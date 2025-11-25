import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { PrismaClient } from "@prisma/client";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev";

function auth(req: any, res: any, next: any) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "Missing token" });
  try {
    const token = h.replace("Bearer ", "");
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/register", async (req, res) => {
  const S = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    city: z.string().optional(),
    username: z.string().optional()
  });
  const data = S.parse(req.body);
  // Ensure username exists (derive from email if client didn't provide it)
  const username = data.username ?? data.email.split("@")[0];
  const hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({ data: { email: data.email, password: hash, city: data.city, username } });
  //res.json({ id: user.id });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.post("/api/login", async (req, res) => {

  const S = z.object({ email: z.string().email(), password: z.string() });
  const { email, password } = S.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Bad credentials" });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.get("/api/events", async (req, res) => {
  const { city, sort = "date", order = "asc", category } = req.query as any;
  const where: any = {};
  if (city) where.city = city;
  if (category) where.category = category;
  const events = await prisma.event.findMany({
    where,
    orderBy: { [sort]: order === "desc" ? "desc" : "asc" }
  });
  res.json(events);
});

app.post("/api/wishlist/:eventId", auth, async (req: any, res) => {
  const eventId = Number(req.params.eventId);
  await prisma.wishlist.upsert({
    where: { userId_eventId: { userId: req.user.id, eventId } },
    create: { userId: req.user.id, eventId },
    update: {}
  });
  res.json({ ok: true });
});

app.get("/api/wishlist", auth, async (req: any, res) => {
  const items = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: { event: true }
  });
  res.json(items.map((i: any) => i.event));
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
