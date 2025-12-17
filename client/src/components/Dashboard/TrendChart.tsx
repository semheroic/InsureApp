import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
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

type TrendDataItem = {
  label: string;
  created: number;
  renewed: number;
};

export const TrendChart = () => {
  const [trendData, setTrendData] = useState<TrendDataItem[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    axios
      .get(`http://localhost:5000/api/trends?period=${period}`, {
        signal: controller.signal,
      })
      .then((res) => {
        let payload = res.data;
        let payloadArray: any[] = [];

        // Normalize different API shapes
        if (Array.isArray(payload)) {
          payloadArray = payload;
        } else if (payload.trends && Array.isArray(payload.trends)) {
          payloadArray = payload.trends;
        } else if (payload.data && Array.isArray(payload.data)) {
          payloadArray = payload.data;
        } else if (typeof payload === "object") {
          payloadArray = Object.keys(payload).map((key) => ({
            label: key,
            created: Number(payload[key]?.created ?? 0),
            renewed: Number(payload[key]?.renewed ?? 0),
          }));
        }

        // Map to consistent shape
        const normalized: TrendDataItem[] = payloadArray.map((d: any) => ({
          label: d.label || d.date || d.day || d.month || d.key || "",
          created: Number(d.created ?? d.cnt ?? d.count ?? 0),
          renewed: Number(d.renewed ?? d.renewedCount ?? 0),
        }));

        setTrendData(normalized);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error("Trend API Error:", err);
        setError("Failed to load trend data");
        setLoading(false);
      });

    return () => controller.abort();
  }, [period]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Policy Trends</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading chart data...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : trendData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trend data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              domain={[0, "auto"]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="created"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Created"
            />
            <Line
              type="monotone"
              dataKey="renewed"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Renewed"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
