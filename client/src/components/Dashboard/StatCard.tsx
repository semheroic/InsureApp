import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LucideIcon, ArrowRight, Loader2, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Fallback high-quality insurance-themed ads
const DEFAULT_ADS = [
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop", // Legal/Insurance doc
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop", // Family/Home
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"  // Business/Handshake
];

interface AdData {
  ad_type: 'image' | 'video';
  media_url: string;
  company_name: string;
  target_url?: string;
}

interface StatCardProps {
  title: string;
  value?: number;
  apiPath?: string;
  field?: string;
  pollInterval?: number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  linkText?: string;
  onLinkClick?: () => void;
  showAd?: boolean;
}

const BASE = import.meta.env.VITE_API_URL;

export const StatCard = ({
  title,
  value = 0,
  apiPath,
  field,
  pollInterval,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-primary/10",
  linkText = "View details",
  onLinkClick,
  showAd = false,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ad, setAd] = useState<AdData | null>(null);
  const rafRef = useRef<number | null>(null);

  const extractValue = (data: any): number => {
    const source = Array.isArray(data) ? data[0] : data;
    if (typeof source === "number") return source;
    if (field && source && source[field] !== undefined) return Number(source[field]);
    if (source && typeof source === "object") {
      return Number(source.count ?? source.total ?? source.value ?? source.policies ?? 0);
    }
    return 0;
  };

  const animateTo = (targetRaw: number) => {
    const target = Number.isFinite(Number(targetRaw)) ? Math.max(0, Math.floor(Number(targetRaw))) : 0;
    if (displayValue === target) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = displayValue;
    const duration = 1500;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (target - start) * ease);
      setDisplayValue(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const fetchAd = async () => {
    try {
      const res = await axios.get(`${BASE}/api/ads/random`);
      // If backend returns data, use it. Otherwise, set a default fallback.
      if (res.data && res.data.media_url) {
        setAd(res.data);
      } else {
        setAd({
          ad_type: 'image',
          media_url: DEFAULT_ADS[Math.floor(Math.random() * DEFAULT_ADS.length)],
          company_name: "Premium Partner"
        });
      }
    } catch (err) {
      // On network error, still show a default ad
      setAd({
        ad_type: 'image',
        media_url: DEFAULT_ADS[0],
        company_name: "Bright Cover Partner"
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchAndAnimate = async () => {
      if (!apiPath) { animateTo(value); return; }
      try {
        if (displayValue === 0) setIsLoading(true);
        const res = await axios.get(apiPath, { withCredentials: true });
        if (mounted) animateTo(extractValue(res.data));
      } catch (err) {
        console.error(`StatCard (${title}) fetch failed:`, err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchAndAnimate();
    if (showAd) fetchAd();

    let intervalId = apiPath && pollInterval ? setInterval(fetchAndAnimate, pollInterval) : null;
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [apiPath, field, pollInterval, value, showAd]);

  const formatted = new Intl.NumberFormat().format(displayValue);

  return (
    <Card className="group relative p-0 overflow-hidden border border-slate-200/50 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 min-h-[180px]">
      
      {/* 1. AD MEDIA LAYER (With Fallback Logic) */}
      {showAd && ad && (
        <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none">
          {ad.ad_type === 'video' ? (
            <video src={ad.media_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={ad.media_url} className="w-full h-full object-cover" alt="Ad" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-transparent" />
        </div>
      )}

      {/* 2. DYNAMIC GLOW (Original) */}
      {!ad && (
        <div className={cn(
          "absolute -right-6 -top-6 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-700",
          iconBgColor.replace("/10", "/100") 
        )} />
      )}

      <div className="p-6 relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className={cn("p-3 rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-110", iconBgColor)}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex items-center gap-3">
            {showAd && ad && (
              <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <Megaphone className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                    {ad.company_name}
                </span>
              </div>
            )}

            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            
            {onLinkClick && (
              <button onClick={onLinkClick} className="p-2 rounded-xl hover:bg-muted transition-all active:scale-95">
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1 flex-1">
          <p className="text-[10px] font-black text-muted-foreground tracking-[0.1em] uppercase opacity-80">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black tracking-tighter text-foreground">
              {formatted}
            </h2>
            {subtitle && (
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-[1500ms] ease-out", iconBgColor.replace("/10", "/100"))} 
            style={{ width: displayValue === 0 ? '0%' : `${Math.min(displayValue, 100)}%`, filter: 'brightness(1.1)' }} 
          />
        </div>
      </div>
    </Card>
  );
};