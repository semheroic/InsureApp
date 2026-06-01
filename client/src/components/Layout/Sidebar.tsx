import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Compass,
  ShieldCheck,
  Users2,
  BarChart4,
  Activity,
  ClockAlert,
  Handshake,
  History,
  Megaphone,
  MessageSquareText,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useChatLauncher } from "@/contexts/ChatLauncherContext";
import LOGO_MARK from "@/components/Layout/newlogo.PNG";

const API_URL = import.meta.env.VITE_API_URL;

const getWsUrl = () =>
  API_URL.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws"));

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

// ── White bordered badge — Policies & Users counts ────────────────────────
const CountBadge = ({ value }: { value: number }) => (
  <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
    {value}
  </span>
);

// ── Indigo pill — unread messages badge ───────────────────────────────────
const UnreadBadge = ({ value }: { value: number }) => {
  if (value <= 0) return null;
  return (
    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg min-w-[20px] text-center tabular-nums">
      {value > 99 ? "99+" : value}
    </span>
  );
};

// ── Icon with dot indicator ───────────────────────────────────────────────
const IconWithDot = ({
  icon: Icon,
  showDot,
}: {
  icon: React.ElementType;
  showDot: boolean;
}) => (
  <div className="relative">
    <Icon
      className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
      strokeWidth={2}
    />
    {showDot && (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
    )}
  </div>
);

