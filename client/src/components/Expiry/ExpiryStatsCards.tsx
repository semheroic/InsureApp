import { Card } from "@/components/ui/card";
// Added 'Forward' icon for Next Month
import { AlertCircle, CalendarDays, History, Hourglass, BarChart3, Milestone, Forward } from "lucide-react";
import { ExpiryData } from "@/types/policy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ExpiryStatsCardsProps {
  // Added nextMonth to the interface
  data: ExpiryData & { thirtyDays?: any[]; yearly?: any[]; nextMonth?: any[] }; 
}

export const ExpiryStatsCards = ({ data }: ExpiryStatsCardsProps) => {
  const total = (data.today?.length || 0) + 
                (data.week?.length || 0) + 
                (data.month?.length || 0) + 
                (data.nextMonth?.length || 0) + // Added to total
                (data.expired?.length || 0) || 1;

  const stats = [
    {
      label: "Critical Today",
      count: data.today?.length || 0,
      description: "Immediate action",
      icon: AlertCircle,
      theme: "rose",
      bg: "bg-rose-50/30 dark:bg-rose-950/10",
      iconBg: "bg-rose-500", 
      text: "text-rose-600 dark:text-rose-400",
      iconColor: "text-white", 
    },
    {
      label: "Next 7 Days",
      count: data.week?.length || 0,
      description: "Upcoming renewals",
      icon: Hourglass,
      theme: "amber",
      bg: "bg-amber-50/30 dark:bg-amber-950/10",
      iconBg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      iconColor: "text-white",
    },
    {
      label: "This Month",
      count: data.month?.length || 0,
      description: "Current month end",
      icon: CalendarDays,
      theme: "blue",
      bg: "bg-blue-50/30 dark:bg-blue-950/10",
      iconBg: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      iconColor: "text-white",
    },
    {
      label: "Next Month", // NEW CARD
      count: data.nextMonth?.length || 0,
      description: "Future pipeline",
      icon: Forward,
      theme: "indigo",
      bg: "bg-indigo-50/30 dark:bg-indigo-950/10",
      iconBg: "bg-indigo-500",
      text: "text-indigo-600 dark:text-indigo-400",
      iconColor: "text-white",
    },
    {
      label: "30-Day Outlook",
      count: data.thirtyDays?.length || 0,
      description: "Rolling forecast",
      icon: BarChart3,
      theme: "violet",
      bg: "bg-violet-50/30 dark:bg-violet-950/10",
      iconBg: "bg-violet-600",
      text: "text-violet-600 dark:text-violet-400",
      iconColor: "text-white",
      isPremium: true,
    },
    {
      label: "365-Day Outlook",
      count: data.yearly?.length || 0,
      description: "Annual pipeline",
      icon: Milestone,
      theme: "emerald",
      bg: "bg-emerald-50/30 dark:bg-emerald-950/10",
      iconBg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      iconColor: "text-white",
      isPremium: true,
    },
    {
      label: "Overdue Items",
      count: data.expired?.length || 0,
      description: "Lapsed policies",
      icon: History,
      theme: "slate",
      bg: "bg-slate-100/50 dark:bg-slate-800/40",
      iconBg: "bg-slate-600",
      text: "text-slate-600 dark:text-slate-300",
      iconColor: "text-white",
    },
  ];

  return (
    /* Updated Grid: Using a 7-column grid on XL screens. 
       Tailwind doesn't have grid-cols-7 by default in standard configs, 
       so we use a CSS grid-template-columns style for precision on large screens.
    */
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:flex 2xl:flex-wrap gap-4 font-sans"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
    >
      {stats.map((stat, index) => {
        const percentage = Math.round((stat.count / total) * 100);

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="flex-1 min-w-[240px]"
          >
            <Card 
              className={cn(
                "relative border-none overflow-hidden transition-all duration-300 rounded-[22px] group",
                "shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]",
                "bg-white dark:bg-slate-950 h-full flex flex-col",
                stat.isPremium && "ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm"
              )}
            >
              {stat.isPremium && (
                <div className={cn(
                  "absolute -right-4 -top-4 h-20 w-20 blur-3xl opacity-10 transition-opacity group-hover:opacity-30",
                  stat.theme === "violet" ? "bg-violet-500" : "bg-emerald-500"
                )} />
              )}

              <div className={cn("absolute inset-0 opacity-40", stat.bg)} />
              
              <div className="relative p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
                        {stat.count}
                      </h2>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Items
                      </span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-500",
                    "shadow-[0_6px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.12)]",
                    "group-hover:-translate-y-1",
                    stat.iconBg,
                    stat.iconColor,
                    stat.isPremium && "scale-105"
                  )}>
                    <stat.icon className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold tracking-tight text-slate-500 dark:text-slate-400 line-clamp-1">
                      {stat.description}
                    </p>
                    <div className={cn(
                      "text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md border border-white/40",
                      "bg-white/60 dark:bg-slate-900",
                      stat.text
                    )}>
                      {percentage > 100 ? "100+" : percentage}%
                    </div>
                  </div>
                  
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/40 dark:bg-slate-800 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className={cn(
                        "h-full rounded-full opacity-90",
                        stat.theme === "rose" && "bg-rose-500",
                        stat.theme === "amber" && "bg-amber-500",
                        stat.theme === "blue" && "bg-blue-500",
                        stat.theme === "indigo" && "bg-indigo-500",
                        stat.theme === "violet" && "bg-violet-500",
                        stat.theme === "emerald" && "bg-emerald-500",
                        stat.theme === "slate" && "bg-slate-500"
                      )}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};