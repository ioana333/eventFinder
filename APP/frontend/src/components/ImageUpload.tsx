"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";

interface ImageUploadProps {
  onImageChange: (base64: string | null) => void;
  initialImage?: string | null;
}

export default function ImageUpload({ onImageChange, initialImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(initialImage || null);
  }, [initialImage]);

  function handleFile(file: File) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageChange(base64); // trimitem imaginea catre Admin.tsx
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          "group relative flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] aspect-square overflow-hidden transition-all duration-300 cursor-pointer shadow-sm",
          isDragging 
            ? "border-brand-purple bg-brand-purple/5 scale-[0.98]" 
            : "border-gray-200 bg-gray-50 hover:border-brand-purple/40 hover:bg-white"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); 
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full animate-in fade-in duration-500">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-red-500 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                <X size={20} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 space-y-3">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-gray-300 group-hover:text-brand-purple group-hover:scale-110 transition-all">
              <ImagePlus size={32} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Add Cover Photo</p>
                <p className="text-[8px] font-bold text-gray-300 uppercase">Max 5MB • JPG, PNG</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}