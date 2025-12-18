import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  PieChart as PieIcon,
  BarChart3
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from "recharts";

const AnalyticsReport = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [summary, setSummary] = useState({});
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

        const monthly = (trendsRes.data.trends || []).map(item => ({
          month: item.month,
          active: item.active || 0,
          expired: item.expired || 0,
          renewed: item.renewed || 0,
        }));
        
        setMonthlyData(monthly.reverse());
        setSummary(summaryRes.data);
        setCompanyData(companyRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="animate-pulse text-muted-foreground font-medium">Refining analytics data...</div>
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
            <h1 className="text-3xl font-black tracking-tight">Analytics Report</h1>
          </div>
          <p className="text-muted-foreground text-sm">Strategic insights into policy lifecycle and distribution performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select defaultValue="6months">
            <SelectTrigger className="w-[160px] h-9 text-xs font-semibold shadow-sm">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="default" size="sm" className="gap-2 shadow-md">
            <Download className="w-3.5 h-3.5" />
            Export Intelligence
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Volume", value: summary.created, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", trend: "+12.5%" },
          { label: "Active Assets", value: summary.active, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Expiry", value: summary.expiring, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Lapsed/Expired", value: summary.expired, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${kpi.bg} p-2 rounded-xl`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {kpi.trend && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {kpi.trend}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-3xl font-black tracking-tight">{kpi.value || 0}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PRIMARY CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Lifecycle Trends</CardTitle>
            <CardDescription>Monthly breakdown of active vs expired status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px'}} />
                  <Bar dataKey="active" name="Active" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expired" name="Expired" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="renewed" name="Renewed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Company Distribution Pie */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">Market Share</CardTitle>
            </div>
            <CardDescription>Provider distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companyData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {companyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PERFORMANCE OVERVIEW AREA CHART */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b">
          <CardTitle className="text-lg">Performance Velocity</CardTitle>
          <CardDescription>Growth momentum of active and renewed policies</CardDescription>
        </div>
        <CardContent className="p-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{top: 20, right: 30, left: 10, bottom: 0}}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} hide />
                <YAxis hide />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                  name="Active Growth"
                />
                <Area 
                  type="monotone" 
                  dataKey="renewed" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="transparent"
                  name="Renewal Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsReport;