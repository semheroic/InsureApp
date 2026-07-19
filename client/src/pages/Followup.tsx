import { useEffect, useState, useMemo, useCallback, useRef, type ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, Search, RefreshCw, LayoutDashboard, Upload, Loader2, Download } from "lucide-react";
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
  policy_number: string;
  plate: string;
  owner: string;
  contact: string;
  company: string;
  expiryDate: string;
  followup_status: "confirmed" | "pending" | "missed";
  followed_at: string; // From MariaDB: "2026-02-28 01:08:03"
}

const API_FOLLOWUP = `${import.meta.env.VITE_API_URL}/api/followup`;
const API_FOLLOWUP_IMPORT = `${import.meta.env.VITE_API_URL}/api/followup/import`;

type FollowupImportRow = {
  row_number: number;
  policy_number?: string;
  policy_no?: string;
  plate?: string;
  contact?: string;
  followup_status: "confirmed" | "pending" | "missed";
  followed_at?: string;
  notes?: string;
};

const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const normalizeCSVHeader = (header: string) =>
  header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const pickCSVValue = (row: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }

  return "";
};

const normalizeFollowupStatus = (value: string): FollowupImportRow["followup_status"] | "" => {
  const normalized = value.trim().toLowerCase();
  if (["confirmed", "confirm", "complete", "completed"].includes(normalized)) return "confirmed";
  if (["pending", "pending action", "waiting"].includes(normalized)) return "pending";
  if (["missed", "miss", "failed", "not reached"].includes(normalized)) return "missed";
  return "";
};

const parseFollowupCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return { followups: [] as FollowupImportRow[], errors: ["Empty CSV file"] };

  const headers = splitCSVLine(lines[0]).map(normalizeCSVHeader);
  const followups: FollowupImportRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i]?.trim() ?? "";
    });

    const status = normalizeFollowupStatus(
      pickCSVValue(row, ["followup_status", "follow_up_status", "status", "followup"])
    );
    const policyNumber = pickCSVValue(row, ["policy_number", "policy_no", "policy", "policy_id"]);
    const plate = pickCSVValue(row, ["plate", "registration", "vehicle"]);
    const contact = pickCSVValue(row, ["contact", "phone", "phone_number", "telephone"]);
    const followedAt = pickCSVValue(row, ["followed_at", "followed", "created_at", "date"]);
    const notes = pickCSVValue(row, ["notes", "note"]);

    if (!status) {
      errors.push(`Row ${rowNumber}: invalid status`);
      return;
    }

    if (!policyNumber && !plate && !contact) {
      errors.push(`Row ${rowNumber}: missing policy number, plate, or contact`);
      return;
    }

    followups.push({
      row_number: rowNumber,
      policy_number: policyNumber,
      plate,
      contact,
      followup_status: status,
      followed_at: followedAt,
      notes,
    });
  });

  return { followups, errors };
};

const escapeCSVCell = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function FollowUps() {
  const { toast } = useToast();
  const [data, setData] = useState<PolicyFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  
  /** New state for Time Filtering */
  const [timeRange, setTimeRange] = useState<"all" | "today" | "week" | "month">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_FOLLOWUP, { credentials: "include" });
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

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const { followups, errors } = parseFollowupCSV(text);

      if (!followups.length) {
        throw new Error(errors[0] || "No valid follow-up rows found.");
      }

      const res = await fetch(API_FOLLOWUP_IMPORT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followups }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || "Failed to import follow-ups.");
      }

      toast({
        title: "Follow-ups imported",
        description: result.message || `Imported ${result.imported || followups.length} follow-up records.`,
      });

      const skippedCount = (result.skipped || 0) + errors.length;
      if (skippedCount > 0) {
        const serverReason = result.skippedRows?.[0]?.reason;
        const clientReason = errors[0];
        toast({
          title: `${skippedCount} row${skippedCount === 1 ? "" : "s"} skipped`,
          description: serverReason || clientReason || "Some rows could not be matched.",
          variant: "destructive",
          duration: 8000,
        });
      }

      fetchData();
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  /** Date Filtering Logic using followed_at */
  const checkDateInRange = (dateStr: string, range: string) => {
    if (range === "all") return true;
    if (!dateStr) return false;

    const recordDate = new Date(dateStr);
    const now = new Date();
    
    // Compare dates without time for "Today"
    const isSameDay = recordDate.toDateString() === now.toDateString();
    if (range === "today") return isSameDay;

    // Calculate day difference for Week/Month
    const diffTime = Math.abs(now.getTime() - recordDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (range === "week") return diffDays <= 7;
    if (range === "month") return diffDays <= 30;

    return true;
  };

  const { currentFiltered, grouped } = useMemo(() => {
    const currentFiltered = data.filter(p => {
      const term = search.toLowerCase();
      const matchesSearch =
        p.policy_number?.toLowerCase().includes(term) ||
        p.plate.toLowerCase().includes(term) ||
        p.owner.toLowerCase().includes(term);
      
      const matchesTime = checkDateInRange(p.followed_at, timeRange);
      
      return matchesSearch && matchesTime;
    });

    return {
      currentFiltered,
      grouped: {
        confirmed: currentFiltered.filter(p => p.followup_status === "confirmed"),
        pending: currentFiltered.filter(p => p.followup_status === "pending"),
        missed: currentFiltered.filter(p => p.followup_status === "missed"),
      }
    };
  }, [data, search, timeRange]);

  const exportFollowups = () => {
    if (!currentFiltered.length) {
      toast({ title: "No follow-ups to export", variant: "destructive" });
      return;
    }

    const headers = [
      "policy_number",
      "plate",
      "owner",
      "contact",
      "company",
      "expiryDate",
      "followup_status",
      "followed_at",
    ];
    const rows = currentFiltered.map((policy) => [
      policy.policy_number || "",
      policy.plate || "",
      policy.owner || "",
      policy.contact || "",
      policy.company || "",
      policy.expiryDate || "",
      policy.followup_status || "",
      policy.followed_at || "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSVCell).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `followups-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={handleImport}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="flex h-10 items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-4 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-60"
          >
            {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-xs font-black uppercase tracking-wider">Import</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={exportFollowups}
            className="flex h-10 items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-4 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <Download size={18} />
            <span className="text-xs font-black uppercase tracking-wider">Export CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
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
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col lg:flex-row justify-between gap-4 items-center">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <input
                   type="text"
                   placeholder="Search policy number, plate, or owner..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                 />
              </div>

              {/* Time Range Filter Group */}
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 self-stretch md:self-auto">
                {(["all", "today", "week", "month"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={cn(
                      "flex-1 md:flex-none px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      timeRange === r 
                        ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    {r === "all" ? "All Time" : r}
                  </button>
                ))}
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
                key={`${timeRange}-content`}
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
                    refreshData={fetchData} 
                    searchable={false} 
                  />
                </TabsContent>
                <TabsContent value="pending" className="mt-0 outline-none">
                  <PolicyTable 
                    data={grouped.pending} 
                    followUpEndpoint={API_FOLLOWUP}
                    refreshData={fetchData} 
                    searchable={false} 
                  />
                </TabsContent>
                <TabsContent value="missed" className="mt-0 outline-none">
                  <PolicyTable 
                    data={grouped.missed} 
                    followUpEndpoint={API_FOLLOWUP}
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
            key={count} // Triggers animation when count changes via filter
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
