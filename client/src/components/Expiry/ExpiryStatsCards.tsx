import { Card } from "@/components/ui/card";
import { AlertCircle, CalendarDays, History, Hourglass } from "lucide-react";
import { ExpiryData } from "@/types/policy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      label: "Monthly Outlook",
      count: data.month?.length || 0,
      description: "30-day forecast",
      icon: CalendarDays,
      theme: "blue",
      bg: "bg-blue-50/30 dark:bg-blue-950/10",
      iconBg: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      iconColor: "text-white",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <Card 
            className={cn(
              "relative border-none overflow-hidden transition-all duration-300 rounded-[28px] group",
              "shadow-[0_4px_12px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]",
              "hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-950"
            )}
          >
            {/* Very faint background tint to distinguish cards separately */}
            <div className={cn("absolute inset-0 opacity-40", stat.bg)} />
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
                      {stat.count}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items</span>
                  </div>
                </div>

                {/* ICON BOX: Now with its own shadow and "separated" container look */}
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500",
                  "shadow-[0_8px_16px_rgba(0,0,0,0.1)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)]",
                  "group-hover:-translate-y-1",
                  stat.iconBg,
                  stat.iconColor
                )}>
                  <stat.icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold tracking-tight text-slate-600 dark:text-slate-300">
                    {stat.description}
                  </p>
                  <div className={cn(
                    "text-[10px] font-mono font-black px-2 py-0.5 rounded-lg shadow-sm border border-white/50",
                    "bg-white/80 dark:bg-slate-900",
                    stat.text
                  )}>
                    {Math.round((stat.count / total) * 100)}%
                  </div>
                </div>
                
                {/* Progress Bar: Smoother, thinner, and less aggressive colors */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-slate-800 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stat.count / total) * 100}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500 opacity-80",
                      stat.theme === "rose" && "bg-rose-500",
                      stat.theme === "amber" && "bg-amber-500",
                      stat.theme === "blue" && "bg-blue-500",
                      stat.theme === "slate" && "bg-slate-500"
                    )}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};