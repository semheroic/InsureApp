import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { Loader2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  showInactive?: boolean;
  max?: number;
}

export const AdsDisplay: React.FC<AdsDisplayProps> = ({ showInactive = false, max }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  useEffect(() => { fetchAds(); }, []);

  // --- Navigation Logic ---
  const nextAd = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const prevAd = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  // --- Auto-scroll Logic (Scrolls every 5 seconds) ---
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(nextAd, 5000);
    return () => clearInterval(interval);
  }, [ads.length, nextAd]);

  const getMediaSrc = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${BASE}${url}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  if (!ads.length) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto group">
      {/* Navigation Buttons */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full shadow-xl bg-white/90 backdrop-blur dark:bg-slate-800/90 border-none h-10 w-10"
          onClick={prevAd}
        >
          <ChevronLeft className="w-6 h-6 text-indigo-600" />
        </Button>
      </div>

      <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full shadow-xl bg-white/90 backdrop-blur dark:bg-slate-800/90 border-none h-10 w-10"
          onClick={nextAd}
        >
          <ChevronRight className="w-6 h-6 text-indigo-600" />
        </Button>
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800">
        <div 
          className="flex transition-transform duration-700 ease-in-out" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className="w-full flex-shrink-0">
              <Card className="border-none bg-white dark:bg-slate-900 rounded-none overflow-hidden">
                <div className="relative w-full aspect-[21/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {ad.ad_type === "video" ? (
                    <video
                      src={getMediaSrc(ad.media_url)}
                      className="w-full h-full object-cover"
                      autoPlay muted loop playsInline preload="auto"
                    />
                  ) : (
                    <img
                      src={getMediaSrc(ad.media_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-[10px] font-black uppercase tracking-widest">
                      Sponsored by {ad.company_name}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900/90 to-transparent text-white">
                    <h3 className="text-2xl font-black mb-2 leading-tight">{ad.title || "Special Offer"}</h3>
                    {ad.target_url && (
                      <a
                        href={ad.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Learn More <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1.5 transition-all duration-300 rounded-full",
              currentIndex === i ? "w-8 bg-indigo-600" : "w-2 bg-slate-300 dark:bg-slate-700"
            )}
          />
        ))}
      </div>
    </div>
  );
};