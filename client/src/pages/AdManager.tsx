import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, ExternalLink, Loader2,
  Power, Megaphone, BarChart3, CheckCircle2
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

  const [formData, setFormData] = useState({
    company_name: "",
    ad_type: "image",
    media_url: "",
    title: "",
    cta_text: "Learn More",
    target_url: ""
  });

  // --- Fetch all ads from DB ---
  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<Ad[]>(`${BASE}/api/ads`);
      setAds(res.data || []);
    } catch (err) {
      console.error("Failed to fetch ads", err);
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  // --- Create new ad ---
  const handleCreate = async () => {
    if (!formData.company_name || !formData.media_url) {
      return alert("Sponsor Name and Media URL are required");
    }

    try {
      await axios.post(`${BASE}/api/ads`, formData);
      setIsAdding(false);
      setFormData({ company_name: "", ad_type: "image", media_url: "", title: "", cta_text: "Learn More", target_url: "" });
      fetchAds();
    } catch (err) {
      console.error(err);
      alert("Failed to save campaign to database");
    }
  };

  // --- Toggle ad status ---
  const toggleStatus = async (ad: Ad) => {
    try {
      await axios.patch(`${BASE}/api/ads/${ad.id}/status`, { is_active: !ad.is_active });
      fetchAds();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  // --- Delete ad ---
  const handleDelete = async (ad: Ad) => {
    if (!window.confirm("Permanently delete this advertisement?")) return;
    try {
      await axios.delete(`${BASE}/api/ads/${ad.id}`);
      fetchAds();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Ad Campaign Manager</h1>
          <p className="text-slate-500 font-medium">Control the sponsor media shown on dashboard cards.</p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl gap-2 shadow-xl shadow-indigo-200">
              <Plus size={20} strokeWidth={3} /> Launch Campaign
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
            <div className="relative bg-slate-900 p-8 text-white">
              <DialogClose className="absolute right-6 top-6 rounded-full p-2 hover:bg-white/10"><Plus size={18} /></DialogClose>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center">
                  <Megaphone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">New Sponsorship</DialogTitle>
                  <p className="text-slate-400 text-sm">Fill the fields required by your database</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-5 bg-white dark:bg-slate-950">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Sponsor Name</Label>
                  <Input placeholder="Company Name" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Media Type</Label>
                  <select className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-transparent text-sm" value={formData.ad_type} onChange={e => setFormData({...formData, ad_type: e.target.value as "image" | "video"})}>
                    <option value="image">Static Image</option>
                    <option value="video">Promotional Video</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Media URL</Label>
                <Input className="font-mono text-xs" placeholder="https://..." value={formData.media_url} onChange={e => setFormData({...formData, media_url: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Ad Title (Headline)</Label>
                <Input placeholder="Catchy Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

            <DialogFooter className="p-8 pt-0">
              <Button onClick={handleCreate} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">Save to Database</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200 flex items-center gap-4 bg-white dark:bg-slate-900">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Campaigns</p>
            <p className="text-2xl font-black">{ads.length}</p>
          </div>
        </Card>
        <Card className="p-5 border-slate-200 flex items-center gap-4 bg-white dark:bg-slate-900">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Ads</p>
            <p className="text-2xl font-black">{ads.filter(a => a.is_active).length}</p>
          </div>
        </Card>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Querying Database...</p>
          </div>
        ) : (
          ads.map((ad: Ad) => (
            <Card key={ad.id} className={cn(
              "overflow-hidden group border-slate-200 dark:border-slate-800 rounded-[32px] transition-all bg-white dark:bg-slate-900",
              !ad.is_active && "opacity-60 grayscale-[0.5]"
            )}>
              <div className="aspect-video relative bg-slate-100 dark:bg-slate-800">
                {ad.ad_type === "video" ? (
                  <video src={ad.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <img src={ad.media_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  <Badge className={cn("border-none font-black text-[9px] uppercase px-3 py-1.5 rounded-full", ad.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white")}>
                    {ad.is_active ? "Live" : "Paused"}
                  </Badge>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{ad.company_name}</p>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{ad.title || "No Headline"}</h3>
                </div>

                <div className="flex items-center gap-2 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    variant="outline" 
                    className={cn("flex-1 h-11 rounded-xl gap-2 font-bold text-xs", ad.is_active ? "text-amber-600" : "text-emerald-600")}
                    onClick={() => toggleStatus(ad)}
                  >
                    <Power size={14} /> {ad.is_active ? "Pause" : "Resume"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-11 w-11 p-0 rounded-xl hover:text-red-600"
                    onClick={() => handleDelete(ad)}
                  >
                    <Trash2 size={16} />
                  </Button>

                  <Button className="h-11 w-11 p-0 rounded-xl bg-slate-900 text-white shadow-lg" asChild>
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
