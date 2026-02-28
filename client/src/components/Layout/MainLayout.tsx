import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on window resize if it's open (Prevents layout glitches)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Sidebar - Controlled internally or via props */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header - Glass effect added */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* MAIN CONTENT AREA */}
      <main
        className={cn(
          "min-h-screen pt-20 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "ml-0 lg:ml-[280px]" // Static margin for desktop
        )}
      >
        {/* Animated Wrapper for Page Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.22, 1, 0.36, 1],
              staggerChildren: 0.1 
            }}
            className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto"
          >
            {/* Inner Content Glass Card (Optional - remove if you want edge-to-edge) */}
            <div className="relative">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Overlay - High-end Blur */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-[40] lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>
    </div>
  );
};