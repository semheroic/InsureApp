import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, Activity, ShieldCheck, AlertCircle, 
  TrendingDown, BarChart3, Loader2 
} from "lucide-react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
const API_URL = import.meta.env.VITE_API_URL;
const AnalyticsReport = () => {
  const { toast } = useToast();
  const [monthlyData, setMonthlyData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [summary, setSummary] = useState({ created: 0, active: 0, expiring: 0, expired: 0 });
  const [timeFilter, setTimeFilter] = useState("12months");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trendsRes, summaryRes, companyRes] = await Promise.all([
          axios.get(`${API_URL}/api/trends`),
          axios.get(`${API_URL}/api/summary`),
          axios.get(`${API_URL}/api/company-distribution`)
        ]);
        setMonthlyData((trendsRes.data.trends || []).reverse());
        setSummary(summaryRes.data);
        setCompanyData(companyRes.data || []);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast({ variant: "destructive", title: "Sync Failed", description: "Could not fetch intelligence data." });
      } finally {
        setTimeout(() => setLoading(false), 400); // Slight delay for smoother transition
      }
    };
    fetchData();
  }, [toast]);

  const filteredData = useMemo(() => {
    const limits: Record<string, number> = { "3months": 3, "6months": 6, "12months": 12 };
    const count = limits[timeFilter] || 12;
    return monthlyData.slice(-count);
  }, [monthlyData, timeFilter]);

  const exportToCSV = () => {
    const headers = ["Month", "Active", "Expired"];
    const rows = filteredData.map((d: any) => [d.month, d.active, d.expired]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_${timeFilter}.csv`;
    link.click();
    toast({ title: "Export Ready", description: "CSV data generated successfully." });
  };

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  if (loading) return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className="text-blue-600 w-8 h-8" strokeWidth={2} />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase"
      >
        Synchronizing...
      </motion.div>
    </div>
  );

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto p-6 space-y-8 font-sans"
    >
      {/* COMPACT HEADER */}
      <motion.div variants={itemVars} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            Analytics Intelligence
          </h1>
          <p className="text-slate-500 text-[12px] font-medium tracking-tight">Real-time system performance and policy lifecycle mapping.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px] h-9 text-[11px] font-bold uppercase tracking-wider rounded-xl border-slate-200 shadow-sm transition-all hover:border-blue-300">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="3months" className="text-xs font-semibold">3 Months</SelectItem>
              <SelectItem value="6months" className="text-xs font-semibold">6 Months</SelectItem>
              <SelectItem value="12months" className="text-xs font-semibold">12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="h-9 px-4 rounded-xl gap-2 text-[11px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* COMPACT KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: summary.created, color: "text-blue-600", bg: "bg-blue-50/50", icon: Activity },
          { label: "Active Assets", value: summary.active, color: "text-emerald-600", bg: "bg-emerald-50/50", icon: ShieldCheck },
          { label: "Expiring Soon", value: summary.expiring, color: "text-amber-600", bg: "bg-amber-50/50", icon: AlertCircle },
          { label: "Lapsed/Expired", value: summary.expired, color: "text-rose-600", bg: "bg-rose-50/50", icon: TrendingDown },
        ].map((kpi, i) => (
          <motion.div key={i} variants={itemVars} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Card className="border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
                    {kpi.value || 0}
                  </h3>
                </div>
                <div className={`${kpi.bg} p-2.5 rounded-2xl`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVars} className="lg:col-span-2">
          <Card className="border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl h-full">
            <CardHeader className="p-5 border-b border-slate-50">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[280px] w-full font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', radius: 8}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.08)' }} 
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                    <Bar isAnimationActive={true} animationDuration={1500} dataKey="active" name="Active" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar isAnimationActive={true} animationDuration={1500} dataKey="expired" name="Expired" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVars}>
          <Card className="border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl h-full">
            <CardHeader className="p-5 border-b border-slate-50">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Market Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[280px] w-full font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={companyData} 
                      innerRadius={65} 
                      outerRadius={85} 
                      paddingAngle={5} 
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={1200}
                    >
                      {companyData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* PERFORMANCE VELOCITY */}
      <motion.div variants={itemVars}>
        <Card className="border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/40 backdrop-blur-sm flex justify-between items-center">
            <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Performance Momentum</CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-blue-500 tracking-tighter">LIVE_DATA_STREAM</span>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="smoothGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fill="url(#smoothGrad)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsReport;