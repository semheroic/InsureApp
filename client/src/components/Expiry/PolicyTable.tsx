import { useState, useMemo } from "react";
import { 
  Send, CheckCircle, Clock, XCircle, FileX, 
  Search, X, RotateCcw, User, Shield, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
const API_URL = import.meta.env.VITE_API_URL;
interface ActionButtonProps {
  icon: any;
  active: boolean;
  color: "blue" | "emerald" | "rose";
  onClick: () => void;
}

const ActionButton = ({ icon: Icon, active, color, onClick }: ActionButtonProps) => {
  const colorMap = {
    blue: active ? "bg-blue-600 text-white shadow-blue-200/50" : "text-blue-600 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 hover:text-white",
    emerald: active ? "bg-emerald-600 text-white shadow-emerald-200/50" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 hover:text-white",
    rose: active ? "bg-rose-600 text-white shadow-rose-200/50" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90",
        active && "shadow-lg scale-105 ring-2 ring-white dark:ring-slate-950",
        colorMap[color]
      )}
    >
      <Icon size={18} strokeWidth={2.5} />
    </button>
  );
};

export const PolicyTable = ({
  data,
  followUpEndpoint,
  refreshData,
  showOverdue,
  searchable = true,
}: any) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return data;
    return data.filter((p: any) => 
      String(p.plate).toLowerCase().includes(term) || 
      String(p.contact).toLowerCase().includes(term) ||
      String(p.owner).toLowerCase().includes(term)
    );
  }, [data, searchQuery]);

  const handleFollowUp = async (policy: any, status: string) => {
    try {
      const res = await fetch(followUpEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_id: policy.id, followup_status: status }),
      });
      if (res.ok) {
        toast({ title: "Status Updated", description: `Policy ${policy.plate} is now ${status}` });
        refreshData?.();
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: "Save failed" });
    }
  };

  const handleClear = async (policyId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/followup/${policyId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast({ title: "Status Reset" });
        refreshData?.();
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Plate", "Owner", "Contact", "Company", "Expiry Date", "Status"];
    const rows = filteredData.map((p: any) => [
      p.plate, p.owner, p.contact, p.company, p.expiryDate, p.followup_status || "Pending"
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex items-center flex-1 max-w-md group">
            <Search className="absolute left-4 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors z-10" />
            <Input
              placeholder="Search records..."
              className="pl-11 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-medium tracking-tight shadow-sm focus-visible:ring-1 focus-visible:ring-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        )}

        <Button 
          onClick={exportToCSV}
          variant="outline" 
          className="h-11 px-5 rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <Download size={14} strokeWidth={2.5} />
          Export CSV
        </Button>
      </div>

      <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 pl-8">Plate</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500">Holder</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500">Provider</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">Expiry</TableHead>
              {showOverdue && <TableHead className="py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">Lapsed</TableHead>}
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((policy: any) => {
                const status = policy.followup_status;
                return (
                  <TableRow 
                    key={policy.id} 
                    
                    className={cn(
                      "group transition-all duration-300 border-b border-slate-100 dark:border-slate-900 last:border-0",
                      status === "confirmed" && "bg-blue-500/[0.07] hover:bg-blue-500/[0.12] dark:bg-blue-500/[0.12]",
                      status === "pending" && "bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12] dark:bg-emerald-500/[0.12]",
                      status === "missed" && "bg-rose-500/[0.07] hover:bg-rose-500/[0.12] dark:bg-rose-500/[0.12]"
                    )}
                  >
                    <TableCell className="pl-8 py-4">
                      <span className="text-[13px] font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {policy.plate}
                      </span>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[14px] tracking-tight text-slate-900 dark:text-slate-100">
                          {policy.owner}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 tracking-normal">{policy.contact}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={12} className="text-slate-400" />
                        <span className="font-semibold text-[12px] tracking-tight text-slate-700 dark:text-slate-300">
                          {policy.company}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center py-4">
                      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                        {policy.expiryDate}
                      </span>
                    </TableCell>

                    {showOverdue && (
                      <TableCell className="text-center py-4">
                        <span className="text-[14px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {policy.days_overdue}d
                        </span>
                      </TableCell>
                    )}

                    <TableCell className="pr-8 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        {status && (
                          <button
                            onClick={() => handleClear(policy.id)}
                            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <RotateCcw size={16} strokeWidth={2.5} />
                          </button>
                        )}
                        <ActionButton icon={CheckCircle} active={status === "confirmed"} color="blue" onClick={() => handleFollowUp(policy, "confirmed")} />
                        <ActionButton icon={Clock} active={status === "pending"} color="emerald" onClick={() => handleFollowUp(policy, "pending")} />
                        <ActionButton icon={XCircle} active={status === "missed"} color="rose" onClick={() => handleFollowUp(policy, "missed")} />
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                        
                        <Button 
                          size="icon" 
                          className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm"
                          onClick={() => toast({ title: "Reminder Sent" })}
                        >
                          <Send size={15} strokeWidth={2.5} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-[13px] font-medium text-slate-500">
                  No policy records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};