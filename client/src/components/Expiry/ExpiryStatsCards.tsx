import { Card } from "@/components/ui/card";
import { AlertCircle, CalendarDays, History, Hourglass } from "lucide-react";
import { ExpiryData } from "@/types/policy";
import { cn } from "@/lib/utils";

interface ExpiryStatsCardsProps {
  data: ExpiryData;
}

export const ExpiryStatsCards = ({ data }: ExpiryStatsCardsProps) => {
  const total = (data.today?.length || 0) + 
                (data.week?.length || 0) + 
                (data.month?.length || 0) + 
                (data.expired?.length || 0) || 1;

  const stats = [
    {
      label: "Critical Today",
      count: data.today?.length || 0,
      description: "Immediate action required",
      icon: AlertCircle,
      color: "rose",
      variant: "destructive",
    },
    {
      label: "Next 7 Days",
      count: data.week?.length || 0,
      description: "Upcoming renewals",
      icon: Hourglass,
      color: "amber",
      variant: "warning",
    },
    {
      label: "Monthly Outlook",
      count: data.month?.length || 0,
      description: "30-day forecast",
      icon: CalendarDays,
      color: "blue",
      variant: "info",
    },
    {
      label: "Overdue Items",
      count: data.expired?.length || 0,
      description: "Policies lapsed",
      icon: History,
      color: "red",
      variant: "danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className="relative overflow-hidden border border-slate-200 bg-white p-0 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 group"
        >
          {/* Subtle Accent Top Bar */}
          <div className={cn(
            "h-1 w-full",
            stat.color === "rose" && "bg-rose-500",
            stat.color === "amber" && "bg-amber-500",
            stat.color === "blue" && "bg-blue-600",
            stat.color === "red" && "bg-red-600"
          )} />

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <h2 className={cn(
                    "text-4xl font-black tracking-tight",
                    stat.color === "rose" && "text-slate-900",
                    stat.color === "amber" && "text-slate-900",
                    stat.color === "blue" && "text-slate-900",
                    stat.color === "red" && "text-red-600"
                  )}>
                    {stat.count}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Units</span>
                </div>
              </div>

              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110",
                stat.color === "rose" && "bg-rose-50 text-rose-600",
                stat.color === "amber" && "bg-amber-50 text-amber-600",
                stat.color === "blue" && "bg-blue-50 text-blue-600",
                stat.color === "red" && "bg-red-50 text-red-600"
              )}>
                <stat.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500">
                  {stat.description}
                </p>
                {/* Micro-Progress bar */}
                <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      stat.color === "rose" && "bg-rose-500",
                      stat.color === "amber" && "bg-amber-500",
                      stat.color === "blue" && "bg-blue-600",
                      stat.color === "red" && "bg-red-600"
                    )}
                    style={{ width: `${(stat.count / total) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Contextual Badge */}
              <div className={cn(
                "rounded-md px-2 py-1 text-[10px] font-bold uppercase",
                stat.color === "rose" && "bg-rose-100 text-rose-700",
                stat.color === "amber" && "bg-amber-100 text-amber-700",
                stat.color === "blue" && "bg-blue-100 text-blue-700",
                stat.color === "red" && "bg-red-100 text-red-700 animate-pulse"
              )}>
                {Math.round((stat.count / total) * 100)}% Vol
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};