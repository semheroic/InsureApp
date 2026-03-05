import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Calendar, 
  AlertCircle, 
  ShieldAlert, 
  Zap, 
  Milestone, 
  Loader2, 
  Forward,
  ShieldCheck 
} from "lucide-react";

import { PageHeader } from "@/components/Expiry/PageHeader";
import { ExpiryStatsCards } from "@/components/Expiry/ExpiryStatsCards";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { ExpiryData, CompanyFilter } from "@/types/policy";
import { cn } from "@/lib/utils";

interface ExtendedExpiryData extends ExpiryData {
  thirtyDays: any[]; 
  yearly: any[]; 
  nextMonth: any[];
  nextAnnual: any[];
}

const API_URL = import.meta.env.VITE_API_URL;
const API_REPORT = `${API_URL}/api/expiry-report`;
const FOLLOWUP_ENDPOINT = `${API_URL}/api/followup`;

export const ExpiryReport = () => {
  const { toast } = useToast();
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  
  const [data, setData] = useState<ExtendedExpiryData>({ 
    today: [], 
    week: [], 
    month: [], 
    nextMonth: [], 
    expired: [],
    thirtyDays: [],
    yearly: [],
    nextAnnual: [] 
  });
  const [loading, setLoading] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_REPORT}?company=${companyFilter}`);
      if (!res.ok) throw new Error("Failed to fetch expiry report");
      
      const result: ExtendedExpiryData = await res.json();
      
      setData({
        today: result.today || [],
        week: result.week || [],
        month: result.month || [],
        nextMonth: result.nextMonth || [],
        expired: result.expired || [],
        thirtyDays: result.thirtyDays || [],
        yearly: result.yearly || [],
        nextAnnual: result.nextAnnual || [] 
      });
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Connection Error", 
        description: "Unable to sync expiry data.", 
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
    { key: "today", label: "Today", data: data.today, icon: Clock, color: "text-blue-500", badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    { key: "week", label: "Week", data: data.week, icon: Calendar, color: "text-purple-500", badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
    { key: "month", label: "Month", data: data.month, icon: AlertCircle, color: "text-orange-500", badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
    { key: "nextMonth", label: "Next Mo", data: data.nextMonth, icon: Forward, color: "text-indigo-500", badge: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" },
    { key: "thirtyDays", label: "30-Day", data: data.thirtyDays, icon: Zap, color: "text-cyan-500", badge: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600" },
    { key: "yearly", label: "Annual", data: data.yearly, icon: Milestone, color: "text-emerald-500", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" },
    { key: "nextAnnual", label: "Future", data: data.nextAnnual, icon: ShieldCheck, color: "text-teal-500", badge: "bg-teal-100 dark:bg-teal-900/40 text-teal-600" },
    { key: "expired", label: "Expired", data: data.expired, icon: ShieldAlert, color: "text-red-500", badge: "bg-red-100 dark:bg-red-900/30 text-red-600" },
  ], [data]);

  return (
    /* Reduced parent padding and vertical gap */
    <div className="p-2 md:p-4 space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans max-w-[1600px] mx-auto">
      
      {/* Tightened Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <PageHeader 
          companyFilter={companyFilter} 
          onFilterChange={setCompanyFilter} 
        />
        {loading && (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Reduced gap for Stats */}
      <div className="grid gap-3 md:gap-4">
        <ExpiryStatsCards data={data} />
      </div>

      {/* Optimized Main Card */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-2xl overflow-hidden border-none md:border">
        <Tabs defaultValue="today" className="w-full">
          
          {/* Scrollable Tabs Wrapper - reduced padding */}
          <div className="w-full bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar py-2 px-2 md:px-4">
              <TabsList className="inline-flex h-10 items-center justify-start bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg w-max min-w-full lg:w-full lg:flex">
                {tabs.map(t => (
                  <TabsTrigger 
                    key={t.key} 
                    value={t.key}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] md:text-xs font-bold transition-all duration-200 rounded-md whitespace-nowrap",
                      "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-950 dark:data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "flex-shrink-0 flex-grow lg:flex-1"
                    )}
                  >
                    <t.icon className={cn("w-3 h-3", t.color)} strokeWidth={2.5} />
                    <span>{t.label}</span>
                    
                    <span className={cn(
                      "ml-1 px-1 py-0 rounded text-[9px] font-mono font-bold",
                      t.badge
                    )}>
                      {t.data?.length || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Table Content - removed min-height and reduced internal padding */}
          <div className="relative">
            {tabs.map(t => (
              <TabsContent 
                key={t.key} 
                value={t.key} 
                className="mt-0 outline-none animate-in fade-in-50 duration-200"
              >
                <div className="p-1 md:p-3">
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
    </div>
  );
};

export default ExpiryReport;