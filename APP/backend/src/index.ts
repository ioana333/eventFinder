import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient, Role } from "@prisma/client";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());


const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// ---------- Types ----------
type JwtPayload = { id: number; email: string; role: Role; username: string };

declare global {
  // eslint-disable-next-line no-var
  var __basedir: string | undefined;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}
//------------------CITY---------------------
// Cities (used by UI datalist)

app.get("/api/cities", async (_req, res) => {
  const rows = await prisma.event.findMany({
    select: { city: true },
    distinct: ["city"],
  });

  const cities = rows
    .map((r) => r.city)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return res.json(cities);
});



// ---------- Helpers ----------
function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });

  const token = h.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Missing token" });
  if (req.user.role !== Role.ADMIN) return res.status(403).json({ error: "Admin only" });
  next();
}

function safeString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

// ---------- Health ----------
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---------------------- Auth routes ----------------------

// REGISTER
// REGISTER (and SIGNUP alias)
const registerHandler: express.RequestHandler = async (req, res) => {
  const S = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(2),
    city: z.string().optional(),
    role: z.enum(["ADMIN", "PARTYER"]).optional(),
    adminCode: z.string().optional(),
  });

  try {
    const data = S.parse(req.body);
    const role: Role = (data.role ?? "PARTYER") as Role;

    const existsEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existsEmail) return res.status(400).json({ error: "Email already used" });

    const existsUser = await prisma.user.findUnique({ where: { username: data.username } });
    if (existsUser) return res.status(400).json({ error: "Username already used" });

    let inviteCodeIdToConsume: number | null = null;

    if (role === Role.ADMIN) {
      if (!data.adminCode) return res.status(400).json({ error: "Admin code required" });

      const masterCode = process.env.MASTER_ADMIN_CODE;
      if (!(masterCode && data.adminCode === masterCode)) {
        const codeRow = await prisma.adminInviteCode.findUnique({ where: { code: data.adminCode } });
        if (!codeRow || codeRow.usedAt) {
          return res.status(400).json({ error: "Invalid or already used admin code" });
        }
        inviteCodeIdToConsume = codeRow.id;
      }
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        username: data.username,
        city: data.city,
        role,
      },
    });

    if (inviteCodeIdToConsume) {
      await prisma.adminInviteCode.update({
        where: { id: inviteCodeIdToConsume },
        data: { usedAt: new Date(), usedBy: { connect: { id: user.id } } },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { usedCodeId: inviteCodeIdToConsume },
      });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, username: user.username });
    return res.json({ token, userId: user.id, role: user.role, username: user.username });
  } catch (e: any) {
    // IMPORTANT: show Zod validation errors nicely
    if (e?.issues) return res.status(400).json({ error: "Invalid input", details: e.issues });
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
};

app.post("/api/register", registerHandler);
app.post("/api/signup", registerHandler); // alias




// LOGIN
app.post("/api/login", async (req, res) => {
  const S = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  try {
    const data = S.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email, role: user.role, username: user.username });
    return res.json({ token, userId: user.id, role: user.role, username: user.username });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

// ME
app.get("/api/me", requireAuth, async (req, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, username: true, city: true, role: true, createdAt: true },
  });
  return res.json(u);
});

// ---------------------- Events ----------------------

//show events
app.get("/api/events", async (req, res) => {
  // Query params:
  // city, q (name/title), category, dateFrom, dateTo
  const city = safeString(req.query.city);
  const q = safeString(req.query.q);
  const category = safeString(req.query.category);
  const dateFrom = safeString(req.query.dateFrom);
  const dateTo = safeString(req.query.dateTo);

  const where: any = {};

  // IMPORTANT:
  // Some legacy DB rows may still have startDate = NULL.
  // Even if your Prisma schema allows DateTime?, older generated clients can crash
  // while reading incompatible values. Filtering them out avoids a hard crash.
  where.startDate = { not: null };

  if (city) where.city = { contains: city, mode: "insensitive" };
  if (category) where.category = { contains: category, mode: "insensitive" };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { venue: { contains: q, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    if (dateFrom) where.startDate.gte = new Date(dateFrom);
    if (dateTo) where.startDate.lte = new Date(dateTo);
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { sourceSite: true },
    take: 200,
  });

  return res.json(events);
});

