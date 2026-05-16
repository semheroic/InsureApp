import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useActivityScope } from "@/contexts/ActivityScopeContext";
import { useLocation, useParams } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  AlertTriangle,
  RefreshCw,
  X,
  ShieldAlert,
  Database,
  ListX,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

axios.defaults.withCredentials = true;

const BASE = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const classifyReason = (reason = "") => {
  const r = reason.toLowerCase();
  if (r.includes("missing"))                               return "missing";
  if (r.includes("belongs to another user"))               return "permission";
  if (r.includes("already exists") || r.includes("duplicate")) return "duplicate";
  if (r.includes("database error"))                        return "db";
  return "other";
};

const REASON_META = {
  missing:    { label: "Missing fields",  className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  duplicate:  { label: "Duplicate",       className: "bg-red-100 text-red-700 border-red-200" },
  permission: { label: "No permission",   className: "bg-blue-100 text-blue-700 border-blue-200" },
  db:         { label: "DB error",        className: "bg-purple-100 text-purple-700 border-purple-200" },
  other:      { label: "Other",           className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const FILTER_TABS = [
  { key: "all",        label: "All",            Icon: ListX },
  { key: "missing",    label: "Missing fields", Icon: AlertTriangle },
  { key: "duplicate",  label: "Duplicate",      Icon: FileWarning },
  { key: "permission", label: "No permission",  Icon: ShieldAlert },
  { key: "db",         label: "DB error",       Icon: Database },
];

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy, HH:mm"); }
  catch { return d; }
};

/* ─────────────────────────────────────────────
   STAT CARD  (matches Policies dashboard cards)
───────────────────────────────────────────── */
const StatCard = ({ label, value, colorClass, Icon }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold leading-tight">{value}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const FailedImportsTable = ({ sessionId: sessionIdProp = null }) => {
  const { sessionId: routeSessionId } = useParams();
  const location = useLocation();
  const sessionId = sessionIdProp ?? routeSessionId ?? location.state?.importSessionId ?? null;
  const { toast } = useToast();
  const { isAdmin } = useActivityScope();

  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedRow, setSelectedRow]           = useState(null);
  const [isViewOpen, setIsViewOpen]             = useState(false);
  const [isDeleteOpen, setIsDeleteOpen]         = useState(false);
  const [isClearAllOpen, setIsClearAllOpen]     = useState(false);
  const [isDeleting, setIsDeleting]             = useState(false);



  /* ── FETCH ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = sessionId ? { session_id: sessionId } : {};
      const { data } = await axios.get(`${BASE}/api/failed-imports`, { params });
      setRows(data.failed || []);
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err.response?.data?.error || "Could not fetch failed imports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── STATS ── */
  const stats = useMemo(() => {
    const counts = { missing: 0, duplicate: 0, permission: 0, db: 0, other: 0 };
    rows.forEach(r => { const t = classifyReason(r.reason); counts[t] = (counts[t] || 0) + 1; });
    return counts;
  }, [rows]);

  /* ── FILTERS + SEARCH ── */
  const filtered = useMemo(() => {
    return rows.filter(r => {
      const type = classifyReason(r.reason);
      if (filter !== "all" && type !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (r.policy_number || "").toLowerCase().includes(q) ||
          (r.plate         || "").toLowerCase().includes(q) ||
          (r.owner         || "").toLowerCase().includes(q) ||
          (r.company       || "").toLowerCase().includes(q) ||
          (r.reason        || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filter, search]);

  /* ── PAGINATION ── */
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  /* Reset to page 1 when filters change */
  useEffect(() => { setCurrentPage(1); }, [filter, search]);

  /* ── DELETE ONE ── */
  const handleDelete = async () => {
    if (!selectedRow) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${BASE}/api/failed-imports/${selectedRow.id}`);
      setRows(prev => prev.filter(r => r.id !== selectedRow.id));
      setIsDeleteOpen(false);
      setSelectedRow(null);
      toast({ title: "Record removed", description: "Failed import entry deleted." });
    } catch {
      toast({ title: "Error", description: "Could not delete record", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── CLEAR ALL (admin) ── */
  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${BASE}/api/failed-imports`);
      setRows([]);
      setIsClearAllOpen(false);
      toast({ title: "Cleared", description: "All failed import records removed." });
    } catch {
      toast({ title: "Error", description: "Could not clear records", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── FILTER TAB COUNTS ── */
  const tabCount = (key) => {
    if (key === "all") return rows.length;
    return stats[key] || 0;
  };

  /* ─────────────────────────────────────────── */
  if (loading) return (
    <p className="text-center py-20 text-muted-foreground animate-pulse">
      Loading failed import records…
    </p>
  );

  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Failed Imports</h1>
          <p className="text-muted-foreground">
            Review and resolve policies that failed during CSV import
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {isAdmin && rows.length > 0 && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setIsClearAllOpen(true)}
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total failed"
          value={rows.length}
          colorClass="bg-red-100 text-red-600"
          Icon={FileWarning}
        />
        <StatCard
          label="Missing fields"
          value={stats.missing}
          colorClass="bg-yellow-100 text-yellow-600"
          Icon={AlertTriangle}
        />
        <StatCard
          label="Duplicates"
          value={stats.duplicate}
          colorClass="bg-red-100 text-red-500"
          Icon={ListX}
        />
        <StatCard
          label="No permission"
          value={stats.permission}
          colorClass="bg-blue-100 text-blue-600"
          Icon={ShieldAlert}
        />
      </div>

      <Card className="p-4 sm:p-6">

        {/* ── FILTER TABS ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTER_TABS.map(({ key, label, Icon }) => {
            const count = tabCount(key);
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-white dark:text-slate-900"
                    : "bg-background text-muted-foreground border-border hover:border-slate-400 hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-bold",
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── SEARCH + RESET ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-6 items-center">
          <div className="relative sm:col-span-2 xl:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by policy number, plate, owner, reason…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="w-full sm:w-10"
            title="Reset filters"
            onClick={() => { setSearch(""); setFilter("all"); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* ── TABLE ── */}
        <div className="relative rounded-lg border border-border overflow-x-auto">
          <div className="min-w-[860px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Plate</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Import Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                        <p className="font-medium">No failed imports found</p>
                        <p className="text-sm">
                          {search || filter !== "all"
                            ? "Try adjusting your search or filter"
                            : "All policy imports completed successfully"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginated.map((row) => {
                  const type = classifyReason(row.reason);
                  const meta = REASON_META[type];
                  return (
                    <TableRow key={row.id}>

                      {/* Row # */}
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        #{row.row_number}
                      </TableCell>

                      {/* Policy Number */}
                      <TableCell className="font-mono text-sm font-medium">
                        {row.policy_number || (
                          <span className="italic text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Plate */}
                      <TableCell className="font-mono text-sm">
                        {row.plate || <span className="italic text-muted-foreground">—</span>}
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        {row.owner || <span className="italic text-muted-foreground">—</span>}
                      </TableCell>

                      {/* Company */}
                      <TableCell>
                        {row.company || <span className="italic text-muted-foreground">—</span>}
                      </TableCell>

                      {/* Reason — truncated, full text in view dialog */}
                      <TableCell
                        className="text-sm text-muted-foreground max-w-[220px] truncate"
                        title={row.reason}
                      >
                        {row.reason}
                      </TableCell>

                      {/* Type badge */}
                      <TableCell>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(row.created_at)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedRow(row); setIsViewOpen(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setSelectedRow(row); setIsDeleteOpen(true); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── PAGINATION ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 py-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * itemsPerPage, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> entries
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ════════════════════════════════════════
          VIEW DIALOG
      ════════════════════════════════════════ */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[520px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">

          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
            <DialogClose className="absolute right-4 top-4 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-opacity">
              <X className="h-4 w-4 text-white" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                  <FileWarning className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Import Failure Details</DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm">
                    Row #{selectedRow?.row_number} · {fmtDate(selectedRow?.created_at)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Body */}
          {selectedRow && (
            <div className="p-6 space-y-5 bg-background">

              {/* Reason banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Failure Reason</p>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed">
                    {selectedRow.reason}
                  </p>
                </div>
              </div>

              {/* Type badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Type:</span>
                <Badge className={REASON_META[classifyReason(selectedRow.reason)].className}>
                  {REASON_META[classifyReason(selectedRow.reason)].label}
                </Badge>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                {[
                  { label: "Policy Number", value: selectedRow.policy_number },
                  { label: "Plate",         value: selectedRow.plate },
                  { label: "Owner",         value: selectedRow.owner },
                  { label: "Company",       value: selectedRow.company },
                  { label: "Contact",       value: selectedRow.contact },
                  { label: "Start Date",    value: selectedRow.start_date },
                  { label: "Expiry Date",   value: selectedRow.expiry_date },
                  { label: "Import Session",value: selectedRow.import_session_id
                      ? `…${selectedRow.import_session_id.slice(-8)}`
                      : "—"
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">{label}</Label>
                    <p className={cn(
                      "font-medium mt-0.5 text-sm break-all",
                      !value && "italic text-muted-foreground"
                    )}>
                      {value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="p-6 pt-0 bg-background flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsViewOpen(false)}
              className="flex-1 font-semibold text-slate-500 hover:bg-slate-100"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => { setIsViewOpen(false); setIsDeleteOpen(true); }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════
          DELETE ONE — Alert Dialog
      ════════════════════════════════════════ */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Remove Record
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2">
              This will permanently remove the failure record for
              <span className="block mt-1 font-bold text-slate-900">
                {selectedRow?.policy_number || `Row #${selectedRow?.row_number}`}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              {isDeleting ? "Removing…" : "Yes, Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════════════════════════════════════════
          CLEAR ALL — Alert Dialog  (admin only)
      ════════════════════════════════════════ */}
      <AlertDialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
        <AlertDialogContent className="max-w-[420px]">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Clear All Records</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2">
              This will permanently delete all{" "}
              <span className="font-bold text-slate-900">{rows.length}</span> failed import
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              {isDeleting ? "Clearing…" : "Yes, Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FailedImportsTable;
