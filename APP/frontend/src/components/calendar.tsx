"use client";

import * as React from "react";
import { format, addWeeks, subWeeks, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../components/button";

interface CalendarProps {
  selectedDate?: string;
  onSelect: (date: string) => void;
}

const DAYS_OF_WEEK = [
  { key: "mon", label: "M" }, { key: "tue", label: "T" }, { key: "wed", label: "W" },
  { key: "thu", label: "T" }, { key: "fri", label: "F" }, { key: "sat", label: "S" }, { key: "sun", label: "S" },
];

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect }) => {
  const [pivotDate, setPivotDate] = React.useState<Date>(
    selectedDate && selectedDate !== "" ? parseISO(selectedDate) : new Date()
  );

  const weekDays = eachDayOfInterval({
    start: startOfWeek(pivotDate, { weekStartsOn: 1 }),
    end: endOfWeek(pivotDate, { weekStartsOn: 1 }),
  });

  return (
    <div className="w-full min-w-[280px] overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl p-2">
      <div className="flex items-center justify-between p-2 mb-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100" onClick={() => setPivotDate(subWeeks(pivotDate, 1))}>
          <ChevronLeft size={14} className="text-gray-400" />
        </Button>
        <h2 className="text-[9px] font-black uppercase tracking-widest text-gray-700">{format(pivotDate, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100" onClick={() => setPivotDate(addWeeks(pivotDate, 1))}>
          <ChevronRight size={14} className="text-gray-400" />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center mb-1 px-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.key} className="text-[8px] font-black text-gray-300 uppercase">{day.label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 pb-1">
        {weekDays.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const isSelected = selectedDate === dayStr;
          const isToday = isSameDay(day, new Date());

          return (
            <Button
              key={day.toString()}
              type="button"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 font-bold text-[10px] rounded-lg transition-all",
                isSelected 
                  ? "bg-[#f9ed69] text-black shadow-sm hover:bg-[#f9ed69]" 
                  : "bg-transparent text-gray-600 hover:bg-gray-50",
                isToday && !isSelected && "text-brand-purple ring-1 ring-inset ring-brand-purple/20"
              )}
              onClick={() => onSelect(isSelected ? "" : dayStr)}
            >
              {format(day, "d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
};