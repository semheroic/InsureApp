import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { AnimatePresence, motion } from "framer-motion";
import { 
  ShieldCheck, Camera, User, Mail, Phone, 
  ShieldAlert, Lock, ArrowLeft, Save 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL = "http://localhost:5000";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "Admin" | "Manager" | "User";
  status: "Active" | "Inactive";
  join_date: string;
  profile_picture?: string;
};

export const EditProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    role: "User",
    status: "Active",
    join_date: "",
    profile_picture: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("User not found");
        const data: User = await res.json();
        if (data.profile_picture && !data.profile_picture.startsWith("http")) {
          data.profile_picture = `${API_URL}${data.profile_picture}`;
        }
        setUser(data);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        navigate("/users");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("phone", user.phone);
      formData.append("role", user.role);
      formData.append("status", user.status);
      if (password) formData.append("password", password);
      if (fileInputRef.current?.files?.[0]) {
        formData.append("profile_picture", fileInputRef.current.files[0]);
      }

      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      toast({ title: "Success", description: "Profile updated successfully" });
      navigate("/users");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/users")}>
            <ArrowLeft size={18} /> Back to Directory
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={24} />
            <span className="font-bold tracking-tight text-slate-900 uppercase">Profile Manager</span>
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 bg-white">
          <form onSubmit={handleSubmit}>
            {/* Top Banner / Avatar Section */}
            <div className="bg-slate-900 h-32 relative">
               <div className="absolute -bottom-12 left-8 group">
                  <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                    <AvatarImage src={profilePreview || user.profile_picture} />
                    <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                      {user.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Camera size={24} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>
            </div>

            <div className="pt-16 px-8 pb-10 space-y-8">
              {/* Identity Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                  <p className="text-sm text-slate-500">Update the user's core identity and contact details.</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                  <div className="relative">
                    <Input className="pl-10 h-11" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} required />
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Work Email</Label>
                  <div className="relative">
                    <Input className="pl-10 h-11" type="email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} required />
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Phone Number</Label>
                  <div className="relative">
                    <Input className="pl-10 h-11" type="tel" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </section>

              <Separator />

              {/* Administrative Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Access Control</h3>
                    <p className="text-sm text-slate-500">Manage system permissions and account status.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">User Role</Label>
                    <div className="relative">
                      <select
                        className="w-full h-11 pl-10 pr-4 border rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none border-slate-200"
                        value={user.role}
                        onChange={(e) => setUser({ ...user, role: e.target.value as User["role"] })}
                      >
                        <option value="User">Standard Agent</option>
                        <option value="Manager">Branch Manager</option>
                        <option value="Admin">System Administrator</option>
                      </select>
                      <ShieldAlert className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Account Status</Label>
                      <p className="text-xs text-slate-500">Set if this user is allowed to login.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                      <Switch
                        checked={user.status === "Active"}
                        onCheckedChange={(checked) => setUser({ ...user, status: checked ? "Active" : "Inactive" })}
                      />
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Security</h3>
                    <p className="text-sm text-slate-500">Change password or update safety protocols.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">New Password</Label>
                    <div className="relative">
                      <Input 
                        className="pl-10 h-11" 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Leave blank to keep existing password.</p>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="font-bold text-slate-500"
                  onClick={() => navigate("/users")}
                >
                  Discard Changes
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 h-11 px-8 gap-2 shadow-lg shadow-blue-200"
                  disabled={saving}
                >
                  <Save size={18} />
                  {saving ? "Updating..." : "Save Profile"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <p className="text-center text-slate-400 text-xs">
          Internal Management Portal • SafeInsure 2.0 • Session Encrypted
        </p>
      </div>
    </div>
  );
};