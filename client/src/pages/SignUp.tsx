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
  ShieldCheck, Activity, ChevronRight 
} from "lucide-react";
import LOGO from "./LOGO.png";

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
  // Rwandan Regex: Supports +2507..., 2507..., or 07...
  const rwPhoneRegex = /^(\+?250|0)7[2389][0-9]{7}$/;

  if (!formData.phone) {
    toast({ title: "Validation Error", description: "Phone number is required", variant: "destructive" });
    return false;
  }

  if (!rwPhoneRegex.test(formData.phone)) {
    toast({ 
      title: "Invalid Phone Number", 
      description: "Please enter a valid Rwandan number (e.g., 078... or +25078...)", 
      variant: "destructive" 
    });
    return false;
  }

  // Add your other validations here (e.g., name, email)
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
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 lg:p-8 overflow-hidden bg-slate-950">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${LOGO})` }}
        />
        <div className="absolute inset-0 bg-slate-950/50" />
      </div>

      <Card className="relative z-10 w-full max-w-4xl grid lg:grid-cols-5 overflow-hidden border-white/20 shadow-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/20">
        
        {/* Left Branding Side */}
        <div className="hidden lg:flex lg:col-span-2 bg-blue-700/80 p-10 flex-col justify-between text-white backdrop-blur-md border-r border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <ShieldCheck className="w-10 h-10 text-blue-200" />
              <span className="text-xl font-bold tracking-tight uppercase">Bright Insurance Agency</span>
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

        {/* Right Form Side */}
        <div className="lg:col-span-3 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-300 text-sm">Fill in the professional details below.</p>
          </div>

          <div className="grid gap-5">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-300">Full Name</Label>
              <div className="relative">
                <Input 
                  className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:bg-white/20 transition-all" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name" 
                />
                <UserPlus className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-300">Email Address</Label>
                <div className="relative">
                  <Input 
                    className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com" 
                  />
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-300">Phone</Label>
                <div className="relative">
                  <Input 
                    className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500" 
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
              <Label className="text-xs font-bold uppercase text-slate-300">Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-12 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••" 
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-blue-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-300">System Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="h-11 bg-white/10 border-white/20 text-white focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="User">Standard User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-300">Account Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-11 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-4">
              <Button 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                onClick={handleAdd}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                <span>Already have an account?</span>
                <button 
                  onClick={() => navigate("/")} 
                  className="text-blue-400 font-bold hover:underline flex items-center"
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