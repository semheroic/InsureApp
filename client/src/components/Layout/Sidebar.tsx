import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Compass, ShieldCheck, Users2, BarChart4, 
  ClockAlert, Handshake, History, Megaphone,
  Menu, X // Added for mobile toggle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

export const Sidebar = () => {
  const [counts, setCounts] = useState({ policies: 0, users: 0 });
  const [userRole, setUserRole] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Mobile state

  useEffect(() => {
    axios
      .get(`${API_URL}/auth/me`, { withCredentials: true })
      .then((res) => {
        setUserRole(res.data.role);
        if (res.data.role?.toLowerCase() === "admin") fetchCounts();
      })
      .catch(() => console.log("User Auth Error"));
  }, []);

  const fetchCounts = () => {
    axios
      .get(`${API_URL}/api/sidebar-counts`, { withCredentials: true })
      .then((res) => setCounts(res.data))
      .catch(() => console.log("Sidebar Count Error"));
  };

  const isAdmin = userRole?.toLowerCase() === "admin";
  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { icon: Compass, label: "Overview", path: "/dashboard", showBadge: false },
    { icon: ShieldCheck, label: "Policies", path: "/policies", showBadge: true, count: counts.policies },
    { icon: Users2, label: "Users", path: "/users", showBadge: true, count: counts.users },
  ];

  const reportItems = [
    { icon: BarChart4, label: "Analytics Report", path: "/reports/analytics" },
    { icon: ClockAlert, label: "Expiry Report", path: "/reports/expiry" },
    { icon: Handshake, label: "Follow Ups", path: "/reports/Followups" },
    { icon: History, label: "History Log", path: "/reports/history" },
  ];

  return (
    <>
      {/* Mobile Toggle Button (Visible only on small screens) */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-indigo-600 text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-[280px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col z-50 transition-transform duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
        "lg:translate-x-0", // Always show on Desktop
        isOpen ? "translate-x-0" : "-translate-x-full" // Toggle on Mobile
      )}>
        
        {/* Brand Header */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <span className="text-white font-black text-xl">B</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">Bright Cover</span>
            </div>
          </div>
        </div>

        {/* Navigation - With scrollbar hide and click-to-close on mobile */}
        <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-hide pb-8" onClick={() => setIsOpen(false)}>
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">Management</h3>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                  activeClassName="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    <span>{item.label}</span>
                  </div>
                  {item.showBadge && isAdmin && (
                    <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </section>

          {isAdmin && (
            <section>
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">Partnerships</h3>
              <div className="space-y-1">
                <NavLink
                  to="/ad-manager"
                  className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                  activeClassName="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20"
                >
                  <Megaphone className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  <span>Ad Manager</span>
                </NavLink>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">Intelligence</h3>
            <div className="space-y-1">
              {reportItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                  activeClassName="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20"
                >
                  <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </section>
        </nav>

        {/* User Quick Info */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase ring-4 ring-white dark:ring-slate-950">
              {userRole?.substring(0, 2) || 'AD'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize truncate">{userRole || 'Admin'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verified Profile</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};