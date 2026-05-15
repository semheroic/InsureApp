import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Essential for the dashboard redirect
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
  Trash2,
  ShieldAlert,
  Database,
  RefreshCw,
  BellOff,
  Lock,
  FileArchive,
  ServerCrash,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Activity,
  Settings2,
  Download,
  ClipboardList,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// ─────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────
interface AdvancedSettingsProps {
  open: boolean;
  onClose: () => void;
  userRole: string;
  activityScope?: "mine" | "all";
  onActivityScopeChange?: (scope: "mine" | "all") => void;
}

type DeleteStep = "password" | "confirm" | "done" | "error";
type ActivityScope = "mine" | "all";

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

// ─────────────────────────────────────────────
// Settings Catalogue
// ─────────────────────────────────────────────
const SETTINGS: SettingItem[] = [
  {
    id: "delete-policies",
    category: "Data Management",
    icon: Trash2,
    label: "Delete All Policies",
    description: "Permanently wipe every policy record, history, and follow-up.",
    danger: true,
    adminOnly: true,
    badge: "Destructive",
  },
  {
    id: "export-db",
    category: "Data Management",
    icon: Download,
    label: "Export Database Backup",
    description: "Download a full JSON snapshot of all policies and users.",
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
    description: "Adjust session timeout, login attempt limits, and 2FA.",
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "audit-log",
    category: "Security & Access",
    icon: ClipboardList,
    label: "View Audit Log",
    description: "Browse a chronological list of destructive admin actions.",
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "system-health",
    category: "System Maintenance",
    icon: Activity,
    label: "System Health Monitor",
    description: "View real-time API response times and DB connection status.",
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "reset-auto-increment",
    category: "System Maintenance",
    icon: Database,
    label: "Reset Table Auto-Increment",
    description: "Reset the primary-key counter on selected tables.",
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
    description: "Change the schedule of automatic SMS reminders.",
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
  {
    id: "server-restart",
    category: "System Maintenance",
    icon: ServerCrash,
    label: "Initiate Graceful Restart",
    description: "Trigger a zero-downtime server restart for environment changes.",
    danger: true,
    adminOnly: true,
    badge: "Coming Soon",
    hardcoded: true,
  },
];

// ─────────────────────────────────────────────
// Sub-component: Delete All Policies Flow
// ─────────────────────────────────────────────
const DeletePoliciesFlow: React.FC<{ onBack: () => void; onDone: () => void }> = ({
  onBack,
  onDone,
}) => {
  const [step, setStep] = useState<DeleteStep>("password");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Password is required to proceed.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      await new Promise((r) => setTimeout(r, 800)); // UX "Thinking" delay
      setStep("confirm");
    } catch {
      setErrorMsg("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalDelete = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/policies/all`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "Deletion failed.");
        setStep("error");
        return;
      }
      
      setStep("done");
      // This triggers the navigate("/dashboard") in the parent after 2 seconds
      setTimeout(onDone, 2000);
    } catch {
      setErrorMsg("Network error. Could not connect to the server.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "password") {
    return (
      <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive">Identity Verification</h4>
            <p className="text-xs text-destructive/80">
              Please enter your administrator password to confirm this destructive operation.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="pr-10 h-11 focus-visible:ring-destructive focus-visible:border-destructive"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errorMsg && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> {errorMsg}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={loading} variant="destructive" className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Password"}
          </Button>
        </div>
      </form>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-destructive">Confirm Final Deletion</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will erase <strong className="text-foreground">all policy records</strong> from the database. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("password")} className="flex-1">Back</Button>
          <Button onClick={handleFinalDelete} disabled={loading} variant="destructive" className="flex-1 font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Wipe All Data"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="py-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-lg text-emerald-600">Success</h3>
          <p className="text-sm text-muted-foreground">The system has been reset. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="py-10 flex flex-col items-center gap-4">
        <XCircle className="w-16 h-16 text-destructive" />
        <div className="text-center">
          <h3 className="font-bold text-lg text-destructive">Operation Failed</h3>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
        </div>
        <Button variant="outline" onClick={() => setStep("password")}>Try Again</Button>
      </div>
    );
  }

  return null;
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  open,
  onClose,
  userRole,
  activityScope: activityScopeProp = "all",
  onActivityScopeChange,
}) => {
  const navigate = useNavigate(); // Hook for dashboard redirect
  const isAdmin = userRole?.toLowerCase() === "admin";
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activityScope, setActivityScope] = useState<ActivityScope>(activityScopeProp);
  const [loadingScope, setLoadingScope] = useState(false);
  const [savingScope, setSavingScope] = useState(false);
  const [scopeError, setScopeError] = useState("");

  const visibleSettings = SETTINGS.filter((s) => !s.adminOnly || isAdmin);

  const groupedSettings = visibleSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<SettingCategory, SettingItem[]>);

  const handleSelect = (item: SettingItem) => {
    if (item.hardcoded) return;
    setActiveAction(item.id);
  };

  const handleActionDone = () => {
    setActiveAction(null);
    onClose();
    navigate("/dashboard"); // Final redirection
  };

  const handleClose = () => {
    setActiveAction(null);
    onClose();
  };

  useEffect(() => {
    setActivityScope(activityScopeProp);
  }, [activityScopeProp]);

  useEffect(() => {
    if (!open || !isAdmin) return;

    let cancelled = false;

    const loadActivityScope = async () => {
      setLoadingScope(true);
      setScopeError("");
      try {
        const res = await fetch(`${API_URL}/admin/activity-scope`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load activity scope.");
        }

        if (!cancelled) {
          setActivityScope(data.scope === "mine" ? "mine" : "all");
        }
      } catch (err: any) {
        if (!cancelled) {
          setScopeError(err.message || "Failed to load activity scope.");
        }
      } finally {
        if (!cancelled) {
          setLoadingScope(false);
        }
      }
    };

    loadActivityScope();

    return () => {
      cancelled = true;
    };
  }, [open, isAdmin]);

  const updateActivityScope = async (scope: ActivityScope) => {
    if (!isAdmin) return;

    setSavingScope(true);
    setScopeError("");
    try {
      const res = await fetch(`${API_URL}/admin/activity-scope`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update activity scope.");
      }

      setActivityScope(data.scope);
      onActivityScopeChange?.(data.scope);
      handleClose();
      window.location.reload();
    } catch (err: any) {
      setScopeError(err.message || "Failed to update activity scope.");
    } finally {
      setSavingScope(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-xl p-0 overflow-hidden sm:rounded-2xl border-muted/40 shadow-2xl bg-background/95 backdrop-blur-xl">
        
        <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {activeAction ? "Execute Action" : "System Settings"}
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5">
                  {activeAction ? "Administrative Override" : "Global Configurations"}
                </DialogDescription>
              </div>
            </div>
            {isAdmin && !activeAction && <Badge variant="secondary" className="font-bold text-[10px] uppercase">Admin Level</Badge>}
          </div>
        </DialogHeader>

        <div className="p-6">
          {activeAction === "delete-policies" ? (
            <DeletePoliciesFlow onBack={() => setActiveAction(null)} onDone={handleActionDone} />
          ) : (
            <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-8 scrollbar-thin">
              {isAdmin && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                    Activity Visibility
                  </h3>
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Admin Activity Scope</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose whether your pages show only records you created or activity from all users.
                        </p>
                      </div>
                      <Badge variant="secondary" className="h-5 px-2 text-[9px] font-bold uppercase">
                        {activityScope === "all" ? "All Users" : "My Activity"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={loadingScope || savingScope}
                        onClick={() => updateActivityScope("mine")}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all disabled:opacity-60",
                          activityScope === "mine"
                            ? "border-primary bg-primary/5"
                            : "border-border/40 hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <p className="text-sm font-semibold">My Activity</p>
                        <p className="text-xs text-muted-foreground mt-1">Show only records you created.</p>
                      </button>

                      <button
                        type="button"
                        disabled={loadingScope || savingScope}
                        onClick={() => updateActivityScope("all")}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all disabled:opacity-60",
                          activityScope === "all"
                            ? "border-primary bg-primary/5"
                            : "border-border/40 hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <p className="text-sm font-semibold">All Users</p>
                        <p className="text-xs text-muted-foreground mt-1">Show activity from every user account.</p>
                      </button>
                    </div>

                    {(loadingScope || savingScope) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {savingScope ? "Applying activity scope..." : "Loading activity scope..."}
                      </p>
                    )}

                    {scopeError && (
                      <p className="text-xs text-destructive flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5" />
                        {scopeError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(Object.keys(groupedSettings) as SettingCategory[]).map((category) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {groupedSettings[category].map((item) => {
                      const Icon = item.icon;
                      const isComingSoon = !!item.hardcoded;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          disabled={isComingSoon}
                          className={cn(
                            "w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                            item.danger
                              ? "border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40"
                              : "border-border/40 hover:bg-muted/50 hover:border-border",
                            isComingSoon && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            item.danger 
                              ? "bg-destructive/10 text-destructive group-hover:bg-destructive/20" 
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn("text-sm font-semibold", item.danger ? "text-destructive" : "text-foreground")}>
                                {item.label}
                              </p>
                              {item.badge && (
                                <Badge 
                                  variant={item.badge === "Destructive" ? "destructive" : "secondary"}
                                  className="h-4 px-1 text-[8px] font-bold uppercase tracking-wider"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                          </div>

                          {!isComingSoon && <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
