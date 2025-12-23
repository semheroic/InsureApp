import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, LogOut, Edit, AlertCircle, Sun, Moon,
  Timer, Inbox, Check, FileText, Users as UsersIcon,
  BarChart3, History, PhoneCall, LayoutDashboard, ArrowLeft, Eye
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

const API_URL = "http://localhost:5000";
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
  
  // WhatsApp-style View State
  const [selectedLog, setSelectedLog] = useState<any>(null);

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

  // --- THEME LOGIC ---
  useEffect(() => {
    const root = window.document.documentElement;
    theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- SESSION TIMER ---
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
    <header className="fixed top-0 right-0 left-[280px] h-16 border-b bg-background/80 backdrop-blur-xl z-50">
      <div className="h-full px-6 flex justify-between items-center">
        
        {/* GLOBAL SEARCH */}
        <div className="flex items-center gap-4 flex-1 max-w-md relative">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              ref={searchInputRef}
              placeholder="Search or type commands..." 
              value={search} 
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 pr-12 bg-muted/40 border-none h-10 rounded-xl" 
            />
            {isSearchOpen && search.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-popover border border-muted/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-[350px] overflow-y-auto p-2">
                  {commandResults.map((cmd, i) => (
                    <button key={i} onClick={() => { if (cmd.path) navigate(cmd.path); if (cmd.action) cmd.action(); setSearch(""); setIsSearchOpen(false); }} className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-xl transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted group-hover:bg-background rounded-lg transition-colors"><cmd.icon className="w-4 h-4 text-primary" /></div>
                        <div><p className="text-sm font-bold">{cmd.title}</p><p className="text-[10px] text-muted-foreground uppercase font-black">{cmd.category}</p></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl shrink-0">
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* NOTIFICATION DROPDOWN */}
          <DropdownMenu onOpenChange={(open) => { if(!open) setSelectedLog(null); }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("relative w-10 h-10 rounded-xl transition-all", unreadCount > 0 && "bg-primary/5")}>
                <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[400px] p-0 rounded-2xl border-muted/40 bg-popover shadow-2xl mt-2 overflow-hidden min-h-[420px]">
              {selectedLog ? (
                /* --- FULL CONTENT VIEW --- */
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                  <div className="p-4 border-b bg-muted/20 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-8 w-8 rounded-full">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm tracking-tight">{selectedLog.phone_number}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Full Message View</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="bg-muted/30 border border-muted/50 p-5 rounded-2xl rounded-tl-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedLog.message}</p>
                      <span className="text-[9px] text-muted-foreground block mt-4 text-right font-mono">
                        {new Date(selectedLog.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/20 rounded-xl border border-muted/10 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Delivery Status</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">{selectedLog.delivery_status}</Badge>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-xl border border-muted/10 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase font-black mb-1 tracking-widest">SMS Cost</p>
                        <p className="text-sm font-black font-mono">${selectedLog.cost || '0.00'}</p>
                      </div>
                    </div>
                    <Button className="w-full rounded-xl shadow-lg shadow-primary/10 py-6" onClick={() => setSelectedLog(null)}>
                      Back to Inbox
                    </Button>
                  </div>
                </div>
              ) : (
                /* --- LIST VIEW (NUMBERS ONLY) --- */
                <>
                  <div className="p-5 border-b bg-muted/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-base tracking-tight text-foreground">Notifications</h3>
                      <Button variant="ghost" onClick={markAllRead} className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 uppercase tracking-tighter">Mark All Read</Button>
                    </div>
                    <div className="flex gap-2 p-1 bg-muted/50 rounded-xl border border-muted/20">
                      <button onClick={() => setActiveTab("all")} className={cn("flex-1 text-[10px] font-black py-1.5 rounded-lg transition-all uppercase tracking-widest", activeTab === "all" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}>Inbox</button>
                      <button onClick={() => setActiveTab("unread")} className={cn("flex-1 text-[10px] font-black py-1.5 rounded-lg transition-all uppercase tracking-widest", activeTab === "unread" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}>Unread</button>
                    </div>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-muted/10 custom-scrollbar">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-20 text-center text-muted-foreground text-xs italic opacity-50"><Inbox className="w-8 h-8 mx-auto mb-2" /> Everything Caught Up</div>
                    ) : (
                      filteredNotifications.map((n: any) => (
                        <div key={n.id} className={cn("p-4 flex items-center justify-between group transition-all", !n.is_read ? "bg-primary/[0.02]" : "hover:bg-muted/30")}>
                          <div className="flex items-center gap-4">
                            <div className={cn("w-2 h-2 rounded-full", !n.is_read ? "bg-primary animate-pulse" : "bg-muted")} />
                            <div>
                              <p className={cn("text-xs font-bold tracking-tight", !n.is_read ? "text-foreground" : "text-muted-foreground")}>{n.phone_number}</p>
                              <p className="text-[9px] text-muted-foreground font-medium uppercase">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          {/* THE ACTION BUTTON TO SHOW CONTENT */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedLog(n); markAsRead(n.id); }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary hover:text-white transition-all shadow-none"
                          >
                            <Eye className="w-4 h-4" />
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
              <Button variant="ghost" className="h-12 gap-3 px-4 border-l border-muted/40 rounded-none group">
                <div className="relative">
                  <Avatar className="w-9 h-9 border-2 border-background shadow-md group-hover:rotate-3 transition-transform">
                    {user.profile_picture ? (
                      <AvatarImage src={`${API_URL}${user.profile_picture}`} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user.name?.[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-bold truncate w-32 tracking-tight">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground font-black truncate w-32 uppercase tracking-tighter">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl mt-2 overflow-hidden border-muted/40">
              <div className="px-5 py-5 mb-2 rounded-xl bg-muted/40 border border-muted/10 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2"><Timer className="w-3.5 h-3.5 text-primary" /> Session Status</span>
                  <Badge className="h-4 px-1.5 text-[9px] bg-green-500 text-white border-none">Online</Badge>
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-xs font-bold font-mono">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Expires In</p>
                    <p className={cn(progress < 15 && "text-red-500 animate-pulse")}>{timeLeft}</p>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", progress < 15 ? "bg-red-500" : "bg-primary")} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-1 space-y-1">
                <Button variant="ghost" onClick={() => navigate(`/users/edit/${user.id}`)} className="w-full justify-start gap-3 h-11 rounded-xl text-sm font-bold hover:text-primary transition-colors">
                  <Edit className="w-4 h-4 opacity-70" /> Account Settings
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 h-11 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest">
                  <LogOut className="w-4 h-4" /> End Session
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};