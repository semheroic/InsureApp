import { useState, useMemo } from "react";
import { 
  Send, CheckCircle, Clock, XCircle, FileX, 
  Search, Hash, Phone, X, RotateCcw 
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
  sendReminderEndpoint,
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
      String(p.contact).toLowerCase().includes(term)
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
        toast({ title: "Updated", description: `Policy marked as ${status}` });
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
        toast({ title: "Status Cleared" });
        refreshData?.();
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative flex items-center max-w-sm group">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Search by plate or contact..."
            className="pl-9 pr-9 border-slate-200 focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X 
              className="absolute right-3 h-4 w-4 cursor-pointer text-slate-400 hover:text-red-500" 
              onClick={() => setSearchQuery("")} 
            />
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Plate</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Owner</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Company</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Expiry</TableHead>
              {showOverdue && <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Overdue</TableHead>}
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">Contact</TableHead>
              <TableHead className="text-right font-bold text-slate-600 uppercase text-[11px] tracking-wider">Actions</TableHead>
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
                      "transition-all duration-300",
                      // ROW MARKERS (Persistence logic)
                      status === "confirmed" && "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-900/10",
                      status === "pending" && "bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-900/10",
                      status === "missed" && "bg-red-50/80 hover:bg-red-100/80 dark:bg-red-900/10"
                    )}
                  >
                    <TableCell className="font-mono font-bold text-slate-900 uppercase">{policy.plate}</TableCell>
                    <TableCell className="font-medium text-slate-700">{policy.owner}</TableCell>
                    <TableCell><Badge variant="outline" className="font-semibold text-[10px]">{policy.company}</Badge></TableCell>
                    <TableCell className="text-slate-600">{policy.expiryDate}</TableCell>
                    {showOverdue && (
                      <TableCell>
                        <Badge className="bg-red-600 text-white border-none">{policy.days_overdue} days</Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-slate-600 font-mono text-xs">{policy.contact}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5 items-center">
                        
                        {/* CLEAR STATUS BUTTON */}
                        {status && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            onClick={() => handleClear(policy.id)}
                            title="Reset Status"
                          >
                            <RotateCcw size={14} />
                          </Button>
                        )}

                        {/* BLUE - CONFIRMED */}
                        <Button
                          size="icon"
                          variant={status === "confirmed" ? "default" : "outline"}
                          className={cn(
                            "h-8 w-8 transition-transform active:scale-95",
                            status === "confirmed" 
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md scale-105 border-transparent" 
                              : "text-blue-600 border-blue-200 hover:bg-blue-50"
                          )}
                          onClick={() => handleFollowUp(policy, "confirmed")}
                        >
                          <CheckCircle size={16} />
                        </Button>

                        {/* EMERALD - PENDING */}
                        <Button
                          size="icon"
                          variant={status === "pending" ? "default" : "outline"}
                          className={cn(
                            "h-8 w-8 transition-transform active:scale-95",
                            status === "pending" 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md scale-105 border-transparent" 
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          )}
                          onClick={() => handleFollowUp(policy, "pending")}
                        >
                          <Clock size={16} />
                        </Button>

                        {/* RED - MISSED */}
                        <Button
                          size="icon"
                          variant={status === "missed" ? "default" : "outline"}
                          className={cn(
                            "h-8 w-8 transition-transform active:scale-95",
                            status === "missed" 
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-md scale-105 border-transparent" 
                              : "text-red-600 border-red-200 hover:bg-red-50"
                          )}
                          onClick={() => handleFollowUp(policy, "missed")}
                        >
                          <XCircle size={16} />
                        </Button>

                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                        
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          onClick={() => {
                            toast({ title: "Reminder", description: `Reminder sent to ${policy.contact}` });
                          }}
                        >
                          <Send size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileX size={32} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">No records matching your search</p>
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