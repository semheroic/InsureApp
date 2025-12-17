import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import { PageHeader } from "@/components/Expiry/PageHeader";
import { ExpiryStatsCards } from "@/components/Expiry/ExpiryStatsCards";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { Policy, ExpiryData, CompanyFilter } from "@/types/policy";

const API_REPORT = "http://localhost:5000/api/expiry-report";
const FOLLOWUP_ENDPOINT = "http://localhost:5000/api/followup";

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
      toast({ title: "Error", description: "Failed to load expiry report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [companyFilter, toast]);

  useEffect(() => {
    fetchPolicies();
    const interval = setInterval(fetchPolicies, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchPolicies]);

  const tabs = useMemo(() => [
    { key: "today", label: "Today", data: data.today },
    { key: "week", label: "This Week", data: data.week },
    { key: "month", label: "This Month", data: data.month },
    { key: "expired", label: "Expired", data: data.expired },
  ], [data]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader companyFilter={companyFilter} onFilterChange={setCompanyFilter} />
      <ExpiryStatsCards data={data} />

      <Card className="p-6">
        <Tabs defaultValue="today">
          <TabsList className="grid grid-cols-4">
            {tabs.map(t => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label} <span className="ml-2 text-xs bg-muted px-2 rounded">{t.data.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(t => (
            <TabsContent key={t.key} value={t.key}>
              <PolicyTable
                data={t.data}
                showOverdue={t.key === "expired"}
                followUpEndpoint={FOLLOWUP_ENDPOINT}
                refreshData={fetchPolicies}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default ExpiryReport;
