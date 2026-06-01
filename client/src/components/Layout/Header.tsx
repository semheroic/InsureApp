import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, LogOut, Edit, AlertCircle, Sun, Moon,
  Timer, Inbox, Check, FileText, Users as UsersIcon,
  BarChart3, History, PhoneCall, LayoutDashboard, ArrowLeft,
  Eye, ShieldCheck, UserCircle, Menu, Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AdvancedSettings } from "@/components/AdvancedSettings"; // ← new import
import { useActivityScope } from "@/contexts/ActivityScopeContext";

const API_URL = import.meta.env.VITE_API_URL;
const SESSION_DURATION_HOURS = 8;
const formatInboxMessage = (value: string) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/Policy\s+[^(]+\s+\(Plate:\s*([^,]+),\s*Owner:\s*([^)]+)\)/gi, "Plate $1 ($2)")
    .replace(/Policy\s+[^(]+\s+\(([^)—-]+)\s+[—-]\s+([^)]+)\)/gi, "Plate $1 ($2)")
    .replace(/insurance policy\s+[^(]+\s+\(([^)]+)\)/gi, "insurance for plate $1");
};

export const Header = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const { setActivityScope, setIsAdmin } = useActivityScope();

  // ─── States ───────────────────────────────────────────────────────────────
  const [user, setUser] = useState({
    id: 0, name: "", email: "", profile_picture: "", role: "", activity_scope: "mine" as "mine" | "all",
  });
  const [notifications, setNotifications]         = useState<any[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const notificationUnreadCountRef = useRef(0);
  const [search, setSearch]                       = useState("");
  const [isSearchOpen, setIsSearchOpen]           = useState(false);
  const [activeTab, setActiveTab]                 = useState<"all" | "unread">("all");
  const [theme, setTheme]                         = useState(localStorage.getItem("theme") || "light");
  const [timeLeft, setTimeLeft]                   = useState("");
  const [progress, setProgress]                   = useState(100);
  const [selectedLog, setSelectedLog]             = useState<any>(null);
  const [advancedOpen, setAdvancedOpen]           = useState(false); // ← new
  const [notificationPage, setNotificationPage]   = useState(0);

  const isAdmin = useMemo(() => user.role?.toLowerCase() === "admin", [user.role]);

  // ─── Global Search ────────────────────────────────────────────────────────
  const commandResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.toLowerCase();
    const commands = [
      { title: "Dashboard",          path: "/dashboard",           icon: LayoutDashboard, category: "Pages"   },
      { title: "Policy Management",  path: "/policies",            icon: FileText,         category: "Pages"   },
      { title: "User Directory",     path: "/users",               icon: UsersIcon,        category: "Pages"   },
      { title: "Analytics Report",   path: "/reports/analytics",   icon: BarChart3,        category: "Reports" },
      { title: "Expiry Report",      path: "/reports/expiry",      icon: AlertCircle,      category: "Reports" },
      { title: "Logout / End Session", action: () => handleLogout(), icon: LogOut,          category: "Actions" },
    ];
    return commands.filter(c => c.title.toLowerCase().includes(term));
  }, [search]);

  // ─── Notifications ────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, { credentials: "include" });
      const data = res.ok ? await res.json() : { notifications: [], unread: 0 };

      const newNotifications = data.notifications || [];
      const newUnread = data.unread || 0;
      const previousUnread = notificationUnreadCountRef.current;

      if (newUnread > previousUnread && previousUnread !== 0) {
        playNotificationSound();
      }

      notificationUnreadCountRef.current = newUnread;
      setNotifications(newNotifications);
      setNotificationUnreadCount(newUnread);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const playNotificationSound = () => {
    try {
      if (!notificationSound.current) {
        notificationSound.current = new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"
        );
      }
      notificationSound.current
        .play()
        .catch(() => console.log("Sound blocked by browser auto-play policy"));
    } catch (err) {
      console.error("Sound Error:", err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PUT", credentials: "include",
      });
      fetchNotifications();
    } catch (err) {
      console.error("Mark Read Error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/mark-read`, { method: "PUT", credentials: "include" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        setUser(data);
        const userIsAdmin = data.role?.toLowerCase() === "admin";
        setIsAdmin(userIsAdmin);
        setActivityScope(data.activity_scope === "all" ? "all" : "mine", userIsAdmin);
      })
      .catch(() => navigate("/"));

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [navigate, setActivityScope, setIsAdmin]);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === "dark"
      ? root.classList.add("dark")
      : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ─── Auth / Session ───────────────────────────────────────────────────────
  const handleLogout = async () => {
    localStorage.removeItem("login_time");
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/");
  };

  useEffect(() => {
    const loginTimestamp =
      localStorage.getItem("login_time") || Date.now().toString();
    const endTime =
      parseInt(loginTimestamp) + SESSION_DURATION_HOURS * 60 * 60 * 1000;

    const updateTimer = () => {
      const distance = endTime - Date.now();
      if (distance < 0) return handleLogout();
      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
      setProgress((distance / (SESSION_DURATION_HOURS * 60 * 60 * 1000)) * 100);
    };

    const t = setInterval(updateTimer, 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    return notifications.filter(
      (n: any) => activeTab === "all" || n.is_read === 0
    );
  }, [notifications, activeTab]);

  const totalUnreadCount = notificationUnreadCount;
  const displayName = user.name || "User";
  const itemsPerPage = 3;
  const maxNotificationPage = Math.max(0, Math.ceil(filteredNotifications.length / itemsPerPage) - 1);
  const visibleNotifications = filteredNotifications.slice(
    notificationPage * itemsPerPage,
    (notificationPage + 1) * itemsPerPage
  );

  useEffect(() => {
    setNotificationPage(0);
  }, [activeTab, filteredNotifications.length]);

  useEffect(() => {
    setNotificationPage(prev => Math.min(prev, maxNotificationPage));
  }, [maxNotificationPage]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Advanced Settings Modal ── */}
      <AdvancedSettings
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        userRole={user.role}
        activityScope={user.activity_scope}
        onActivityScopeChange={(scope) => {
          setUser((prev) => ({ ...prev, activity_scope: scope }));
          setActivityScope(scope, isAdmin);
        }}
      />

      <header className="fixed top-0 right-0 left-0 lg:left-[280px] h-16 border-b border-muted/30 bg-background/60 backdrop-blur-md z-50 transition-all duration-300">
        <div className="h-full px-4 md:px-8 flex justify-between items-center gap-4">

          {/* Mobile logo */}
          <div className="lg:hidden">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>

          {/* ── Global Search + Theme Toggle ── */}
          <div className="flex items-center gap-2 md:gap-6 flex-1 max-w-md relative">
            <div className="relative w-full group">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                value={search}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 md:pl-11 pr-4 md:pr-12 bg-muted/30 hover:bg-muted/50 border-none h-10 md:h-11 rounded-xl md:rounded-2xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/20"
              />

              {/* Search dropdown */}
              {isSearchOpen && search.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[280px] md:w-full bg-background/95 backdrop-blur-xl border border-muted/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-[60]">
                  <div className="max-h-[300px] md:max-h-[350px] overflow-y-auto p-2">
                    {commandResults.map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (cmd.path)   navigate(cmd.path);
                          if (cmd.action) cmd.action();
                          setSearch("");
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted group-hover:bg-primary/10 rounded-lg">
                            <cmd.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs md:text-sm font-semibold">{cmd.title}</p>
                            <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                              {cmd.category}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-xl md:rounded-2xl shrink-0 hover:bg-muted/50 h-10 w-10 md:h-11 md:w-11"
            >
              {theme === "light"
                ? <Moon className="w-4 h-4 md:w-5 md:h-5 text-slate-700" />
                : <Sun  className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />}
            </Button>
          </div>

          {/* ── Right cluster ── */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">

            {/* ── Notifications ── */}
            <DropdownMenu onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl transition-all",
                    totalUnreadCount > 0 && "bg-primary/5"
                  )}
                >
                  <Bell
                    className={cn(
                      "w-4 h-4 md:w-5 md:h-5 transition-transform",
                      totalUnreadCount > 0 ? "text-primary animate-ring" : "text-muted-foreground"
                    )}
                  />
                  {totalUnreadCount > 0 && (
                    <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 min-w-[18px] px-1.5 text-[10px] md:text-[11px] font-black leading-none rounded-full bg-primary text-white flex items-center justify-center">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-[300px] md:w-[420px] p-0 rounded-[24px] border-muted/30 bg-background/95 backdrop-blur-2xl shadow-2xl mt-4 overflow-hidden animate-in zoom-in-95"
              >
                {selectedLog ? (
                  /* ── Detail view ── */
                  <div className="flex flex-col h-full">
                    <div className="p-4 md:p-5 border-b bg-muted/10 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(null)}
                        className="h-8 w-8 rounded-lg hover:bg-background"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <h3 className="font-bold text-xs md:text-sm truncate">{selectedLog.title || selectedLog.phone_number || "Notification"}</h3>
                        <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">
                          Details
                        </p>
                      </div>
                    </div>
                    <div className="p-4 md:p-6 space-y-4">
                      <div className="bg-primary/[0.03] border border-primary/10 p-4 md:p-6 rounded-[15px] md:rounded-[20px] rounded-tl-none">
                        <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
                          {formatInboxMessage(selectedLog.message)}
                        </p>
                        <div className="flex justify-end items-end mt-4">
                          <span className="text-[9px] md:text-[10px] text-muted-foreground block text-right">
                            {new Date(selectedLog.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full rounded-xl py-6 text-xs md:text-sm font-bold"
                        onClick={() => setSelectedLog(null)}
                      >
                        Back to Inbox
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── List view ── */
                  <>
                    <div className="p-4 md:p-6 border-b bg-muted/10 space-y-3">
                      <div className="flex justify-between items-center gap-3">
                        <h3 className="font-bold text-base md:text-lg">Notifications</h3>
                        <button
                          onClick={(e) => { e.preventDefault(); markAllRead(); }}
                          className="h-7 text-[9px] md:text-[11px] font-bold text-primary uppercase hover:opacity-70"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-muted/10">
                        <button
                          onClick={(e) => { e.preventDefault(); setActiveTab("all"); }}
                          className={cn(
                            "flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all",
                            activeTab === "all"
                              ? "bg-background text-primary shadow-sm"
                              : "text-muted-foreground"
                          )}
                        >
                          ALL
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); setActiveTab("unread"); }}
                          className={cn(
                            "flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all",
                            activeTab === "unread"
                              ? "bg-background text-primary shadow-sm"
                              : "text-muted-foreground"
                          )}
                        >
                          UNREAD
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[300px] md:max-h-[360px] overflow-y-auto px-1">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center gap-2 opacity-30 italic">
                          <Inbox className="w-8 h-8" />
                          <p className="text-[10px]">No notifications</p>
                        </div>
                      ) : (
                        visibleNotifications.map((n: any) => (
                          <div
                            key={n.id}
                            className={cn(
                              "m-1 p-3 flex items-center justify-between rounded-xl transition-all cursor-pointer",
                              !n.is_read ? "bg-primary/[0.04]" : "hover:bg-muted/30"
                            )}
                            onClick={() => { setSelectedLog(n); markAsRead(n.id); }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", !n.is_read ? "bg-primary" : "bg-muted")} />
                              <div className="max-w-[120px] md:max-w-none">
                                <p className={cn("text-xs font-bold truncate", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                                  {n.title || n.phone_number || n.activity_type || "Notification"}
                                </p>
                                <p className="text-[9px] text-muted-foreground truncate max-w-[150px]">
                                  {formatInboxMessage(n.message)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[9px] text-muted-foreground">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {filteredNotifications.length > itemsPerPage && (
                      <div className="px-4 py-3 border-t bg-muted/10 flex items-center justify-between text-[10px] md:text-[11px] text-muted-foreground">
                        <span>Page {notificationPage + 1} of {maxNotificationPage + 1}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={notificationPage === 0}
                            onClick={() => setNotificationPage(prev => Math.max(prev - 1, 0))}
                            className={cn(
                              "px-2 py-1 rounded-lg transition-all",
                              notificationPage === 0 ? "bg-muted/30 text-muted-foreground cursor-not-allowed" : "bg-background text-primary hover:bg-primary/10"
                            )}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            disabled={notificationPage === maxNotificationPage}
                            onClick={() => setNotificationPage(prev => Math.min(prev + 1, maxNotificationPage))}
                            className={cn(
                              "px-2 py-1 rounded-lg transition-all",
                              notificationPage === maxNotificationPage ? "bg-muted/30 text-muted-foreground cursor-not-allowed" : "bg-background text-primary hover:bg-primary/10"
                            )}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ── User Profile Dropdown ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 md:h-12 gap-2 md:gap-4 px-1 md:px-2 rounded-xl md:rounded-2xl group transition-all shrink-0"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all" />
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 md:border-[3px] border-background shadow-lg relative z-10">
                      {user.profile_picture ? (
                        <AvatarImage src={`${API_URL}${user.profile_picture}`} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px] md:text-xs">
                          {user.name?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3.5 md:w-3.5 rounded-full bg-green-500 border-2 md:border-[3px] border-background z-20" />
                  </div>

                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[11px] md:text-[13px] font-bold truncate max-w-[80px] md:max-w-none">
                        {displayName}
                      </p>
                      <Badge className="h-[14px] md:h-[18px] px-1 md:px-2 text-[7px] md:text-[9px] uppercase font-black bg-primary/10 text-primary border-none">
                        {user.role}
                      </Badge>
                    </div>
                    {isAdmin && (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Scope: {user.activity_scope === "all" ? "All Users" : "My Activity"}
                      </p>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-[280px] md:w-[320px] p-2 rounded-[24px] shadow-2xl mt-4 border-muted/30 bg-background/95 backdrop-blur-2xl"
              >
                {/* Session timer card */}
                <div className="px-4 py-5 md:px-5 md:py-6 mb-2 rounded-[20px] bg-gradient-to-br from-muted/40 to-muted/10 border border-muted/10 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                      <Timer className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" /> Session
                    </span>
                    <Badge className="h-4 md:h-5 px-1.5 md:px-2 text-[7px] md:text-[9px] bg-primary text-white border-none">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-[9px] md:text-[11px] font-bold font-mono">
                      <p className="text-muted-foreground uppercase tracking-widest">Expires in</p>
                      <p className={cn(progress < 15 && "text-red-500 animate-pulse")}>{timeLeft}</p>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-1000", progress < 15 ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-1 space-y-1">
                  {/* Edit Profile */}
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/users/edit/${user.id}`)}
                    className="w-full justify-start gap-3 md:gap-4 h-11 md:h-12 rounded-xl text-xs md:text-sm font-semibold hover:bg-primary/5"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Edit className="w-3.5 h-3.5 opacity-70" />
                    </div>
                    Edit Profile
                  </Button>

                  {/* ── Advanced Settings (NEW) ── */}
                  <Button
                    variant="ghost"
                    onClick={() => setAdvancedOpen(true)}
                    className="w-full justify-start gap-3 md:gap-4 h-11 md:h-12 rounded-xl text-xs md:text-sm font-semibold hover:bg-primary/5"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Settings2 className="w-3.5 h-3.5 opacity-70" />
                    </div>
                    Advanced Settings
                    {isAdmin && (
                      <Badge className="ml-auto h-4 px-1.5 text-[8px] bg-primary/10 text-primary border-none font-black uppercase">
                        Admin
                      </Badge>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="h-px bg-muted/30 mx-2 my-1" />

                  {/* Logout */}
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 md:gap-4 h-11 md:h-12 rounded-xl text-xs md:text-sm font-black text-red-500 uppercase tracking-widest"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    Log Out
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>
    </>
  );
};
