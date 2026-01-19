import { api } from "./api";

export type Role = "ADMIN" | "PARTYER";

export type EventItem = {
  id: string;                 // UUID string
  title: string;
  description?: string | null;
  category?: string | null;
  city: string;
  venue?: string | null;
  startDate: string;          // ISO string
  endDate?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  sourceSiteId?: string | null;
  sourceSite?: SiteItem | null;
};

export type SiteItem = {
  id: string;                 // UUID string
  name: string;
  url: string;
  jsonUrl?: string | null;
  enabled: boolean;
  createdAt: string;
};

export type AdminInviteCode = {
  id: string;
  code: string;
  createdAt: string;
  usedAt?: string | null;
  usedById?: number | null;
};

export type Me = {
  id: number;
  email: string;
  username: string;
  city?: string | null;
  role: Role;
};

export type PhotoItem = {
  id: number;
  imageUrl: string;
  caption?: string | null;
  createdAt: string;
  eventId?: string | null;
  event?: EventItem | null;
};

// -------------------- Auth --------------------
export async function loginUser(body: { email: string; password: string }) {
  const { data } = await api.post("/login", body);
  return data as { token: string; userId: number; role: Role };
}

export async function registerUser(body: {
  email: string;
  password: string;
  username: string;
  city?: string;
  role?: Role;
  adminCode?: string;
}) {
  const { data } = await api.post("/register", body);
  return data as { token: string; userId: number; role: Role };
}

export async function getMe(): Promise<Me> {
  const { data } = await api.get("/me");
  return data;
}

// -------------------- Events --------------------
/**
 * Backend accepts: q, city, category, dateFrom, dateTo
 * UI uses: startDate/endDate -> map to dateFrom/dateTo here
 */
export async function listEventsDB(params?: {
  q?: string;
  city?: string;
  category?: string;
  startDate?: string; // UI
  endDate?: string;   // UI
}): Promise<EventItem[]> {
  const mapped = params
    ? {
        q: params.q,
        city: params.city,
        category: params.category,
        dateFrom: params.startDate,
        dateTo: params.endDate,
      }
    : undefined;

  const { data } = await api.get("/events", { params: mapped });
  return data;
}

// (optional) If you still call /events/:id somewhere
export async function getEvent(id: string): Promise<EventItem> {
  const { data } = await api.get(`/events/${id}`);
  return data;
}

// -------------------- Wishlist --------------------
export async function getWishlistDB(): Promise<EventItem[]> {
  const { data } = await api.get("/wishlist");
  return data;
}

export async function addToWishlist(eventId: string) {
  await api.post(`/wishlist/${eventId}`);
}

export async function removeFromWishlist(eventId: string) {
  await api.delete(`/wishlist/${eventId}`);
}

// -------------------- Cities --------------------
/**
 * Backend-ul tău NU are /cities în index.ts (în varianta asta),
 * deci facem fallback: luăm evenimente și extragem orașele distincte.
 */
export async function listCities(): Promise<string[]> {
  try {
    const { data } = await api.get("/cities");
    return data as string[];
  } catch {
    const events = await listEventsDB({});
    const set = new Set<string>();
    for (const e of events) if (e.city) set.add(e.city);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }
}

// -------------------- Photos (dacă le folosești) --------------------
export async function getMyPhotos(): Promise<PhotoItem[]> {
  const { data } = await api.get("/photos");
  return data;
}

export async function addMyPhoto(body: { imageUrl: string; caption?: string; eventId?: string }) {
  const { data } = await api.post("/photos", body);
  return data as PhotoItem;
}

// -------------------- Admin: Events --------------------
export async function adminListEvents(params?: {
  q?: string;
  city?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<EventItem[]> {
  const mapped: any = { ...(params ?? {}) };

  // backend expects dateFrom/dateTo (same as /api/events)
  if (mapped.startDate) {
    mapped.dateFrom = mapped.startDate;
    delete mapped.startDate;
  }
  if (mapped.endDate) {
    mapped.dateTo = mapped.endDate;
    delete mapped.endDate;
  }

  const { data } = await api.get("/admin/events", { params: mapped });
  return data;
}


export async function adminCreateEvent(body: {
  title: string;
  city: string;
  startDate: string;
  description?: string | null;
  category?: string | null;
  venue?: string | null;
  endDate?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  sourceSiteId?: string | null;
}) {
  const { data } = await api.post("/events", body);
  return data as EventItem;
}

export async function adminUpdateEvent(id: string, body: Partial<EventItem>) {
  const { data } = await api.put(`/events/${id}`, body);
  return data as EventItem;
}

export async function adminDeleteEvent(id: string) {
  const { data } = await api.delete(`/events/${id}`);
  return data as { ok: boolean };
}

// -------------------- Admin: Sites --------------------
export async function adminListSites(): Promise<SiteItem[]> {
  const { data } = await api.get("/admin/sites");
  return data;
}

export async function adminCreateSite(body: { name: string; url: string; jsonUrl?: string; enabled?: boolean }) {
  const { data } = await api.post("/admin/sites", body);
  return data as SiteItem;
}

export async function adminUpdateSite(id: string, body: Partial<SiteItem>) {
  const { data } = await api.patch(`/admin/sites/${id}`, body);
  return data as SiteItem;
}

// -------------------- Admin: Codes --------------------
export async function adminGenerateCode(count = 1) {
  const { data } = await api.post("/admin/codes", { count }); // body!
  return data;
}


export async function adminListCodes(): Promise<AdminInviteCode[]> {
  const { data } = await api.get("/admin/codes");
  return data;
}

// -------------------- Admin: Run import (addEvents.py) --------------------
export async function adminRunScrape() {
  const { data } = await api.post("/admin/run-import");
  // expected: { code, out, err }
  return data as { code: number; out: string; err: string };
}
