import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value?: number; // fallback when apiPath not provided
  apiPath?: string; // optional endpoint to fetch value from
  field?: string; // optional field name in the response (e.g. "total_policies" or "count")
  pollInterval?: number; // ms, optional polling interval
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
  linkText = "See All Tasks",
  onLinkClick,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState<number>(Math.max(0, Math.floor(value)));
  const rafRef = useRef<number | null>(null);

  const extractValue = (data: any): number => {
    if (typeof data === "number") return data;
    if (field && data && data[field] !== undefined) return Number(data[field] ?? 0);
    if (data && typeof data === "object") {
      return Number(
        data.count ??
          data.total ??
          data.value ??
          data.total_policies ??
          data.policies ??
          data.totalPolicies ??
          0
      );
    }
    return 0;
  };

  const animateTo = (targetRaw: number) => {
    const target = Number.isFinite(Number(targetRaw)) ? Math.max(0, Math.floor(Number(targetRaw))) : 0;
    // quick set if same
    if (displayValue === target) {
      setDisplayValue(target);
      return;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const start = Number(displayValue) || 0;
    const duration = 700;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + (target - start) * ease);
      setDisplayValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
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
        const res = await axios.get(apiPath);
        if (!mounted) return;
        const v = extractValue(res.data);
        animateTo(v);
      } catch (err) {
        // silent fail — keep existing value
      }
    };

    // initial fetch / animate
    fetchAndAnimate();

    if (apiPath && pollInterval && pollInterval > 0) {
      intervalId = setInterval(fetchAndAnimate, pollInterval);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, field, pollInterval, value]);

  const formatted = new Intl.NumberFormat().format(displayValue);

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", iconBgColor)}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-4xl font-bold text-foreground">{formatted}</p>

        {onLinkClick && (
          <button
            onClick={onLinkClick}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {linkText}
            <span className="text-lg">→</span>
          </button>
        )}
      </div>
    </Card>
  );
};
