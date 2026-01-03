import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ChevronRight, ArrowRight } from "lucide-react";
import LOGO from "./LOGO.png";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

const API_URL = import.meta.env.VITE_API_URL;

  // Check if user is already logged in on mount
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          // If the server says we are logged in, go to dashboard
          navigate("/dashboard");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      return toast({
        title: "Missing Fields",
        description: "Email and password are required.",
        variant: "destructive",
      });
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        return toast({
          title: "Login Failed",
          description: data.error || "Invalid email or password.",
          variant: "destructive",
        });
      }

      // SUCCESS: The session cookie is now set in the browser automatically.
      // We don't need to store the role in localStorage because our 
      // Dashboard will fetch the role from /auth/me when it loads.
      
      toast({ 
        title: "Welcome back!", 
        description: `Access granted as ${data.role}.` 
      });
      
      navigate("/dashboard");
    } catch {
      toast({
        title: "Network Error",
        description: "Unable to connect to server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      
      {/* 1. Background Image Layer (Clearer background) */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${LOGO})` }}
        />
        {/* Darker overlay to make white text readable, but no blur here */}
        <div className="absolute inset-0 bg-slate-950/40" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase drop-shadow-md">
            Bright Insurance Agency
          </h1>
          <p className="text-slate-200 text-sm mt-1 uppercase tracking-widest font-semibold drop-shadow-sm">
            Authorized Personnel Only
          </p>
        </div>

        {/* 2. Login Card with Backdrop Filter */}
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150 p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-slate-300 text-sm">Please enter your credentials.</p>
          </div>

          <div className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-300 tracking-wider">Work Email</Label>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase text-slate-300 tracking-wider">Secret Password</Label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  Fortget Password?
                </Link>
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl focus:ring-blue-500 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" 
              onClick={handleLogin} 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Login to Dashboard"}
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-300">
              New to the system?{" "}
              <Link to="/signup" className="text-blue-400 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Internal Use Only • Encrypted Session
        </p>
      </div>
    </div>
  );
};

export default Login;