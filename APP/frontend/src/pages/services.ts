import { api } from "@/api";
import {
  loginUser,
  registerUser,
  listEventsDB,
  // getWishlistDB,
  // addToWishlist,
  // removeFromWishlist,
  getMe,
  listCities,
  getMyPhotos,
  addMyPhoto,
  adminListEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  adminListSites,
  adminCreateSite,
  adminUpdateSite,
  adminGenerateCode,
  adminListCodes,
  adminRunScrape,
  type Role,
  type EventItem,
  type PhotoItem,
  type SiteItem,
  type AdminInviteCode,
  type Me,
} from "../services";

export type ApiError = { response?: { data?: { error?: string } } };

// ---- auth ----
export async function login(body: { email: string; password: string }) {
  const result = await loginUser(body);
  localStorage.setItem("token", result.token);
  localStorage.setItem("userid", String(result.userId));
  localStorage.setItem("role", result.role);
  return result;
}

export async function register(body: {
  email: string;
  password: string;
  username: string;
  city?: string;
  role?: Role;
  adminCode?: string;
}) {
  const result = await registerUser(body);
  localStorage.setItem("token", result.token);
  localStorage.setItem("userid", String(result.userId));
  localStorage.setItem("role", result.role);
  return result;
}


export async function me(): Promise<Me> {
  return getMe();
}

// ---- events (Home) ----
export async function listEvents(params?: { q?: string; city?: string; category?: string; startDate?: string; endDate?: string }) {
  return listEventsDB(params);
}

export async function listCitiesUI() {
  return listCities();
}

// ---- wishlist ----
export type WishlistRow = {
  id: number;
  userId: number;
  eventId: string;
  createdAt: string;
  event: EventItem;
};

export async function getWishlistDB(): Promise<WishlistRow[]> {
  const { data } = await api.get("/wishlist");
  return data;
}

export async function addToWishlist(eventId: string) {
  const { data } = await api.post(`/wishlist/${eventId}`);
  return data;
}

export async function removeFromWishlist(eventId: string) {
  const { data } = await api.delete(`/wishlist/${eventId}`);
  return data;
}


// ---- photos ----
export async function myPhotos(): Promise<PhotoItem[]> {
  return getMyPhotos();
}

export async function addPhoto(body: { imageUrl: string; caption?: string; eventId?: string }) {
  return addMyPhoto(body);
}


// ---- admin wrappers ----
export async function adminEvents(params?: { q?: string; city?: string; category?: string; startDate?: string; endDate?: string }) {
  return adminListEvents(params);
}


export async function adminAddEvent(body: any) {
  return adminCreateEvent(body);
}

export async function adminEditEvent(id: string, body: any) {
  return adminUpdateEvent(id, body);
}

export async function adminRemoveEvent(id: string) {
  return adminDeleteEvent(id);
}

export async function adminSites() {
  return adminListSites();
}

export async function adminAddSite(body: any) {
  return adminCreateSite(body);
}

export async function adminEditSite(id: string, body: any) {
  return adminUpdateSite(id, body);
}

export async function adminCreateInviteCode() {
  return adminGenerateCode(1);
}

export async function adminCodes(): Promise<AdminInviteCode[]> {
  return adminListCodes();
}

export async function adminRunAddEvent() {
  return adminRunScrape();
}



export type { Role, EventItem, SiteItem, AdminInviteCode, PhotoItem, Me };
