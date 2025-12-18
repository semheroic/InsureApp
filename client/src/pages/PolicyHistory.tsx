import { useEffect, useState, useMemo } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  User, 
  Hash, 
  ArrowRight, 
  History, 
  Download, 
  Printer,
  Zap,
  Sparkles,
  RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 100 } 
  }
};

interface PolicyHistory {
  id: number;
  plate: string;
  owner: string;
  company: string;
  expiry_date: string;
  renewed_date: string | null;
  created_at?: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const PolicyHistoryItem = ({ item }: { item: PolicyHistory }) => {
  const isRenewed = !!item.renewed_date;
  
  const isNew = useMemo(() => {
    if (!item.created_at) return false;
    const entryTime = new Date(item.created_at).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return entryTime > fiveMinutesAgo;
  }, [item.created_at]);

  return (
    <motion.div 
      variants={itemVariants}
      layout
      className="group relative ml-10 mb-8 last:mb-0"
    >
      {/* Timeline Connector Dot */}
      <div className={cn(
        "absolute -left-[45px] top-4 z-10 w-8 h-8 rounded-full border-4 border-background shadow-md flex items-center justify-center transition-all duration-500",
        isNew ? "bg-blue-600 scale-125 shadow-blue-500/50" : isRenewed ? "bg-emerald-500" : "bg-rose-500"
      )}>
        {isNew ? <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Sparkles size={14} className="text-white" /></motion.div> : 
         isRenewed ? <CheckCircle2 size={14} className="text-white" /> : 
         <XCircle size={14} className="text-white" />
        }
      </div>

      <Card className={cn(
        "relative overflow-hidden border-muted transition-all duration-300 bg-card hover:shadow-xl",
        isNew ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 border-transparent bg-blue-50/30" : "hover:border-primary/50"
      )}>
        {isNew && (
          <motion.div 
            initial={{ x: 50 }} 
            animate={{ x: 0 }} 
            className="absolute top-0 right-0 z-20"
          >
            <div className="bg-blue-600 text-[10px] font-black text-white px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg">
              <Zap size={10} className="fill-current animate-pulse" /> NEW RECORD
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row">
          <div className="p-6 flex-grow border-b md:border-b-0 md:border-r border-muted/50">
            <div className="flex items-center gap-4 mb-4">
              <motion.div 
                whileHover={{ rotate: 10 }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                  isNew ? "bg-blue-100 dark:bg-blue-800" : "bg-muted"
                )}
              >
                <Hash size={20} className={isNew ? "text-blue-600" : "text-muted-foreground"} />
              </motion.div>
              <div>
                <h3 className="text-xl font-black tracking-tighter uppercase text-foreground leading-none mb-1">
                  {item.plate}
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <User size={12} />
                  <span>{item.owner}</span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md inline-block uppercase tracking-wider">
              {item.company}
            </p>
          </div>

          <div className="p-6 bg-muted/20 min-w-[300px] flex flex-col justify-center">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Audit Status</span>
                <Badge className={cn(
                  "font-black text-[9px] uppercase tracking-tighter border-none",
                  isRenewed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                )}>
                  {isRenewed ? "Successfully Renewed" : "Contract Expired"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 bg-background/50 p-3 rounded-xl border border-muted/50 transition-colors group-hover:border-primary/30">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase font-black">Expiry</span>
                  <span className="text-sm font-mono font-bold">{formatDate(item.expiry_date)}</span>
                </div>
                
                {isRenewed && (
                  <>
                    <ArrowRight size={16} className="text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-emerald-500 uppercase font-black">Renewed</span>
                      <span className="text-sm font-mono font-bold text-emerald-600">
                        {formatDate(item.renewed_date)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const PolicyHistoryTracker = () => {
  const [history, setHistory] = useState<PolicyHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "expired" | "renewed">("all");
  const { toast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/policy-history");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.sort((a: any, b: any) => b.id - a.id));
    } catch (err) {
      toast({ title: "Sync Failed", description: "Unable to reach server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.plate.toLowerCase().includes(search.toLowerCase()) || 
                            item.owner.toLowerCase().includes(search.toLowerCase());
      const isRenewed = !!item.renewed_date;
      const matchesStatus = statusFilter === "all" || 
                            (statusFilter === "expired" && !isRenewed) || 
                            (statusFilter === "renewed" && isRenewed);
      return matchesSearch && matchesStatus;
    });
  }, [history, search, statusFilter]);

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="max-w-6xl mx-auto p-6 md:p-10 space-y-8"
    >
      {/* Header Actions */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <History size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Integrity Audit</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            History Tracker
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => window.print()}>
            <Printer size={16} className="mr-2" /> Print Audit
          </Button>
          <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Download size={16} className="mr-2" /> Export Data
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchHistory} className={cn("rounded-full", loading && "animate-spin")}>
            <RefreshCcw size={16} />
          </Button>
        </div>
      </motion.div>

      {/* Control Center */}
      <motion.div variants={itemVariants}>
        <Card className="p-2 border-muted bg-muted/30 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-center gap-2">
            <div className="relative w-full lg:flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Filter history by plate or owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 text-base"
              />
            </div>

            <div className="flex p-1 bg-background rounded-lg shadow-sm border border-muted w-full lg:w-auto">
              {(["all", "expired", "renewed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    "relative flex-1 px-5 py-2 rounded-md text-[11px] font-black uppercase transition-all tracking-widest z-10",
                    statusFilter === filter ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {statusFilter === filter && (
                    <motion.div 
                      layoutId="activeFilter" 
                      className="absolute inset-0 bg-primary rounded-md -z-10 shadow-md"
                    />
                  )}
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Timeline Section */}
      <div className="relative min-h-[400px]">
        {/* Animated Gradient Line */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          className="absolute left-[15px] top-6 w-1 bg-gradient-to-b from-primary via-muted to-transparent rounded-full origin-top" 
        />
        
        <AnimatePresence mode="popLayout">
          {loading && history.length === 0 ? (
            <motion.div key="loading" className="space-y-6 ml-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </motion.div>
          ) : filteredHistory.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-muted ml-10"
            >
              <Search size={32} className="text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold">No Audit Records</h3>
              <p className="text-muted-foreground text-sm">No history matches your search criteria.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map(item => (
                <PolicyHistoryItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </AnimatePresence> 
      </div>
    </motion.div>
  );
};

export default PolicyHistoryTracker;