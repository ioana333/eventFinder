"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface SelectorChipsProps {
  options: string[];
  onChange: (selected: string[]) => void;
}

export const SelectorChips: React.FC<SelectorChipsProps> = ({ options, onChange }) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggleOption = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    setSelected(next);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => toggleOption(option)}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border-2",
            selected.includes(option)
              ? "bg-[#f9ed69] border-[#f9ed69] text-black shadow-sm"
              : "bg-white border-gray-100 text-gray-500 hover:border-brand-purple/30"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};