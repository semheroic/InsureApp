import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Trash2, ShieldAlert, Database, RefreshCw, BellOff,
  Lock, FileArchive, ServerCrash, ChevronRight, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, Activity,
  Settings2, Download, ClipboardList, ArrowLeft,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AdvancedSettingsProps {
  open: boolean;
  onClose: () => void;
  userRole: string;
}

type DeleteStep = "password" | "confirm" | "done" | "error";
type SettingCategory = "Data Management" | "Security & Access" | "System Maintenance";

interface SettingItem {
  id: string;
  category: SettingCategory;
  icon: React.ElementType;
  label: string;
  description: string;
  danger?: boolean;
  adminOnly?: boolean;
  badge?: "Destructive" | "Coming Soon" | string;
  hardcoded?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Catalogue
// ─────────────────────────────────────────────────────────────────────────────
const SETTINGS: SettingItem[] = [
  {
    id: "delete-policies",
    category: "Data Management",
    icon: Trash2,
    label: "Delete All Policies",
    description: "Permanently wipe every policy record, history, and follow-up from the database.",
    danger: true,
    adminOnly: true,
    badge: "Destructive",
  },
  {
    id: "export-db",
    category: "Data Management",
    icon: Download,
    label: "Export Database Backup",
    description: "Download a full JSON snapshot of all policies and users for offline archiving.",
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "clear-sms-logs",
    category: "Data Management",
    icon: BellOff,
    label: "Clear All SMS Logs",
    description: "Remove every SMS notification log entry from the system inbox.",
    danger: true,
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "archive-expired",
    category: "Data Management",
    icon: FileArchive,
    label: "Archive Expired Policies",
    description: "Move all expired policies into a cold-storage archive table.",
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "session-config",
    category: "Security & Access",
    icon: Lock,
    label: "Session & Security Config",
    description: "Adjust session timeout, login attempt limits, and 2FA preferences.",
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "audit-log",
    category: "Security & Access",
    icon: ClipboardList,
    label: "View Audit Log",
    description: "Browse a chronological list of every destructive action performed by admins.",
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "system-health",
    category: "System Maintenance",
    icon: Activity,
    label: "System Health Monitor",
    description: "View real-time API response times, DB connection status, and uptime metrics.",
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "reset-auto-increment",
    category: "System Maintenance",
    icon: Database,
    label: "Reset Table Auto-Increment",
    description: "Reset the primary-key counter on selected tables after bulk deletions.",
    danger: true,
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "reconfigure-cron",
    category: "System Maintenance",
    icon: RefreshCw,
    label: "Reconfigure Cron Jobs",
    description: "Change the schedule of automatic SMS reminders and expiry checks.",
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "server-restart",
    category: "System Maintenance",
    icon: ServerCrash,
    label: "Initiate Graceful Restart",
    description: "Trigger a zero-downtime server restart to apply pending environment changes.",
    danger: true,
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Category colour map
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<SettingCategory, { dot: string; label: string }> = {
  "Data Management":    { dot: "bg-blue-500",   label: "text-blue-600 dark:text-blue-400"    },
  "Security & Access":  { dot: "bg-amber-500",  label: "text-amber-600 dark:text-amber-400"  },
  "System Maintenance": { dot: "bg-violet-500", label: "text-violet-600 dark:text-violet-400" },
};

// ─────────────────────────────────────────────────────────────────────────────
// DeletePoliciesFlow
// ─────────────────────────────────────────────────────────────────────────────
const DeletePoliciesFlow: React.FC<{
  onBack: () => void;
  onDone: () => void;
}> = ({ onBack, onDone }) => {
  const [step, setStep]                 = useState<DeleteStep>("password");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim()) { setErrorMsg("Password is required to proceed."); return; }
    setLoading(true);
    setErrorMsg("");
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setStep("confirm");
  };

  const handleFinalDelete = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res  = await fetch(`${API_URL}/policies/all`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Deletion failed."); setStep("error"); return; }
      setDeletedCount(data.deleted ?? null);
      setStep("done");
      setTimeout(onDone, 2200);
    } catch {
      setErrorMsg("Network error. Could not connect to the server.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  // ── Password ──────────────────────────────────────────────────────────────
  if (step === "password") return (
    <form
      onSubmit={handlePasswordSubmit}
      className="flex flex-col gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex gap-3 p-3 sm:p-4 rounded-xl bg-destructive/8 border border-destructive/20">
        <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-xs sm:text-sm font-bold text-destructive leading-snug">
            Identity Verification Required
          </p>
          <p className="text-[11px] sm:text-xs text-destructive/75 mt-0.5 leading-relaxed">
            Enter your admin password to authorise this irreversible operation.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          Admin Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
            placeholder="••••••••••"
            autoFocus
            className={cn(
              "h-10 sm:h-12 pr-10 rounded-xl text-sm transition-all",
              "focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:border-destructive/60",
              errorMsg && "border-destructive/60 bg-destructive/5"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showPassword
              ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              : <Eye    className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
        {errorMsg && (
          <p className="flex items-center gap-1 text-[11px] text-destructive font-medium">
            <XCircle className="w-3 h-3 shrink-0" /> {errorMsg}
          </p>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onBack}
          className="flex-1 h-9 sm:h-11 rounded-xl text-xs sm:text-sm font-bold">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} variant="destructive"
          className="flex-1 h-9 sm:h-11 rounded-xl text-xs sm:text-sm font-bold">
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Verifying…</>
            : "Verify & Continue"}
        </Button>
      </div>
    </form>
  );

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (step === "confirm") return (
    <div className="flex flex-col gap-4 sm:gap-5 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:p-6 text-center space-y-3">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_hsl(var(--destructive)/0.08),_transparent_65%)]" />
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
        </div>
        <div className="relative space-y-1.5">
          <p className="font-black text-sm sm:text-base text-destructive uppercase tracking-wide">
            Are you absolutely sure?
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            This will <strong className="text-foreground">permanently erase</strong> all policies,
            renewal history, and follow-ups. There is{" "}
            <strong className="text-destructive">no undo</strong>.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
          {["Policies", "History", "Follow-ups"].map((t) => (
            <div key={t} className="bg-destructive/10 border border-destructive/15 rounded-lg sm:rounded-xl py-2 px-1">
              <p className="text-[9px] sm:text-[10px] font-black text-destructive uppercase tracking-wider">{t}</p>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5">Deleted</p>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/20">
          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-destructive font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Button variant="outline" onClick={() => { setStep("password"); setErrorMsg(""); }}
          className="flex-1 h-9 sm:h-11 rounded-xl text-xs sm:text-sm font-bold">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Go Back
        </Button>
        <Button onClick={handleFinalDelete} disabled={loading} variant="destructive"
          className="flex-1 h-9 sm:h-11 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide">
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Deleting…</>
            : "Yes, Wipe All"}
        </Button>
      </div>
    </div>
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === "done") return (
    <div className="py-8 sm:py-12 flex flex-col items-center gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">Database Cleared</p>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          {deletedCount !== null ? `${deletedCount} policies removed.` : "All records deleted."} Redirecting…
        </p>
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === "error") return (
    <div className="py-8 sm:py-12 flex flex-col items-center gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-destructive/10 border border-destructive/25 flex items-center justify-center">
        <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-black text-sm sm:text-base text-destructive">Operation Failed</p>
        <p className="text-[11px] sm:text-xs text-muted-foreground max-w-[260px]">{errorMsg}</p>
      </div>
      <Button variant="outline"
        onClick={() => { setStep("password"); setErrorMsg(""); setPassword(""); }}
        className="h-9 sm:h-10 rounded-xl px-5 text-xs sm:text-sm font-bold mt-1">
        Try Again
      </Button>
    </div>
  );

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  open,
  onClose,
  userRole,
}) => {
  const navigate = useNavigate();
  const isAdmin  = userRole?.toLowerCase() === "admin";

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
      setActiveAction(null);
    }
  }, [open]);

