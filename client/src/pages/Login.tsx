import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import LOGO from "./LOGO.png";
import LOGO_MARK from "@/components/Layout/newlogo.PNG";

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

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          navigate(user.role?.toLowerCase() === "admin" ? "/admin/activity" : "/dashboard");
        }
      })
      .catch(() => {});
  }, [API_URL, navigate]);

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

      toast({
        title: "Welcome back!",
        description: `Access granted as ${data.role}.`,
      });

      localStorage.setItem("login_time", Date.now().toString());
      navigate(data.role?.toLowerCase() === "admin" ? "/admin/activity" : "/dashboard");
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
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-100 text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#dbe4ef_100%)]" />
      <img
        src={LOGO}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-8 hidden w-[780px] opacity-[0.04] lg:block"
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-[#f28a57]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden bg-[#0f2f46] p-10 text-white md:flex">
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(15,47,70,0.95),rgba(11,28,43,0.98))]" />
            <img
              src={LOGO}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-40 bottom-16 w-[680px] opacity-[0.08]"
            />

            <div className="relative">
              <div className="flex items-center gap-4">
                <img
                  src={LOGO_MARK}
                  alt="Bright Cover Agency logo"
                  className="h-16 w-16 rounded-md border border-white/15 bg-slate-950 object-contain p-1.5 shadow-lg"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f7a777]">
                    Bright Cover Agency
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                    Policy Administration System
                  </h1>
                </div>
              </div>

              <div className="mt-16 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f7a777]">
                  Official Access Portal
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight">
                  Secure insurance operations for authorized staff.
                </h2>
                <p className="mt-5 text-sm leading-6 text-slate-200">
                  Manage policies, users, reports, follow-ups, notifications, and sponsor content from one controlled workspace.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-3 text-xs text-slate-200">
              {["Session Protected", "Role Based", "Audit Ready"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <ShieldCheck className="mb-2 h-4 w-4 text-[#f7a777]" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[640px] flex-col justify-center px-5 py-8 sm:px-8 lg:px-12">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <img
                src={LOGO_MARK}
                alt="Bright Cover Agency logo"
                className="h-12 w-12 rounded-md border border-slate-200 bg-slate-950 object-contain p-1"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f2f46]">
                  Bright Cover Agency
                </p>
                <h1 className="text-lg font-semibold">Policy Administration</h1>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                <Building2 className="h-4 w-4 text-[#f28a57]" />
                Staff Verification
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Use your registered staff email and password.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="name@brightcoveragency.com"
                    className="h-12 rounded-md border-slate-300 bg-white pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#0f2f46] underline-offset-4 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="********"
                    className="h-12 rounded-md border-slate-300 bg-white pl-11 pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46]"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0f2f46]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-md bg-[#0f2f46] font-semibold text-white shadow-sm hover:bg-[#123a57]"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Continue to Workspace"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-600">
                New staff member?{" "}
                <Link to="/signup" className="font-semibold text-[#0f2f46] underline-offset-4 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>

            <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {new Date().getFullYear()} Bright Cover Agency. All rights reserved.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
