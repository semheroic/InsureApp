import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TrendChart = () => {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        // Matching your backend route: app.get("/api/trends", ...)
        // We pass the period as a query param
        const res = await axios.get(`http://localhost:5000/api/trends?period=${period}`, { 
          withCredentials: true 
        });

        const payload = res.data.trends || [];
        
        // Normalizing data: Backend returns { month, active, expired, renewed }
        // We map 'month' (e.g., "Jan 2024") to 'label' for the XAxis
        const normalized = payload.map((d: any) => ({
          label: d.month || "N/A",
          active: Number(d.active || 0),
          expired: Number(d.expired || 0),
          renewed: Number(d.renewed || 0),
        })).reverse(); // Reverse to show chronological order (Past -> Present)

        setTrendData(normalized);
      } catch (err) {
        console.error("Trend fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [period]);

  return (
    <Card className="shadow-sm border-slate-200 bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg font-bold">Performance Velocity</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tracking policy lifecycle status over time
          </CardDescription>
        </div>
        
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 h-9 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        <div className="h-[350px] w-full relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Syncing Trends...</p>
            </div>
          ) : trendData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs italic">
              No trend data available for this period.
            </div>
          ) : null}

          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={trendData} 
              margin={{ top: 0, right: 0, left: -20, bottom: 10 }}
              barGap={6}
            >
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3" 
                stroke="#f1f5f9" 
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                dy={15}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
              />

              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                wrapperStyle={{ paddingBottom: '25px', fontSize: '11px', fontWeight: 'bold' }} 
              />
              
              <Bar
                dataKey="active"
                name="Active"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="renewed"
                name="Renewed"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="expired"
                name="Expired"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};