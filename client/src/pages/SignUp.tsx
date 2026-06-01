import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  ChevronRight,
  Building2,
} from "lucide-react";
import LOGO from "./LOGO.png";
import LOGO_MARK from "@/components/Layout/newlogo.PNG";

const AddUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "User",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const validateInput = () => {
    const rwPhoneRegex = /^(\+?250|0)7[2389][0-9]{7}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Full name is required.", variant: "destructive" });
      return false;
    }

    if (!emailRegex.test(formData.email.trim())) {
      toast({ title: "Invalid Email", description: "Enter a valid email address.", variant: "destructive" });
      return false;
    }

    if (!rwPhoneRegex.test(formData.phone.trim())) {
      toast({
        title: "Invalid Phone Number",
        description: "Enter a valid Rwandan number, for example 078... or +25078...",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleAdd = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!validateInput()) return;
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("email", formData.email.trim());
      formDataToSend.append("phone", formData.phone.trim());
      formDataToSend.append("password", formData.password);
      formDataToSend.append("role", formData.role);

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("Server Error Response:", errorText);
        throw new Error("The server returned an unexpected response.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user.");

      toast({ title: "Success", description: "Account created successfully." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        className="pointer-events-none absolute -right-44 top-12 hidden w-[820px] opacity-[0.04] lg:block"
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-[#f28a57]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-[#0f2f46] p-10 text-white md:flex">
            <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(15,47,70,0.96),rgba(10,25,39,0.98))]" />
            <img
              src={LOGO}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -left-36 bottom-20 w-[620px] opacity-[0.08]"
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
                    Staff Registration
                  </h1>
                </div>
              </div>

              <div className="mt-16 max-w-sm">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f7a777]">
                  Account Intake
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight">
                  Create controlled access for insurance operations.
                </h2>
                <p className="mt-5 text-sm leading-6 text-slate-200">
                  New accounts enter the policy workspace with a defined role and auditable activity history.
                </p>
              </div>
            </div>

            <div className="relative space-y-3 text-sm text-slate-200">
              <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3">
                <Activity className="h-5 w-5 text-[#f7a777]" />
                <span className="font-semibold">Activity tracking enabled</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3">
                <ShieldCheck className="h-5 w-5 text-[#f7a777]" />
                <span className="font-semibold">Role-based permissions</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-[680px] flex-col justify-center px-5 py-8 sm:px-8 lg:px-12">
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
                <h1 className="text-lg font-semibold">Staff Registration</h1>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                <Building2 className="h-4 w-4 text-[#f28a57]" />
                New Account
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Register staff access
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter verified contact details for the policy administration workspace.
              </p>
            </div>

            <form onSubmit={handleAdd} className="grid gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  Full Name
                </Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-12 rounded-md border-slate-300 bg-white pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46]"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      className="h-12 rounded-md border-slate-300 bg-white pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46]"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                    Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-12 rounded-md border-slate-300 bg-white pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46]"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+250..."
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-md border-slate-300 bg-white pl-11 pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#0f2f46]"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="********"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0f2f46]"
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
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-sm text-slate-600">
                <span>Already registered?</span>
                <Link to="/" className="inline-flex items-center font-semibold text-[#0f2f46] underline-offset-4 hover:underline">
                  Login <ChevronRight size={14} />
                </Link>
              </div>
            </form>

            <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {new Date().getFullYear()} Bright Cover Agency. All rights reserved.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AddUser;
