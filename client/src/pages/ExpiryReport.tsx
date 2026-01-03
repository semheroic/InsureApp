import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, AlertCircle, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/Expiry/PageHeader";
import { ExpiryStatsCards } from "@/components/Expiry/ExpiryStatsCards";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { ExpiryData, CompanyFilter } from "@/types/policy";
import { cn } from "@/lib/utils";
const API_URL = import.meta.env.VITE_API_URL;
const API_REPORT = `${API_URL}/api/expiry-report`;
const FOLLOWUP_ENDPOINT = `${API_URL}/api/followup`;

export const ExpiryReport = () => {
  const { toast } = useToast();
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  const [data, setData] = useState<ExpiryData>({ today: [], week: [], month: [], expired: [] });
  const [loading, setLoading] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_REPORT}?company=${companyFilter}`);
      if (!res.ok) throw new Error("Failed to fetch expiry report");
      const result: ExpiryData = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Connection Error", 
        description: "Unable to sync expiry data. Please check your connection.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [companyFilter, toast]);

  useEffect(() => {
    fetchPolicies();
    const interval = setInterval(fetchPolicies, 60000);
    return () => clearInterval(interval);
  }, [fetchPolicies]);

  const tabs = useMemo(() => [
    { key: "today", label: "Today", data: data.today, icon: Clock, color: "text-blue-500" },
    { key: "week", label: "This Week", data: data.week, icon: Calendar, color: "text-purple-500" },
    { key: "month", label: "This Month", data: data.month, icon: AlertCircle, color: "text-orange-500" },
    { key: "expired", label: "Expired", data: data.expired, icon: ShieldAlert, color: "text-red-500" },
  ], [data]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out font-sans">
      
      {/* Header Section */}
      <div className="relative">
        <PageHeader 
          companyFilter={companyFilter} 
          onFilterChange={setCompanyFilter} 
        />
      </div>

      {/* Stats Section */}
      <div className="grid gap-6">
        <ExpiryStatsCards data={data} />
      </div>

      {/* Main Content Table Card */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-[28px] overflow-hidden">
        <Tabs defaultValue="today" className="w-full">
          <div className="px-6 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
            <TabsList className="h-12 w-full max-w-2xl bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
              {tabs.map(t => (
                <TabsTrigger 
                  key={t.key} 
                  value={t.key}
                  className={cn(
                    "flex-1 gap-2 text-[12px] font-bold tracking-tight transition-all duration-300 rounded-lg",
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
                  )}
                >
                  <t.icon className={cn("w-3.5 h-3.5", t.color)} strokeWidth={2.5} />
                  {t.label}
                  {/* Badge Typography: Small, Bold Monospace */}
                  <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold opacity-80">
                    {t.data.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-2">
            {tabs.map(t => (
              <TabsContent 
                key={t.key} 
                value={t.key} 
                className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in zoom-in-[0.98] duration-500"
              >
                <div className="p-4">
                   <PolicyTable
                    data={t.data}
                    showOverdue={t.key === "expired"}
                    followUpEndpoint={FOLLOWUP_ENDPOINT}
                    refreshData={fetchPolicies}
                  />
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </Card>

      {/* Syncing Indicator: Small, High Letter Spacing */}
      {loading && (
        <div className="fixed bottom-8 right-8 animate-pulse bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold tracking-[0.2em] px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md">
          SYNCING LIVE DATA
        </div>
      )}
    </div>
  );
};

export default ExpiryReport;