// Admin: list events (for Admin.tsx)
app.get("/api/admin/events", requireAuth, requireAdmin, async (req, res) => {
  const city = safeString(req.query.city);
  const q = safeString(req.query.q);
  const category = safeString(req.query.category);
  const dateFrom = safeString(req.query.dateFrom);
  const dateTo = safeString(req.query.dateTo);

  const where: any = {};

  // Same safety filter as /api/events
  where.startDate = { not: null };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (category) where.category = { contains: category, mode: "insensitive" };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { venue: { contains: q, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    if (dateFrom) where.startDate.gte = new Date(dateFrom);
    if (dateTo) where.startDate.lte = new Date(dateTo);
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { sourceSite: true },
    take: 500,
  });

  return res.json(events);
});


// Get one
app.get("/api/events/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const ev = await prisma.event.findUnique({
    where: { id },
    include: { sourceSite: true },
  });
  if (!ev) return res.status(404).json({ error: "Not found" });
  return res.json(ev);
});

// Admin: create event
app.post("/api/events", requireAuth, requireAdmin, async (req, res) => {
  const S = z.object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    city: z.string().min(2),
    venue: z.string().optional().nullable(),
    startDate: z.string().min(1), // ISO string
    endDate: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    sourceSiteId: z.string().optional().nullable(), // Site.id is String uuid
  });

  try {
    const data = S.parse(req.body);

    const ev = await prisma.event.create({
      data: {
        id: randomUUID(), // ensures insert even if DB default mismatch
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? null,
        city: data.city,
        venue: data.venue ?? null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        url: data.url ?? null,
        imageUrl: data.imageUrl ?? null,
        sourceSiteId: data.sourceSiteId ?? null,
      },
    });

    return res.json(ev);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

// Admin: update event
app.put("/api/events/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  const S = z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    city: z.string().min(2).optional(),
    venue: z.string().optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    sourceSiteId: z.string().optional().nullable(),
  });

  try {
    const data = S.parse(req.body);

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.venue !== undefined ? { venue: data.venue } : {}),
        ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.sourceSiteId !== undefined ? { sourceSiteId: data.sourceSiteId } : {}),
      },
    });

    return res.json(updated);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

// Admin: delete event (also remove dependent rows first)
app.delete("/api/events/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  try {
    await prisma.$transaction([
      prisma.wishlist.deleteMany({ where: { eventId: id } }),
      prisma.attendance.deleteMany({ where: { eventId: id } }),
      prisma.photo.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Delete failed" });
  }
});



// ---------------------- Wishlist ----------------------

app.get("/api/wishlist", requireAuth, async (req, res) => {
  const rows = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rows);
});

app.post("/api/wishlist/:eventId", requireAuth, async (req, res) => {
  const eventId = String(req.params.eventId);

  await prisma.wishlist.upsert({
    where: { userId_eventId: { userId: req.user!.id, eventId } },
    create: { userId: req.user!.id, eventId },
    update: {},
  });

  return res.json({ ok: true });
});

app.delete("/api/wishlist/:eventId", requireAuth, async (req, res) => {
  const eventId = String(req.params.eventId);
  await prisma.wishlist.deleteMany({ where: { userId: req.user!.id, eventId } });
  return res.json({ ok: true });
});

// ---------------------- Attendance ----------------------

