import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  LogOut,
  Trash2,
  Edit,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MailOpen,
  Sun,
  Moon,
  Timer,
  CheckCircle2,
  Inbox,
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

  // --- STATES ---
  const [user, setUser] = useState({ id: 0, name: "", email: "", profile_picture: "" });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(100);

  // --- THEME ---
  useEffect(() => {
    const root = window.document.documentElement;
    theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- DATA FETCH ---
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => navigate("/"));
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/sms/logs`, { credentials: "include" });
      const data = await res.json();
      const logs = data.logs || [];
      setNotifications(logs);
      setUnreadCount(logs.filter((n: any) => n.is_read === 0).length);
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    localStorage.removeItem("login_time");
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/");
  };

  // --- SESSION TIMER ---
  useEffect(() => {
    let loginTimestamp = localStorage.getItem("login_time") || Date.now().toString();
    if (!localStorage.getItem("login_time")) localStorage.setItem("login_time", loginTimestamp);
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
    return notifications.filter((n: any) => n.message.toLowerCase().includes(search.toLowerCase()));
  }, [notifications, search]);

  const visibleNotifications = showAllLogs ? filteredNotifications : filteredNotifications.slice(0, 4);

  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 border-b bg-background/80 backdrop-blur-xl z-50 transition-all duration-300">
      <div className="h-full px-6 flex justify-between items-center">
        
        {/* SEARCH */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted/40 border-none h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl shrink-0 border border-transparent hover:border-muted-foreground/10">
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          
          {/* MODERN NOTIFICATIONS DROPDOWN */}
          <DropdownMenu onOpenChange={(open) => !open && setShowAllLogs(false)}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("relative w-10 h-10 rounded-xl transition-all", unreadCount > 0 && "bg-primary/5 hover:bg-primary/10")}>
                <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[420px] p-0 rounded-3xl border-muted/40 bg-popover shadow-2xl overflow-hidden mt-2">
              <div className="p-5 bg-gradient-to-r from-primary/10 via-transparent to-transparent border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-foreground">Activity Feed</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">You have {unreadCount} unread alerts</p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/5">Mark All</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold rounded-lg text-muted-foreground hover:text-destructive">Clear</Button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                {visibleNotifications.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Inbox className="w-6 h-6 text-muted-foreground opacity-40" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium italic">Everything is up to date.</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-1">
                    {visibleNotifications.map((n: any) => (
                      <div key={n.id} className={cn(
                        "group relative flex gap-4 p-3 rounded-2xl transition-all cursor-pointer",
                        n.is_read ? "opacity-70 grayscale-[0.5] hover:bg-muted/30" : "bg-primary/[0.03] hover:bg-primary/[0.06] border border-primary/5"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          n.is_read ? "bg-muted border-muted-foreground/10" : "bg-primary/10 border-primary/20"
                        )}>
                          {n.is_read ? <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> : <AlertCircle className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[11px] font-black tracking-tight text-foreground">{n.phone_number}</span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug line-clamp-2 group-hover:line-clamp-none transition-all">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="ghost" className="w-full h-12 text-[11px] font-black text-primary border-t rounded-none hover:bg-primary/5 gap-2 uppercase tracking-widest" onClick={() => setShowAllLogs(!showAllLogs)}>
                {showAllLogs ? <><ChevronUp className="w-4 h-4" /> Show Less</> : <><ChevronDown className="w-4 h-4" /> View History</>}
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* PROFILE */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 gap-3 px-4 border-l border-muted/40 rounded-none hover:bg-muted/50 transition-all group">
                <div className="relative">
                  <Avatar className="w-9 h-9 border-2 border-background shadow-md transition-transform group-hover:rotate-3">
                    {user.profile_picture ? (
                      <AvatarImage src={`${API_URL}${user.profile_picture}`} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user.name?.[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
                <div className="text-left hidden lg:block overflow-hidden">
                  <p className="text-sm font-bold text-foreground leading-tight truncate w-32">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight truncate w-32">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-3xl border-muted/40 bg-popover shadow-2xl mt-2">
              <div className="px-5 py-5 mb-2 rounded-2xl bg-muted/40 border border-muted/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-primary" /> Security Session
                  </span>
                  <Badge className={cn("h-4 px-1.5 text-[9px] font-black uppercase tracking-tighter", progress < 15 ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600")}>Online</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-xs font-bold">
                    <p className="text-[10px] text-muted-foreground font-bold">EXPIRES IN:</p>
                    <p className={cn("font-mono text-sm tracking-tighter", progress < 15 && "text-red-500 animate-pulse")}>{timeLeft}</p>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", progress < 15 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-primary")} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-1 gap-1 flex flex-col">
                <Button variant="ghost" onClick={() => navigate(`/users/edit/${user.id}`)} className="justify-start gap-3 h-11 rounded-xl text-sm font-medium hover:bg-primary/5 hover:text-primary transition-all">
                  <Edit className="w-4 h-4 opacity-70" /> Account Profile
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="justify-start gap-3 h-11 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all">
                  <LogOut className="w-4 h-4" /> End Current Session
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};