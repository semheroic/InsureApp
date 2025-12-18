import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, LogOut, Edit, ChevronDown, ChevronUp,
  AlertCircle, Sun, Moon, Timer, CheckCircle2, Inbox,
  Check, Eye, MoreHorizontal
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
  const [user, setUser] = useState({ id: 0, name: "", email: "", profile_picture: "", role: "" });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(100);

  // --- THEME LOGIC ---
  useEffect(() => {
    const root = window.document.documentElement;
    theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- DATA FETCHING ---
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/sms/logs`, { credentials: "include" });
      const data = await res.json();
      const logs = data.logs || [];
      setNotifications(logs);
      setUnreadCount(logs.filter((n: any) => n.is_read === 0).length);
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

  // --- ACTIONS ---
  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/sms/logs/${id}/read`, { method: "PUT", credentials: "include" });
      fetchNotifications();
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

  // --- FILTERING ---
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n: any) => {
      const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === "all" || n.is_read === 0;
      return matchesSearch && matchesTab;
    });
  }, [notifications, search, activeTab]);

  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 border-b bg-background/80 backdrop-blur-xl z-50 transition-all duration-300">
      <div className="h-full px-6 flex justify-between items-center">
        
        {/* SEARCH & THEME */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search logs..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 bg-muted/40 border-none h-10 rounded-xl" 
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl shrink-0">
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          
          {/* NOTIFICATIONS DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("relative w-10 h-10 rounded-xl transition-all", unreadCount > 0 && "bg-primary/5")}>
                <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[400px] p-0 rounded-2xl border-muted/40 bg-popover shadow-2xl mt-2 overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm">Activity Feed</h3>
                  <Badge variant="outline" className="text-[10px]">{unreadCount} New</Badge>
                </div>
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                  <button onClick={() => setActiveTab("all")} className={cn("flex-1 text-[10px] font-bold py-1 rounded-md", activeTab === "all" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}>ALL</button>
                  <button onClick={() => setActiveTab("unread")} className={cn("flex-1 text-[10px] font-bold py-1 rounded-md", activeTab === "unread" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}>UNREAD</button>
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-muted/10">
                {filteredNotifications.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-xs italic"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-20" /> No alerts found.</div>
                ) : (
                  filteredNotifications.map((n: any) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={cn("p-4 flex gap-3 cursor-pointer hover:bg-muted/30 transition-all", !n.is_read && "bg-primary/[0.02]")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", !n.is_read ? "bg-primary/10 text-primary" : "bg-muted")}>
                        {n.is_read ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[11px] font-bold truncate">{n.phone_number}</p>
                          <span className="text-[9px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={cn("text-xs line-clamp-2", n.is_read ? "text-muted-foreground" : "text-foreground font-medium")}>{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* PROFILE DROPDOWN */}
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
                  <p className="text-sm font-bold truncate w-32">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate w-32">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl mt-2">
              <div className="px-5 py-5 mb-2 rounded-xl bg-muted/40 border border-muted/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2"><Timer className="w-3.5 h-3.5 text-primary" /> Session Status</span>
                  <Badge className="h-4 px-1.5 text-[9px] bg-green-500/10 text-green-600">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <p className="text-[10px] text-muted-foreground">EXPIRES IN:</p>
                    <p className={cn("font-mono", progress < 15 && "text-red-500 animate-pulse")}>{timeLeft}</p>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all", progress < 15 ? "bg-red-500" : "bg-primary")} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-1 space-y-1">
                <Button variant="ghost" onClick={() => navigate(`/users/edit/${user.id}`)} className="w-full justify-start gap-3 h-11 rounded-xl text-sm hover:text-primary">
                  <Edit className="w-4 h-4 opacity-70" /> Account Settings
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 h-11 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10">
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