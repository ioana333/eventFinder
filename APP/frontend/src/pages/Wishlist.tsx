import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWishlist, removeFromWishlist } from "./services";

export default function Wishlist() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => removeFromWishlist(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return (
    <div className="card">
      <h1>Wishlist</h1>
      {isLoading && <p>Se încarcă…</p>}
      {isError && <p>A apărut o eroare.</p>}
      {!isLoading && data?.length === 0 && <p>Încă nu ai adăugat nimic.</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".75rem" }}>
        {data?.map((e) => (
          <li key={e.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div style={{ opacity: .75 }}>{e.city} • {new Date(e.date).toLocaleDateString()} • {e.category}</div>
            </div>

            <button
              className="wishlistHeart wishlistHeart--full"
              onClick={() => removeMut.mutate(e.id)}
              disabled={removeMut.isPending}
              aria-label="Scoate din wishlist"
              title="Scoate din wishlist"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
