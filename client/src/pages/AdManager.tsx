import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, ExternalLink, Loader2,
  Power, Megaphone, BarChart3, CheckCircle2, Link, Upload
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;

interface Ad {
  id: number | string;
  company_name: string;
  ad_type: "image" | "video";
  media_url: string;
  title?: string;
  cta_text?: string;
  target_url?: string;
  is_active: boolean;
}

export const AdManager: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New states for flexible input
  const [uploadMode, setUploadMode] = useState<"file" | "url">("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    ad_type: "image",
    media_url: "", // For URL mode
    title: "",
    cta_text: "Learn More",
    target_url: ""
  });

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<Ad[]>(`${BASE}/api/ads`, { withCredentials: true });
      setAds(res.data || []);
    } catch (err) {
      console.error("Failed to fetch ads", err);
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleCreate = async () => {
    if (!formData.company_name) return alert("Sponsor Name is required");
    
    // Prepare FormData for Backend
    const data = new FormData();
    data.append("company_name", formData.company_name);
    data.append("ad_type", formData.ad_type);
    data.append("title", formData.title);
    data.append("cta_text", formData.cta_text);
    data.append("target_url", formData.target_url);

    if (uploadMode === "file") {
      if (!selectedFile) return alert("Please select a file to upload");
      data.append("media", selectedFile); 
    } else {
      if (!formData.media_url) return alert("Please enter a media URL");
      data.append("media_url", formData.media_url);
    }

    try {
      await axios.post(`${BASE}/api/ads`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIsAdding(false);
      resetForm();
      fetchAds();
    } catch (err) {
      console.error(err);
      alert("Failed to save campaign");
    }
  };

  const resetForm = () => {
    setFormData({ company_name: "", ad_type: "image", media_url: "", title: "", cta_text: "Learn More", target_url: "" });
    setSelectedFile(null);
    setUploadMode("url");
  };

  const toggleStatus = async (ad: Ad) => {
    try {
      await axios.patch(`${BASE}/api/ads/${ad.id}/status`, { is_active: !ad.is_active }, { withCredentials: true });
      fetchAds();
    } catch (err) { console.error("Status update failed", err); }
  };

  const handleDelete = async (ad: Ad) => {
    if (!window.confirm("Permanently delete this advertisement?")) return;
    try {
      await axios.delete(`${BASE}/api/ads/${ad.id}`, { withCredentials: true });
      fetchAds();
    } catch (err) { console.error(err); alert("Delete failed"); }
  };

  // Helper to determine the final source URL
  const getMediaSrc = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${BASE}${url}`;
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Ad Campaign Manager</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">Control the sponsor media shown on dashboard cards.</p>
        </div>

        <Dialog open={isAdding} onOpenChange={(val) => { setIsAdding(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-11 w-full gap-2 rounded-md bg-indigo-600 px-5 font-bold text-white shadow-sm hover:bg-indigo-700 sm:w-auto">
              <Plus size={20} strokeWidth={3} /> Launch Campaign
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border-none p-0 shadow-2xl sm:max-w-[640px]">
            <div className="relative bg-slate-900 p-5 text-white sm:p-8">
              <DialogClose className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-white/10 sm:right-6 sm:top-6"><Plus className="rotate-45" size={18} /></DialogClose>
              <div className="flex items-center gap-4 pr-8 sm:gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-indigo-500 sm:h-14 sm:w-14">
                  <Megaphone className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-bold sm:text-2xl">New Sponsorship</DialogTitle>
                  <p className="text-slate-400 text-sm">Upload local files or use external links</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 bg-white p-5 dark:bg-slate-950 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Sponsor Name</Label>
                  <Input placeholder="Company Name" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Ad Type</Label>
                  <select className="h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-800" value={formData.ad_type} onChange={e => setFormData({...formData, ad_type: e.target.value as any})}>
                    <option value="image">Static Image</option>
                    <option value="video">Promotional Video</option>
                  </select>
                </div>
              </div>

              {/* Input Mode Selector */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Media Source</Label>
                <div className="grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-900">
                  <button 
                    type="button"
                    onClick={() => setUploadMode("url")}
                    className={cn("flex items-center justify-center gap-2 rounded-md py-2 text-xs font-bold transition-all", uploadMode === "url" ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800" : "text-slate-500")}
                  >
                    <Link size={14} /> Paste Link
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={cn("flex items-center justify-center gap-2 rounded-md py-2 text-xs font-bold transition-all", uploadMode === "file" ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800" : "text-slate-500")}
                  >
                    <Upload size={14} /> Local File
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                  {uploadMode === "url" ? "Media URL" : "Upload File"}
                </Label>
                {uploadMode === "url" ? (
                  <Input className="font-mono text-xs" placeholder="https://..." value={formData.media_url} onChange={e => setFormData({...formData, media_url: e.target.value})} />
                ) : (
                  <Input 
                    type="file" 
                    className="cursor-pointer"
                    accept={formData.ad_type === "video" ? "video/*" : "image/*"} 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Ad Title (Headline)</Label>
                <Input placeholder="Catchy Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">CTA Button Text</Label>
                  <Input placeholder="Learn More" value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Target URL</Label>
                  <Input placeholder="https://..." value={formData.target_url} onChange={e => setFormData({...formData, target_url: e.target.value})} />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-white p-5 pt-0 dark:bg-slate-950 sm:p-8 sm:pt-0">
              <Button onClick={handleCreate} className="h-12 w-full rounded-md bg-indigo-600 font-bold text-white shadow-sm transition-transform hover:bg-indigo-700 active:scale-[0.98]">
                Save to Database
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 rounded-lg border-slate-200 bg-white p-4 dark:bg-slate-900 sm:p-5">
          <div className="rounded-md bg-indigo-50 p-3 text-indigo-600"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Campaigns</p>
            <p className="text-2xl font-black">{ads.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 rounded-lg border-slate-200 bg-white p-4 dark:bg-slate-900 sm:p-5">
          <div className="rounded-md bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Ads</p>
            <p className="text-2xl font-black">{ads.filter(a => a.is_active).length}</p>
          </div>
        </Card>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Querying Database...</p>
          </div>
        ) : (
          ads.map((ad: Ad) => (
            <Card key={ad.id} className={cn(
              "group overflow-hidden rounded-lg border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900",
              !ad.is_active && "opacity-60 grayscale-[0.5]"
            )}>
              <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {ad.ad_type === "video" ? (
                  <video 
                    src={getMediaSrc(ad.media_url)} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                  />
                ) : (
                  <img 
                    src={getMediaSrc(ad.media_url)} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                )}

                <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                  <Badge className={cn("rounded-full border-none px-3 py-1.5 text-[9px] font-black uppercase", ad.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white")}>
                    {ad.is_active ? "Live" : "Paused"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{ad.company_name}</p>
                  <h3 className="text-lg font-bold leading-tight text-slate-900 dark:text-white sm:text-xl">{ad.title || "No Headline"}</h3>
                </div>

                <div className="grid grid-cols-[1fr_44px_44px] items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Button 
                    variant="outline" 
                    className={cn("h-11 rounded-md gap-2 text-xs font-bold", ad.is_active ? "text-amber-600" : "text-emerald-600")}
                    onClick={() => toggleStatus(ad)}
                  >
                    <Power size={14} /> {ad.is_active ? "Pause" : "Resume"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-11 w-11 rounded-md p-0 transition-colors hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(ad)}
                  >
                    <Trash2 size={16} />
                  </Button>

                  <Button className="h-11 w-11 rounded-md bg-slate-900 p-0 text-white shadow-sm transition-transform active:scale-90" asChild>
                    <a href={ad.target_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
