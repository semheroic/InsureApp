import React, { useEffect, useState, useCallback, useRef } from "react";
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

  const nextAd = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const prevAd = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

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
      <div className="flex items-center justify-center py-12 md:py-16">
        <Loader2 className="animate-spin w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
      </div>
    );
  }

  if (!ads.length) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 group">
      {/* Navigation Buttons - Hidden on Mobile, Visible on Desktop Hover */}
      <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity ml-6">
        <Button 
          variant="outline" size="icon" 
          className="rounded-full shadow-xl bg-white/90 dark:bg-slate-800/90 border-none h-10 w-10 hover:scale-110 transition-transform"
          onClick={prevAd}
        >
          <ChevronLeft className="w-6 h-6 text-indigo-600" />
        </Button>
      </div>

      <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity mr-6">
        <Button 
          variant="outline" size="icon" 
          className="rounded-full shadow-xl bg-white/90 dark:bg-slate-800/90 border-none h-10 w-10 hover:scale-110 transition-transform"
          onClick={nextAd}
        >
          <ChevronRight className="w-6 h-6 text-indigo-600" />
        </Button>
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-2xl md:rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800">
        <div 
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className="w-full flex-shrink-0">
              <Card className="border-none bg-white dark:bg-slate-900 rounded-none overflow-hidden">
                {/* Responsive Aspect Ratio: 16:9 for Mobile, 21:9 for Desktop */}
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

                  {/* Sponsored Badge - Scaled for Mobile */}
                  <div className="absolute top-3 left-3 md:top-6 md:left-6 flex items-center gap-3">
                    <div className="px-3 py-1 md:px-4 md:py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/20 text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em]">
                      Sponsored by {ad.company_name}
                    </div>
                  </div>

                  {/* Gradient & Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent text-white">
                    <h3 className="text-lg md:text-2xl font-black mb-1 md:mb-2 leading-tight">
                      {ad.title || "Special Offer"}
                    </h3>
                    {ad.target_url && (
                      <a
                        href={ad.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                      >
                        Explore Now 
                        <ExternalLink size={12} className="md:w-[14px] md:h-[14px] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots - Larger hit area for touch */}
      <div className="flex justify-center items-center gap-2.5 mt-4 md:mt-6">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to ad ${i + 1}`}
            className={cn(
              "h-1.5 md:h-2 transition-all duration-300 rounded-full p-0",
              currentIndex === i 
                ? "w-6 md:w-8 bg-indigo-600" 
                : "w-1.5 md:w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
            )}
          />
        ))}
      </div>
    </div>
  );
};