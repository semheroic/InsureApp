import { useEffect, useState, useMemo } from "react";
import { 
  CheckCircle2, XCircle, Search, User, Hash, ArrowRight, History as HistoryIcon, 
  RefreshCcw, MessageSquare, DollarSign, Send, ShieldCheck, 
  Phone, Building2, Filter, TrendingUp, Clock, Zap, Sparkles, CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

// --- Types ---
interface PolicyHistoryData {
  id: number;
  policy_id: number;
  plate: string;
  owner: string;
  company: string;
  expiry_date: string;
  renewed_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SMSLog {
  id: number;
  phone_number: string;
  message: string;
  cost: string | number;
  delivery_status: string;
  is_read: number;
  created_at: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const PolicyHistory = () => {
  const [history, setHistory] = useState<PolicyHistoryData[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"policies" | "messages">("policies");
  const [statusFilter, setStatusFilter] = useState<"all" | "expired" | "renewed">("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const { toast } = useToast();

  const API_URL = "http://localhost:5000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, smsRes] = await Promise.all([
        fetch(`${API_URL}/api/policy-history`, { credentials: "include" }),
        fetch(`${API_URL}/sms/logs`, { credentials: "include" })
      ]);
      const histData = await histRes.json();
      const smsData = await smsRes.json();
      
      setHistory(histData.sort((a: any, b: any) => b.id - a.id));
      setSmsLogs(smsData.logs || []);
    } catch (err) {
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  // --- CALCULATE COSTS (Today, Week, Month) ---
  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const getCost = (log: SMSLog) => {
      const val = parseFloat(String(log.cost));
      return isNaN(val) ? 0 : val;
    };

    const totalSpent = smsLogs.reduce((acc, log) => acc + getCost(log), 0);
    
    const todaySpent = smsLogs
      .filter(log => new Date(log.created_at).getTime() >= startOfDay)
      .reduce((acc, log) => acc + getCost(log), 0);

    const weekSpent = smsLogs
      .filter(log => new Date(log.created_at).getTime() >= startOfWeek)
      .reduce((acc, log) => acc + getCost(log), 0);

    const monthSpent = smsLogs
      .filter(log => new Date(log.created_at).getTime() >= startOfMonth)
      .reduce((acc, log) => acc + getCost(log), 0);

    const successRate = smsLogs.length > 0 
      ? Math.round((smsLogs.filter(l => l.delivery_status === 'Success').length / smsLogs.length) * 100) 
      : 0;
    
    const renewalCount = history.filter(h => !!h.renewed_date).length;

    return { totalSpent, todaySpent, weekSpent, monthSpent, successRate, renewalCount };
  }, [smsLogs, history]);

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    const s = search.toLowerCase();
    if (activeTab === "policies") {
      return history.filter(h => {
        const matchesSearch = h.plate?.toLowerCase().includes(s) || h.owner?.toLowerCase().includes(s);
        const isRenewed = !!h.renewed_date;
        const matchesStatus = statusFilter === "all" || 
                             (statusFilter === "expired" && !isRenewed) || 
                             (statusFilter === "renewed" && isRenewed);
        const matchesCompany = companyFilter === "all" || h.company === companyFilter;
        return matchesSearch && matchesStatus && matchesCompany;
      });
    }
    // SMS Search: Check both phone number and message content
    return smsLogs.filter(l => l.phone_number.includes(search) || l.message.toLowerCase().includes(s));
  }, [history, smsLogs, search, activeTab, statusFilter, companyFilter]);

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Auditor Dashboard</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground italic">Registry History</h1>
        </div>
        <Button onClick={fetchData} disabled={loading} className="rounded-xl shadow-lg shadow-primary/20">
          <RefreshCcw size={16} className={cn("mr-2", loading && "animate-spin")} /> Force Sync
        </Button>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-primary/5 border-primary/20 border-l-4 border-l-primary flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Successful Renewals</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary" size={24}/>
              <p className="text-3xl font-black">{stats.renewalCount}</p>
            </div>
            <HistoryIcon className="text-primary/20" size={32}/>
          </div>
        </Card>

        <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Delivery Performance</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={24}/>
              <p className="text-3xl font-black">{stats.successRate}%</p>
            </div>
            <MessageSquare className="text-emerald-500/20" size={32}/>
          </div>
        </Card>

        <Card className="p-6 bg-amber-500/5 border-amber-500/20 border-l-4 border-l-amber-600">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Spending (RWF)</p>
            <CalendarDays size={16} className="text-amber-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center border-r border-amber-200/50">
               <p className="text-[9px] font-black text-amber-700/50">TODAY</p>
               <p className="text-sm font-black">{stats.todaySpent.toFixed(0)}</p>
            </div>
            <div className="text-center border-r border-amber-200/50">
               <p className="text-[9px] font-black text-amber-700/50">WEEK</p>
               <p className="text-sm font-black">{stats.weekSpent.toFixed(0)}</p>
            </div>
            <div className="text-center">
               <p className="text-[9px] font-black text-amber-700/50">MONTH</p>
               <p className="text-sm font-black">{stats.monthSpent.toFixed(0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* CONTROL CENTER */}
      <Card className="p-2 border-muted bg-muted/30 backdrop-blur-xl sticky top-20 z-40">
        <div className="flex flex-col lg:flex-row items-center gap-2">
          <div className="relative w-full lg:flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder={activeTab === 'policies' ? "Search Plate or Owner..." : "Search Phone Number or SMS..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 text-base"
            />
          </div>

          <div className="flex bg-background rounded-lg border p-1 w-full lg:w-auto">
            {(["policies", "messages"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(""); }}
                className={cn(
                  "relative flex-1 px-6 py-2 rounded-md text-[10px] font-black uppercase transition-all tracking-widest z-10 whitespace-nowrap",
                  activeTab === tab ? "text-white" : "text-muted-foreground"
                )}
              >
                {activeTab === tab && <motion.div layoutId="tab" className="absolute inset-0 bg-primary rounded-md -z-10" />}
                {tab === 'policies' ? 'Policy Audit' : 'SMS Logs'}
              </button>
            ))}
          </div>

          {activeTab === 'policies' && (
            <div className="flex gap-2 w-full lg:w-auto">
              <Select value={statusFilter} onValueChange={(v:any) => setStatusFilter(v)}>
                <SelectTrigger className="w-full lg:w-[130px] h-12 bg-background border-none text-[10px] font-bold uppercase">
                  <Filter size={14} className="mr-2"/> Status
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="renewed">Renewed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full lg:w-[130px] h-12 bg-background border-none text-[10px] font-bold uppercase">
                  <Building2 size={14} className="mr-2"/> Provider
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="SORAS">SORAS</SelectItem>
                  <SelectItem value="RADIANT">RADIANT</SelectItem>
                  <SelectItem value="SANLAM">SANLAM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* TIMELINE VIEW */}
      <div className="relative min-h-[400px]">
        <div className="absolute left-[15px] top-6 bottom-6 w-1 bg-gradient-to-b from-primary via-muted to-transparent rounded-full opacity-50" />
        
        <AnimatePresence mode="popLayout">
          {filteredData.map((item: any) => (
            <motion.div key={`${activeTab}-${item.id}`} variants={itemVariants} className="relative ml-10 mb-6 last:mb-0">
              <div className={cn(
                "absolute -left-[45px] top-4 w-8 h-8 rounded-full border-4 border-background shadow-md flex items-center justify-center text-white",
                activeTab === 'policies' ? (item.renewed_date ? "bg-emerald-500" : "bg-rose-500") : "bg-blue-600"
              )}>
                {activeTab === 'policies' ? <Hash size={14}/> : <Send size={14}/>}
              </div>

              <Card className="p-6 hover:shadow-xl transition-all group border-muted">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-black uppercase tracking-tighter">{item.plate || item.phone_number}</h3>
                      {activeTab === 'policies' && <Badge variant="outline" className="text-[9px] font-bold">{item.company}</Badge>}
                      {activeTab === 'messages' && (
                        <Badge className={cn("text-[9px] font-black", item.delivery_status === 'Success' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                          {item.delivery_status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 italic">
                      {activeTab === 'policies' ? <><User size={14}/> {item.owner}</> : `"${item.message}"`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {activeTab === 'policies' ? (
                      <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border border-muted/50">
                        <div className="text-center">
                          <span className="text-[8px] font-black uppercase text-muted-foreground block">Expiry</span>
                          <span className="text-xs font-mono font-bold">{formatDate(item.expiry_date)}</span>
                        </div>
                        {item.renewed_date && (
                          <>
                            <ArrowRight size={14} className="text-emerald-500" />
                            <div className="text-center">
                              <span className="text-[8px] font-black uppercase text-emerald-500 block">Renewed</span>
                              <span className="text-xs font-mono font-bold text-emerald-600">{formatDate(item.renewed_date)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-black text-primary">
                          {item.cost && !isNaN(parseFloat(item.cost)) ? parseFloat(item.cost).toFixed(2) : "0.00"} RWF
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                          <Clock size={10}/> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PolicyHistory;