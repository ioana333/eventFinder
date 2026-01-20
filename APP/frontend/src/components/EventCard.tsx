"use client";

import { MapPin, Calendar, Heart, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  title: string;
  city: string;
  venue?: string | null;
  startDate: string;
  imageUrl?: string | null;
  category?: string | null;
  isWished?: boolean;
  isPending?: boolean;
  onToggleWishlist?: () => void;
  url?: string | null;
}

export const EventCard = ({
  title,
  city,
  venue,
  startDate,
  imageUrl,
  category,
  isWished,
  isPending,
  onToggleWishlist,
  url
}: EventCardProps) => {
  return (
    <div className="group bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-purple/20 transition-all duration-300 overflow-hidden flex flex-col h-full">
      
      {/* IMAGINE*/}
      <div className="relative h-40 overflow-hidden">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000&auto=format&fit=crop"} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40" />
        
        {category && (
          <div className="absolute top-3 left-4 px-3 py-1 bg-[#f9ed69] rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-md">
            {category}
          </div>
        )}

        <button 
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          disabled={isPending}
          className={cn(
            "absolute top-3 right-4 p-2 rounded-full backdrop-blur-md transition-all",
            isWished 
              ? "bg-brand-pink text-white shadow-lg scale-110" 
              : "bg-white/30 text-white hover:bg-white hover:text-brand-pink"
          )}
        >
          <Heart size={18} fill={isWished ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>

      {/* CONTINUT TEXT */}
      <div className="p-6 flex flex-col justify-between flex-grow gap-5">
        <div>
          <h3 className="text-xl font-black text-gray-900 leading-[1.1] uppercase tracking-tight line-clamp-1 mb-3">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={16} className="text-brand-purple shrink-0" />
              <span className="text-xs font-bold tracking-wide uppercase">{city}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={16} className="text-brand-purple shrink-0" />
              <span className="text-xs font-bold tracking-wide uppercase">
                {format(parseISO(startDate), "dd MMM yyyy")}
              </span>
            </div>
          </div>
        </div>

        {/* BUTON */}
        <a 
          href={url || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-brand-purple hover:shadow-lg active:scale-[0.98] group/btn"
        >
          View Details
          <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
        </a>
      </div>
    </div>
  );
};