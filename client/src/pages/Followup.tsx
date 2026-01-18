import { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, Search, RefreshCw, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** Animation Variants */
const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVars = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface PolicyFollowUp {
  id: number;
  plate: string;
  owner: string;
  contact: string;
  company: string;
  expiryDate: string;
  followup_status: "confirmed" | "pending" | "missed";
}

const API_FOLLOWUP = `${import.meta.env.VITE_API_URL}/api/followup`;
const API_REMINDER = `${import.meta.env.VITE_API_URL}/api/policies/send-reminder`;

export default function FollowUps() {
  const { toast } = useToast();
  const [data, setData] = useState<PolicyFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_FOLLOWUP);
      if (!res.ok) throw new Error("Failed to fetch data.");
      const json: PolicyFollowUp[] = await res.json();
      setData(json);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { grouped } = useMemo(() => {
    const currentFiltered = data.filter(p => 
      p.plate.toLowerCase().includes(search.toLowerCase()) || 
      p.owner.toLowerCase().includes(search.toLowerCase())
    );
    return {
      grouped: {
        confirmed: currentFiltered.filter(p => p.followup_status === "confirmed"),
        pending: currentFiltered.filter(p => p.followup_status === "pending"),
        missed: currentFiltered.filter(p => p.followup_status === "missed"),
      }
    };
  }, [data, search]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="space-y-8 p-6 bg-slate-50/50 dark:bg-slate-950 min-h-screen"
    >
      
      {/* HEADER */}
      <motion.div variants={itemVars} className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <LayoutDashboard className="w-6 h-6 text-blue-600" />
             <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
               Follow-Ups
             </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage and track renewal confirmations</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData} 
          disabled={loading}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </motion.button>
      </motion.div>

      {/* STATUS CARDS */}
      <motion.div variants={containerVars} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard title="Confirmed" count={grouped.confirmed.length} icon={CheckCircle} color="emerald" />
        <StatusCard title="Pending" count={grouped.pending.length} icon={Clock} color="amber" />
        <StatusCard title="Missed" count={grouped.missed.length} icon={XCircle} color="rose" />
      </motion.div>
      
      {/* MAIN CONTENT */}
      <motion.div variants={itemVars}>
        <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between gap-4">
             <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search owner or plate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
             </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-slate-100 dark:border-slate-800 h-12 px-4 gap-6">
              <TabTrigger value="confirmed" label="Confirmed" count={grouped.confirmed.length} color="text-emerald-600" />
              <TabTrigger value="pending" label="Pending Action" count={grouped.pending.length} color="text-amber-600" />
              <TabTrigger value="missed" label="Missed" count={grouped.missed.length} color="text-rose-600" />
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key="tab-content"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4"
              >
                <TabsContent value="confirmed" className="mt-0 outline-none">
                  <PolicyTable 
                    data={grouped.confirmed} 
                    followUpEndpoint={API_FOLLOWUP}
                    sendReminderEndpoint={API_REMINDER} 
                    refreshData={fetchData} 
                    searchable={false} 
                  />
                </TabsContent>
                <TabsContent value="pending" className="mt-0 outline-none">
                  <PolicyTable 
                    data={grouped.pending} 
                    followUpEndpoint={API_FOLLOWUP}
                    sendReminderEndpoint={API_REMINDER} 
                    refreshData={fetchData} 
                    searchable={false} 
                  />
                </TabsContent>
                <TabsContent value="missed" className="mt-0 outline-none">
                  <PolicyTable 
                    data={grouped.missed} 
                    followUpEndpoint={API_FOLLOWUP}
                    sendReminderEndpoint={API_REMINDER} 
                    refreshData={fetchData} 
                    searchable={false} 
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/** * Sub-components with internal animations */

function StatusCard({ title, count, icon: Icon, color }: { title: string, count: number, icon: any, color: 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    rose: "text-rose-600 bg-rose-50 border-rose-200",
  };

  return (
    <motion.div variants={itemVars} whileHover={{ y: -5 }} className="group">
      <Card className={cn("p-6 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex items-center justify-between")}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <motion.div 
            initial={{ scale: 0.5 }} 
            animate={{ scale: 1 }} 
            className="text-4xl font-black mt-1 text-slate-900 dark:text-white"
          >
            {count}
          </motion.div>
        </div>
        <div className={cn("p-3 rounded-2xl transition-colors", colors[color])}>
          <Icon className="w-8 h-8" strokeWidth={2.5} />
        </div>
      </Card>
    </motion.div>
  );
}

function TabTrigger({ value, label, count, color }: { value: string, label: string, count: number, color: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-3 mt-1 font-semibold text-slate-500 transition-all"
    >
      {label} <span className={cn("ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]", color)}>{count}</span>
    </TabsTrigger>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}