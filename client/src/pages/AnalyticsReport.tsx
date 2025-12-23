import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, Activity, ShieldCheck, AlertCircle, 
  TrendingDown, PieChart as PieIcon, BarChart3, Loader2 
} from "lucide-react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";

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
          axios.get("http://localhost:5000/api/trends"),
          axios.get("http://localhost:5000/api/summary"),
          axios.get("http://localhost:5000/api/company-distribution")
        ]);

        // Monthly data is already reversed in SQL via ORDER BY DESC, 
        // we reverse it back for the chart to show Left-to-Right time flow
        setMonthlyData((trendsRes.data.trends || []).reverse());
        setSummary(summaryRes.data);
        setCompanyData(companyRes.data || []);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic for the dropdown
  const filteredData = useMemo(() => {
    const limits: Record<string, number> = { "3months": 3, "6months": 6, "12months": 12 };
    const count = limits[timeFilter] || 12;
    return monthlyData.slice(-count);
  }, [monthlyData, timeFilter]);

  const exportToCSV = () => {
    const headers = ["Month", "Active", "Expired", "Total Volume"];
    const rows = filteredData.map((d: any) => [d.month, d.active, d.expired, d.active + d.expired]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export Successful", description: "The intelligence report has been downloaded." });
  };

  if (loading) return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
      <div className="text-muted-foreground font-medium">Refining analytics data...</div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">Analytics Report</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Strategic insights into policy lifecycle and distribution performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[160px] h-10 text-xs font-bold uppercase tracking-widest shadow-sm">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} className="gap-2 shadow-md font-bold">
            <Download className="w-4 h-4" />
            Export Intelligence
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Volume", value: summary.created, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Assets", value: summary.active, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Expiry", value: summary.expiring, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Lapsed/Expired", value: summary.expired, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-6">
              <div className={`${kpi.bg} p-2 w-fit rounded-xl mb-4`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-4xl font-black tracking-tighter">{kpi.value || 0}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Lifecycle Trends</CardTitle>
            <CardDescription>Monthly breakdown of active vs expired status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold'}} />
                  <Bar dataKey="active" name="Active" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expired" name="Expired" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Market Share</CardTitle>
            <CardDescription>Provider distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={companyData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                    {companyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PERFORMANCE VELOCITY AREA CHART */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b">
          <CardTitle className="text-lg font-bold uppercase tracking-tighter">Performance Velocity</CardTitle>
          <CardDescription>Growth momentum of active policies</CardDescription>
        </div>
        <CardContent className="p-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{top: 20, right: 30, left: 10, bottom: 0}}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorActive)" name="Active Growth" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsReport;