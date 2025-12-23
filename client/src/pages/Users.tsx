import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Mail, Phone, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {  Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
};

const API_URL = "http://localhost:5000/users";

const Users = () => {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  /** ==================== AUTH & DATA FETCH ==================== */
  /** ==================== AUTH & DATA FETCH ==================== */
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Identify logged in user & their role
      const meRes = await fetch("http://localhost:5000/auth/me", { 
        credentials: "include" // Correct
      });
      
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser({ 
          id: meData.id, 
          role: meData.role ? meData.role.toLowerCase() : "" 
        });
      }

      // 2. Fetch all users - ADDED CREDENTIALS HERE
      const res = await fetch(API_URL, { 
        credentials: "include" // This was missing and caused the 401
      });

      if (!res.ok) throw new Error("Unauthorized access to user list");

      const data = await res.json();
      const formatted: User[] = data.map((u: any) => ({
        ...u,
        initials: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
        joinDate: u.joined_date,
        profile_picture: u.profile_picture ? `http://localhost:5000${u.profile_picture}` : undefined,
      }));
      setUsers(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
      toast({ title: "Error", description: "Session expired or unauthorized.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /** ==================== API ACTIONS ==================== */
/** ==================== API ACTIONS ==================== */
  const handleAdd = async () => {
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });

      const res = await fetch(API_URL, { 
        method: "POST", 
        body: form,
        credentials: "include" // REQUIRED: Sends cookies to backend
      });

      if (!res.ok) throw new Error("Unauthorized or server error");
      
      await fetchData();
      setIsAddDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", password: "", role: "User", status: "Active", profile_picture: null });
      toast({ title: "Success", description: "User created successfully." });
    } catch (err) {
      toast({ title: "Action Failed", description: "You don't have permission to add users.", variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });

      const res = await fetch(`${API_URL}/${selectedUser.id}`, { 
        method: "PUT", 
        body: form,
        credentials: "include" // REQUIRED: Sends cookies to backend
      });

      if (!res.ok) throw new Error("Unauthorized or server error");
      
      await fetchData();
      setIsEditDialogOpen(false);
      toast({ title: "Updated", description: "User details saved." });
    } catch (err) {
      toast({ title: "Update Failed", description: "You don't have permission to edit this user.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/${selectedUser.id}`, { 
        method: "DELETE",
        credentials: "include" // REQUIRED: Sends cookies to backend
      });

      if (!res.ok) throw new Error("Unauthorized or server error");
      
      await fetchData();
      setIsDeleteDialogOpen(false);
      toast({ title: "Deleted", description: "User removed from system." });
    } catch (err) {
      toast({ title: "Delete Failed", description: "You don't have permission to delete users.", variant: "destructive" });
    }
  };
  /** ==================== HELPERS ==================== */
  // FIXED: Case-insensitive check against normalized role
  const isAdmin = currentUser?.role === "admin";

  const getRoleBadge = (role: string) => {
    const variants = {
      Admin: "bg-destructive/10 text-destructive border-destructive/20",
      Manager: "bg-primary/10 text-primary border-primary/20",
      User: "bg-secondary text-secondary-foreground border-secondary",
    };
    return variants[role as keyof typeof variants] || "";
  };

  const getStatusBadge = (status: string) => 
    status === "Active" 
      ? "bg-success/10 text-success border-success/20" 
      : "bg-muted text-muted-foreground border-border";

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.phone.includes(searchQuery);
      const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  if (loading) return <div className="p-20 text-center text-muted-foreground text-sm">Loading user directory...</div>;
