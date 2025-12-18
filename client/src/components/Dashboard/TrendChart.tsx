import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
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
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/trends?period=${period}`, { withCredentials: true })
      .then((res) => {
        const payload = res.data.trends || res.data || [];
        const normalized = payload.map((d: any) => ({
          label: d.label || d.month || d.date || d.day || "N/A",
          created: Number(d.created || d.count || 0),
          renewed: Number(d.renewed || 0),
        }));
        setTrendData(normalized);
      })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <Card className="p-6 border-none shadow-none bg-transparent">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Performance Trends</h3>
          <p className="text-xs text-muted-foreground">Detailed axis view of policy metrics</p>
        </div>
        
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-32 rounded-xl">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={trendData} 
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }} // Bottom margin for X-axis labels
            barGap={8}
          >
            {/* GRID: Only horizontal lines for better readability */}
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.2)" />

            {/* X-AXIS: Positioned clearly at the bottom */}
            <XAxis
              dataKey="label"
              axisLine={{ stroke: 'hsl(var(--muted-foreground)/0.4)', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
              dy={15} // Pushes labels down away from the bars
              interval={0} // Shows all labels if space allows
            />

            {/* Y-AXIS: Clearly marked with integers */}
            <YAxis
              axisLine={{ stroke: 'hsl(var(--muted-foreground)/0.4)', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
              dx={-10} // Moves numbers left away from the grid
              allowDecimals={false} // Clean integers for policy counts
            />

            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.15)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
              }}
            />

            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ paddingBottom: '30px' }} 
            />
            
            <Bar
              dataKey="created"
              name="New Policies"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              dataKey="renewed"
              name="Renewed"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};