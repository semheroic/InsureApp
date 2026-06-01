import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  ArrowLeft,
  SendHorizontal,
  LockKeyhole,
  Building2,
  KeyRound,
} from "lucide-react";
import LOGO from "./LOGO.png";
import LOGO_MARK from "@/components/Layout/newlogo.PNG";

const API_URL = import.meta.env.VITE_API_URL;

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
      const res = await fetch(`${API_URL}/auth/send-otp`, {
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
    } catch {
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
                    Account Recovery
                  </h1>
                </div>
              </div>

              <div className="mt-16 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f7a777]">
                  Security Reset
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight">
                  Recover staff access without leaving the secure portal.
                </h2>
                <p className="mt-5 text-sm leading-6 text-slate-200">
                  Enter your registered work email and receive a one-time code for password reset verification.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-3 text-xs text-slate-200">
              {["Email Verified", "OTP Protected"].map((item) => (
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
                <h1 className="text-lg font-semibold">Account Recovery</h1>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                <Building2 className="h-4 w-4 text-[#f28a57]" />
                Staff Verification
              </div>
              <div className="mb-3 flex items-center gap-2 text-[#0f2f46]">
                <LockKeyhole className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Password Reset
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Reset your password
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter your registered staff email and we will send a 6-digit reset code.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendOtp();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  Registered Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="name@brightcoveragency.com"
                    className="h-12 rounded-md border-slate-300 bg-white pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46] disabled:opacity-60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-md bg-[#0f2f46] font-semibold text-white shadow-sm hover:bg-[#123a57]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending Code...
                  </span>
                ) : (
                  <>
                    Send Reset Code <SendHorizontal className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <KeyRound className="h-4 w-4 text-slate-400" />
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-semibold text-[#0f2f46] underline-offset-4 hover:underline"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
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

export default ForgotPassword;
