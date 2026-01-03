import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Clock, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
const API_URL = import.meta.env.VITE_API_URL;
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
      .get(`${API_URL}/api/summary`, { withCredentials: true })
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
    <Card className="p-6 h-full flex flex-col justify-center items-center space-y-4 border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className="w-8 h-8 text-blue-500" />
      </motion.div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analyzing Intel...</p>
    </Card>
  );

  const activePercent = calculatePercentage(summary?.active || 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="p-6 h-full overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white dark:bg-slate-900 rounded-[32px] ring-1 ring-slate-200/60 dark:ring-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black tracking-tighter">Policy Health</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Real-time status distribution</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Main Visualization: Circular Progress */}
        <div className="relative flex justify-center mb-10">
          <svg className="w-44 h-44 transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="78"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-100 dark:text-slate-800"
            />
            <motion.circle
              cx="88"
              cy="88"
              r="78"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={490}
              initial={{ strokeDashoffset: 490 }}
              animate={{ strokeDashoffset: 490 - (490 * activePercent) / 100 }}
              transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
              strokeLinecap="round"
              className="text-blue-500 transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tighter"
            >
              {activePercent}%
            </motion.span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Health Index</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox 
            label="Total" 
            value={summary?.created} 
            icon={FileText} 
            color="blue" 
            delay={0.3} 
          />
          <StatBox 
            label="Valid" 
            value={summary?.active} 
            icon={ShieldCheck} 
            color="emerald" 
            delay={0.4} 
          />
          <StatBox 
            label="Expiring" 
            value={summary?.expiring} 
            icon={Clock} 
            color="amber" 
            delay={0.5} 
          />
          <StatBox 
            label="Expired" 
            value={summary?.expired} 
            icon={AlertTriangle} 
            color="rose" 
            delay={0.6} 
          />
        </div>

        {error && (
          <p className="mt-4 text-[9px] text-center text-rose-500 font-bold uppercase tracking-tighter">
            {error}
          </p>
        )}
      </Card>
    </motion.div>
  );
};

/* Sub-component for individual stat boxes */
const StatBox = ({ label, value, icon: Icon, color, delay }: any) => {
  const themes: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/10",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/10",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-900/10",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className="p-3 rounded-[20px] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className={cn("p-1.5 rounded-lg transition-colors shadow-sm", themes[color])}>
          <Icon className="w-3 h-3" strokeWidth={3} />
        </div>
      </div>
      <p className="text-xl font-black tracking-tight tabular-nums">{value || 0}</p>
    </motion.div>
  );
};