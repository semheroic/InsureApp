import { Card } from "@/components/ui/card";
import { AlertCircle, CalendarDays, History, Hourglass, BarChart3, Milestone, Forward, CalendarCheck } from "lucide-react";
import { ExpiryData } from "@/types/policy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ExpiryStatsCardsProps {
  data: ExpiryData & { 
    thirtyDays?: any[]; 
    yearly?: any[]; 
    nextMonth?: any[]; 
    nextAnnual?: any[] 
  }; 
}

export const ExpiryStatsCards = ({ data }: ExpiryStatsCardsProps) => {
  const total = (data.today?.length || 0) + 
                (data.week?.length || 0) + 
                (data.month?.length || 0) + 
                (data.nextMonth?.length || 0) + 
                (data.expired?.length || 0) +
                (data.nextAnnual?.length || 0) || 1;

  // Bento Redesign: Organized chronologically (Today -> Future -> Expired)
  const stats = [
    {
      label: "Today",
      count: data.today?.length || 0,
      description: "Critical actions today",
      icon: AlertCircle,
      theme: "rose",
      bg: "bg-rose-500/10",
      iconBg: "bg-rose-500", 
      text: "text-rose-600 dark:text-rose-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1", // Small square
    },
    {
      label: "This Week",
      count: data.week?.length || 0,
      description: "Next 7 days",
      icon: Hourglass,
      theme: "amber",
      bg: "bg-amber-500/10",
      iconBg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1", // Small square
    },
    {
      label: "30-Day Outlook",
      count: data.thirtyDays?.length || 0,
      description: "Strategic rolling 30-day forecast and pipeline analysis",
      icon: BarChart3,
      theme: "violet",
      bg: "bg-violet-500/10",
      iconBg: "bg-violet-600",
      text: "text-violet-600 dark:text-violet-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-2", // TALL card
      isPremium: true,
    },
    {
      label: "This Month",
      count: data.month?.length || 0,
      description: "Due by month end",
      icon: CalendarDays,
      theme: "blue",
      bg: "bg-blue-500/10",
      iconBg: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1", // Small square
    },
    {
      label: "Next Month",
      count: data.nextMonth?.length || 0,
      description: "Upcoming pipeline",
      icon: Forward,
      theme: "indigo",
      bg: "bg-indigo-500/10",
      iconBg: "bg-indigo-500",
      text: "text-indigo-600 dark:text-indigo-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1", // Small square
    },
    {
      label: "Future Forecast",
      count: data.yearly?.length || 0,
      description: "Comprehensive 365-day annual pipeline overview including all future scheduled renewals and milestones.",
      icon: Milestone,
      theme: "emerald",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      iconColor: "text-white",
      className: "lg:col-span-2 lg:row-span-2", // BIG SQUARE (Hero)
      isPremium: true,
    },
    {
      label: "Annual",
      count: data.nextAnnual?.length || 0,
      description: "Next yearly cycle",
      icon: CalendarCheck,
      theme: "cyan",
      bg: "bg-cyan-500/10",
      iconBg: "bg-cyan-500",
      text: "text-cyan-600 dark:text-cyan-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1", // Small square
    },
    {
      label: "Expired",
      count: data.expired?.length || 0,
      description: "Lapsed policies",
      icon: History,
      theme: "slate",
      bg: "bg-slate-500/10",
      iconBg: "bg-slate-600",
      text: "text-slate-600 dark:text-slate-300",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1", // Small square
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[160px] w-full">
      {stats.map((stat, index) => {
        const percentage = Math.round((stat.count / total) * 100);
        const isBig = stat.className.includes("lg:col-span-2");
        const isTall = stat.className.includes("lg:row-span-2") && !isBig;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={cn("relative h-full", stat.className)}
          >
            <Card 
              className={cn(
                "relative h-full border-none overflow-hidden transition-all duration-500 rounded-[32px] group flex flex-col p-6",
                "bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:-translate-y-1",
                stat.isPremium && "ring-1 ring-slate-200 dark:ring-slate-800"
              )}
            >
              {/* Bento Background Decor */}
              <div className={cn("absolute inset-0 opacity-5 transition-opacity group-hover:opacity-15", stat.bg)} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400/80">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h2 className={cn(
                        "font-black tracking-tighter text-slate-900 dark:text-white tabular-nums",
                        isBig ? "text-6xl" : "text-3xl"
                      )}>
                        {stat.count}
                      </h2>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex shrink-0 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110",
                    isBig ? "h-16 w-16" : "h-12 w-12",
                    stat.iconBg,
                    stat.iconColor
                  )}>
                    <stat.icon className={isBig ? "h-8 w-8" : "h-6 w-6"} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <p className={cn(
                      "font-semibold tracking-tight text-slate-500 dark:text-slate-400",
                      isBig ? "text-base max-w-[240px]" : "text-[11px] line-clamp-2"
                  )}>
                    {stat.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                      <span className="text-slate-400">Relative Weight</span>
                      <span className={stat.text}>{percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className={cn(
                          "h-full rounded-full",
                          stat.theme === "rose" && "bg-rose-500",
                          stat.theme === "amber" && "bg-amber-500",
                          stat.theme === "blue" && "bg-blue-500",
                          stat.theme === "indigo" && "bg-indigo-500",
                          stat.theme === "violet" && "bg-violet-500",
                          stat.theme === "emerald" && "bg-emerald-500",
                          stat.theme === "slate" && "bg-slate-500",
                          stat.theme === "cyan" && "bg-cyan-500"
                        )}
                      />
                    </div>
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