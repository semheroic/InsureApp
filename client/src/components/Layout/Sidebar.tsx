import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Compass,      
  ShieldCheck,  
  Users2,       
  BarChart4,    
  ClockAlert,   
  Handshake,    
  History       
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

export const Sidebar = () => {
  const [counts, setCounts] = useState({
    policies: 0,
    users: 0,
  });
  
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/auth/me`, { withCredentials: true })
      .then((res) => {
        setUserRole(res.data.role);
        if (res.data.role?.toLowerCase() === "admin") {
          fetchCounts();
        }
      })
      .catch(() => console.log("User Auth Error in Sidebar"));
  }, []);

  const fetchCounts = () => {
    axios
      .get(`${API_URL}/api/sidebar-counts`, { withCredentials: true })
      .then((res) => setCounts(res.data))
      .catch(() => console.log("Sidebar Count Error"));
  };

  const isAdmin = userRole?.toLowerCase() === "admin";

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
    <aside className="fixed left-0 top-0 h-screen w-[280px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col z-50 transition-colors duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* Brand Header */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <span className="text-white font-black text-xl">B</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">Bright Cover
            Agency</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-hide">
        {/* Management Group */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">
            Management
          </h3>
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

        {/* Intelligence Group */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">
            Intelligence
          </h3>
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
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[24px] p-4 flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase ring-4 ring-white dark:ring-slate-950">
            {userRole?.substring(0, 2) || 'AD'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">{userRole || 'Admin'}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verified Profile </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
