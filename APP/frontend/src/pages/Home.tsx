import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addToWishlist, removeFromWishlist, listEvents } from "./services";

export default function Home() {
  const [city, setCity] = useState("");
  const qc = useQueryClient();

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ["events", city],
    queryFn: () => listEvents({ city }),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, wished }: { id: number; wished: boolean }) => {
      if (wished) {
        await removeFromWishlist(id);
      } else {
        await addToWishlist(id);
      }
    },
    onSuccess: () => {
      // refresh listele ca sa se actualizeze inimioara + pagina Wishlist
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
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
        {events?.map((e) => {
          const wished = (e.wishers?.length ?? 0) > 0;
          return (
          <li key={e.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div style={{ opacity: .75 }}>{e.city} • {new Date(e.date).toLocaleDateString()}</div>
              <div style={{ opacity: .75 }}>{e.category}</div>
            </div>

            <button
              className={`wishlistHeart ${wished ? "wishlistHeart--full" : "wishlistHeart--empty"}`}
              onClick={() => toggleMut.mutate({ id: e.id, wished })}
              disabled={toggleMut.isPending}
              aria-label={wished ? "Scoate din wishlist" : "Adaugă la wishlist"}
              title={wished ? "Scoate din wishlist" : "Adaugă la wishlist"}
            >
              {/* icon-only */}
            </button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
