import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* MAIN CONTENT */}
      <main
        className={`
          pt-16
          transition-all duration-300 ease-in-out
          ml-0
          lg:ml-[280px]
        `}
      >
        <div
          className="
            p-3
            sm:p-4
            md:p-6
            lg:p-8
            max-w-[1600px]
            mx-auto
          "
        >
          {children}
        </div>
      </main>
    </div>
  );
};
