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
  FileJson, 
  Table as TableIcon,
  Printer
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Types ---
interface PolicyHistory {
  id: number;
  plate: string;
  owner: string;
  company: string;
  expiry_date: string;
  renewed_date: string | null;
}

// --- Helper Functions ---
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// --- Sub-Components ---

const PolicyHistoryItem = ({ item }: { item: PolicyHistory }) => {
  const isRenewed = !!item.renewed_date;
  
  return (
    <div className="group relative ml-9 mb-8 last:mb-0">
      {/* Timeline Connector Dot */}
      <div className={cn(
        "absolute -left-[41px] top-1 z-10 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 shadow-sm flex items-center justify-center transition-transform group-hover:scale-110",
        isRenewed ? "bg-emerald-500" : "bg-rose-500"
      )}>
        {isRenewed ? (
          <CheckCircle2 size={12} className="text-white" />
        ) : (
          <XCircle size={12} className="text-white" />
        )}
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row">
          <div className="p-5 flex-grow border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Hash size={18} className="text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                  {item.plate}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <User size={14} />
                  <span>{item.owner}</span>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md inline-block">
              {item.company}
            </p>
          </div>

          <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-center min-w-[260px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Timeline</span>
                <Badge className={cn(
                  "font-bold px-2 py-0 text-[10px] border-none shadow-none",
                  isRenewed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}>
                  {isRenewed ? "Renewed" : "Expired"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Expiry</span>
                  <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">
                    {formatDate(item.expiry_date)}
                  </span>
                </div>
                
                {isRenewed && (
                  <>
                    <ArrowRight size={14} className="text-slate-300 mt-3" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-500 uppercase font-bold">New Start</span>
                      <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
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
    </div>
  );
};

// --- Main Tracker Component ---

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
      setHistory(data);
    } catch (err) {
      toast({ title: "Sync Failed", description: "Unable to reach server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filteredHistory = useMemo(() => {
    return history
      .filter(item => {
        const matchesSearch = item.plate.toLowerCase().includes(search.toLowerCase()) || item.owner.toLowerCase().includes(search.toLowerCase());
        const isRenewed = !!item.renewed_date;
        const matchesStatus = statusFilter === "all" || (statusFilter === "expired" && !isRenewed) || (statusFilter === "renewed" && isRenewed);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime());
  }, [history, search, statusFilter]);

  // Export Logic
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ["Plate", "Owner", "Company", "Expiry Date", "Renewed Date"];
    const csvContent = [
      headers.join(","),
      ...filteredHistory.map(h => `${h.plate},${h.owner},${h.company},${h.expiry_date},${h.renewed_date || "N/A"}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Policy_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Successful", description: "CSV file has been generated." });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      {/* Professional Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <History size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">System Audit</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            History Tracker
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex gap-2 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-blue-600"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print
          </Button>
          <Button 
            onClick={handleExportCSV}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-lg shadow-blue-500/10"
          >
            <Download size={16} />
            Export Data
          </Button>
        </div>
      </div>

      {/* Control Center */}
      <Card className="p-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-center gap-2">
          <div className="relative w-full lg:flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search history by plate or owner name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 text-base"
            />
          </div>

          <div className="flex p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 w-full lg:w-auto">
            {(["all", "expired", "renewed"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "flex-1 px-5 py-2 rounded-md text-[11px] font-black uppercase transition-all tracking-widest",
                  statusFilter === filter 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Timeline Content */}
      <div className="relative">
        <div className="absolute left-3 top-4 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800/50" />
        
        {loading ? (
          <div className="space-y-6 ml-9">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 ml-9">
            <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold">No Records Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(item => (
              <PolicyHistoryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!loading && filteredHistory.length > 0 && (
        <div className="flex items-center justify-center py-6 ml-9 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History size={12} />
            End of History Log — {filteredHistory.length} Entries
          </p>
        </div>
      )}
    </div>
  );
};

export default PolicyHistoryTracker;