import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Sidebar />
      <Header />
      <main className="ml-[280px] pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
