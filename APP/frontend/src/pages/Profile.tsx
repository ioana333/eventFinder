import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addPhoto, getWishlist, me, myPhotos } from "./services";

export default function Profile() {
  const qc = useQueryClient();

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: me });
  const { data: wishlist } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });
  const { data: photos } = useQuery({ queryKey: ["myPhotos"], queryFn: myPhotos });

  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [eventId, setEventId] = useState("");

  const addMut = useMutation({
    mutationFn: () =>
      addPhoto({
        imageUrl: imageUrl.trim(),
        caption: caption.trim() || undefined,
        eventId: eventId.trim() ? Number(eventId.trim()) : undefined,
      }),
    onSuccess: () => {
      setImageUrl("");
      setCaption("");
      setEventId("");
      qc.invalidateQueries({ queryKey: ["myPhotos"] });
    },
  });

  const role = localStorage.getItem("role");

  return (
    <div className="stack">
      <h1>Profile</h1>

      <div className="card">
        <div><strong>{meData?.username}</strong> ({meData?.role})</div>
        <div style={{ opacity: 0.75 }}>{meData?.email} {meData?.city ? `• ${meData.city}` : ""}</div>
      </div>

      <div className="card">
        <h3>Add a photo (by URL)</h3>
        <input className="input" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <input className="input" placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <input className="input" placeholder="Event ID (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)} />
        <button className="btn" disabled={!imageUrl.trim() || addMut.isPending} onClick={() => addMut.mutate()}>
          Add
        </button>
      </div>

      <div className="card">
        <h3>Photos (simple Instagram-like grid)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: ".5rem" }}>
          {(photos ?? []).map((p) => (
            <div key={p.id} className="card" style={{ padding: ".5rem" }}>
              <img src={p.imageUrl} alt={p.caption ?? "photo"} style={{ width: "100%", height: 140, objectFit: "cover" }} />
              {p.caption ? <div style={{ fontSize: 12, marginTop: 6 }}>{p.caption}</div> : null}
            </div>
          ))}
          {(photos ?? []).length === 0 ? <div>No photos yet.</div> : null}
        </div>
      </div>

      <div className="card">
        <h3>Wishlist</h3>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".5rem" }}>
          {(wishlist ?? []).map((e) => (
            <li key={e.id} className="card" style={{ padding: ".5rem" }}>
              <strong>{e.title}</strong>
              <div style={{ opacity: 0.75 }}>{e.city} • {new Date(e.startDate).toLocaleString()}</div>
            </li>
          ))}
        </ul>
        {(wishlist ?? []).length === 0 ? <div>Your wishlist is empty.</div> : null}
      </div>

      {role === "ADMIN" ? (
        <div className="card">
          <h3>Admin</h3>
          <p>You can manage the app from the “Admin” page.</p>
        </div>
      ) : null}
    </div>
  );
}
