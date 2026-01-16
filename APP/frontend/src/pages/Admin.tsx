import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  adminAddEvent,
  adminAddSite,
  adminCodes,
  adminCreateInviteCode,
  adminEditEvent,
  adminEditSite,
  adminEvents,
  adminRemoveEvent,
  adminRunAddEvent,
  adminSites,
  listCitiesUI,
} from "./services";

type EditableEvent = {
  id: string;
  title: string;
  city: string;
  category?: string | null;
  startDate: string;
  description?: string | null;
  venue?: string | null;
  url?: string | null;
  imageUrl?: string | null;
};

export default function Admin() {
  const role = localStorage.getItem("role");
  if (role !== "ADMIN") return <div className="card">Acces interzis (admin only).</div>;

  const qc = useQueryClient();

  // Invite codes
  const { data: codes } = useQuery({ queryKey: ["adminCodes"], queryFn: adminCodes });
  const genCode = useMutation({
    mutationFn: adminCreateInviteCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminCodes"] }),
  });

  // Sites
  const { data: sites } = useQuery({ queryKey: ["adminSites"], queryFn: adminSites });
  const { data: cities } = useQuery({ queryKey: ["cities"], queryFn: () => listCitiesUI() });

  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteJsonUrl, setSiteJsonUrl] = useState("");

  const addSiteMut = useMutation({
    mutationFn: () =>
      adminAddSite({ name: siteName, url: siteUrl, jsonUrl: siteJsonUrl || undefined, enabled: true }),
    onSuccess: () => {
      setSiteName("");
      setSiteUrl("");
      setSiteJsonUrl("");
      qc.invalidateQueries({ queryKey: ["adminSites"] });
    },
  });

  const toggleSiteMut = useMutation({
    mutationFn: (p: { id: number; enabled: boolean }) => adminEditSite(p.id, { enabled: p.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminSites"] }),
  });

  // Events search
  const [searchQ, setSearchQ] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchStart, setSearchStart] = useState("");
  const [searchEnd, setSearchEnd] = useState("");

  const { data: events } = useQuery({
    queryKey: ["adminEvents", searchQ, searchCity, searchCategory, searchStart, searchEnd],
    queryFn: () =>
      adminEvents({
        q: searchQ.trim() || undefined,
        city: searchCity.trim() || undefined,
        category: searchCategory.trim() || undefined,
        startDate: searchStart || undefined,
        endDate: searchEnd || undefined,
      }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminRemoveEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Add event manually
  const [newTitle, setNewTitle] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStart, setNewStart] = useState("");

  const addEventMut = useMutation({
    mutationFn: () =>
      adminAddEvent({
        title: newTitle,
        city: newCity,
        category: newCategory || undefined,
        startDate: newStart,
      }),
    onSuccess: () => {
      setNewTitle("");
      setNewCity("");
      setNewCategory("");
      setNewStart("");
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Edit/save event
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentEditing = useMemo(() => {
    if (!editingId) return null;
    return (events ?? []).find((x: any) => x.id === editingId) as EditableEvent | undefined;
  }, [editingId, events]);

  const [editTitle, setEditTitle] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  function startEdit(e: any) {
    setEditingId(e.id);
    setEditTitle(e.title ?? "");
    setEditCity(e.city ?? "");
    setEditCategory(e.category ?? "");
    // datetime-local expects: YYYY-MM-DDTHH:mm
    const dt = new Date(e.startDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
      dt.getMinutes()
    )}`;
    setEditStart(local);
    setEditUrl(e.url ?? "");
    setEditImageUrl(e.imageUrl ?? "");
  }

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("No event selected");
      return adminEditEvent(editingId, {
        title: editTitle,
        city: editCity,
        category: editCategory || null,
        startDate: editStart, // backend converts to Date
        url: editUrl || null,
        imageUrl: editImageUrl || null,
      });
    },
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Run scraper
  const runScrape = useMutation({ mutationFn: adminRunAddEvent });

  return (
    <div className="stack">
      <h1>Admin Management</h1>

      <div className="card">
        <h3>Generate admin invite code</h3>
        <button className="btn" onClick={() => genCode.mutate()} disabled={genCode.isPending}>
          Generate
        </button>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".25rem" }}>
          {(codes ?? []).map((c: any) => (
            <li key={c.id} className="card" style={{ padding: ".5rem" }}>
              <strong>{c.code}</strong> • {c.usedAt ? "USED" : "UNUSED"}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Run addEvent.py</h3>
        <button className="btn" onClick={() => runScrape.mutate()} disabled={runScrape.isPending}>
          Run
        </button>
        {runScrape.data ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>
            exit={runScrape.data.code}
            {"\n"}STDOUT:
            {"\n"}{runScrape.data.out}
            {"\n"}STDERR:
            {"\n"}{runScrape.data.err}
          </pre>
        ) : null}
      </div>

      <div className="card">
        <h3>Sites</h3>
        <div style={{ display: "grid", gap: ".5rem" }}>
          <input className="input" placeholder="Name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          <input className="input" placeholder="URL" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
          <input
            className="input"
            placeholder="JSON URL (optional)"
            value={siteJsonUrl}
            onChange={(e) => setSiteJsonUrl(e.target.value)}
          />
          <button className="btn" onClick={() => addSiteMut.mutate()} disabled={addSiteMut.isPending || !siteName || !siteUrl}>
            Add site
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
          {(sites ?? []).map((s: any) => (
            <li key={s.id} className="card" style={{ padding: ".5rem" }}>
              <div>
                <strong>{s.name}</strong> {s.enabled ? "(enabled)" : "(disabled)"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{s.jsonUrl ?? s.url}</div>
              <button className="btn" onClick={() => toggleSiteMut.mutate({ id: s.id, enabled: !s.enabled })} disabled={toggleSiteMut.isPending}>
                Toggle enabled
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Events</h3>

        <div className="card" style={{ marginTop: ".75rem" }}>
          <h4>{editingId ? "Edit event" : "Add event manually"}</h4>

          {editingId ? (
            <>
              <input className="input" placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <input className="input" placeholder="City" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
              <input className="input" placeholder="Category (optional)" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              <input className="input" type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              <input className="input" placeholder="URL (optional)" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
              <input className="input" placeholder="Image URL (optional)" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} />

              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                <button
                  className="btn"
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || !editTitle || !editCity || !editStart}
                >
                  Save
                </button>
                <button className="btn" onClick={() => setEditingId(null)} disabled={saveMut.isPending}>
                  Cancel
                </button>
              </div>

              {currentEditing ? (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                  Editing: <strong>{currentEditing.title}</strong> ({currentEditing.id})
                </div>
              ) : null}
            </>
          ) : (
            <>
              <input className="input" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <input className="input" placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
              <input className="input" placeholder="Category (optional)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <input className="input" type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              <button className="btn" onClick={() => addEventMut.mutate()} disabled={addEventMut.isPending || !newTitle || !newCity || !newStart}>
                Add
              </button>
            </>
          )}
        </div>

        <div className="card" style={{ display: "grid", gap: ".5rem" }}>
          <h4>Search Events</h4>
          <input className="input" placeholder="Search by name" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />

          <input
            className="input"
            placeholder="Category (e.g., Music, Theater)"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          />

          <input
            className="input"
            list="cities"
            placeholder="City (type and pick)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
          <datalist id="cities">
            {(cities ?? []).map((c: string) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <label>
              From: <input className="input" type="date" value={searchStart} onChange={(e) => setSearchStart(e.target.value)} />
            </label>
            <label>
              To: <input className="input" type="date" value={searchEnd} onChange={(e) => setSearchEnd(e.target.value)} />
            </label>
          </div>
        </div>

        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
          {(events ?? []).map((e: any) => (
            <li key={e.id} className="card" style={{ padding: ".5rem" }}>
              {e.imageUrl ? (
                <img src={e.imageUrl} alt={e.title} style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8 }} />
              ) : null}
              <strong>{e.title}</strong>
              <div style={{ opacity: 0.8 }}>
                {e.city} • {new Date(e.startDate).toLocaleString()} {e.category ? `• ${e.category}` : ""}
              </div>

              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: 8 }}>
                <button className="btn" onClick={() => startEdit(e)} disabled={saveMut.isPending || delMut.isPending}>
                  Edit
                </button>
                <button className="btn" onClick={() => delMut.mutate(e.id)} disabled={delMut.isPending || saveMut.isPending}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
