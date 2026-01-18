import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, AlertCircle, Shield, Download, LayoutDashboard, Loader2 } from "lucide-react";
import { StatCard } from "@/components/Dashboard/StatCard";
import {AdsDisplay } from "@/components/Dashboard/AdsDisplay";
import { TrendChart } from "@/components/Dashboard/TrendChart";
import { SummaryCard } from "@/components/Dashboard/SummaryCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
const API_URL = import.meta.env.VITE_API_URL;
interface SummaryData {
  created: number;
  active: number;
  expiring: number;
  expired: number;
  renewed?: number;
}

/** Animation Configs */
const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVars = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const Dashboard = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<SummaryData>({
    created: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    renewed: 0,
  });
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const cachedSummary = localStorage.getItem("summary");
        const cachedTrends = localStorage.getItem("trends");
        if (cachedSummary) setSummary(JSON.parse(cachedSummary));
        if (cachedTrends) setTrends(JSON.parse(cachedTrends));

        const [summaryRes, trendsRes] = await Promise.all([
          axios.get(`${API_URL}/api/summary`, { withCredentials: true }),
          axios.get(`${API_URL}/api/trends`, { withCredentials: true }),
        ]);

        setSummary(summaryRes.data);
        setTrends(trendsRes.data.trends || []);

        localStorage.setItem("summary", JSON.stringify(summaryRes.data));
        localStorage.setItem("trends", JSON.stringify(trendsRes.data.trends || []));
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setTimeout(() => setLoading(false), 500); // Smooth transition out of loading
      }
    };

    fetchDashboardData();
  }, []);

  const exportToCSV = () => {
    try {
      const headers = ["Category", "Total Count", "Metric", "Trend Date", "Trend Value"];
      const rows = [
        ["Created Policies", summary.created, "", "", ""],
        ["Active Policies", summary.active, "", "", ""],
        ["Expiring Soon", summary.expiring, "", "", ""],
        ["Expired Policies", summary.expired, "", "", ""],
        ["Renewed Policies", summary.renewed || 0, "", "", ""],
        ["", "", "", "", ""],
        ["TREND DATA", "", "", "", ""]
      ];

      trends.forEach((t: any) => {
        rows.push(["", "", "", t.date || t.name, t.value || t.count]);
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `dashboard_overview_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Success", description: "Dashboard data exported to CSV." });
    } catch (err) {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const renderSkeleton = () => (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[24px]"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-[32px]"></div>
        <div className="h-[400px] bg-slate-200 dark:bg-slate-800 rounded-[32px]"></div>
      </div>
    </div>
  );

  if (loading) return renderSkeleton();
  if (error) return (
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
      <AlertCircle className="w-12 h-12 text-rose-500" />
      <p className="text-lg font-bold text-slate-900 dark:text-white">{error}</p>
      <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
    </div>
  );

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="max-w-[1400px] mx-auto p-6 space-y-10 font-sans"
    >
      {/* Header Section */}
      <motion.div variants={itemVars} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                <LayoutDashboard className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
               Overview<span className="text-blue-400">.</span>
             </h1>
          </div>
          <p className="text-slate-500 text-[14px] font-bold tracking-tight uppercase opacity-60">
            Real-time policy intelligence & distribution
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
         
        </motion.div>
      </motion.div>
    
      {/* Stat Cards - Staggered Entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Created", subtitle: "Total Registered", val: summary.created, icon: CheckCircle2, bg: "bg-blue-500" },
          { title: "Active", subtitle: "Currently Valid", val: summary.active, icon: Shield, bg: "bg-emerald-500" },
          { title: "Expiring", subtitle: "Upcoming Review", val: summary.expiring, icon: Clock, bg: "bg-amber-500" },
          { title: "Expired", subtitle: "Lapsed Coverage", val: summary.expired, icon: AlertCircle, bg: "bg-rose-500" },
        ].map((card, idx) => (
          <motion.div key={idx} variants={itemVars} whileHover={{ y: -5 }}>
             <StatCard
                title={card.title}
                subtitle={card.subtitle}
                value={card.val}
                icon={card.icon}
                iconBgColor={`${card.bg}/10`}
                className="rounded-[28px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] ring-1 ring-slate-200/60 dark:ring-slate-800 bg-white dark:bg-slate-900 p-6"
             />
          </motion.div>
        ))}
      </div>
 {/* ads display section  */}
     <motion.div variants={itemVars}>
       <AdsDisplay showInactive={false} max={3} />
       </motion.div>
      {/* Trend Chart & Summary - Staggered Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVars} className="lg:col-span-2">
           <div className="rounded-[32px] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              <TrendChart data={trends} />
           </div>
        </motion.div>
        
        <motion.div variants={itemVars}>
           <div className="rounded-[32px] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.04)] h-full">
              <SummaryCard data={summary} />
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;