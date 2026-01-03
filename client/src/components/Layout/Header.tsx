import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, LogOut, Edit, AlertCircle, Sun, Moon,
  Timer, Inbox, Check, FileText, Users as UsersIcon,
  BarChart3, History, PhoneCall, LayoutDashboard, ArrowLeft, Eye, ShieldCheck, UserCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;
const SESSION_DURATION_HOURS = 8;

export const Header = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- STATES ---
  const [user, setUser] = useState({ id: 0, name: "", email: "", profile_picture: "", role: "" });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(100);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const isAdmin = useMemo(() => user.role?.toLowerCase() === "admin", [user.role]);

  // --- GLOBAL SEARCH LOGIC ---
  const commandResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.toLowerCase();
    const commands = [
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, category: "Pages" },
      { title: "Policy Management", path: "/policies", icon: FileText, category: "Pages" },
      { title: "User Directory", path: "/users", icon: UsersIcon, category: "Pages" },
      { title: "Analytics Report", path: "/reports/analytics", icon: BarChart3, category: "Reports" },
      { title: "Expiry Report", path: "/reports/expiry", icon: AlertCircle, category: "Reports" },
      { title: "Logout / End Session", action: () => handleLogout(), icon: LogOut, category: "Actions" },
    ];
    return commands.filter(c => c.title.toLowerCase().includes(term));
  }, [search]);

  // --- DATA FETCHING ---
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/sms/logs`, { credentials: "include" });
      const data = await res.json();
      setNotifications(data.logs || []);
      setUnreadCount(data.unread || 0);
    } catch (err) { console.error(err); }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/sms/logs/${id}/read`, { method: "PUT", credentials: "include" });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/sms/mark-read`, { method: "PUT", credentials: "include" });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => navigate("/"));
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    localStorage.removeItem("login_time");
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/");
  };

  useEffect(() => {
    let loginTimestamp = localStorage.getItem("login_time") || Date.now().toString();
    const endTime = parseInt(loginTimestamp) + SESSION_DURATION_HOURS * 60 * 60 * 1000;
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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n: any) => activeTab === "all" || n.is_read === 0);
  }, [notifications, activeTab]);

  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 border-b border-muted/30 bg-background/60 backdrop-blur-md z-50">
      <div className="h-full px-8 flex justify-between items-center">
        
        {/* GLOBAL SEARCH */}
        <div className="flex items-center gap-6 flex-1 max-w-md relative">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
            <Input 
              ref={searchInputRef}
              placeholder="Quick search..." 
              value={search} 
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-11 pr-12 bg-muted/30 hover:bg-muted/50 border-none h-11 rounded-2xl transition-all duration-300 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20" 
            />
            {isSearchOpen && search.length > 0 && (
              <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-background/95 backdrop-blur-xl border border-muted/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-none">
                  {commandResults.map((cmd, i) => (
                    <button key={i} onClick={() => { if (cmd.path) navigate(cmd.path); if (cmd.action) cmd.action(); setSearch(""); setIsSearchOpen(false); }} className="w-full flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-muted group-hover:bg-primary/10 rounded-xl transition-colors"><cmd.icon className="w-4 h-4 text-primary" /></div>
                        <div className="text-left"><p className="text-sm font-semibold">{cmd.title}</p><p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{cmd.category}</p></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-2xl shrink-0 hover:bg-muted/50 transition-colors h-11 w-11">
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5 text-yellow-500" />}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* NOTIFICATION DROPDOWN */}
          <DropdownMenu onOpenChange={(open) => { if(!open) setSelectedLog(null); }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("relative w-11 h-11 rounded-2xl transition-all duration-300 hover:bg-muted/50", unreadCount > 0 && "bg-primary/5")}>
                <Bell className={cn("w-5 h-5 transition-transform duration-300", unreadCount > 0 ? "text-primary animate-ring" : "text-muted-foreground")} />
                {unreadCount > 0 && <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background shadow-sm" />}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[420px] p-0 rounded-[24px] border-muted/30 bg-background/95 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] mt-4 overflow-hidden min-h-[420px] animate-in zoom-in-95 duration-200">
              {selectedLog ? (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-5 border-b bg-muted/10 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-9 w-9 rounded-xl hover:bg-background">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm tracking-tight text-foreground">{selectedLog.phone_number}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">Message Details</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="bg-primary/[0.03] border border-primary/10 p-6 rounded-[20px] rounded-tl-none shadow-sm">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">{selectedLog.message}</p>
                      <span className="text-[10px] text-muted-foreground block mt-6 text-right font-medium">
                        {new Date(selectedLog.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/20 rounded-2xl border border-muted/10">
                        <p className="text-[9px] text-muted-foreground uppercase font-black mb-1.5 tracking-widest text-center">Status</p>
                        <div className="flex justify-center"><Badge variant="secondary" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-none px-3">{selectedLog.delivery_status}</Badge></div>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-2xl border border-muted/10 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase font-black mb-1.5 tracking-widest">Cost</p>
                        <p className="text-sm font-black text-foreground font-mono">${selectedLog.cost || '0.00'}</p>
                      </div>
                    </div>
                    <Button className="w-full rounded-2xl shadow-xl shadow-primary/20 py-7 text-sm font-bold tracking-tight hover:scale-[1.02] active:scale-95 transition-all" onClick={() => setSelectedLog(null)}>
                      Back to Inbox
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b bg-muted/10">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-lg tracking-tight">Inbox</h3>
                      <Button variant="ghost" onClick={markAllRead} className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 uppercase tracking-wider">Mark all as read</Button>
                    </div>
                    <div className="flex gap-1.5 p-1 bg-muted/40 rounded-2xl border border-muted/10">
                      <button onClick={() => setActiveTab("all")} className={cn("flex-1 text-[11px] font-bold py-2 rounded-xl transition-all uppercase tracking-widest", activeTab === "all" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>All</button>
                      <button onClick={() => setActiveTab("unread")} className={cn("flex-1 text-[11px] font-bold py-2 rounded-xl transition-all uppercase tracking-widest", activeTab === "unread" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>Unread</button>
                    </div>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-muted/10 custom-scrollbar px-2">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40 italic">
                        <Inbox className="w-10 h-10 stroke-[1.5px]" /> 
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    ) : (
                      filteredNotifications.map((n: any) => (
                        <div key={n.id} className={cn("m-1 p-4 flex items-center justify-between rounded-2xl transition-all duration-300", !n.is_read ? "bg-primary/[0.04] shadow-sm" : "hover:bg-muted/30")}>
                          <div className="flex items-center gap-4">
                            <div className={cn("w-2.5 h-2.5 rounded-full ring-4 ring-background", !n.is_read ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted")} />
                            <div>
                              <p className={cn("text-sm font-bold tracking-tight", !n.is_read ? "text-foreground" : "text-muted-foreground")}>{n.phone_number}</p>
                              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedLog(n); markAsRead(n.id); }}
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 group/btn shadow-none"
                          >
                            <Eye className="w-4 h-4 opacity-50 group-hover/btn:opacity-100" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* USER PROFILE & SESSION */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 gap-4 px-2  rounded-2xl group transition-all duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md  transition-all opacity-0 group-hover:opacity-100" />
                  <Avatar className="w-10 h-10 border-[3px] border-background shadow-xl  transition-transform duration-500 relative z-10">
                    {user.profile_picture ? (
                      <AvatarImage src={`${API_URL}${user.profile_picture}`} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user.name?.[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-[3px] border-background z-20" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-bold tracking-tight">{user.name}</p>
                    {user.role && (
                      <Badge variant="secondary" className="h-[18px] px-2 text-[9px] uppercase font-black bg-primary/10 text-primary border-none shadow-sm rounded-md">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold truncate w-32 uppercase tracking-tighter opacity-60 ">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[320px] p-2 rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] mt-4 border-muted/30 bg-background/95 backdrop-blur-2xl">
              <div className="px-5 py-6 mb-2 rounded-[20px] bg-gradient-to-br from-muted/40 to-muted/10 border border-muted/10 relative overflow-hidden group/card">
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover/card:bg-primary/10 transition-colors" />
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2"><Timer className="w-3.5 h-3.5 text-primary" /> Session Duration</span>
                  <div className="flex gap-1.5">
                    {user.role && (
                      <Badge className="h-5 px-2 text-[9px] bg-primary text-white border-none flex gap-1.5 items-center shadow-lg shadow-primary/20">
                        {isAdmin ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserCircle className="w-2.5 h-2.5" />}
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-[11px] font-bold font-mono">
                    <p className="text-muted-foreground uppercase tracking-widest">Logout in</p>
                    <p className={cn("tabular-nums", progress < 15 && "text-red-500 animate-pulse")}>{timeLeft}</p>
                  </div>
                  <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden p-[2px]">
                    <div className={cn("h-full rounded-full transition-all duration-1000", progress < 15 ? "bg-red-500" : "bg-primary")} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-1 space-y-1">
                <Button variant="ghost" onClick={() => navigate(`/users/edit/${user.id}`)} className="w-full justify-start gap-4 h-12 rounded-xl text-sm font-semibold hover:bg-primary/5 hover:text-primary transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><Edit className="w-4 h-4 opacity-70" /></div> Account Settings
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-4 h-12 rounded-xl text-sm font-black text-red-500 transition-all duration-300 uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><LogOut className="w-4 h-4" /></div> End Session
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};