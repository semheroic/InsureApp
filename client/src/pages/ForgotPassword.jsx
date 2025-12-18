import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, ArrowLeft, SendHorizontal, LockKeyhole } from "lucide-react";
import LOGO from "./LOGO.png";

const API_BASE = "http://localhost:5000";

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your registered email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Failed to send OTP",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verification Sent",
        description: "A 6-digit security code is on its way to your inbox.",
      });

      navigate("/verify-otp", { state: { email: email.trim() } });
    } catch (err) {
      toast({
        title: "Network error",
        description: "Unable to connect to server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      
      {/* 1. Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${LOGO})` }}
        />
        {/* Dark overlay matching the set */}
        <div className="absolute inset-0 bg-slate-950/50" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 transition-transform hover:scale-110">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase drop-shadow-md">
            SafeInsure
          </h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-semibold">
            Account Recovery
          </p>
        </div>

        {/* 2. Recovery Card with Backdrop Filter */}
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150 p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/10">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <LockKeyhole size={20} />
              <h2 className="text-2xl font-bold text-white">Recover Password</h2>
            </div>
            <p className="text-slate-300 text-sm">
              Don't worry, it happens. Enter your work email and we'll send you an OTP to reset your access.
            </p>
          </div>

          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                Registered Email
              </Label>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" 
              onClick={sendOtp} 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Reset Code <SendHorizontal size={18} />
                </span>
              )}
            </Button>

            <div className="flex justify-center pt-2">
              <button 
                onClick={() => navigate("/")} 
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-blue-400 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Secure Security Protocol • SafeInsure 2.0
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;