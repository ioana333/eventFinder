import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { addToWishlist, listEvents } from "./services";

export default function Home() {
  const [city, setCity] = useState("");

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ["events", city],
    queryFn: () => listEvents({ city }),
  });

  const addMut = useMutation({
    mutationFn: (id: number) => addToWishlist(id),
  });

  return (
    <div className="card">
      <h1>Evenimente</h1>

      <div className="row" style={{ marginBottom: ".75rem" }}>
        <input
          className="input"
          placeholder="Filtrează după oraș (ex: București)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button className="btn" onClick={() => setCity(city.trim())}>Aplică</button>
      </div>

      {isLoading && <p>Se încarcă…</p>}
      {isError && <p>A apărut o eroare.</p>}
      {!isLoading && events?.length === 0 && <p>Nu s-au găsit evenimente.</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".75rem" }}>
        {events?.map((e) => (
          <li key={e.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div style={{ opacity: .75 }}>{e.city} • {new Date(e.date).toLocaleDateString()}</div>
              <div style={{ opacity: .75 }}>{e.category}</div>
            </div>

            <button
              className={e.wishers?.length > 0 ? "btn_iWl" : "btn_niWl"}
              onClick={() => addMut.mutate(e.id)}
              disabled={addMut.isPending}
              title="Adaugă la wishlist"
            >
              {addMut.isPending ? "Se adaugă…" : "☆ Wishlist"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
