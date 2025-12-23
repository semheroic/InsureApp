import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LucideIcon, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}

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
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const rafRef = useRef<number | null>(null);

  // --- REFINED EXTRACTION LOGIC ---
  const extractValue = (data: any): number => {
    // Handle cases where backend returns an array (common in SQL SELECT COUNT)
    const source = Array.isArray(data) ? data[0] : data;
    
    if (typeof source === "number") return source;
    if (field && source && source[field] !== undefined) return Number(source[field]);
    
    // Common fallback keys used in your backend
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
    const duration = 1500; // Smoother, high-end feel
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease-out
      const current = Math.round(start + (target - start) * ease);
      
      setDisplayValue(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    let mounted = true;
    let intervalId: any = null;

    const fetchAndAnimate = async () => {
      if (!apiPath) {
        animateTo(value);
        return;
      }

      try {
        if (displayValue === 0) setIsLoading(true);
        // Added withCredentials to ensure it works with your Auth middleware
        const res = await axios.get(apiPath, { withCredentials: true });
        if (mounted) animateTo(extractValue(res.data));
      } catch (err) {
        console.error(`StatCard (${title}) fetch failed:`, err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchAndAnimate();

    if (apiPath && pollInterval) {
      intervalId = setInterval(fetchAndAnimate, pollInterval);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [apiPath, field, pollInterval, value]);

  const formatted = new Intl.NumberFormat().format(displayValue);

  return (
    <Card className="group relative p-0 overflow-hidden border border-slate-200/50 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
      {/* Dynamic Background Glow */}
      <div className={cn(
        "absolute -right-6 -top-6 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-700",
        iconBgColor.replace("/10", "/100") 
      )} />

      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={cn("p-3 rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-110", iconBgColor)}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            {onLinkClick && (
              <button
                onClick={onLinkClick}
                className="p-2 rounded-xl hover:bg-muted transition-all active:scale-95"
                title={linkText}
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
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

        {/* Decorative Progress Line - Matches the Icon color theme */}
        <div className="mt-6 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-[1500ms] ease-out", iconBgColor.replace("/10", "/100"))} 
            style={{ 
               width: displayValue === 0 ? '0%' : `${Math.min(displayValue, 100)}%`,
               filter: 'brightness(1.1)'
            }} 
          />
        </div>
      </div>
    </Card>
  );
};