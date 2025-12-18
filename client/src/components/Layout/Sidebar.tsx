import { useEffect, useState } from "react";
import axios from "axios";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  FileClock, 
  MessageSquare, 
  History 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

export const Sidebar = () => {
  const [counts, setCounts] = useState({
    policies: 0,
    users: 0,
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/sidebar-counts")
      .then((res) => setCounts(res.data))
      .catch(() => console.log("Sidebar Count Error"));
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/dashboard", showBadge: false },
    { icon: FileText, label: "Policies", path: "/policies", showBadge: true, count: counts.policies },
    { icon: Users, label: "Users", path: "/users", showBadge: true, count: counts.users },
  ];

  const reportItems = [
    { icon: BarChart3, label: "Analytics Report", path: "/reports/analytics" },
    { icon: FileClock, label: "Expiry Report", path: "/reports/expiry" }, // Changed to FileClock
    { icon: MessageSquare, label: "Follow Ups", path: "/reports/Followups" }, // Changed to MessageSquare
    { icon: History, label: "History ", path: "/reports/history" }, // Changed to History
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] border-r border-border bg-background flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <span className="font-bold text-xl text-foreground">Bright Insurance Agency</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {/* Menu */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3 px-3">Menu</p>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>

                {item.showBadge && (
                  <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Reports */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3 px-3">Reports</p>
          <div className="space-y-1">
            {reportItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};
