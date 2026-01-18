import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom"; //necesar pentru redirect
import { listCitiesUI, listEvents, getWishlistDB, addToWishlist, removeFromWishlist } from "./services";
import { EventCard } from "../components/EventCard";
import { SelectorChips } from "../components/SelectorChips";
import RomaniaMap from "../components/RomaniaMap";
import { Calendar } from "../components/calendar"; 
import { Search, MapPin, Calendar as CalendarIcon, X } from "lucide-react";

export default function Home() {
  const qc = useQueryClient();
  const navigate = useNavigate(); // pentru navigare
  
  const [q, setQ] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  const loggedIn = !!localStorage.getItem("token"); // verificam daca exista token (pt redirectionare)

  const categoryOptions = ["music", "theater", "art", "cinema", "food", "sport", "technology", "international", "stand-up", "conferences", "markets", "others"];

  const filters = useMemo(() => ({
    q: q.trim() || undefined,
    category: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
    city: city.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [q, selectedCategories, city, startDate, endDate]);

  const { data: eventsRaw, isLoading: isEventsLoading } = useQuery({
    queryKey: ["events", filters],
    queryFn: () => listEvents(filters),
  });
  
  const events = useMemo(() => (Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw as any)?.events || []), [eventsRaw]);

  const { data: wishlistRaw } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlistDB,
    enabled: loggedIn,
  });

  const wishlistIds = useMemo(() => new Set((Array.isArray(wishlistRaw) ? wishlistRaw : []).map((r: any) => r.eventId)), [wishlistRaw]);

  const toggleMut = useMutation({
    mutationFn: async (vars: { id: string; wished: boolean }) => vars.wished ? removeFromWishlist(vars.id) : addToWishlist(vars.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] py-10 px-4">
      <div className="w-full max-w-[1400px] mx-auto">
        
        {/* FILTERS CARD */}
        <div className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            
            {/* STANGA: Search, Location, Categories */}
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-3 tracking-widest">Search</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/30 focus-within:border-brand-purple focus-within:bg-white transition-all shadow-sm">
                    <Search size={16} className="text-gray-700" />
                    <input className="w-full bg-transparent outline-none font-bold text-xs text-gray-700" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-3 tracking-widest">Location</label>
                  <button onClick={() => setIsMapOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/30 hover:border-brand-purple transition-all text-left shadow-sm">
                    <MapPin size={16} className="text-brand-purple" />
                    <span className="font-bold text-xs text-gray-700 truncate">{city || "Select City"}</span>
                    {city && <X size={14} className="ml-auto text-gray-300" onClick={(e) => { e.stopPropagation(); setCity(""); }} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-3 tracking-widest">Categories</label>
                <SelectorChips options={categoryOptions} onChange={setSelectedCategories} />
              </div>
            </div>

            {/* DREAPTA: Time Period & Discover */}
            <div className="flex flex-col lg:border-l lg:border-gray-50 lg:pl-10">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-4 mb-3 tracking-widest">Time Period</label>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="dropdown dropdown-bottom">
                  <div tabIndex={0} role="button" className="flex items-center gap-2.5 w-full px-3 py-3 bg-white border-2 border-gray-100 rounded-xl shadow-sm">
                    <CalendarIcon size={14} className="text-brand-purple shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="text-[7px] font-black text-gray-400 uppercase leading-none mb-0.5">From</span>
                      <span className="text-[10px] font-bold text-gray-800">
                        {startDate ? format(parseISO(startDate), "dd.MM.yy") : "Pick date"}
                      </span>
                    </div>
                  </div>
                  <div tabIndex={0} className="dropdown-content z-[110] mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100">
                    <Calendar selectedDate={startDate} onSelect={(date) => { setStartDate(startDate === date ? "" : date); if (document.activeElement instanceof HTMLElement) (document.activeElement as any).blur(); }} />
                  </div>
                </div>

                <div className="dropdown dropdown-bottom">
                  <div tabIndex={0} role="button" className="flex items-center gap-2.5 w-full px-3 py-3 bg-white border-2 border-gray-100 rounded-xl shadow-sm">
                    <CalendarIcon size={14} className="text-brand-purple shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="text-[7px] font-black text-gray-400 uppercase leading-none mb-0.5">To</span>
                      <span className="text-[10px] font-bold text-gray-800">
                        {endDate ? format(parseISO(endDate), "dd.MM.yy") : "Pick date"}
                      </span>
                    </div>
                  </div>
                  <div tabIndex={0} className="dropdown-content z-[110] mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100">
                    <Calendar selectedDate={endDate} onSelect={(date) => { setEndDate(endDate === date ? "" : date); if (document.activeElement instanceof HTMLElement) (document.activeElement as any).blur(); }} />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] hover:bg-brand-purple transition-all shadow-xl active:scale-[0.98]">
                  Discover
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isEventsLoading ? (
            <div className="col-span-full text-center py-20 font-black text-gray-200 uppercase tracking-widest animate-pulse">
              Curating Events...
            </div>
          ) : (
            events.map((e: any) => {
              const isWished = wishlistIds.has(e.id);
              return (
                <EventCard 
                  key={e.id} 
                  {...e} 
                  isWished={isWished} 
                  isPending={toggleMut.isPending} 
                  onToggleWishlist={() => {
                    if (!loggedIn) {
                      navigate("/login");
                      return;
                    }
                    toggleMut.mutate({ id: e.id, wished: isWished });
                  }} 
                />
              );
            })
          )}
        </div>

        {isMapOpen && <RomaniaMap onSelect={setCity} onClose={() => setIsMapOpen(false)} />}
      </div>
    </div>
  );
}