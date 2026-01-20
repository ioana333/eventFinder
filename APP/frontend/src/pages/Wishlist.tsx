import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWishlistDB, removeFromWishlist, type WishlistRow } from "./services";
import { EventCard } from "../components/EventCard";
import { HeartOff } from "lucide-react";

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
    <div className="w-full min-h-screen bg-[#fcfcfc] py-12 px-4">
      <div className="w-full max-w-[1400px] mx-auto">
        
        {/* HEADER SECȚIUNE */}
        <div className="mb-12 space-y-2">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
            My Wishlist
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            {rows.length} Saved Events
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 text-red-500 p-6 rounded-3xl font-bold text-center">
            Something went wrong.
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-gray-100 border-dashed">
            <HeartOff size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Your wishlist is empty.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rows.map((row) => {
            const e = row.event; // <- AICI e evenimentul complet
            if (!e) return null;

            return (
              <EventCard 
                key={row.id}
                id={row.eventId}
                title={e.title ?? "(missing title)"}
                city={e.city ?? ""}
                venue={e.venue}
                startDate={e.startDate}
                category={e.category}
                imageUrl={e.imageUrl}
                url={e.url}
                isWished={true} // Suntem în wishlist, deci toate sunt "wished"
                isPending={removeMut.isPending}
                onToggleWishlist={() => removeMut.mutate(row.eventId)} // <- FOARTE IMPORTANT: eventId, NU row.id
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}