const exportToCSV = () => {
  if (!users || users.length === 0) {
    toast({
      title: "No data to export",
      variant: "destructive",
    });
    return;
  }

  const headers = ["Username", "Email", "Role", "Created At"];
  
  const rows = users.map((user: any) => {
    // 1. Handle Username fallback
    const userName = user.username || user.name || user.full_name || "N/A";
    
    // 2. Handle Email
    const userEmail = user.email || "N/A";
    
    // 3. Handle Role
    const userRole = user.role || "N/A";
    
    // 4. Handle Date - Check for created_at OR createdAt
    const dateValue = user.created_at || user.createdAt || user.date_joined;
    const formattedDate = dateValue 
      ? new Date(dateValue).toLocaleDateString('en-GB') // Results in DD/MM/YYYY
      : "N/A";

    return [userName, userEmail, userRole, formattedDate];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `system_users_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast({ title: "Export Successful", description: "User list downloaded." });
};
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-foreground tracking-tight">Users</h1>
    <p className="text-muted-foreground mt-1 text-sm">Manage system access levels and profiles</p>
  </div>
  
  <div className="flex gap-2">
    {/* ROLE CHECK: Only Admin can see Export and Add buttons */}
    {isAdmin && (
      <>
        <Button 
          variant="outline" 
          className="gap-2 shadow-sm" 
          onClick={exportToCSV}
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>

        <Button className="gap-2 shadow-sm" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </>
    )}
  </div>
</div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name, email, or phone..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">User Profile</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No users matching your search.</TableCell>
                </TableRow>
              ) : filteredUsers.map(user => {
                const isMe = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id} className={isMe ? "bg-primary/[0.02] transition-colors" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                            {user.profile_picture ? <AvatarImage src={user.profile_picture} /> : <AvatarFallback>{user.initials}</AvatarFallback>}
                          </Avatar>
                          {isMe && (
                            <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full bg-background flex items-center justify-center">
                              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground text-sm">{user.name}</span>
                            {isMe && <Badge className="h-4 px-1 text-[9px] bg-primary/10 text-primary border-none font-black tracking-tighter uppercase">Me</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 opacity-70" /> {user.email}</div>
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 opacity-70" /> {user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={`${getRoleBadge(user.role)} text-[10px] font-bold px-2 h-5`} variant="outline">{user.role}</Badge></TableCell>
                    <TableCell><Badge className={`${getStatusBadge(user.status)} text-[10px] font-bold px-2 h-5`} variant="outline">{user.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.joinDate || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUser(user); setIsViewDialogOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {/* ROLE CHECK: Only Admins see Edit and Delete buttons */}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { 
                              setSelectedUser(user); 
                              setFormData({ name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, password: "", profile_picture: null }); 
                              setIsEditDialogOpen(true); 
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isMe} onClick={() => { setSelectedUser(user); setIsDeleteDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      {/* VIEW USER DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="text-xl">Profile Snapshot</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 border-4 border-muted">
                  {selectedUser.profile_picture ? <AvatarImage src={selectedUser.profile_picture} /> : <AvatarFallback className="text-3xl">{selectedUser.initials}</AvatarFallback>}
                </Avatar>
                <h3 className="mt-4 text-xl font-bold">{selectedUser.name}</h3>
                <Badge className={getRoleBadge(selectedUser.role)} variant="outline">{selectedUser.role}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm border-t pt-6">
                <div><Label className="text-muted-foreground">Email</Label><p className="font-medium truncate">{selectedUser.email}</p></div>
                <div><Label className="text-muted-foreground">Phone</Label><p className="font-medium">{selectedUser.phone}</p></div>
                <div><Label className="text-muted-foreground">Status</Label><p><Badge className={getStatusBadge(selectedUser.status)} variant="outline">{selectedUser.status}</Badge></p></div>
                <div><Label className="text-muted-foreground">Joined</Label><p className="font-medium">{selectedUser.joinDate}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button className="w-full" onClick={() => setIsViewDialogOpen(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD USER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Register New User</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Full Name</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Email Address</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Phone Number</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Password</Label><Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
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
            <div className="grid gap-2"><Label>Profile Photo</Label><Input type="file" accept="image/*" className="cursor-pointer" onChange={e => setFormData({ ...formData, profile_picture: e.target.files?.[0] || null })} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modify User Profile</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="grid gap-2"><Label>New Password</Label><Input type="password" placeholder="Leave empty to keep current" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
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
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Discard</Button>
            <Button onClick={handleEdit}>Update Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all access for <strong>{selectedUser?.name}</strong>. Their profile data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
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