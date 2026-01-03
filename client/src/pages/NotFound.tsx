import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="relative flex flex-col items-center text-center">
        
        {/* Animated Icon Layer */}
        <div className="relative mb-8">
          {/* Background decorative glow */}
          <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl animate-pulse" />
          
          <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-muted/50 border shadow-inner overflow-hidden">
             {/* Main bouncing icon */}
            <FileQuestion className="h-16 w-16 text-primary animate-bounce" />
            
            {/* Small floating search icon */}
            <Search className="absolute top-4 right-4 h-5 w-5 text-muted-foreground animate-pulse" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tighter text-muted/30">
            404
          </h1>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lost in the digital void?
          </h2>
          <p className="mx-auto max-w-[400px] text-muted-foreground">
            We couldn't find the page <span className="font-mono text-primary bg-primary/5 px-1 rounded">"{location.pathname}"</span>. 
            It might have been moved, deleted, or never existed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="default" className="px-8 shadow-lg shadow-primary/20">
            <Link to="/dashboard" className="gap-2">
              <Home size={18} />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="px-8">
            <Link to="/" className="gap-2">
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </Button>
        </div>

        {/* Subtle Footer Decoration */}
        <div className="mt-20 flex gap-4 opacity-20">
            <div className="h-1 w-12 rounded-full bg-primary" />
            <div className="h-1 w-4 rounded-full bg-primary" />
            <div className="h-1 w-1 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;