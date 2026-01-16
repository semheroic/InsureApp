import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Edit, Trash2, Eye, Calendar as CalendarIcon } from "lucide-react";
import { Car, User, Building2, CalendarDays, Phone, ClipboardPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { 
  format, 
  isSameDay, 
  isWithinInterval, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  parseISO, 
  startOfDay, 
  endOfDay 
} from "date-fns";
import { DateRange } from "react-day-picker";
 const { toast } = useToast(); // 
axios.defaults.withCredentials = true;

type Policy = {
  id: number;
  plate: string;
  owner: string;
  company: string;
  start_date: string;
  expiry_date: string;
  contact: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Renewed";
  days_remaining: number;
};

const BASE = import.meta.env.VITE_API_URL;
const API_URL = `${BASE}/policies`;
const AUTH_URL = `${BASE}/auth/me`;

/* ---------------- HELPERS ---------------- */
const daysBetween = (date: string) => {
  const today = new Date();
  const target = new Date(`${date}T23:59:59`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    Active: "bg-green-100 text-green-700 border-green-200",
    "Expiring Soon": "bg-yellow-100 text-yellow-700 border-yellow-200",
    Expired: "bg-red-100 text-red-700 border-red-200",
    Renewed: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return variants[status] || "";
};

const Policies = () => {
  const { toast } = useToast();

  /* ---------------- ROLE STATE ---------------- */
  const [userRole, setUserRole] = useState<string | null>(null);

  /* ---------------- COMPONENT STATES ---------------- */
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    plate: "",
    owner: "",
    company: "SORAS",
    startDate: "",
    expiryDate: "",
    contact: "",
  });

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const roleClean = userRole?.toLowerCase();
  const isAdmin = roleClean === "admin";
  const isManager = roleClean === "manager";
  const canModify = isAdmin || isManager;

  /* ---------------- AUTH & FETCH ---------------- */
  const checkAuthAndFetch = async () => {
    setLoading(true);
    try {
      const authRes = await axios.get(AUTH_URL);
      setUserRole(authRes.data.role);

      const { data } = await axios.get(API_URL);
      setPolicies(
        data.map((p: any) => ({
          ...p,
          days_remaining: daysBetween(p.expiry_date),
          status: p.status,
        }))
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.status === 401 ? "Please login again" : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  /* ---------------- DYNAMIC COUNTS CALCULATION ---------------- */
  const counts = useMemo(() => {
    const today = new Date();
    return {
      all: policies.length,
      active: policies.filter(p => p.status === "Active").length,
      expiring: policies.filter(p => p.status === "Expiring Soon").length,
      expired: policies.filter(p => p.status === "Expired").length,
      renewed: policies.filter(p => p.status === "Renewed").length,
      soras: policies.filter(p => p.company.toLowerCase() === "soras").length,
      sonarwa: policies.filter(p => p.company.toLowerCase() === "sonarwa").length,
      prime: policies.filter(p => p.company.toLowerCase() === "prime").length,
      radiant: policies.filter(p => p.company.toLowerCase() === "radiant").length,
      today: policies.filter(p => isSameDay(parseISO(p.start_date), today)).length,
      weekly: policies.filter(p => isWithinInterval(parseISO(p.start_date), { start: startOfWeek(today), end: endOfWeek(today) })).length,
      monthly: policies.filter(p => isWithinInterval(parseISO(p.start_date), { start: startOfMonth(today), end: endOfMonth(today) })).length,
    };
  }, [policies]);

  /* ---------------- SMART FILTERS ---------------- */
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const pDate = parseISO(p.start_date);
      const today = new Date();
      const searchLower = searchQuery.toLowerCase().trim();

      let matchesSearch = true;
      if (dateRange?.from && dateRange?.to) {
        matchesSearch = isWithinInterval(pDate, { 
            start: startOfDay(dateRange.from), 
            end: endOfDay(dateRange.to) 
        });
      } else if (searchQuery) {
        matchesSearch =
          p.plate.toLowerCase().includes(searchLower) ||
          p.owner.toLowerCase().includes(searchLower) ||
          p.company.toLowerCase().includes(searchLower);
      }

      const matchesStatus =
        statusFilter === "all" ||
        p.status.toLowerCase().replace(/\s+/g, "") === statusFilter;

      const matchesCompany =
        companyFilter === "all" || p.company.toLowerCase() === companyFilter;

      let matchesQuickDate = true;
      if (dateFilter === "today") {
        matchesQuickDate = isSameDay(pDate, today);
      } else if (dateFilter === "weekly") {
        matchesQuickDate = isWithinInterval(pDate, {
          start: startOfWeek(today),
          end: endOfWeek(today),
        });
      } else if (dateFilter === "monthly") {
        matchesQuickDate = isWithinInterval(pDate, {
          start: startOfMonth(today),
          end: endOfMonth(today),
        });
      }

      return matchesSearch && matchesStatus && matchesCompany && matchesQuickDate;
    });
  }, [policies, searchQuery, statusFilter, companyFilter, dateFilter, dateRange]);

  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(start, start + itemsPerPage);
  }, [filteredPolicies, currentPage]);

  const validateRWPhone = (phone: string) => {
    const regex = /^(\+?250|0)?(7[2389])[0-9]{7}$/;
    return regex.test(phone);
  };

  /* ---------------- ACTIONS ---------------- */
  const handleSendMessage = async () => {
    setIsSending(true);
    try {
      const payload = {
        template: bulkMessage,
        recipients: filteredPolicies.map(p => ({
          contact: p.contact,
          owner: p.owner,
          plate: p.plate,
          days: p.days_remaining
        }))
      };
      const { data } = await axios.post(`${BASE}/policies/broadcast`, payload);
      toast({ title: "Broadcast Complete", description: `Sent ${data.summary.successful} messages.` });
      setIsMessageDialogOpen(false);
      setBulkMessage("");
    } catch {
      toast({ title: "Error", description: "Failed to send broadcast", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleAdd = async () => {
    if (!validateRWPhone(formData.contact)) {
      return toast({ title: "Invalid Phone", description: "Use Rwandan format (078...)", variant: "destructive" });
    }
    try {
      await axios.post(API_URL, {
        plate: formData.plate,
        owner: formData.owner,
        company: formData.company,
        start_date: formData.startDate,
        expiry_date: formData.expiryDate,
        contact: formData.contact,
      });
      checkAuthAndFetch();
      setIsAddDialogOpen(false);
      toast({ title: "Added", description: "Policy created" });
      setFormData({ plate: "", owner: "", company: "SORAS", startDate: "", expiryDate: "", contact: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "Failed to add", variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedPolicy) return;
    try {
      await axios.put(`${API_URL}/${selectedPolicy.id}`, {
        plate: formData.plate,
        owner: formData.owner,
        company: formData.company,
        start_date: formData.startDate,
        expiry_date: formData.expiryDate,
        contact: formData.contact,
      });
      checkAuthAndFetch();
      setIsEditDialogOpen(false);
      toast({ title: "Updated", description: "Policy saved" });
    } catch {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;
    try {
      await axios.delete(`${API_URL}/${selectedPolicy.id}`);
      checkAuthAndFetch();
      setIsDeleteDialogOpen(false);
      toast({ title: "Deleted", description: "Policy removed", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };
const HEADER_ALIASES: Record<string, string[]> = {
  plate: ["plate", "plate number", "plate_no", "plate_no.", "plate#"],
  owner: ["owner", "owner name", "name", "insured"],
  company: ["company", "insurance company", "provider"],
  start_date: ["start date", "start_date", "start", "startdate", "start-date"],
  expiry_date: ["expiry date", "expiry_date", "expiry", "expirydate", "expiry-date", "end date"],
  contact: ["contact", "contact number", "phone", "phone number", "telephone", "tel"],
};

const clean = (s: string | undefined) =>
  (s || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const mapHeaders = (parsedFields: string[] = []) => {
  const map: Record<string, string | null> = {
    plate: null,
    owner: null,
    company: null,
    start_date: null,
    expiry_date: null,
    contact: null,
  };

  const cleanedToOriginal: Record<string, string> = {};
  parsedFields.forEach((f) => (cleanedToOriginal[clean(f)] = f));

  Object.entries(HEADER_ALIASES).forEach(([canonical, aliases]) => {
    for (const alias of aliases) {
      const target = cleanedToOriginal[clean(alias)];
      if (target) {
        map[canonical] = target;
        break;
      }
    }
  });

  return map;
};

const parseDateToISO = (value: string | undefined): string | null => {
  if (!value) return null;
  const v = value.trim();
  // ISO-like first
  const iso = new Date(v);
  if (!isNaN(iso.getTime())) {
    return iso.toISOString().split("T")[0];
  }
  // dd/mm/yyyy or d/m/yyyy
  const dmy = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [_, d, m, y] = dmy;
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  // yyyy/mm/dd or yyyy-mm-dd handled earlier, so fallback null
  return null;
};

const normalizeContact = (value: string | undefined) => {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // If starts with country code like 250... and number length > 9, strip country code and prefix 0
  if (digits.startsWith("250") && digits.length >= 11) {
    const local = digits.slice(digits.length - 9); // last 9 digits
    return "0" + local;
  }

  // If 9 digits (likely missing leading 0), add leading 0
  if (digits.length === 9) return "0" + digits;

  // If already has leading 0 and length 10, keep
  if (digits.length === 10 && digits.startsWith("0")) return digits;

  // If starts with country code with + (handled by removing non-digits) or other lengths, try to normalize to last 9 digits
  if (digits.length > 10) {
    const local = digits.slice(-9);
    return "0" + local;
  }

  // fallback: return digits as-is
  return digits;
};

// validate a normalized policy row; returns { valid, error }
const validatePolicyRow = (r: any, rowNum: number) => {
  const errors: string[] = [];

  if (!r.plate || r.plate.trim() === "") errors.push("missing plate");
  if (!r.owner || r.owner.trim() === "") errors.push("missing owner");
  if (!r.company || r.company.trim() === "") errors.push("missing company");

  if (!r.start_date) errors.push("invalid start date");
  if (!r.expiry_date) errors.push("invalid expiry date");
  if (!r.contact || r.contact.trim() === "") errors.push("missing contact");

  return {
    valid: errors.length === 0,
    error: errors.length ? `Row ${rowNum}: ${errors.join(", ")}` : null,
  };
};

// --- Updated handleImport using PapaParse ---
const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    complete: async (results) => {
      try {
        const parsedRows = results.data as Record<string, any>[];
        const parsedFields = results.meta.fields || [];
        if (!parsedFields || parsedFields.length === 0) {
          toast({
            title: "Import Failed",
            description: "No headers found in CSV",
            variant: "destructive",
          });
          return;
        }

        const headerMap = mapHeaders(parsedFields);

        // detect missing required header columns
        const missingHeaders = Object.entries(headerMap)
          .filter(([, v]) => !v)
          .map(([k]) => k);
        if (missingHeaders.length) {
          // Allow user to proceed if they just want to rely on some defaults? For now, show helpful message.
          toast({
            title: "Invalid CSV structure",
            description: `Missing headers: ${missingHeaders.join(", ")}. Accepted header names: Plate, Owner, Company, Start Date, Expiry Date, Contact.`,
            variant: "destructive",
          });
          return;
        }

        const validPolicies: any[] = [];
        const errors: string[] = [];

        parsedRows.forEach((row, idx) => {
          const rowNum = idx + 2; // account for header row
          // Build canonical row using headerMap:
          const plate = (row[headerMap.plate!] || "").toString().trim();
          const owner = (row[headerMap.owner!] || "").toString().trim();
          const company = (row[headerMap.company!] || "").toString().trim();
          const startRaw = (row[headerMap.start_date!] || "").toString().trim();
          const expiryRaw = (row[headerMap.expiry_date!] || "").toString().trim();
          const contactRaw = (row[headerMap.contact!] || "").toString().trim();

          const start_date = parseDateToISO(startRaw);
          const expiry_date = parseDateToISO(expiryRaw);
          const contact = normalizeContact(contactRaw);

          const normalized = {
            plate,
            owner,
            company,
            start_date,
            expiry_date,
            contact,
          };

          const { valid, error } = validatePolicyRow(normalized, rowNum);
          if (valid) {
            validPolicies.push(normalized);
          } else {
            errors.push(error!);
          }
        });

        if (validPolicies.length === 0) {
          toast({
            title: "Import Failed",
            description: `No valid rows to import. ${errors.length} errors found.`,
            variant: "destructive",
          });
          // optionally console.log(errors) for debugging
          console.warn("CSV import errors:", errors);
          return;
        }

        if (errors.length > 0) {
          // Ask the user whether to continue importing valid rows
          const proceed = window.confirm(
            `Found ${errors.length} invalid row(s). ${validPolicies.length} valid row(s) will be imported. Continue? (OK = import valid rows, Cancel = abort)`
          );
          if (!proceed) {
            // show a summary and stop
            toast({
              title: "Import Aborted",
              description: `${errors.length} errors found. Import cancelled.`,
              variant: "destructive",
            });
            console.warn("CSV import errors:", errors);
            return;
          }
        }

        // POST valid policies to server
        await axios.post(
          `${API_URL}/import`,
          { policies: validPolicies },
          { headers: { "Content-Type": "application/json" } }
        );

        toast({
          title: "Import Successful",
          description: `${validPolicies.length} policies imported${errors.length ? ` — ${errors.length} skipped` : ""}.`,
        });

        // show errors in console for admin debugging; you can enhance this to show modal with downloadable error CSV
        if (errors.length) {
          console.warn("CSV import errors (skipped rows):", errors);
        }

        checkAuthAndFetch();
      } catch (err) {
        console.error("Import error", err);
        toast({
          title: "Import Failed",
          description: "An unexpected error occurred while importing.",
          variant: "destructive",
        });
      }
    },
    error: (err) => {
      console.error("PapaParse error", err);
      toast({
        title: "Import Failed",
        description: "Could not parse CSV file.",
        variant: "destructive",
      });
    },
  });
};
  const exportToCSV = () => {
    const headers = ["Plate", "Owner", "Company", "Start Date", "Expiry Date", "Days Remaining", "Status", "Contact"];
    const rows = filteredPolicies.map((p) => [p.plate, p.owner, p.company, p.start_date, p.expiry_date, p.days_remaining, p.status, p.contact]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policies_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) return <p className="text-center py-20 text-muted-foreground animate-pulse">Synchronizing policies...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Insurance Policies</h1>
          <p className="text-muted-foreground">Manage and track vehicle insurance coverage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button
  variant="outline"
  className="gap-2"
  onClick={() => document.getElementById("import-file")?.click()}
>
  <Download className="w-4 h-4 rotate-180" />
  Import CSV
</Button>

<input
  id="import-file"
  type="file"
  accept=".csv"
  hidden
  onChange={handleImport}
/>

          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => setIsMessageDialogOpen(true)}>
              <Search className="w-4 h-4" /> Broadcast SMS
            </Button>
          )}
          {canModify && (
            <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Add Policy
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search plate or owner..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Filter by Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
                <CalendarIcon className="w-4 h-4 mr-2 opacity-50" />
                <SelectValue placeholder="Registration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time ({counts.all})</SelectItem>
              <SelectItem value="today">Today ({counts.today})</SelectItem>
              <SelectItem value="weekly">Latest Week ({counts.weekly})</SelectItem>
              <SelectItem value="monthly">Latest Month ({counts.monthly})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status ({counts.all})</SelectItem>
              <SelectItem value="active">Active ({counts.active})</SelectItem>
              <SelectItem value="expiringsoon">Expiring Soon ({counts.expiring})</SelectItem>
              <SelectItem value="expired">Expired ({counts.expired})</SelectItem>
              <SelectItem value="renewed">Renewed ({counts.renewed})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies ({counts.all})</SelectItem>
              <SelectItem value="soras">SORAS ({counts.soras})</SelectItem>
              <SelectItem value="sonarwa">SONARWA ({counts.sonarwa})</SelectItem>
              <SelectItem value="prime">PRIME ({counts.prime})</SelectItem>
              <SelectItem value="radiant">RADIANT ({counts.radiant})</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" title="Reset Filters" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setCompanyFilter("all");
              setDateFilter("all");
              setDateRange({ from: undefined, to: undefined });
          }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records found matching filters</TableCell>
                </TableRow>
              ) : paginatedPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.plate}</TableCell>
                  <TableCell>{policy.owner}</TableCell>
                  <TableCell>{policy.company}</TableCell>
                  <TableCell>{policy.start_date}</TableCell>
                  <TableCell>{policy.expiry_date}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(policy.status)}>{policy.status}</Badge>
                  </TableCell>
                  <TableCell>{policy.days_remaining > 0 ? `${policy.days_remaining} day${policy.days_remaining > 1 ? "s" : ""}` : "Expired"}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPolicy(policy); setIsViewDialogOpen(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {canModify && (
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedPolicy(policy);
                        setFormData({
                          plate: policy.plate,
                          owner: policy.owner,
                          company: policy.company,
                          startDate: policy.start_date,
                          expiryDate: policy.expiry_date,
                          contact: policy.contact,
                        });
                        setIsEditDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedPolicy(policy); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* VIEW DIALOG - RESTORED FULL FIELDS */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Plate Number</Label>
                  <p className="font-bold text-lg">{selectedPolicy.plate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Owner</Label>
                  <p className="font-medium">{selectedPolicy.owner}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Company</Label>
                  <p className="font-medium">{selectedPolicy.company}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Contact</Label>
                  <p className="font-medium">{selectedPolicy.contact}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Start Date</Label>
                  <p className="font-medium">{selectedPolicy.start_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Expiry Date</Label>
                  <p className="font-medium">{selectedPolicy.expiry_date}</p>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <Label className="text-muted-foreground text-xs uppercase">Status Overview</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={getStatusBadge(selectedPolicy.status)}>{selectedPolicy.status}</Badge>
                    <span className="text-sm font-semibold">
                       {selectedPolicy.days_remaining > 0 ? `${selectedPolicy.days_remaining} days remaining` : "Policy Expired"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD DIALOG - RESTORED FULL FIELDS */}
      

{/* USER-FRIENDLY REDESIGNED ADD POLICY DIALOG */}
<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
  <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
    {/* Header with a Professional "Insurance Blue" Theme */}
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
            <ClipboardPlus className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">New Insurance Policy</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Register a vehicle insurance coverage details
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
    </div>

    <div className="p-6 space-y-6 bg-background">
      {/* SECTION 1: Vehicle & Owner */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          Vehicle Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="plate" className="text-xs font-semibold text-slate-700">Plate Number</Label>
            <div className="relative">
              <Input 
                id="plate" 
                placeholder="RAE 123A" 
                value={formData.plate} 
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })} 
                className="pl-9 bg-slate-50/50 border-slate-200 focus:ring-blue-500 uppercase"
              />
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner" className="text-xs font-semibold text-slate-700">Owner Name</Label>
            <div className="relative">
              <Input 
                id="owner" 
                placeholder="Full Name"
                value={formData.owner} 
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })} 
                className="pl-9 bg-slate-50/50 border-slate-200"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Insurance Provider */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          Coverage Details
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Insurance Company</Label>
            <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
              <SelectTrigger className="bg-slate-50/50 border-slate-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Select..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SORAS">SORAS</SelectItem>
                <SelectItem value="SONARWA">SONARWA</SelectItem>
                <SelectItem value="PRIME">PRIME</SelectItem>
                <SelectItem value="RADIANT">RADIANT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Contact Number</Label>
            <div className="relative">
              <Input 
                placeholder="078..." 
                value={formData.contact} 
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
                className="pl-9 bg-slate-50/50 border-slate-200"
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* SECTION 3: Timeline */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-blue-700 uppercase">Effective Date</Label>
            <div className="relative">
              <Input 
                type="date" 
                value={formData.startDate} 
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                className="bg-white border-blue-200 h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-blue-700 uppercase">Expiration Date</Label>
            <div className="relative">
              <Input 
                type="date" 
                value={formData.expiryDate} 
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} 
                className="bg-white border-blue-200 h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer with emphasis on the Save Action */}
    <DialogFooter className="p-6 pt-0 bg-background flex flex-row gap-3">
      <Button 
        variant="ghost" 
        onClick={() => setIsAddDialogOpen(false)}
        className="flex-1 font-semibold text-slate-500 hover:bg-slate-100"
      >
        Cancel
      </Button>
      <Button 
        onClick={handleAdd}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
      >
        Save Policy
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      {/* EDIT DIALOG - RESTORED FULL FIELDS */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Plate Number</Label>
                <Input value={formData.plate} onChange={(e) => setFormData({ ...formData, plate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Owner</Label>
                <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Company</Label>
                <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SORAS">SORAS</SelectItem>
                    <SelectItem value="SONARWA">SONARWA</SelectItem>
                    <SelectItem value="PRIME">PRIME</SelectItem>
                    <SelectItem value="RADIANT">RADIANT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Contact</Label>
                <Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent className="max-w-[400px]">
    <AlertDialogHeader className="flex flex-col items-center text-center">
      {/* Warning Icon Circle */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
        <Trash2 className="h-6 w-6 text-red-600" />
      </div>
      
      <AlertDialogTitle className="text-xl font-bold text-slate-900">
        Confirm Deletion
      </AlertDialogTitle>
      
      <AlertDialogDescription className="text-slate-500 mt-2">
        This action cannot be undone. You are about to permanently remove the policy for 
        <span className="block mt-1 font-bold text-slate-900">
          Plate: {selectedPolicy?.plate}
        </span>
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter className="mt-6 flex gap-2 sm:justify-center">
      <AlertDialogCancel className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50">
        No, Keep it
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete} 
        className="flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-sm"
      >
        Yes, Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
      {/* BROADCAST DIALOG */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Broadcast SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-2 rounded text-xs font-mono text-primary">
              Use tags: {'{owner}'}, {'{plate}'}, {'{days}'}
            </div>
            <textarea
              className="w-full min-h-[150px] rounded border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter message..."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage} disabled={isSending || !bulkMessage.trim()}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Policies;