  const visibleSettings = SETTINGS.filter((s) => !s.adminOnly || isAdmin);

  const groupedSettings = visibleSettings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<SettingCategory, SettingItem[]>);

  const handleSelect = (item: SettingItem) => {
    if (item.hardcoded) return;
    setActiveAction(item.id);
  };

  const handleActionDone = () => {
    setActiveAction(null);
    onClose();
    navigate("/dashboard");
  };

  const handleClose = () => {
    setActiveAction(null);
    onClose();
  };

  const activeItem = activeAction ? SETTINGS.find((s) => s.id === activeAction) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          // Reset
          "p-0 gap-0",
          // Mobile: full-width bottom sheet
          "fixed bottom-0 left-0 right-0 translate-x-0",
          "rounded-t-[20px] rounded-b-none",
          "max-h-[92dvh] w-full",
          // Tablet+: centred floating modal
          "sm:relative sm:inset-auto sm:translate-x-0",
          "sm:rounded-2xl",
          "sm:w-[90vw] sm:max-w-[560px]",
          "sm:max-h-[88dvh]",
          // Desktop
          "lg:max-w-[580px]",
          // Shared
          "overflow-hidden border-border/30 bg-background/97",
          "backdrop-blur-2xl shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95",
          "duration-300"
        )}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* ── Header ── */}
        <DialogHeader className={cn(
          "shrink-0",
          "px-4 sm:px-6 py-3 sm:py-4",
          "border-b border-border/30 bg-muted/10",
          // Override default flex-col to flex-row
          "flex flex-row items-center justify-between gap-3"
        )}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Back button */}
            {activeAction && (
              <button
                onClick={() => setActiveAction(null)}
                className={cn(
                  "shrink-0 flex items-center justify-center",
                  "w-7 h-7 sm:w-9 sm:h-9",
                  "rounded-lg sm:rounded-xl",
                  "bg-muted/60 hover:bg-muted",
                  "transition-colors"
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Icon */}
            {!activeAction && (
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            )}
            {activeItem && (
              <div className={cn(
                "shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                activeItem.danger ? "bg-destructive/10" : "bg-primary/10"
              )}>
                <activeItem.icon className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5",
                  activeItem.danger ? "text-destructive" : "text-primary"
                )} />
              </div>
            )}

            {/* Title group */}
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-[15px] font-bold tracking-tight truncate leading-tight">
                {activeAction ? (activeItem?.label ?? "Action") : "Advanced Settings"}
              </DialogTitle>
              <DialogDescription className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-black text-muted-foreground mt-0.5">
                {activeAction ? "Administrative Override" : "Global Configurations"}
              </DialogDescription>
            </div>
          </div>

          {/* Admin badge */}
          {isAdmin && !activeAction && (
            <Badge
              variant="secondary"
              className="shrink-0 h-5 sm:h-6 px-1.5 sm:px-2 text-[8px] sm:text-[9px] font-black uppercase tracking-wider"
            >
              Admin
            </Badge>
          )}
        </DialogHeader>

        {/* ── Scrollable Body ── */}
        <div className={cn(
          "overflow-y-auto overscroll-contain",
          "px-3 sm:px-5 py-4 sm:py-5",
          "flex-1",
          // Height: total viewport - drag handle - header - bottom safe area
          "max-h-[calc(92dvh-56px-52px)] sm:max-h-[calc(88dvh-72px)]",
        )}>

          {/* Action flows */}
          {activeAction === "delete-policies" && (
            <DeletePoliciesFlow onBack={() => setActiveAction(null)} onDone={handleActionDone} />
          )}

          {/* Settings list */}
          {!activeAction && (
            <div className="space-y-5 sm:space-y-7 pb-safe">
              {(Object.keys(groupedSettings) as SettingCategory[]).map((category, ci) => {
                const style = CATEGORY_STYLE[category];
                return (
                  <section key={category}>
                    {/* Category heading */}
                    <div className="flex items-center gap-2 mb-2.5 sm:mb-3 px-0.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                      <h3 className={cn(
                        "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]",
                        style.label
                      )}>
                        {category}
                      </h3>
                      <div className="flex-1 h-px bg-border/40 ml-1" />
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 sm:space-y-2">
                      {groupedSettings[category].map((item, idx) => {
                        const Icon         = item.icon;
                        const isComingSoon = !!item.hardcoded;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            disabled={isComingSoon}
                            style={{ animationDelay: mounted ? `${(ci * 4 + idx) * 38}ms` : "0ms" }}
                            className={cn(
                              // Layout
                              "w-full flex items-center gap-3 sm:gap-4",
                              "px-3 sm:px-4 py-2.5 sm:py-3.5",
                              "rounded-xl sm:rounded-2xl border text-left",
                              // Animation
                              "animate-in fade-in slide-in-from-left-2 duration-300",
                              // Interactions
                              "transition-all duration-150",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                              // Danger vs normal
                              item.danger
                                ? "border-destructive/15 hover:bg-destructive/5 hover:border-destructive/35 active:bg-destructive/10"
                                : "border-border/35 hover:bg-muted/50 hover:border-border/60 active:bg-muted/80",
                              // Disabled
                              isComingSoon && "opacity-40 cursor-not-allowed pointer-events-none"
                            )}
                          >
                            {/* Icon */}
                            <div className={cn(
                              "shrink-0 flex items-center justify-center",
                              "w-8 h-8 sm:w-10 sm:h-10",
                              "rounded-lg sm:rounded-xl",
                              "transition-colors",
                              item.danger
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={cn(
                                  "text-xs sm:text-sm font-semibold leading-tight",
                                  item.danger ? "text-destructive" : "text-foreground"
                                )}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <Badge
                                    variant={item.badge === "Destructive" ? "destructive" : "secondary"}
                                    className="h-3.5 sm:h-4 px-1 sm:px-1.5 text-[7px] sm:text-[8px] font-black uppercase tracking-wider"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2 sm:line-clamp-1">
                                {item.description}
                              </p>
                            </div>

                            {/* Arrow */}
                            {!isComingSoon && (
                              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-muted-foreground transition-transform duration-150" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {/* iOS safe-area bottom spacing */}
              <div className="h-3 sm:h-0" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};