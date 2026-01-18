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
  Search, MapPin, X, Check, Clock, Map, Tag 
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
  const [isSearchMap, setIsSearchMap] = useState(false); 
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

  // Search States
  const [searchQ, setSearchQ] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchStart, setSearchStart] = useState("");
  const [searchEnd, setSearchEnd] = useState("");

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
        startDate: editStart,
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
        <RomaniaMap onSelect={(selected) => { 
          if (isSearchMap) setSearchCity(selected);
          else if (editingId) setEditCity(selected); 
          else setNewCity(selected); 
          setShowMap(false); 
          setIsSearchMap(false);
        }} onClose={() => { setShowMap(false); setIsSearchMap(false); }} />
      )}

      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Admin Management</h1>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg" onClick={() => genCode.mutate()} disabled={genCode.isPending}>
              <Key size={16} /> Generate Code
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg" onClick={() => runScrape.mutate()} disabled={runScrape.isPending}>
              <Play size={16} /> Run Scraper
            </button>
          </div>
        </div>

        {/* INVITE CODES & SCRAPER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-50 shadow-sm min-h-[140px] flex flex-col justify-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2 px-2">Invite Codes</h3>
            <div className="flex flex-wrap gap-2 px-2">
              {(codes ?? []).map((c: any) => (
                <div key={c.id} className={`px-4 py-2 rounded-xl text-[10px] font-black border ${c.usedAt ? 'bg-gray-50 text-gray-300 border-gray-100' : 'bg-brand-yellow/10 text-brand-orange border-brand-pink/20'}`}>
                  {c.code} • {c.usedAt ? "USED" : "UNUSED"}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-pink/25 p-6 rounded-[2.5rem] text-black shadow-xl overflow-hidden text-[9px] font-mono whitespace-pre-wrap flex flex-col justify-center">
            <h3 className="text-black/40 uppercase font-black mb-2 tracking-widest px-2">Scraper Output</h3>
            <div className="px-2">
              {runScrape.data ? `Exit Code: ${runScrape.data.code}\n${runScrape.data.out || runScrape.data.err}` : "Ready."}
            </div>
          </div>
        </div>

        {/* SITES */}
        <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3"><Globe size={18} className="text-brand-purple" /> Managed Sites</h3>
          <div className="flex flex-col xl:flex-row items-end gap-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow w-full">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-300 ml-2">Name</label>
                <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm outline-none focus:border-brand-purple transition-all" placeholder="iabilet-cluj" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-300 ml-2">URL</label>
                <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm outline-none focus:border-brand-purple transition-all" placeholder="https://..." value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-300 ml-2">JSON Path</label>
                <input className="w-full px-5 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 text-gray-900 font-bold text-sm outline-none focus:border-brand-purple transition-all" placeholder="optional" value={siteJsonUrl} onChange={(e) => setSiteJsonUrl(e.target.value)} />
              </div>
            </div>
            <button className="h-[46px] px-10 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-purple transition-all shadow-lg flex items-center justify-center whitespace-nowrap" onClick={() => addSiteMut.mutate()} disabled={addSiteMut.isPending || !siteName || !siteUrl}>
              Add Site
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {(sites ?? []).map((s: any) => (
              <div key={s.id} className="p-4 rounded-2xl border-2 border-gray-50 flex flex-col justify-between hover:border-brand-purple/20 transition-all">
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

        {/* EVENTS SECTION */}
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

          {/* DATABASE EXPLORER */}
          <div className="bg-[#fcfcfc] p-10 rounded-[3rem] border-2 border-gray-100 shadow-inner space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2 px-2">
              <Search size={14}/> Database Explorer
            </h4>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              <div className="space-y-8 flex flex-col justify-center">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Keyword Search</label>
                  <div className="relative flex items-center group">
                    <Search size={18} className="absolute left-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-2 border-white bg-white text-gray-900 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-purple/10 transition-all" placeholder="Search events, venues..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Filter by Category</label>
                  <div className="flex flex-wrap gap-2 px-2">
                    {PREDEFINED_CATEGORIES.map(cat => {
                      const active = searchCategory === cat;
                      return (
                        <button key={cat} onClick={() => setSearchCategory(active ? "" : cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${active ? 'bg-brand-purple border-brand-purple text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-brand-purple/20'}`}>{cat}</button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Filter by City</label>
                  <div className="relative flex items-center group cursor-pointer" onClick={() => { setIsSearchMap(true); setShowMap(true); }}>
                    <MapPin size={18} className="absolute left-6 text-brand-purple" />
                    <input readOnly className="w-full pl-16 pr-12 py-5 rounded-[2rem] border-2 border-white bg-white text-gray-900 font-bold text-sm shadow-sm cursor-pointer outline-none group-hover:border-brand-purple/20 transition-all" placeholder="All of Romania" value={searchCity} />
                    {searchCity && (
                      <button onClick={(e) => { e.stopPropagation(); setSearchCity(""); }} className="absolute right-6 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X size={14} /></button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 xl:justify-end">
                  <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase text-gray-400 ml-1 block text-center tracking-widest">From Date</span>
                    <CustomCalendar selectedDate={searchStart} onSelect={(date) => setSearchStart(date)} />
                    {searchStart && <button onClick={() => setSearchStart("")} className="w-full text-[8px] font-black uppercase text-red-400 hover:text-red-500 mt-1">Clear</button>}
                  </div>
                  <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase text-gray-400 ml-1 block text-center tracking-widest">To Date</span>
                    <CustomCalendar selectedDate={searchEnd} onSelect={(date) => setSearchEnd(date)} />
                    {searchEnd && <button onClick={() => setSearchEnd("")} className="w-full text-[8px] font-black uppercase text-red-400 hover:text-red-500 mt-1">Clear</button>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {(events ?? []).map((e: any) => (
              <div key={e.id} className="relative group">
                <EventCard id={e.id} title={e.title} city={e.city} venue={e.venue || "N/A"} startDate={e.startDate} imageUrl={e.imageUrl} category={e.category} url={e.url} isWished={false} isPending={false} onToggleWishlist={() => {}} />
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