app.get("/api/attendance", requireAuth, async (req, res) => {
  const rows = await prisma.attendance.findMany({
    where: { userId: req.user!.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rows);
});

app.post("/api/attendance/:eventId", requireAuth, async (req, res) => {
  const eventId = String(req.params.eventId);

  await prisma.attendance.upsert({
    where: { userId_eventId: { userId: req.user!.id, eventId } },
    create: { userId: req.user!.id, eventId },
    update: {},
  });

  return res.json({ ok: true });
});

app.delete("/api/attendance/:eventId", requireAuth, async (req, res) => {
  const eventId = String(req.params.eventId);
  await prisma.attendance.deleteMany({ where: { userId: req.user!.id, eventId } });
  return res.json({ ok: true });
});

// ---------------------- Photos (Profile) ----------------------

app.get("/api/photos", requireAuth, async (req, res) => {
  const rows = await prisma.photo.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rows);
});

app.post("/api/photos", requireAuth, async (req, res) => {
  const S = z.object({
    imageUrl: z.string().min(3),
    caption: z.string().optional().nullable(),
    eventId: z.string().optional().nullable(), // Event.id is string UUID
  });

  try {
    const data = S.parse(req.body);

    const photo = await prisma.photo.create({
      data: {
        userId: req.user!.id,
        imageUrl: data.imageUrl,
        caption: data.caption ?? null,
        eventId: data.eventId ?? null,
      },
    });

    return res.json(photo);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

// ---------------------- Sites (Admin) ----------------------
// NOTE: Site.id in Prisma is String @default(uuid()).
// If your DB is out of sync and doesn't auto-generate ids, we generate one here.

app.get("/api/admin/sites", requireAuth, requireAdmin, async (_req, res) => {
  const sites = await prisma.site.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(sites);
});

app.post("/api/admin/sites", requireAuth, requireAdmin, async (req, res) => {
  const S = z.object({
    name: z.string().min(2),
    url: z.string().min(3),
    jsonUrl: z.string().optional().nullable(),
    enabled: z.boolean().optional(),
  });

  try {
    const data = S.parse(req.body);

    const site = await prisma.site.create({
      data: {
        id: randomUUID(),
        name: data.name,
        url: data.url,
        jsonUrl: data.jsonUrl ?? null,
        enabled: data.enabled ?? true,
      },
    });

    return res.json(site);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

app.patch("/api/admin/sites/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const S = z.object({
    name: z.string().min(2).optional(),
    url: z.string().min(3).optional(),
    jsonUrl: z.string().optional().nullable(),
    enabled: z.boolean().optional(),
  });

  try {
    const data = S.parse(req.body);

    const site = await prisma.site.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.jsonUrl !== undefined ? { jsonUrl: data.jsonUrl } : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      },
    });

    return res.json(site);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

app.delete("/api/admin/sites/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  await prisma.site.delete({ where: { id } });
  return res.json({ ok: true });
});

// ---------------------- Admin Invite Codes (Admin) ----------------------

app.get("/api/admin/codes", requireAuth, requireAdmin, async (_req, res) => {
  const codes = await prisma.adminInviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { usedBy: true, createdBy: true },
    take: 200,
  });
  return res.json(codes);
});

app.post("/api/admin/codes", requireAuth, requireAdmin, async (req, res) => {
  const S = z.object({
    count: z.number().int().min(1).max(50).optional(),
  });

  try {
    const data = S.parse(req.body ?? {});
    const count = data.count ?? 1;

    const created: { id: number; code: string }[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      const row = await prisma.adminInviteCode.create({
        data: {
          code,
          createdBy: { connect: { id: req.user!.id } },
        },
        select: { id: true, code: true },
      });
      created.push(row);
    }

    return res.json({ created });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "Invalid input" });
  }
});

// ---------------------- Run addEvent.py (Admin) ----------------------

import { execFile } from "child_process";

function execFileP(cmd: string, args: string[], cwd: string) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
    execFile(cmd, args, { cwd }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout ?? "",
        stderr: stderr ?? (error ? String(error) : ""),
        exitCode: (error as any)?.code ?? 0,
      });
    });
  });
}


import fs from "fs";

app.post("/api/admin/run-import", requireAuth, requireAdmin, async (_req, res) => {
  try {
    // 1) Găsește scriptul indiferent de cwd
    const candidates = [
      path.resolve(process.cwd(), "addEvents.py"),
      path.resolve(process.cwd(), "backend", "addEvents.py"),
      path.resolve(__dirname, "..", "..", "addEvents.py"),      // dacă ești în backend/src -> dist
      path.resolve(__dirname, "..", "addEvents.py"),
    ];

    const scriptPath = candidates.find((p) => fs.existsSync(p));
    if (!scriptPath) {
      return res.status(500).json({
        exitCode: 127,
        stdout: "",
        stderr:
          "addEvents.py not found. Checked:\n" + candidates.join("\n"),
      });
    }

    // 2) Comanda de python
    const pythonCmd = process.env.PYTHON_CMD || "npx python";

    // 3) Rulează și capturează output complet
    const result = await runProcess(pythonCmd, [scriptPath], {
      cwd: process.cwd(),
      env: process.env, // IMPORTANT: să aibă DATABASE_URL_PY etc.
    });

    // Dacă vrei să tratezi non-zero ca eroare:
    if (result.exitCode !== 0) {
      return res.status(500).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      exitCode: 1,
      stdout: "",
      stderr: err?.stack || String(err),
    });
  }
});

// helper
function runProcess(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));

    child.on("error", (e) => {
      resolve({ exitCode: 127, stdout, stderr: stderr + "\n" + String(e) });
    });

    child.on("close", (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
  });
}


// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
