import { Card } from "@/components/ui/card";
import { 
  AlertCircle, CalendarDays, History, Hourglass, 
  BarChart3, Milestone, Forward, CalendarCheck, Clock 
} from "lucide-react";
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
  // Safe total calculation for percentage bars
  const total = (
    (data.today?.length || 0) + 
    (data.week?.length || 0) + 
    (data.month?.length || 0) + 
    (data.nextMonth?.length || 0) + 
    (data.expired?.length || 0) +
    (data.nextAnnual?.length || 0) +
    (data.yearly?.length || 0)
  ) || 1;

  const stats = [
    {
      label: "Today",
      count: data.today?.length || 0,
      description: "Critical actions required now",
      icon: Clock,
      theme: "amber",
      bg: "bg-amber-500/10",
      iconBg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      label: "This Week",
      count: data.week?.length || 0,
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
      label: "30-Day",
      count: data.thirtyDays?.length || 0,
      description: "Strategic rolling forecast for the month ahead",
      icon: BarChart3,
      theme: "violet",
      bg: "bg-violet-500/10",
      iconBg: "bg-violet-600",
      text: "text-violet-600 dark:text-violet-400",
      iconColor: "text-white",
      className: "lg:col-span-1 lg:row-span-2", // Bento Vertical Tall
      isPremium: true,
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
      label: "Future Outlook",
      count: data.yearly?.length || 0,
      description: "Comprehensive 365-day perspective on all upcoming policy expirations",
      icon: Milestone,
      theme: "emerald",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      iconColor: "text-white",
      className: "lg:col-span-2 lg:row-span-2", // Bento Feature Card
      isPremium: true,
    },
    {
      label: "Expired",
      count: data.expired?.length || 0,
      description: "Lapsed items",
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={cn("relative h-full", stat.className)}
          >
            <Card 
              className={cn(
                "relative h-full border-none overflow-hidden transition-all duration-300 rounded-[24px] group flex flex-col p-5",
                "bg-white dark:bg-slate-900 shadow-sm hover:shadow-md",
                stat.isPremium && "ring-1 ring-slate-200 dark:ring-slate-800"
              )}
            >
              {/* Animated Hover Background */}
              <div className={cn(
                "absolute inset-0 opacity-5 transition-opacity duration-500 group-hover:opacity-15", 
                stat.bg
              )} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <h2 className={cn(
                        "font-black tracking-tight text-slate-900 dark:text-white tabular-nums",
                        isBig ? "text-5xl" : "text-3xl"
                      )}>
                        {stat.count}
                      </h2>
                    </div>
                  </div>

                  <div className={cn(
                    "flex shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                    isBig ? "h-12 w-12" : "h-9 w-9",
                    stat.iconBg,
                    stat.iconColor
                  )}>
                    <stat.icon className={isBig ? "h-6 w-6" : "h-4.5 w-4.5"} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-end justify-between gap-4">
                    <p className={cn(
                        "font-medium leading-tight text-slate-500 dark:text-slate-400 line-clamp-2",
                        isBig ? "text-sm" : "text-[11px]"
                    )}>
                      {stat.description}
                    </p>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm",
                      stat.text,
                      "bg-white/50 dark:bg-slate-800/50"
                    )}>
                      {percentage}%
                    </div>
                  </div>
                  
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className={cn(
                        "h-full rounded-full transition-colors",
                        {
                          "bg-amber-500": stat.theme === "amber",
                          "bg-rose-500": stat.theme === "rose",
                          "bg-blue-500": stat.theme === "blue",
                          "bg-indigo-500": stat.theme === "indigo",
                          "bg-violet-500": stat.theme === "violet",
                          "bg-emerald-500": stat.theme === "emerald",
                          "bg-slate-500": stat.theme === "slate",
                          "bg-cyan-500": stat.theme === "cyan",
                        }
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