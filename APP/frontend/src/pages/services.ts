import { loginUser } from "../services";
import { registerUser } from "../services";

// mock simplu ca să ruleze fără backend
type LoginPayload = { email: string; password: string };

type Event = {
  id: number;
  title: string;
  city: string;
  date: string;
  category: string;
};

// Error shape used by the frontend to read server-like errors
interface ApiError extends Error {
  response?: { data?: { error?: string } };
}

const fakeDB = {
  events: [
    { id: 1, title: "Concert simfonic", city: "Cluj",      date: new Date().toISOString(), category: "Muzică" },
    { id: 2, title: "Stand-up night",   city: "București", date: new Date().toISOString(), category: "Comedie" },
    { id: 3, title: "Expo foto",        city: "Timișoara", date: new Date().toISOString(), category: "Artă" },
    { id: 4, title: "Teatru clasic",    city: "București", date: new Date().toISOString(), category: "Teatru" },
  ] as Event[],
  wishlist: [] as number[],
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function listEvents({ city }: { city?: string }) {
  await delay();
  const c = (city ?? "").trim().toLowerCase();
  return fakeDB.events.filter((e) => !c || e.city.toLowerCase().includes(c));
}

export async function addToWishlist(id: number) {
  await delay();
  if (!fakeDB.wishlist.includes(id)) fakeDB.wishlist.push(id);
  return { ok: true };
}

export async function getWishlist() {
  await delay();
  return fakeDB.events.filter((e) => fakeDB.wishlist.includes(e.id));
}

export async function login({ email, password }: LoginPayload) {
  await delay();
  if (email && password) {
    const result = await loginUser({ email, password });
    // păstrăm token-ul pentru rute protejate (wishlist)
    localStorage.setItem("token", result.token);
    return result as { token: string };
  }
  const err = new Error("Logare eșuată") as ApiError;
  err.response = { data: { error: "Email sau parolă lipsă" } };
  throw err;
}

export async function register({ email, password, username, city }: { email: string; password: string; username?: string; city?: string }) {
  await delay();
  if (email && password) {
    const result = await registerUser({ email, username, password, city });
    // păstrăm token-ul pentru rute protejate (wishlist)
    localStorage.setItem("token", result.token);
    return result as { token: string };
  }
  const err = new Error("Înregistrare eșuată") as ApiError;
  err.response = { data: { error: "Email sau parolă lipsă" } };
  throw err;
}
