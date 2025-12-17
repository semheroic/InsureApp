import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  UserPlus, Mail, Phone, Lock, Eye, EyeOff, 
  ShieldCheck, Briefcase, Activity, ChevronRight 
} from "lucide-react";

const AddUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "User",
    status: "Active",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_URL = "http://localhost:5000/users";

  const validateInput = () => {
    if (!formData.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", variant: "destructive" });
      return false;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Must include uppercase, number, and special character.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateInput()) return;
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 lg:p-8">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      </div>

      <Card className="relative z-10 w-full max-w-4xl grid lg:grid-cols-5 overflow-hidden border-none shadow-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        
        {/* Left Branding Side (2/5 columns) */}
        <div className="hidden lg:flex lg:col-span-2 bg-blue-700 p-10 flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <ShieldCheck className="w-10 h-10 text-blue-200" />
              <span className="text-xl font-bold tracking-tight uppercase">SafeInsure Admin</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-4">Onboard New Team Member</h2>
            <p className="text-blue-100/80">Grant secure access to the policy management system and agent dashboard.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
              <Activity className="w-5 h-5 text-blue-300" />
              <span className="text-sm">Real-time status tracking</span>
            </div>
            <p className="text-xs text-blue-200/60">© 2025 Insurance Management Systems</p>
          </div>
        </div>

        {/* Right Form Side (3/5 columns) */}
        <div className="lg:col-span-3 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-500 text-sm">Fill in the professional details below.</p>
          </div>

          <div className="grid gap-5">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
              <div className="relative">
                <Input 
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name" 
                />
                <UserPlus className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {/* Email & Phone Group */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Email Address</Label>
                <div className="relative">
                  <Input 
                    className="pl-10 h-11 bg-slate-50 border-slate-200" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com" 
                  />
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Phone</Label>
                <div className="relative">
                  <Input 
                    className="pl-10 h-11 bg-slate-50 border-slate-200" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+250..." 
                  />
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-12 h-11 bg-slate-50 border-slate-200" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••" 
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-blue-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role & Status Group */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">System Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="h-11 bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="User">Standard User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Account Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-11 bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active text-emerald-600">Active</SelectItem>
                    <SelectItem value="Inactive text-red-600">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-4">
              <Button 
                className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-lg shadow-blue-200"
                onClick={handleAdd}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <span>Already have an account?</span>
                <button 
                  onClick={() => navigate("/")} 
                  className="text-blue-700 font-bold hover:underline flex items-center"
                >
                  Login <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AddUser;