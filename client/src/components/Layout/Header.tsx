import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  LogOut,
  CheckCircle,
  MailOpen,
  Mail,
  Trash2,
  Edit,
  MessageSquare,
  History,
  Check,
  ChevronDown,
  ChevronUp,
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

const API_URL = "http://localhost:5000";

type User = {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
};

type Notification = {
  id: number;
  phone_number: string;
  message: string;
  is_read: number;
  created_at: string;
  expanded?: boolean;
};

export const Header = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({ id: 0, name: "", email: "" });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  // Character limit for "Show More" logic
  const MESSAGE_LIMIT = 90;

  const prevUnreadRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.wav");
    audioRef.current.volume = 0.6;
    audioRef.current.load();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: User) => setUser(data))
      .catch(() => navigate("/"));
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/sms/logs`, { credentials: "include" });
      const data = await res.json();
      const logs: Notification[] = data.logs || [];
      const unread = logs.filter((n) => n.is_read === 0).length;

      if (unread > prevUnreadRef.current) {
        setHasNewAlert(true);
        audioRef.current?.play().catch(() => {});
        setTimeout(() => setHasNewAlert(false), 1800);
      }

      prevUnreadRef.current = unread;
      setNotifications(logs);
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    await fetch(`${API_URL}/sms/mark-read`, { method: "PUT", credentials: "include" });
    setNotifications((n) => n.map((x) => ({ ...x, is_read: 1 })));
    setUnreadCount(0);
  };

  const toggleRead = async (id: number, read: boolean) => {
    const url = read ? `${API_URL}/sms/mark-read` : `${API_URL}/sms/mark-unread/${id}`;
    await fetch(url, { method: "PUT", credentials: "include" });
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, is_read: read ? 1 : 0 } : x)));
    setUnreadCount((c) => Math.max(0, read ? c - 1 : c + 1));
  };

  const deleteNotification = async (id: number) => {
    if (!confirm("Delete log?")) return;
    await fetch(`${API_URL}/sms/delete/${id}`, { method: "DELETE", credentials: "include" });
    setNotifications((n) => n.filter((x) => x.id !== id));
  };

  const toggleExpand = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, expanded: !n.expanded } : n))
    );
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/");
  };

  const filteredNotifications = useMemo(() => {
    const q = search.toLowerCase();
    return notifications.filter(
      (n) => n.message.toLowerCase().includes(q) || n.phone_number.includes(q)
    );
  }, [notifications, search]);

  const visibleNotifications = showAllLogs ? filteredNotifications : filteredNotifications.slice(0, 5);

  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 border-b bg-background/95 backdrop-blur-md z-50">
      <div className="h-full px-6 flex justify-between items-center">
        
        {/* SEARCH BAR */}
        <div className="max-w-md w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Quick search..." className="pl-10 bg-muted/40 border-none h-10 rounded-xl" />
        </div>

        <div className="flex items-center gap-1">
          {/* NOTIFICATIONS DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("relative w-10 h-10 rounded-xl", hasNewAlert && "ring-2 ring-primary/20 animate-pulse")}>
                <Bell className={cn("w-5 h-5 text-muted-foreground", hasNewAlert && "text-primary")} />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary border-2 border-background" />}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-2xl rounded-2xl border-muted/60 overflow-hidden">
              <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
                <h3 className="font-bold text-sm">System Notifications</h3>
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs text-primary">Mark read</Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {filteredNotifications.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground">No recent logs</div>
                ) : (
                  visibleNotifications.map((n) => {
                    const isLong = n.message.length > MESSAGE_LIMIT;
                    return (
                      <div key={n.id} className={cn("p-4 border-b border-muted/30 transition-all hover:bg-muted/20", !n.is_read && "bg-primary/[0.02] border-l-2 border-l-primary")}>
                        <div className="flex gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", n.is_read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[11px] font-bold">{n.phone_number}</span>
                              <span className="text-[10px] text-muted-foreground italic">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            {/* MESSAGE TEXT WITH SHOW MORE/LESS */}
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {n.expanded || !isLong ? n.message : `${n.message.substring(0, MESSAGE_LIMIT)}...`}
                            </p>
                            
                            {isLong && (
                              <button 
                                onClick={() => toggleExpand(n.id)} 
                                className="text-[10px] font-bold text-primary mt-1 flex items-center gap-0.5 hover:underline"
                              >
                                {n.expanded ? <><ChevronUp className="w-3 h-3"/> Show Less</> : <><ChevronDown className="w-3 h-3"/> Show More</>}
                              </button>
                            )}

                            <div className="mt-3 flex gap-2">
                               <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => toggleRead(n.id, n.is_read === 0)}>
                                 {n.is_read ? <Mail className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                               </Button>
                               <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                                 <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* USER PROFILE SECTION */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 gap-3 px-4 border-l rounded-none hover:bg-muted/50 group transition-all">
                <div className="relative">
                  <Avatar className="w-9 h-9 border-2 border-background shadow-sm">
                    {user.profile_picture ? (
                      <AvatarImage src={`${API_URL}${user.profile_picture}`} />
                    ) : (
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-background flex items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 border border-background shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  </span>
                </div>

                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight font-medium">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl border-muted/60 rounded-xl">
              <div className="px-3 py-3 mb-2 rounded-lg bg-muted/30 border border-muted/10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-green-500/10 text-green-600 border-green-200 uppercase font-bold">Live</Badge>
                </div>
                <p className="text-xs font-bold text-foreground truncate">{user.email}</p>
                <p className="text-[10px] text-muted-foreground font-medium italic mt-1 flex items-center gap-1">
                  <History className="w-3 h-3" /> Logged in: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="space-y-0.5">
                <DropdownMenuItem onClick={() => navigate(`/users/edit/${user.id}`)} className="gap-3 cursor-pointer py-2.5 rounded-lg font-medium text-sm">
                  <Edit className="w-4 h-4 opacity-70" /> Edit Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="gap-3 cursor-pointer py-2.5 rounded-lg text-destructive font-medium text-sm">
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};