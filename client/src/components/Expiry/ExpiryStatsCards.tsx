import { Card } from "@/components/ui/card";
import { AlertTriangle, Calendar } from "lucide-react";
import { ExpiryData } from "@/types/policy";

interface ExpiryStatsCardsProps {
  data: ExpiryData;
}

export const ExpiryStatsCards = ({ data }: ExpiryStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6 border-destructive/50 bg-gradient-to-br from-destructive/5 to-destructive/10 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Expiring Today</span>
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
        </div>
        <p className="text-4xl font-bold text-destructive">{data.today.length}</p>
        <p className="text-xs text-muted-foreground mt-2">Requires immediate attention</p>
      </Card>

      <Card className="p-6 border-warning/50 bg-gradient-to-br from-warning/5 to-warning/10 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">This Week</span>
          <div className="p-2 rounded-full bg-warning/10">
            <Calendar className="w-5 h-5 text-warning" />
          </div>
        </div>
        <p className="text-4xl font-bold text-warning">{data.week.length}</p>
        <p className="text-xs text-muted-foreground mt-2">Expiring within 7 days</p>
      </Card>

      <Card className="p-6 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">This Month</span>
          <div className="p-2 rounded-full bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-4xl font-bold text-primary">{data.month.length}</p>
        <p className="text-xs text-muted-foreground mt-2">Expiring within 30 days</p>
      </Card>

      <Card className="p-6 border-destructive bg-gradient-to-br from-destructive/10 to-destructive/15 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Already Expired</span>
          <div className="p-2 rounded-full bg-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
        </div>
        <p className="text-4xl font-bold text-destructive">{data.expired.length}</p>
        <p className="text-xs text-muted-foreground mt-2">Overdue policies</p>
      </Card>
    </div>
  );
};
