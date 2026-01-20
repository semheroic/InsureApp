import { useState, useMemo } from "react";
import { 
  Send, CheckCircle, Clock, XCircle, 
  Search, X, RotateCcw, Shield, Download, 
  Phone, Loader2, User, Smartphone, Copy, Check, Languages
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL;

interface ActionButtonProps {
  icon: any;
  active: boolean;
  isLoading?: boolean;
  color: "blue" | "emerald" | "rose";
  onClick: () => void;
}

const ActionButton = ({ icon: Icon, active, isLoading, color, onClick }: ActionButtonProps) => {
  const colorMap = {
    blue: active ? "bg-blue-600 text-white shadow-blue-200/50" : "text-blue-600 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 hover:text-white",
    emerald: active ? "bg-emerald-600 text-white shadow-emerald-200/50" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 hover:text-white",
    rose: active ? "bg-rose-600 text-white shadow-rose-200/50" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 disabled:opacity-50",
        active && "shadow-lg scale-105 ring-2 ring-white dark:ring-slate-950",
        colorMap[color]
      )}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Icon size={18} strokeWidth={2.5} />
      )}
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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  
  // Message Modal States
  const [messagePolicy, setMessagePolicy] = useState<any>(null);
  const [lang, setLang] = useState<"rw" | "en">("rw");
  const [editedMessage, setEditedMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredData = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return data;
    return data.filter((p: any) => 
      String(p.plate).toLowerCase().includes(term) || 
      String(p.contact).toLowerCase().includes(term) ||
      String(p.owner).toLowerCase().includes(term)
    );
  }, [data, searchQuery]);

  // Generate Dynamic Message
  const generateMessage = (policy: any, language: "rw" | "en") => {
    if (!policy) return "";
    const name = policy.owner || "Client";
    const plate = policy.plate || "";
    const days = policy.days_overdue || 0;
    
    // Determine Timeframe
    let timeframe = "soon"; 
    if (days === 0) timeframe = "today";
    else if (days < 0) timeframe = "expired";
    else if (days <= 7) timeframe = "week";
    else timeframe = "month";

    const messages = {
      rw: {
        today: `Muraho ${name}, Ubwishingizi bw’ikinyabiziga ${plate} burasohora uyu munsi. Niba mwifuza kubuvugurura, mutwoherere ubutumwa cyangwa mwigere ku biro byacu. Murakoze.`,
        week: `Muraho ${name}, Ubwishingizi bw’ikinyabiziga ${plate} buzasohora mu minsi ${days} isigaye. Niba mwifuza kubuvugurura natwe, mutwoherere nimero ya telefoni izakoreshwa mu kwishyura. Murakoze.`,
        month: `Muraho ${name}, Ubwishingizi bw’ikinyabiziga ${plate} buzasohora muri uku kwezi. Twifuje kubibutsa kare kugira ngo mutazatinda kubuvugurura. Murakoze.`,
        expired: `Muraho ${name}, Ubwishingizi bw’ikinyabiziga ${plate} bwarangiye hashize iminsi ${Math.abs(days)}. Mwibuke kubuvugurura vuba kugira ngo mwirinde ibihano. Murakoze.`
      },
      en: {
        today: `Hello ${name}, your insurance for ${plate} expires today. Please contact us to renew it immediately. Thank you.`,
        week: `Hello ${name}, your insurance for ${plate} will expire in ${days} days. Send us your phone number if you'd like to renew with us. Thank you.`,
        month: `Hello ${name}, this is a reminder that your insurance for ${plate} is due for renewal this month. Thank you.`,
        expired: `Hello ${name}, your insurance for ${plate} expired ${Math.abs(days)} days ago. Please renew it as soon as possible. Thank you.`
      }
    };

    return messages[language][timeframe as keyof typeof messages['en']];
  };

  const handleOpenMessage = (policy: any) => {
    setMessagePolicy(policy);
    setEditedMessage(generateMessage(policy, "rw"));
    setLang("rw");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFollowUp = async (policy: any, status: string) => {
    const actualPolicyId = policy.policy_id || policy.id;
    setLoadingId(`${policy.id}-${status}`);
    
    try {
      const res = await fetch(followUpEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          policy_id: actualPolicyId, 
          followup_status: status 
        }),
      });
      
      if (res.ok) {
        toast({ title: "Status Updated", description: `Policy ${policy.plate} is now ${status}` });
        refreshData?.();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update");
      }
    } catch (err: any) {
      toast({ title: "Error", variant: "destructive", description: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const handleClear = async (policy: any) => {
    const actualPolicyId = policy.policy_id || policy.id;
    setLoadingId(`${policy.id}-clear`);
    
    try {
      const res = await fetch(`${API_URL}/api/followup/${actualPolicyId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast({ title: "Status Reset" });
        refreshData?.();
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoadingId(null);
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
      {/* Contact Info Dialog */}
      <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[24px] border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold tracking-tight">Contact Information</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <User size={18} className="text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Owner</span>
                <span className="text-[15px] font-bold text-slate-900 dark:text-white">{selectedPolicy?.owner}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10">
              <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <Smartphone size={18} className="text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">Phone Number</span>
                <span className="text-[18px] font-mono font-bold text-blue-700 dark:text-blue-400">{selectedPolicy?.contact}</span>
              </div>
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase text-[12px] tracking-widest hover:opacity-90"
              onClick={() => window.location.href = `tel:${selectedPolicy?.contact}`}
            >
              Start Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Send Message Dialog */}
      <Dialog open={!!messagePolicy} onOpenChange={() => setMessagePolicy(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-500 flex items-center justify-center">
                  <Send size={20} className="text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Draft Message</DialogTitle>
                  <p className="text-slate-400 text-xs">Policy: {messagePolicy?.plate}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-700 text-blue-400 bg-blue-500/10 px-3 py-1">
                Professional Mode
              </Badge>
            </div>

            <Tabs value={lang} onValueChange={(v: any) => {
              setLang(v);
              setEditedMessage(generateMessage(messagePolicy, v));
            }} className="w-full">
              <TabsList className="bg-slate-800/50 border border-slate-700 p-1 rounded-xl w-full">
                <TabsTrigger value="rw" className="flex-1 rounded-lg gap-2 data-[state=active]:bg-blue-600">
                  <Languages size={14} /> Kinyarwanda
                </TabsTrigger>
                <TabsTrigger value="en" className="flex-1 rounded-lg gap-2 data-[state=active]:bg-blue-600">
                   English
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-6 bg-white dark:bg-slate-950 space-y-6">
            <div className="relative group">
              <Textarea
                className="min-h-[180px] rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-[14px] leading-relaxed resize-none focus-visible:ring-blue-500 transition-all"
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                placeholder="Write your message here..."
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                 <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditedMessage(generateMessage(messagePolicy, lang))}
                  className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                >
                  <RotateCcw size={12} className="mr-1" /> Reset
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-bold uppercase text-[11px] tracking-[0.1em] gap-2"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button
                onClick={() => {
                  handleCopy();
                  toast({ title: "Ready to Paste" });
                  setMessagePolicy(null);
                }}
                className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[11px] tracking-[0.1em] gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header Controls */}
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

      {/* Table Section */}
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
                const isClearing = loadingId === `${policy.id}-clear`;

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
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedPolicy(policy)}
                          className="h-9 px-3 rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                        >
                          <Phone size={14} />
                          Call Now
                        </Button>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {status && (
                          <button
                            onClick={() => handleClear(policy)}
                            disabled={isClearing}
                            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-30"
                          >
                            {isClearing ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <RotateCcw size={16} strokeWidth={2.5} />
                            )}
                          </button>
                        )}
                        <ActionButton 
                          icon={CheckCircle} 
                          active={status === "confirmed"} 
                          isLoading={loadingId === `${policy.id}-confirmed`}
                          color="blue" 
                          onClick={() => handleFollowUp(policy, "confirmed")} 
                        />
                        <ActionButton 
                          icon={Clock} 
                          active={status === "pending"} 
                          isLoading={loadingId === `${policy.id}-pending`}
                          color="emerald" 
                          onClick={() => handleFollowUp(policy, "pending")} 
                        />
                        <ActionButton 
                          icon={XCircle} 
                          active={status === "missed"} 
                          isLoading={loadingId === `${policy.id}-missed`}
                          color="rose" 
                          onClick={() => handleFollowUp(policy, "missed")} 
                        />
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                        
                        <Button 
                          size="icon" 
                          className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm"
                          onClick={() => handleOpenMessage(policy)}
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