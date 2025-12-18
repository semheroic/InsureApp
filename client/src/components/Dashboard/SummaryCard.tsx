import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Clock, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryData {
  created: number;
  active: number;
  expiring: number;
  expired: number;
}

export const SummaryCard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/summary", { withCredentials: true })
      .then((res) => {
        setSummary(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load metrics");
        setLoading(false);
      });
  }, []);

  const calculatePercentage = (value: number) => {
    if (!summary || summary.created === 0) return 0;
    return Math.round((value / summary.created) * 100);
  };

  if (loading) return (
    <Card className="p-6 h-full flex flex-col justify-center items-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-medium text-muted-foreground">Analyzing policies...</p>
    </Card>
  );

  const activePercent = calculatePercentage(summary?.active || 0);

  return (
    <Card className="p-6 h-full overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Policy Health</h3>
          <p className="text-xs text-muted-foreground">Real-time status distribution</p>
        </div>
        <ShieldCheck className="w-6 h-6 text-primary/40" />
      </div>

      {/* Main Visualization: Circular Progress */}
      <div className="relative flex justify-center mb-10">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * activePercent) / 100}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black">{activePercent}%</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-2xl bg-muted/30 border border-muted-foreground/5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total</span>
          </div>
          <p className="text-lg font-bold">{summary?.created}</p>
        </div>

        <div className="p-3 rounded-2xl bg-green-500/5 border border-green-500/10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-bold uppercase text-green-600/70">Valid</span>
          </div>
          <p className="text-lg font-bold text-green-600">{summary?.active}</p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase text-amber-600/70">Expiring</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{summary?.expiring}</p>
        </div>

        <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-bold uppercase text-red-600/70">Expired</span>
          </div>
          <p className="text-lg font-bold text-red-600">{summary?.expired}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-[10px] text-center text-destructive font-medium">{error}</p>}
    </Card>
  );
};