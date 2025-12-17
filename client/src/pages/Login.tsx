import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ChevronRight, ArrowRight } from "lucide-react";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const API_BASE = "http://localhost:5000";
  const bgImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop";

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => res.ok && navigate("/dashboard"))
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
      const response = await fetch(`${API_BASE}/auth/login`, {
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

      toast({ title: "Welcome back!", description: "Access granted." });
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 transform hover:rotate-3 transition-transform">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">SafeInsure</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-semibold">Authorized Personnel Only</p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Please enter your credentials to manage policies.</p>
          </div>

          <div className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Work Email</Label>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Secret Password</Label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Reset Password?
                </Link>
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
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
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Login to Dashboard <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              New to the system?{" "}
              <a href="/signup" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                Create Staff Account <ChevronRight size={14} />
              </a>
            </p>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Internal Use Only • Encrypted Session
        </p>
      </div>
    </div>
  );
};

export default Login;