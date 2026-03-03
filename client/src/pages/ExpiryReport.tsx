import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
// Added 'CalendarArrowRight' or 'Forward' for Next Month
import { Clock, Calendar, AlertCircle, ShieldAlert, Zap, Milestone, Loader2, Forward } from "lucide-react";

import { PageHeader } from "@/components/Expiry/PageHeader";
import { ExpiryStatsCards } from "@/components/Expiry/ExpiryStatsCards";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { ExpiryData, CompanyFilter } from "@/types/policy";
import { cn } from "@/lib/utils";

interface ExtendedExpiryData extends ExpiryData {
  thirtyDays: any[]; 
  yearly: any[]; 
  nextMonth: any[]; // Integrated
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
    nextMonth: [], // Initialized
    expired: [],
    thirtyDays: [],
    yearly: [] 
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
        nextMonth: result.nextMonth || [], // Hydrated from API
        expired: result.expired || [],
        thirtyDays: result.thirtyDays || [],
        yearly: result.yearly || []
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

  // Redesigned Tab Configuration for perfect fit and color harmony
  const tabs = useMemo(() => [
    { key: "today", label: "Today", data: data.today, icon: Clock, color: "text-blue-500", badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    { key: "week", label: "This Week", data: data.week, icon: Calendar, color: "text-purple-500", badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
    { key: "month", label: "This Month", data: data.month, icon: AlertCircle, color: "text-orange-500", badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
    { key: "nextMonth", label: "Next Month", data: data.nextMonth, icon: Forward, color: "text-indigo-500", badge: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" },
    { key: "thirtyDays", label: "30-Day", data: data.thirtyDays, icon: Zap, color: "text-cyan-500", badge: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600" },
    { key: "yearly", label: "Annual", data: data.yearly, icon: Milestone, color: "text-emerald-500", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" },
    { key: "expired", label: "Expired", data: data.expired, icon: ShieldAlert, color: "text-red-500", badge: "bg-red-100 dark:bg-red-900/30 text-red-600" },
  ], [data]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out font-sans">
      
      <div className="relative flex justify-between items-center">
        <PageHeader 
          companyFilter={companyFilter} 
          onFilterChange={setCompanyFilter} 
        />
        {loading && (
          <div className="absolute right-0 top-0 md:relative">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <ExpiryStatsCards data={data} />
      </div>

      <Card className="border-slate-200/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-[24px] md:rounded-[28px] overflow-hidden">
        <Tabs defaultValue="today" className="w-full">
          
          <div className="px-4 md:px-6 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              {/* Optimized TabsList: Reduced gap slightly to fit 7 items better */}
              <TabsList className="h-11 md:h-12 flex w-max min-w-full md:w-full bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                {tabs.map(t => (
                  <TabsTrigger 
                    key={t.key} 
                    value={t.key}
                    className={cn(
                      "flex-1 px-3 md:px-4 gap-1.5 md:gap-2 text-[10px] md:text-[12px] font-bold tracking-tight transition-all duration-300 rounded-lg whitespace-nowrap",
                      "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
                    )}
                  >
                    <t.icon className={cn("w-3.5 h-3.5 shrink-0", t.color)} strokeWidth={2.5} />
                    <span className="hidden lg:inline">{t.label}</span>
                    {/* Short label for smaller screens to prevent overflow */}
                    <span className="lg:hidden inline">{t.label.split(' ')[0]}</span>
                    
                    <span className={cn(
                      "ml-0.5 px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-mono font-bold transition-colors",
                      t.badge
                    )}>
                      {t.data?.length || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="p-2">
            {tabs.map(t => (
              <TabsContent 
                key={t.key} 
                value={t.key} 
                className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in zoom-in-[0.98] duration-500"
              >
                <div className="p-2 md:p-4">
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