import { useState, useMemo } from "react";
import { 
  Send, CheckCircle, Clock, XCircle, FileX, 
  Search, X, RotateCcw, User, Shield, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      const res = await fetch(`http://localhost:5000/api/followup/${policyId}`, {
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
      p.plate,
      p.owner,
      p.contact,
      p.company,
      p.expiryDate,
      p.followup_status || "Pending"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `policy_report_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Complete", description: "Your CSV file is ready." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex items-center flex-1 max-w-md group">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search records (Plate, Owner, or Contact)..."
              className="pl-11 h-12 bg-card border-muted-foreground/20 rounded-2xl shadow-sm focus-visible:ring-primary focus-visible:border-primary text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute right-4 p-1 hover:bg-muted rounded-full transition-colors"
                onClick={() => setSearchQuery("")} 
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        <Button 
          onClick={exportToCSV}
          variant="outline" 
          className="h-12 px-6 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <div className="rounded-[24px] border border-muted/40 bg-card shadow-xl overflow-hidden backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-muted/50 hover:bg-muted/30">
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pl-8">Vehicle Plate</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Policy Holder</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Provider</TableHead>
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">Expiry</TableHead>
              {showOverdue && <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">Status</TableHead>}
              <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right pr-8">Actions</TableHead>
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
                      "group transition-all duration-200 border-b border-muted/20",
                      status === "confirmed" && "bg-blue-500/5 hover:bg-blue-500/10",
                      status === "pending" && "bg-emerald-500/5 hover:bg-emerald-500/10",
                      status === "missed" && "bg-rose-500/5 hover:bg-rose-500/10"
                    )}
                  >
                    <TableCell className="pl-8 py-5">
                      <span className="text-xl font-black tracking-tighter text-foreground font-mono bg-muted/40 px-3 py-1 rounded-lg border border-muted-foreground/10">
                        {policy.plate}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <User size={14} className="text-muted-foreground" />
                          {policy.owner}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">{policy.contact}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-primary/60" />
                        <span className="font-bold text-xs uppercase tracking-wider">{policy.company}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-muted-foreground">{policy.expiryDate}</span>
                    </TableCell>

                    {showOverdue && (
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-rose-600 tracking-tighter leading-none">
                            {policy.days_overdue}
                          </span>
                          <span className="text-[9px] font-black uppercase text-rose-600/60 mt-1">Days Overdue</span>
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="pr-8">
                      <div className="flex justify-end gap-2 items-center">
                        {status && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                            onClick={() => handleClear(policy.id)}
                            title="Reset"
                          >
                            <RotateCcw size={16} />
                          </Button>
                        )}

                        <ActionButton 
                          icon={CheckCircle} 
                          active={status === "confirmed"} 
                          color="blue" 
                          onClick={() => handleFollowUp(policy, "confirmed")} 
                        />
                        <ActionButton 
                          icon={Clock} 
                          active={status === "pending"} 
                          color="emerald" 
                          onClick={() => handleFollowUp(policy, "pending")} 
                        />
                        <ActionButton 
                          icon={XCircle} 
                          active={status === "missed"} 
                          color="rose" 
                          onClick={() => handleFollowUp(policy, "missed")} 
                        />

                        <div className="w-[1px] h-6 bg-muted mx-1" />
                        
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="h-9 w-9 rounded-xl shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
                          onClick={() => toast({ title: "Reminder Sent", description: `Notified ${policy.contact}` })}
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center opacity-40">
                    <FileX size={48} className="mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">No matching records</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, active, color, onClick }: any) => {
  const colorMap: any = {
    blue: active ? "bg-blue-600 text-white shadow-blue-200" : "text-blue-600 bg-blue-500/10 hover:bg-blue-500/20",
    emerald: active ? "bg-emerald-600 text-white shadow-emerald-200" : "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20",
    rose: active ? "bg-rose-600 text-white shadow-rose-200" : "text-rose-600 bg-rose-500/10 hover:bg-rose-500/20",
  };

  return (
    <Button
      size="icon"
      className={cn(
        "h-9 w-9 rounded-xl transition-all duration-300 active:scale-90 border-none",
        active && "shadow-lg scale-110 ring-2 ring-background",
        colorMap[color]
      )}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={2.5} />
    </Button>
  );
};