export const Sidebar = (_props: SidebarProps) => {
  const [counts, setCounts]           = useState({ policies: 0, users: 0 });
  const [userRole, setUserRole]       = useState("");
  const [userId, setUserId]           = useState<number | null>(null);
  const [isOpen, setIsOpen]           = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef   = useRef(true);

  const { openChat } = useChatLauncher();

  // ── Fetch total unread count from all conversations ───────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/conversations`, {
        withCredentials: true,
      });
      const total: number = (res.data.conversations ?? []).reduce(
        (sum: number, c: { unread_count: number }) =>
          sum + (c.unread_count ?? 0),
        0
      );
      if (mountedRef.current) setUnreadCount(total);
    } catch {
      // non-critical
    }
  }, []);

  // ── WebSocket — every role connects ──────────────────────────────────────
  const connectWs = useCallback(
    (currentUserId: number) => {
      const connect = () => {
        if (!mountedRef.current) return;

        const ws = new WebSocket(`${getWsUrl()}/chat`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (reconnectRef.current) {
            clearTimeout(reconnectRef.current);
            reconnectRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const payload = JSON.parse(event.data);

            // Increment when a new message arrives for THIS user
            if (
              payload.type === "chat:message" &&
              payload.message?.recipient_id === currentUserId
            ) {
              setUnreadCount((n) => n + 1);
            }

            // Re-fetch when someone reads our messages
            if (payload.type === "chat:read") {
              fetchUnreadCount();
            }
          } catch {
            // ignore malformed frames
          }
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          reconnectRef.current = setTimeout(() => connect(), 4000);
        };

        ws.onerror = () => ws.close();
      };

      connect();
    },
    [fetchUnreadCount]
  );

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    axios
      .get(`${API_URL}/auth/me`, { withCredentials: true })
      .then((res) => {
        if (!mountedRef.current) return;

        const role   = res.data.role ?? "";
        const uid    = res.data.id   ?? null;
        const roleLC = role.toLowerCase();

        setUserRole(role);
        setUserId(uid);

        // Sidebar policy/user counts — admin & manager only
        if (roleLC === "admin" || roleLC === "manager") {
          axios
            .get(`${API_URL}/api/sidebar-counts`, { withCredentials: true })
            .then((r) => { if (mountedRef.current) setCounts(r.data); })
            .catch(() => {});
        }

        // All roles get unread count + WebSocket
        if (uid) {
          fetchUnreadCount();
          connectWs(uid);
        }
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs, fetchUnreadCount]);

  // ── Derived flags ─────────────────────────────────────────────────────────
  const roleLC       = userRole?.toLowerCase();
  const isAdmin      = roleLC === "admin";
  const isManager    = roleLC === "manager";
  const isUser       = !isAdmin && !isManager;
  const canSeeCounts = isAdmin || isManager;

  // ── Open chat + refresh badge after user reads messages ───────────────────
  const handleOpenChat = useCallback(() => {
    setIsOpen(false);
    openChat();
    setTimeout(() => fetchUnreadCount(), 1500);
  }, [openChat, fetchUnreadCount]);

  // ── Report items ──────────────────────────────────────────────────────────
  const reportItems = [
    { icon: BarChart4,     label: "Analytics Report", path: "/reports/analytics" },
    { icon: ClockAlert,    label: "Expiry Report",    path: "/reports/expiry"    },
    { icon: Handshake,     label: "Follow Ups",       path: "/reports/Followups" },
    { icon: History,       label: "History Log",      path: "/reports/history"   },
    { icon: AlertTriangle, label: "Failed Imports",   path: "/failed-imports"    },
  ];

  // ── Shared class strings ──────────────────────────────────────────────────
  const navCls =
    "group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200";
  const activeCls =
    "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20";
  const btnCls =
    "group flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-indigo-600 text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-[280px] z-50",
          "border-r border-slate-200 dark:border-slate-800",
          "bg-white dark:bg-slate-950 flex flex-col",
          "shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          "transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md border border-slate-200 bg-slate-950 p-1 shadow-lg dark:border-slate-800">
              <img
                src={LOGO_MARK}
                alt="Bright Cover Agency logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              Bright Cover
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-hide pb-8"
          onClick={() => setIsOpen(false)}
        >
          {/* ── Management ───────────────────────────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">
              Management
            </h3>
            <div className="space-y-1">

              {/* Overview — no badge, all roles */}
              <NavLink to="/dashboard" className={navCls} activeClassName={activeCls}>
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  <span>Overview</span>
                </div>
              </NavLink>

              {/* Policies — white bordered count, admin + manager only */}
              <NavLink to="/policies" className={navCls} activeClassName={activeCls}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  <span>Policies</span>
                </div>
                {canSeeCounts && <CountBadge value={counts.policies} />}
              </NavLink>

              {/* Users — white bordered count, admin + manager only */}
              <NavLink to="/users" className={navCls} activeClassName={activeCls}>
                <div className="flex items-center gap-3">
                  <Users2 className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  <span>Users</span>
                </div>
                {canSeeCounts && <CountBadge value={counts.users} />}
              </NavLink>

              {/* ── ADMIN: User Tracking with unread badge ─────────────── */}
              {isAdmin && (
                <NavLink to="/admin/activity" className={navCls} activeClassName={activeCls}>
                  <div className="flex items-center gap-3">
                    <IconWithDot icon={Activity} showDot={unreadCount > 0} />
                    <span>User Tracking</span>
                  </div>
                  <UnreadBadge value={unreadCount} />
                </NavLink>
              )}

              {/* ── MANAGER: Live Chat button with unread badge ─────────── */}
              {isManager && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenChat(); }}
                  className={btnCls}
                >
                  <div className="flex items-center gap-3">
                    <IconWithDot icon={MessageSquareText} showDot={unreadCount > 0} />
                    <span>Live Chat</span>
                  </div>
                  <UnreadBadge value={unreadCount} />
                </button>
              )}

              {/* ── USER: Live Chat button, no badge ───────────────────── */}
              {isUser && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenChat(); }}
                  className={btnCls}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    <span>Live Chat</span>
                  </div>
                </button>
              )}

            </div>
          </section>

          {/* ── Partnerships (admin only) ─────────────────────────────────── */}
          {isAdmin && (
            <section>
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">
                Partnerships
              </h3>
              <div className="space-y-1">
                <NavLink to="/ad-manager" className={navCls} activeClassName={activeCls}>
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    <span>Ad Manager</span>
                  </div>
                </NavLink>
              </div>
            </section>
          )}

          {/* ── Intelligence ─────────────────────────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">
              Intelligence
            </h3>
            <div className="space-y-1">
              {reportItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(navCls, "justify-start")}
                  activeClassName={activeCls}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          </section>

        </nav>

        {/* User footer */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase ring-4 ring-white dark:ring-slate-950">
              {userRole?.substring(0, 2) || "AD"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize truncate">
                {userRole || "Admin"}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Verified Profile
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
