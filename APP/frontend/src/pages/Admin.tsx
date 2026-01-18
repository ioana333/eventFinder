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
import { EventCard } from "../components/EventCard";
import { Calendar as CustomCalendar } from "../components/calendar";
import ImageUpload from "../components/ImageUpload";
import RomaniaMap from "../components/RomaniaMap";
import { format } from "date-fns";
import { 
  Edit2, Trash2, LayoutGrid, Globe, Key, Play, 
  Search, MapPin, X, Check, Clock, Map 
} from "lucide-react";

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

const PREDEFINED_CATEGORIES = [
  "music", "theater", "art", "cinema", "food", 
  "sport", "technology", "international", "stand-up", 
  "conferences", "markets", "others"
];

export default function Admin() {
  const role = localStorage.getItem("role");
  if (role !== "ADMIN") return <div className="p-10 text-center font-black uppercase text-gray-400">Acces interzis (admin only).</div>;

  const qc = useQueryClient();

  const [showMap, setShowMap] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStart, setNewStart] = useState("");

  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteJsonUrl, setSiteJsonUrl] = useState("");

  // Invite codes
  const { data: codes } = useQuery({ queryKey: ["adminCodes"], queryFn: adminCodes });
  const genCode = useMutation({
    mutationFn: adminCreateInviteCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminCodes"] }),
  });

  // Sites
  const { data: sites } = useQuery({ queryKey: ["adminSites"], queryFn: adminSites });
  const { data: cities } = useQuery({ queryKey: ["cities"], queryFn: () => listCitiesUI() });

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
    mutationFn: (p: { id: number; enabled: boolean }) => adminEditSite(p.id.toString(), { enabled: p.enabled }),
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
  const addEventMut = useMutation({
    mutationFn: () =>
      adminAddEvent({
        title: newTitle,
        city: newCity,
        category: newCategory || undefined,
        startDate: newStart,
        imageUrl: imageUrl || undefined
      }),
    onSuccess: () => {
      setNewTitle("");
      setNewCity("");
      setNewCategory("");
      setNewStart("");
      setImageUrl(null);
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Edit/save event
  const currentEditing = useMemo(() => {
    if (!editingId) return null;
    return (events ?? []).find((x: any) => x.id === editingId) as EditableEvent | undefined;
  }, [editingId, events]);

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
    setImageUrl(e.imageUrl ?? null);

    setTimeout(() => {
      const element = document.getElementById("edit-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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
        imageUrl: imageUrl || null,
      });
    },
    onSuccess: () => {
      setEditingId(null);
      setImageUrl(null);
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Run scraper
  const runScrape = useMutation({ mutationFn: adminRunAddEvent });

  const updateDateTime = (currentStr: string, newDate: string, setter: (val: string) => void) => {
    const timePart = currentStr.includes("T") ? currentStr.split("T")[1] : "19:00";
    setter(`${newDate}T${timePart}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] py-12 px-4 space-y-12 text-gray-900 relative">
      
      {showMap && (
        <RomaniaMap onSelect={(selected) => { if (editingId) setEditCity(selected); else setNewCity(selected); setShowMap(false); }} onClose={() => setShowMap(false)} />
      )}

      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Admin Management</h1>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg" onClick={() => genCode.mutate()} disabled={genCode.isPending}>
              <Key size={16} /> Generate Code
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg" onClick={() => runScrape.mutate()} disabled={runScrape.isPending}>
              <Play size={16} /> Run Scraper
            </button>
          </div>
        </div>

        {/* INVITE CODES & SCRAPER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-50 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">Invite Codes</h3>
            <div className="flex flex-wrap gap-2">
              {(codes ?? []).map((c: any) => (
                <div key={c.id} className={`px-4 py-2 rounded-xl text-[10px] font-black border ${c.usedAt ? 'bg-gray-50 text-gray-300 border-gray-100' : 'bg-brand-purple/5 text-brand-purple border-brand-purple/20'}`}>
                  {c.code} • {c.usedAt ? "USED" : "UNUSED"}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-xl overflow-hidden text-[9px] font-mono whitespace-pre-wrap">
            {runScrape.data ? `Exit Code: ${runScrape.data.code}\n${runScrape.data.out || runScrape.data.err}` : "Ready."}
          </div>
        </div>

        {/* SITES */}
        <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3"><Globe size={18} className="text-brand-purple" /> Sites</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" placeholder="Name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" placeholder="URL" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
            <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" placeholder="JSON URL (optional)" value={siteJsonUrl} onChange={(e) => setSiteJsonUrl(e.target.value)} />
          </div>
          <button className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-purple transition-all" onClick={() => addSiteMut.mutate()} disabled={addSiteMut.isPending || !siteName || !siteUrl}>Add site</button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {(sites ?? []).map((s: any) => (
              <div key={s.id} className="p-4 rounded-2xl border-2 border-gray-50 flex flex-col justify-between">
                <div>
                  <div className="font-black text-xs uppercase text-gray-900">{s.name}</div>
                  <div className="text-[10px] text-gray-400 truncate mb-4">{s.jsonUrl ?? s.url}</div>
                </div>
                <button className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${s.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`} onClick={() => toggleSiteMut.mutate({ id: s.id, enabled: !s.enabled })}>
                  {s.enabled ? "Enabled" : "Disabled"} (Toggle)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* EVENTS */}
        <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3"><LayoutGrid size={18} className="text-brand-purple" /> Events</h3>

          <div id="edit-section" className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{editingId ? "Edit existing event" : "Add event manually"}</h4>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <div className="xl:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Title</label>
                    <input className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm outline-none focus:border-brand-purple transition-all" value={editingId ? editTitle : newTitle} onChange={(e) => editingId ? setEditTitle(e.target.value) : setNewTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">City (Map)</label>
                    <div className="relative flex items-center cursor-pointer" onClick={() => setShowMap(true)}>
                      <MapPin size={18} className="absolute left-4 text-brand-purple" />
                      <input readOnly className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm cursor-pointer" value={editingId ? editCity : newCity} placeholder="Pick County..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase text-gray-400 ml-1 tracking-widest">Categories</span>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_CATEGORIES.map(cat => {
                      const active = (editingId ? editCategory : newCategory) === cat;
                      return (
                        <button key={cat} onClick={() => editingId ? setEditCategory(cat) : setNewCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${active ? 'bg-brand-purple border-brand-purple text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>{cat}</button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Event Time</label>
                      <div className="relative flex items-center">
                         <Clock size={18} className="absolute left-4 text-brand-purple" />
                         <input type="time" className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" value={(editingId ? editStart : newStart).split("T")[1] || "19:00"} onChange={(e) => {
                           const date = (editingId ? editStart : newStart).split("T")[0] || format(new Date(), "yyyy-MM-dd");
                           editingId ? setEditStart(`${date}T${e.target.value}`) : setNewStart(`${date}T${e.target.value}`);
                         }} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Manual Category</label>
                      <input className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" value={editingId ? editCategory : newCategory} onChange={(e) => editingId ? setEditCategory(e.target.value) : setNewCategory(e.target.value)} />
                   </div>
                </div>

                <button className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-brand-purple transition-all active:scale-[0.98]" onClick={() => editingId ? saveMut.mutate() : addEventMut.mutate()} disabled={saveMut.isPending || addEventMut.isPending}>
                  <Check className="inline-block mr-2" size={16} /> {editingId ? "Update Event" : "Publish Event"}
                </button>
              </div>

              <div className="xl:col-span-1 flex flex-col items-center gap-8">
                <div className="space-y-3 w-full max-w-[280px]">
                  <span className="text-[9px] font-black uppercase text-gray-400 ml-1 block tracking-widest">1. Select Date</span>
                  <CustomCalendar 
                    selectedDate={(editingId ? editStart : newStart).split("T")[0]} 
                    onSelect={(date) => updateDateTime(editingId ? editStart : newStart, date, editingId ? setEditStart : setNewStart)} 
                  />
                </div>

                <div className="space-y-3 w-full max-w-[280px]">
                  <span className="text-[9px] font-black uppercase text-gray-400 ml-1 block tracking-widest text-center">2. Event Photo</span>
                  <ImageUpload initialImage={imageUrl} onImageChange={(base64) => setImageUrl(base64)} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
             <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" placeholder="Search..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
             <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" placeholder="City" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} />
             <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" placeholder="Category" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} />
             <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" type="date" value={searchStart} onChange={(e) => setSearchStart(e.target.value)} />
             <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm" type="date" value={searchEnd} onChange={(e) => setSearchEnd(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {(events ?? []).map((e: any) => (
              <div key={e.id} className="relative group">
                <EventCard 
                  id={e.id} title={e.title} city={e.city} venue={e.venue || "N/A"} 
                  startDate={e.startDate} imageUrl={e.imageUrl} category={e.category} 
                  url={e.url} isWished={false} isPending={false} onToggleWishlist={() => {}} 
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 z-20">
                  <button className="p-2 bg-white/90 backdrop-blur text-gray-900 rounded-xl shadow-xl hover:bg-brand-purple hover:text-white transition-all" onClick={() => startEdit(e)}><Edit2 size={16} /></button>
                  <button className="p-2 bg-white/90 backdrop-blur text-red-600 rounded-xl shadow-xl hover:bg-red-600 hover:text-white transition-all" onClick={() => delMut.mutate(e.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
          {(events ?? []).length === 0 && <div className="text-center py-20 text-gray-300 font-black uppercase text-[10px] tracking-widest">No matching events found in database.</div>}
        </div>
      </div>
    </div>
  );
}