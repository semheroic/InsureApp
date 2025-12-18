import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LucideIcon, ArrowRight } from "lucide-react";
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
  const [displayValue, setDisplayValue] = useState<number>(Math.max(0, Math.floor(value)));
  const rafRef = useRef<number | null>(null);

  // --- Logic remains identical to preserve functionality ---
  const extractValue = (data: any): number => {
    if (typeof data === "number") return data;
    if (field && data && data[field] !== undefined) return Number(data[field] ?? 0);
    if (data && typeof data === "object") {
      return Number(data.count ?? data.total ?? data.value ?? data.policies ?? 0);
    }
    return 0;
  };

  const animateTo = (targetRaw: number) => {
    const target = Number.isFinite(Number(targetRaw)) ? Math.max(0, Math.floor(Number(targetRaw))) : 0;
    if (displayValue === target) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = displayValue;
    const duration = 1000; // Slower, more premium animation
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
      if (!apiPath) { animateTo(value); return; }
      try {
        const res = await axios.get(apiPath);
        if (mounted) animateTo(extractValue(res.data));
      } catch (err) {}
    };
    fetchAndAnimate();
    if (apiPath && pollInterval) intervalId = setInterval(fetchAndAnimate, pollInterval);
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [apiPath, field, pollInterval, value]);

  const formatted = new Intl.NumberFormat().format(displayValue);

  return (
    <Card className="group relative p-0 overflow-hidden border-none bg-card shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Subtle Background Glow Effect */}
      <div className={cn(
        "absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-20 transition-opacity group-hover:opacity-40",
        iconBgColor.replace("/10", "/40")
      )} />

      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={cn("p-3 rounded-2xl shadow-inner", iconBgColor)}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {onLinkClick && (
            <button
              onClick={onLinkClick}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title={linkText}
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground tracking-tight uppercase">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black tracking-tighter text-foreground">
              {formatted}
            </h2>
            {subtitle && (
              <span className="text-xs font-medium text-muted-foreground italic">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Progress Decoration Line */}
        <div className="mt-6 h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-1000", iconBgColor.replace("/10", "/100"))} 
            style={{ width: `${Math.min(displayValue, 100)}%` }} // Purely decorative
          />
        </div>
      </div>
    </Card>
  );
};