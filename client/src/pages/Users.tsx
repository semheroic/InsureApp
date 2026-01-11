import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Mail, Phone, Edit, Trash2, Eye, Download, Loader2, AlertCircle, Calendar, Key, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  profile_picture?: string;
  initials: string;
  joinDate: string;
  created_at: string; 
};

const BASE = import.meta.env.VITE_API_URL;
const API_URL = `${BASE}/users`;

const Users = () => {
  const { toast } = useToast();

  // --- State ---
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "User",
    status: "Active",
    password: "",
    profile_picture: null as File | null,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // --- Fetch Logic ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch(`${BASE}/auth/me`, { credentials: "include" });
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser({ 
          id: meData.id, 
          role: meData.role ? meData.role.toLowerCase() : "" 
        });
      }

      const res = await fetch(API_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      const formatted: User[] = data.map((u: any) => ({
        ...u,
        initials: u.name ? u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "??",
        joinDate: u.joined_date || u.created_at || "N/A",
        created_at: u.created_at || new Date().toISOString(),
        profile_picture: u.profile_picture ? (u.profile_picture.startsWith('http') ? u.profile_picture : `${BASE}${u.profile_picture}`) : undefined,
      }));
      setUsers(formatted);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = currentUser?.role === "admin";

  // --- Helpers ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter;
      
      const createdDate = new Date(u.created_at);
      const now = new Date();
      let matchesTime = true;
      
      if (timeFilter === "today") matchesTime = createdDate.toDateString() === now.toDateString();
      else if (timeFilter === "week") {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        matchesTime = createdDate >= weekAgo;
      } else if (timeFilter === "month") {
        const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
        matchesTime = createdDate >= monthAgo;
      }
      return matchesSearch && matchesRole && matchesStatus && matchesTime;
    });
  }, [users, searchQuery, roleFilter, statusFilter, timeFilter]);

  const recentRegistrations = useMemo(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return users.filter(u => new Date(u.created_at) >= twentyFourHoursAgo);
  }, [users]);

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r === "admin") return "bg-destructive/10 text-destructive border-destructive/20";
    if (r === "manager") return "bg-primary/10 text-primary border-primary/20";
    return "bg-secondary text-secondary-foreground border-secondary";
  };

  const getStatusBadge = (status: string) => 
    status.toLowerCase() === "active" 
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
      : "bg-muted text-muted-foreground border-border";

  // --- Action Handlers ---
  const handleAdd = async () => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") form.append(key, value as any);
      });
      const res = await fetch(API_URL, { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error();
      await fetchData();
      setIsAddDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", password: "", role: "User", status: "Active", profile_picture: null });
      toast({ title: "Success", description: "User created." });
    } catch { toast({ title: "Failed", description: "Error creating user.", variant: "destructive" }); }
    finally { setIsProcessing(false); }
  };

  const handleEdit = async () => {
    if (!isAdmin || !selectedUser) return;
    setIsProcessing(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Only append password if it was actually modified
        if (key === "password" && value === "") return;
        if (value !== null) form.append(key, value as any);
      });
      const res = await fetch(`${API_URL}/${selectedUser.id}`, { method: "PUT", body: form, credentials: "include" });
      if (!res.ok) throw new Error();
      await fetchData();
      setIsEditDialogOpen(false);
      toast({ title: "Updated", description: "User details and security saved." });
    } catch { toast({ title: "Error", description: "Update failed.", variant: "destructive" }); }
    finally { setIsProcessing(false); }
  };

  const handleDelete = async () => {
    if (!isAdmin || !selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/${selectedUser.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      await fetchData();
      setIsDeleteDialogOpen(false);
      toast({ title: "Deleted", description: "User removed." });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  if (loading) return <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4"><Loader2 className="animate-spin h-8 w-8 text-primary" /><p>Syncing user directory...</p></div>;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {isAdmin && recentRegistrations.length > 0 && (
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-500 font-bold">New Registrations</AlertTitle>
          <AlertDescription className="text-xs">{recentRegistrations.length} users joined in the last 24 hours.</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Manage system access 
            {isAdmin && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{users.length} Total</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => {
                const headers = ["Name", "Email", "Role", "Status"];
                const csv = [headers.join(","), ...filteredUsers.map(u => [u.name, u.email, u.role, u.status].join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob); a.download = "users.csv"; a.click();
              }}><Download className="w-4 h-4" /> Export CSV</Button>
              <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}><UserPlus className="w-4 h-4" /> Add User</Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name or email..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin ({users.filter(u=>u.role.toLowerCase()==='admin').length})</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
            {isAdmin && (
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full md:w-[140px]"><Calendar className="w-3 h-3 mr-2" /><SelectValue placeholder="Time Joined" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Any Time</SelectItem><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem></SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User Profile</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const isMe = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id} className={cn(isMe && "bg-primary/[0.02]")}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 border shadow-sm">
                            <AvatarImage src={user.profile_picture} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          {isMe && (
                             <span className={cn(
                               "absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full animate-pulse",
                               isAdmin ? "bg-blue-500" : "bg-emerald-500"
                             )} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            {user.name} {isMe && <Badge className={cn("text-[9px] h-4 font-bold uppercase", isAdmin ? "bg-blue-500" : "bg-emerald-500")}>Online</Badge>}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {user.email}</div>
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px] font-bold px-2", getRoleBadge(user.role))}>{user.role}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px] font-bold px-2", getStatusBadge(user.status))}>{user.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setIsViewDialogOpen(true); }}><Eye className="w-4 h-4" /></Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setSelectedUser(user);
                              setFormData({ name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, password: "", profile_picture: null });
                              setIsEditDialogOpen(true);
                            }}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={isMe} onClick={() => { setSelectedUser(user); setIsDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* --- DIALOGS --- */}

      {/* VIEW DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
          {selectedUser && (
            <div className="flex flex-col">
              <div className="bg-slate-50 dark:bg-slate-900/50 pt-10 pb-6 px-6 border-b">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-28 h-28 border-4 border-background relative shadow-xl">
                    <AvatarImage src={selectedUser.profile_picture} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-muted text-muted-foreground">{selectedUser.initials}</AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{selectedUser.name}</h3>
                  <Badge className={cn("mt-2 px-3 py-0.5 font-semibold uppercase tracking-wider text-[10px]", getRoleBadge(selectedUser.role))}>{selectedUser.role}</Badge>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 gap-6 bg-background">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Mail size={18} /></div>
                    <div className="flex flex-col"><span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email</span><span className="text-sm font-medium">{selectedUser.email}</span></div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Phone size={18} /></div>
                    <div className="flex flex-col"><span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Phone</span><span className="text-sm font-medium">{selectedUser.phone || "Not provided"}</span></div>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 pt-0"><Button variant="secondary" className="w-full" onClick={() => setIsViewDialogOpen(false)}>Close</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG (WITH PASSWORD FIELD) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> Administrative Update</DialogTitle>
            <DialogDescription>Modify profile details or reset security credentials for <strong>{selectedUser?.name}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Full Name</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            
            {/* PASSWORD FIELD ADDED HERE */}
            <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
              <Label className="text-primary flex items-center gap-2 font-bold"><Key className="w-4 h-4" /> Reset Password</Label>
              <Input type="password" placeholder="Enter new password (leave empty to keep current)" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <p className="text-[10px] text-muted-foreground italic">Admin: You can bypass security and set a new password directly.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Manager">Manager</SelectItem><SelectItem value="User">User</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button disabled={isProcessing} onClick={handleEdit}>{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
  <DialogContent className="max-w-lg rounded-2xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        Register New User
      </DialogTitle>
      <p className="text-sm text-muted-foreground">
        Create a new user account and assign access level.
      </p>
    </DialogHeader>

    <div className="space-y-5 py-4">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Email Address</Label>
          <Input
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Phone Number</Label>
          <Input
            placeholder="+250 7XX XXX XXX"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
      </div>

      {/* Role & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(v) =>
              setFormData({ ...formData, role: v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) =>
              setFormData({ ...formData, status: v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <DialogFooter className="pt-4">
      <Button
        className="w-full rounded-xl"
        disabled={isProcessing}
        onClick={handleAdd}
      >
        {isProcessing && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Create Account
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Permanent Deletion?</AlertDialogTitle><AlertDialogDescription>Remove <strong>{selectedUser?.name}</strong>? This action is permanent and cannot be reversed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep User</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;