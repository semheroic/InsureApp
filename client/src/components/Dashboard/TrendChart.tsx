import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const API_URL = import.meta.env.VITE_API_URL;
export const TrendChart = () => {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/trends?period=${period}`, { 
          withCredentials: true 
        });

        const payload = res.data.trends || [];
        const normalized = payload.map((d: any) => ({
          label: d.month || "N/A",
          active: Number(d.active || 0),
          expired: Number(d.expired || 0),
          renewed: Number(d.renewed || 0),
        })).reverse();

        setTrendData(normalized);
      } catch (err) {
        console.error("Trend fetch error:", err);
      } finally {
        // Slight delay for smoother UI transition
        setTimeout(() => setLoading(false), 400);
      }
    };

    fetchTrends();
  }, [period]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-none bg-white dark:bg-slate-900 rounded-[32px] ring-1 ring-slate-200/60 dark:ring-slate-800 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-8 p-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-black tracking-tighter">Performance Velocity</CardTitle>
            </div>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Policy lifecycle trajectories
            </CardDescription>
          </div>
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:ring-blue-500">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none ring-1 ring-slate-200 shadow-xl">
              <SelectItem value="week" className="text-[10px] font-bold uppercase">Weekly View</SelectItem>
              <SelectItem value="month" className="text-[10px] font-bold uppercase">Monthly View</SelectItem>
              <SelectItem value="year" className="text-[10px] font-bold uppercase">Yearly View</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <div className="h-[350px] w-full relative group">
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-20 gap-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" strokeWidth={2.5} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Recalibrating...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!loading && trendData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                No telemetry available for this vector.
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={trendData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={8}
              >
                <defs>
                  <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  vertical={false} 
                  strokeDasharray="4 4" 
                  stroke="#f1f5f9" 
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={15}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  allowDecimals={false}
                />

                <Tooltip
                  cursor={{ fill: "#f8fafc", radius: 8 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(8px)",
                    border: "none",
                    borderRadius: "16px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textTransform: "uppercase"
                  }}
                />

                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  wrapperStyle={{ paddingBottom: '30px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} 
                />
                
                {/* Background area for "smoothness" */}
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  fill="url(#activeGradient)" 
                  stroke="transparent" 
                  isAnimationActive={true}
                />

                <Bar
                  dataKey="active"
                  name="Active"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={14}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                <Bar
                  dataKey="renewed"
                  name="Renewed"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={14}
                  animationDuration={1800}
                  animationEasing="ease-in-out"
                />
                <Bar
                  dataKey="expired"
                  name="Expired"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  barSize={14}
                  animationDuration={2100}
                  animationEasing="ease-in-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};