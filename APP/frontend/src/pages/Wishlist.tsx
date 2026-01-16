import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWishlistDB, removeFromWishlist, type WishlistRow } from "./services";

export default function Wishlist() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlistDB,
  });

  const removeMut = useMutation({
    mutationFn: (eventId: string) => removeFromWishlist(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const rows: WishlistRow[] = Array.isArray(data) ? data : [];

  return (
    <div className="card">
      <h1>Wishlist</h1>

      {isLoading && <p>Loading…</p>}
      {isError && <p>Something went wrong.</p>}
      {!isLoading && rows.length === 0 && <p>Your wishlist is empty.</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".75rem" }}>
        {rows.map((row) => {
          const e = row.event; // <- AICI e evenimentul complet
          return (
            <li key={row.id} className="card" style={{ display: "grid", gap: ".25rem" }}>
              <div style={{ fontWeight: 600 }}>{e?.title ?? "(missing title)"}</div>

              <div style={{ opacity: 0.75 }}>
                {(e?.city ?? "")}
                {e?.startDate ? ` • ${new Date(e.startDate).toLocaleString()}` : ""}
                {e?.category ? ` • ${e.category}` : ""}
              </div>

              <button
                className="wishlistHeart wishlistHeart--full"
                onClick={() => removeMut.mutate(row.eventId)}  // <- FOARTE IMPORTANT: eventId, NU row.id
                disabled={removeMut.isPending}
                aria-label="Scoate din wishlist"
                title="Scoate din wishlist"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
