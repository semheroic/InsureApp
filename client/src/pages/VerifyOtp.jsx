import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, EyeOff, ShieldCheck, Fingerprint, 
  KeyRound, Lock, CheckCircle2, ArrowLeft 
} from "lucide-react";
import LOGO from "./LOGO.png";

const API_URL = import.meta.env.VITE_API_URL;

const VerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = state?.email;

  const [step, setStep] = useState("otp");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!email) {
      toast({
        title: "Session expired",
        description: "Please request a new OTP.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [email, navigate, toast]);

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast({ title: "OTP required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Invalid OTP",
          description: data.error || "OTP verification failed",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Identity Verified", description: "You can now reset your password." });
      setStep("reset");
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!password || !confirmPassword) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error();

      toast({ title: "Success", description: "Password updated successfully." });
      navigate("/");
    } catch {
      toast({ title: "Reset failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${LOGO})` }}
        />
        <div className="absolute inset-0 bg-slate-950/50" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 transition-all hover:scale-110">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase drop-shadow-md">Bright Insurance Agency</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-semibold">Security Verification</p>
        </div>

        {/* Verification Card with Glassmorphism */}
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150 p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/10">
          {step === "otp" ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-blue-500/20 rounded-full text-blue-400 mb-2">
                  <Fingerprint size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">Verify Your Identity</h2>
                <p className="text-slate-300 text-sm">
                  A verification code has been sent to <br />
                  <span className="font-bold text-white">{email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-300 tracking-wider">6-Digit Code</Label>
                <div className="relative group">
                  <Input
                    placeholder="0 0 0 0 0 0"
                    className="h-14 text-center text-2xl font-black tracking-[0.5em] bg-white/10 border-white/20 text-white rounded-xl focus:ring-blue-500 transition-all"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" 
                onClick={verifyOtp} 
                disabled={loading}
              >
                {loading ? "Verifying..." : "Confirm Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-500/20 rounded-full text-emerald-400 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">New Credentials</h2>
                <p className="text-slate-300 text-sm">Create a strong password to protect your account.</p>
              </div>

              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-300 tracking-wider">New Password</Label>
                  <div className="relative group">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white rounded-xl transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-300 tracking-wider">Confirm New Password</Label>
                  <div className="relative group">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white rounded-xl transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-400"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]" 
                onClick={updatePassword} 
                disabled={loading}
              >
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button 
              onClick={() => navigate("/forgot-password")} 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-blue-400 transition-colors"
            >
              <ArrowLeft size={16} /> Start Over
            </button>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Multi-Factor Authentication • Session Secure
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;