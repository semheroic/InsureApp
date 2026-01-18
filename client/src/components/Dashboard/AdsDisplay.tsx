import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL;

export interface Ad {
  id: number | string;
  company_name: string;
  ad_type: "image" | "video";
  media_url: string;
  title?: string;
  target_url?: string;
  is_active: boolean;
}

interface AdsDisplayProps {
  showInactive?: boolean; // whether to show inactive ads
  max?: number; // max number of ads to show
}

export const AdsDisplay: React.FC<AdsDisplayProps> = ({ showInactive = false, max }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Ad[]>(`${BASE}/api/ads`);
      let filtered = res.data || [];
      if (!showInactive) filtered = filtered.filter(ad => ad.is_active);
      if (max) filtered = filtered.slice(0, max);
      setAds(filtered);
    } catch (err) {
      console.error("Failed to fetch ads", err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  if (!ads.length) {
    return <p className="text-center text-slate-400 py-16 font-bold uppercase text-xs">No ads available</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map(ad => (
        <Card key={ad.id} className={cn(
          "overflow-hidden group rounded-2xl transition-all bg-white dark:bg-slate-900 shadow-lg",
          !ad.is_active && "opacity-60 grayscale-[0.5]"
        )}>
          <div className="aspect-video relative bg-slate-100 dark:bg-slate-800">
            {ad.ad_type === "video" ? (
              <video src={ad.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={ad.media_url} alt={ad.title || ad.company_name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            )}

            <div className="absolute top-4 right-4">
              <Badge className={cn(
                "border-none font-black text-[9px] uppercase px-3 py-1.5 rounded-full",
                ad.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
              )}>
                {ad.is_active ? "Live" : "Paused"}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{ad.company_name}</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{ad.title || "Sponsored"}</h3>

            {ad.target_url && (
              <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:underline">
                Visit <ExternalLink size={14} />
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
