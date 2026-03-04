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

  // Stats reorganized in your specific ascending order
  const stats = [
    {
      label: "This Week",
      count: (data.today?.length || 0) + (data.week?.length || 0),
      description: "Immediate upcoming renewals",
      icon: AlertCircle,
      theme: "rose",
      bg: "bg-rose-500/10",
      iconBg: "bg-rose-500", 
      text: "text-rose-600 dark:text-rose-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      label: "This Month",
      count: data.month?.length || 0,
      description: "Current month end",
      icon: CalendarDays,
      theme: "blue",
      bg: "bg-blue-500/10",
      iconBg: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      label: "Next Month",
      count: data.nextMonth?.length || 0,
      description: "Short-term pipeline",
      icon: Forward,
      theme: "indigo",
      bg: "bg-indigo-500/10",
      iconBg: "bg-indigo-500",
      text: "text-indigo-600 dark:text-indigo-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      label: "30-Day",
      count: data.thirtyDays?.length || 0,
      description: "Strategic rolling forecast",
      icon: BarChart3,
      theme: "violet",
      bg: "bg-violet-500/10",
      iconBg: "bg-violet-600",
      text: "text-violet-600 dark:text-violet-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-2", // Bento Big Card
      isPremium: true,
    },
    {
      label: "Annual",
      count: data.nextAnnual?.length || 0,
      description: "Upcoming yearly renewals",
      icon: CalendarCheck,
      theme: "cyan",
      bg: "bg-cyan-500/10",
      iconBg: "bg-cyan-500",
      text: "text-cyan-600 dark:text-cyan-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      label: "Future",
      count: data.yearly?.length || 0,
      description: "Comprehensive 365-day outlook",
      icon: Milestone,
      theme: "emerald",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      iconColor: "text-white",
      className: "lg:col-span-2 lg:row-span-2", // Bento Big Card
      isPremium: true,
    },
    {
      label: "Expired",
      count: data.expired?.length || 0,
      description: "Lapsed and overdue items",
      icon: History,
      theme: "slate",
      bg: "bg-slate-500/10",
      iconBg: "bg-slate-600",
      text: "text-slate-600 dark:text-slate-300",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[140px] w-full">
      {stats.map((stat, index) => {
        const percentage = Math.round((stat.count / total) * 100);
        const isBig = stat.className.includes("row-span-2");

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04, duration: 0.5, ease: "easeOut" }}
            className={cn("relative h-full", stat.className)}
          >
            <Card 
              className={cn(
                "relative h-full border-none overflow-hidden transition-all duration-500 rounded-[28px] group flex flex-col p-6",
                "bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl",
                stat.isPremium && "ring-1 ring-slate-200 dark:ring-slate-800"
              )}
            >
              <div className={cn("absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20", stat.bg)} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h2 className={cn(
                        "font-black tracking-tighter text-slate-900 dark:text-white tabular-nums transition-all",
                        isBig ? "text-5xl" : "text-2xl"
                      )}>
                        {stat.count}
                      </h2>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:rotate-12",
                    isBig ? "h-14 w-14" : "h-10 w-10",
                    stat.iconBg,
                    stat.iconColor
                  )}>
                    <stat.icon className={isBig ? "h-7 w-7" : "h-5 w-5"} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                        "font-bold tracking-tight text-slate-500 dark:text-slate-400 line-clamp-2",
                        isBig ? "text-sm max-w-[180px]" : "text-[10px]"
                    )}>
                      {stat.description}
                    </p>
                    <div className={cn(
                      "text-[10px] font-mono font-black px-2 py-1 rounded-lg border bg-white dark:bg-slate-800",
                      stat.text
                    )}>
                      {percentage > 100 ? "100+" : percentage}%
                    </div>
                  </div>
                  
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1.5, ease: "anticipate" }}
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
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};