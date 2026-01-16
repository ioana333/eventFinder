import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCitiesUI, listEvents, getWishlistDB, addToWishlist, removeFromWishlist } from "./services";

type EventItem = {
  id: string; // UUID string
  title: string;
  city: string;
  venue?: string | null;
  startDate: string;
  category?: string | null;
  url?: string | null;
  imageUrl?: string | null;
};

const loggedIn = !!localStorage.getItem("token");

function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((x): x is string => typeof x === "string");
  // suport dacă API-ul întoarce { cities: [...] }
  if (input && typeof input === "object" && Array.isArray((input as any).cities)) {
    return (input as any).cities.filter((x: any) => typeof x === "string");
  }
  return [];
}

function normalizeEventsArray(input: unknown): EventItem[] {
  if (Array.isArray(input)) return input as EventItem[];
  // suport dacă API-ul întoarce { events: [...] }
  if (input && typeof input === "object" && Array.isArray((input as any).events)) {
    return (input as any).events as EventItem[];
  }
  return [];
}

export default function Home() {
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filters = useMemo(
    () => ({
      q: q.trim() || undefined,
      category: category.trim() || undefined,
      city: city.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [q, category, city, startDate, endDate]
  );

const { data: citiesRaw, isLoading: isCitiesLoading, isError: isCitiesError } = useQuery({
  queryKey: ["cities"],
  queryFn: listCitiesUI,
});

  const cities = useMemo(() => normalizeStringArray(citiesRaw), [citiesRaw]);

const { data: eventsRaw, isLoading: isEventsLoading, isError: isEventsError } = useQuery({
  queryKey: ["events", filters],
  queryFn: () => listEvents(filters),
});


const { data: wishlistRaw } = useQuery({
  queryKey: ["wishlist"],
  queryFn: getWishlistDB,
  enabled: loggedIn,
});
const wishlistIds = useMemo(() => {
  const rows = Array.isArray(wishlistRaw) ? wishlistRaw : [];
  return new Set(rows.map((r: any) => r.eventId));
}, [wishlistRaw]);


  const events = useMemo(() => normalizeEventsArray(eventsRaw), [eventsRaw]);

  // const addMut = useMutation({
  //   mutationFn: (id: number) => addWish(id),
  //   onSuccess: () => {
  //     // dacă ai query de wishlist în altă parte, asta îl va reîncărca
  //     qc.invalidateQueries({ queryKey: ["wishlist"] });
  //   },
  // });

  const toggleMut = useMutation({
  mutationFn: async (vars: { id: string; wished: boolean }) => {
    if (vars.wished) return removeFromWishlist(vars.id);
    return addToWishlist(vars.id);
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  },
});

  return (
    <div className="stack">
      <h2>Events</h2>

      <div className="card" style={{ display: "grid", gap: ".5rem" }}>
        <input className="input" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />

        <input
          className="input"
          placeholder="Category (e.g., Music)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          className="input"
          list="cities"
          placeholder="City (type and pick)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <datalist id="cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <label>
            From:{" "}
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            To: <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          {/* Butonul e opțional – filtrele deja declanșează query-ul */}
          <button className="btn" type="button">
            Search
          </button>
        </div>

        {isCitiesLoading && <small>Loading cities…</small>}
        {isCitiesError && <small>Could not load cities.</small>}
      </div>

      {isEventsLoading && <p>Loading…</p>}
      {isEventsError && <p>Something went wrong.</p>}
      {!isEventsLoading && events.length === 0 && <p>No events found.</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".75rem" }}>
        {events.map((e) => {
  const wished = wishlistIds.has(e.id);

  return (
    <li key={e.id} className="card" style={{ display: "grid", gap: ".25rem" }}>
      {e.imageUrl ? <img src={e.imageUrl} alt={e.title} /> : null}

      <strong>{e.title}</strong>

      <span>
        {e.city}
        {e.venue ? ` • ${e.venue}` : ""}
      </span>

      <span>{e.startDate ? new Date(e.startDate).toLocaleString() : ""}</span>
      <span>{e.category ?? ""}</span>

      {e.url ? (
        <a href={e.url} target="_blank" rel="noreferrer">
          Click here for details
        </a>
      ) : null}

      {loggedIn ? (
        <button
          className={`wishlistHeart ${wished ? "wishlistHeart--full" : "wishlistHeart--empty"}`}
          onClick={() => toggleMut.mutate({ id: e.id, wished })}
          disabled={toggleMut.isPending}
          aria-label={wished ? "Scoate din wishlist" : "Adaugă la wishlist"}
          title={wished ? "Scoate din wishlist" : "Adaugă la wishlist"}
        >
          {/* icon-only */}
        </button>
      ) : (
        <small>Log in to add to your wishlist.</small>
      )}
    </li>
  );
})}

      </ul>
    </div>
  );
}
