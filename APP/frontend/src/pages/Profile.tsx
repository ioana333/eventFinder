import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addPhoto, getWishlistDB, me, myPhotos } from "./services";
import { EventCard } from "../components/EventCard";
import { CircularGallery, type GalleryItem } from "../components/CircularGallery";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "../components/dialog";
import { Camera, Mail, MapPin, Plus, User, LayoutGrid, AlertCircle } from "lucide-react";
import FileUpload, { DropZone, FileList } from "../components/FileUpload"; 

export default function Profile() {
  const qc = useQueryClient();
  
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: me });
  const { data: wishlistRaw } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlistDB });
  const { data: photos } = useQuery({ queryKey: ["myPhotos"], queryFn: myPhotos });

  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [eventId, setEventId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  
  // Stare pentru erori vizibile în formular
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addMut = useMutation({
    mutationFn: () => {
      console.log("Se trimite la server...", { imageUrlLength: imageUrl.length, caption , imageUrl});
      return addPhoto({
        imageUrl: imageUrl.trim(), // String-ul Base64
        caption: caption.trim() || undefined,
        eventId: eventId.trim() || undefined,
      });
    },
    onSuccess: () => {
      console.log("Succes! Poza a fost salvată.");
      setImageUrl("");
      setCaption("");
      setEventId("");
      setSelectedFiles([]);
      setUploadError(null);
      setIsDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["myPhotos"] });
    },
    onError: (err: any) => {
      console.error("Eroare la upload:", err);
      // Verificăm dacă eroarea este din cauza mărimii fișierului
      if (err.response?.status === 413) {
        setUploadError("Poza este prea mare pentru server! Încearcă una sub 1MB.");
      } else {
        setUploadError("Eroare la salvare. Verifică consola pentru detalii.");
      }
    }
  });

  const handleFileChange = (files: any[]) => {
    console.log("Fișier selectat:", files);
    setSelectedFiles(files);
    setUploadError(null);

    if (files && files.length > 0) {
      const file = files[0].file;
      
      // Verificare mărime înainte de procesare (Ex: max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        setUploadError("Fișierul este prea mare (Max 4MB).");
        setImageUrl("");
        return;
      }

      const reader = new FileReader();
      
      reader.onloadstart = () => console.log("A început conversia în Base64...");
      
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log("Conversie gata! Lungime string:", result.length);
        setImageUrl(result);
      };
      
      reader.onerror = () => {
        console.error("Eroare la citirea fișierului");
        setUploadError("Nu s-a putut citi fișierul.");
      };

      reader.readAsDataURL(file);
    } else {
      setImageUrl("");
    }
  };

  const role = localStorage.getItem("role");
  const wishlistRows = Array.isArray(wishlistRaw) ? wishlistRaw : [];

  const galleryItems: GalleryItem[] = (photos ?? []).map((p) => ({
    id: p.id,
    url: p.imageUrl,
    caption: p.caption || "", 
    author: meData?.username
  }));

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] py-12 px-4">
      <div className="w-full max-w-[1400px] mx-auto space-y-16">
        
        <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-brand-purple/10 rounded-full flex items-center justify-center text-brand-purple">
            <User size={40} />
          </div>
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
              {meData?.username || "Loading..."}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400 font-bold text-[10px] tracking-widest uppercase">
              <span className="flex items-center gap-1.5"><Mail size={12} className="text-brand-purple" /> {meData?.email}</span>
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-purple" /> {meData?.city || "No City Specified"}</span>
              <span className="px-3 py-1 bg-gray-50 rounded-lg text-brand-purple border border-gray-100">{meData?.role}</span>
            </div>
          </div>

          <div className="md:ml-auto">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-brand-purple transition-all shadow-xl shadow-gray-200">
                  <Plus size={18} /> Add New Moment
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-black uppercase tracking-tight text-xl text-gray-700">Share a Photo</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 pt-4">
                  {uploadError && (
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle size={16} /> {uploadError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Upload Photo</label>
                    <FileUpload 
                      accept="image/*" 
                      maxCount={1} 
                      maxSize={5}
                      files={selectedFiles}
                      onFileSelectChange={handleFileChange}
                    >
                      <DropZone prompt="Drop your memory here or click" />
                      <FileList 
                        onRemove={() => { setSelectedFiles([]); setImageUrl(""); setUploadError(null); }} 
                      />
                    </FileUpload>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-700 ml-2 tracking-widest">Caption</label>
                    <input className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 outline-none focus:border-brand-purple font-bold text-xs text-gray-700" placeholder="What's happening?" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Event ID (Optional)</label>
                    <input className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 outline-none focus:border-brand-purple font-bold text-xs text-gray-700" placeholder="e.g. 123" value={eventId} onChange={(e) => setEventId(e.target.value)} />
                  </div>
                  
                  <button 
                    className="w-full py-5 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-[0.3em] disabled:opacity-50 hover:bg-brand-purple transition-all mt-4" 
                    disabled={!imageUrl || addMut.isPending} 
                    onClick={() => addMut.mutate()}
                  >
                    {addMut.isPending ? "Uploading..." : "Post to Gallery"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* GALERIA 3D */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
              <Camera size={18} className="text-brand-purple" /> 3D Visual Memories
            </h3>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{galleryItems.length} Photos</span>
          </div>
          
          <div className="relative h-[650px] w-full bg-gray-950 rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
            {galleryItems.length > 0 ? (
              <CircularGallery 
                items={galleryItems} 
                radius={550} 
                autoRotateSpeed={0.03} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-gray-700">
                  <Camera size={32} />
                </div>
                <p className="text-gray-600 font-black uppercase text-[10px] tracking-[0.3em]">Gallery is currently empty</p>
              </div>
            )}
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/40 text-[9px] font-black uppercase tracking-[0.4em] pointer-events-none">
              Scroll to Explore 360°
            </div>
          </div>
        </div>

        {/* WISHLIST */}
        <div className="space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 ml-4 flex items-center gap-3">
            <LayoutGrid size={18} className="text-brand-purple" /> Saved Experiences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistRows.map((row) => {
              const e = row.event;
              if (!e) return null;
              return (
                <EventCard 
                  key={row.id} 
                  id={row.eventId} 
                  title={e.title} 
                  city={e.city} 
                  venue={e.venue} 
                  startDate={e.startDate} 
                  imageUrl={e.imageUrl} 
                  category={e.category} 
                  url={e.url} 
                  isWished={true} 
                  isPending={false} 
                  onToggleWishlist={() => {}} 
                />
              );
            })}
          </div>
          {wishlistRows.length === 0 && (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-gray-50 text-center">
              <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">No events saved in your wishlist</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}