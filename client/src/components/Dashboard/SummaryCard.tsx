import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";

interface SummaryData {
  created: number;
  active: number;
  expiring: number;
  expired: number;
}

export const SummaryCard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/summary")
      .then((res) => {
        setSummary(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load summary data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <p className="text-sm text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Summary</h3>

      <div className="space-y-4">
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Created Policies Count</span>
          <span className="text-sm font-semibold">{summary?.created}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Active Policies Count</span>
          <span className="text-sm font-semibold">{summary?.active}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Expiring Soon Count</span>
          <span className="text-sm font-semibold">{summary?.expiring}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-transparent">
          <span className="text-sm text-muted-foreground">Expired Policies Count</span>
          <span className="text-sm font-semibold">{summary?.expired}</span>
        </div>
      </div>
    </Card>
  );
};
