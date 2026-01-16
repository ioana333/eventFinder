import axios from "axios";

// export const api_vite = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
// });

export const api = axios.create({
  baseURL: "http://localhost:4000/api", 
});

// atașează token-ul dacă există în localStorage
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
