import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Clock, AlertCircle, Shield, Download } from "lucide-react";
import { StatCard } from "@/components/Dashboard/StatCard";
import { TrendChart } from "@/components/Dashboard/TrendChart";
import { SummaryCard } from "@/components/Dashboard/SummaryCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Added for feedback
import axios from "axios";

interface SummaryData {
  created: number;
  active: number;
  expiring: number;
  expired: number;
  renewed?: number;
}

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
          axios.get("http://localhost:5000/api/summary", { withCredentials: true }),
          axios.get("http://localhost:5000/api/trends", { withCredentials: true }),
        ]);

        setSummary(summaryRes.data);
        setTrends(trendsRes.data.trends || []);

        localStorage.setItem("summary", JSON.stringify(summaryRes.data));
        localStorage.setItem("trends", JSON.stringify(trendsRes.data.trends || []));
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /** * Export logic that combines Summary stats and Trend data
   */
  const exportToCSV = () => {
    try {
      const headers = ["Category", "Total Count", "Metric", "Trend Date", "Trend Value"];
      
      // We map the summary data and zip it with trend data for a comprehensive report
      const rows = [
        ["Created Policies", summary.created, "", "", ""],
        ["Active Policies", summary.active, "", "", ""],
        ["Expiring Soon", summary.expiring, "", "", ""],
        ["Expired Policies", summary.expired, "", "", ""],
        ["Renewed Policies", summary.renewed || 0, "", "", ""],
        ["", "", "", "", ""], // Spacer
        ["TREND DATA", "", "", "", ""]
      ];

      // Add trend lines if available
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );

  if (loading) return renderSkeleton();
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Find all updates here!</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Created Policies"
          subtitle="Total registered policies"
          value={summary.created}
          icon={CheckCircle2}
          iconBgColor="bg-primary/10"
        />
        <StatCard
          title="Active Policies"
          subtitle="Policies currently active"
          value={summary.active}
          icon={Shield}
          iconBgColor="bg-success/10"
        />
        <StatCard
          title="Expiring Soon"
          subtitle="Policies expiring soon"
          value={summary.expiring}
          icon={Clock}
          iconBgColor="bg-warning/10"
        />
        <StatCard
          title="Expired Policies"
          subtitle="Policies that have expired"
          value={summary.expired}
          icon={AlertCircle}
          iconBgColor="bg-destructive/10"
        />
      </div>

      {/* Trend Chart & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={trends} />
        </div>
        <div>
          <SummaryCard data={summary} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;