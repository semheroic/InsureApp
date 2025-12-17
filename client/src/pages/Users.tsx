import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Mail, Phone, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
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

  /** ==================== API FUNCTIONS ==================== */
  const fetchUsers = async () => {
    try {
      // Identify logged in user
      const meRes = await fetch("http://localhost:5000/auth/me", { credentials: "include" });
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUserId(meData.id);
      }

      const res = await fetch(API_URL);
      const data = await res.json();
      const formatted: User[] = data.map((u: any) => ({
        ...u,
        initials: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
        joinDate: u.join_date || u.joinDate,
        profile_picture: u.profile_picture ? `${API_URL.replace("/users", "")}${u.profile_picture}` : undefined,
      }));
      setUsers(formatted);
    } catch {
      toast({ title: "Error", description: "Failed to fetch users." });
    }
  };

  const handleAdd = async () => {
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("role", formData.role);
      form.append("status", formData.status);
      form.append("password", formData.password);
      if (formData.profile_picture) form.append("profile_picture", formData.profile_picture);

      const res = await fetch(API_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed to add user");
      await fetchUsers();
      setFormData({ name: "", email: "", phone: "", password: "", role: "User", status: "Active", profile_picture: null });
      setIsAddDialogOpen(false);
      toast({ title: "Added", description: "User added successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to add user." });
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("role", formData.role);
      form.append("status", formData.status);
      if (formData.password) form.append("password", formData.password);
      if (formData.profile_picture) form.append("profile_picture", formData.profile_picture);

      const res = await fetch(`${API_URL}/${selectedUser.id}`, { method: "PUT", body: form });
      if (!res.ok) throw new Error("Failed to update user");
      await fetchUsers();
      setSelectedUser(null);
      setFormData({ name: "", email: "", phone: "", role: "User", status: "Active", password: "", profile_picture: null });
      setIsEditDialogOpen(false);
      toast({ title: "Updated", description: "User updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to update user." });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/${selectedUser.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      await fetchUsers();
      setSelectedUser(null);
      setIsDeleteDialogOpen(false);
      toast({ title: "Deleted", description: "User deleted successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to delete user." });
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /** ==================== HELPERS ==================== */
  const getRoleBadge = (role: string) => {
    const variants = {
      Admin: "bg-destructive/10 text-destructive border-destructive/20",
      Manager: "bg-primary/10 text-primary border-primary/20",
      User: "bg-secondary text-secondary-foreground border-secondary",
    };
    return variants[role as keyof typeof variants] || "";
  };

  // RESTORED ORIGINAL STATUS BADGE LOGIC
  const getStatusBadge = (status: string) => status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border";

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery);
    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system users and permissions</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}><UserPlus className="w-4 h-4" /> Add User</Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const isMe = user.id === currentUserId;
                return (
                  <TableRow key={user.id} className={isMe ? "bg-primary/[0.01]" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                            {user.profile_picture ? <AvatarImage src={user.profile_picture} /> : <AvatarFallback>{user.initials}</AvatarFallback>}
                          </Avatar>
                          {/* LIVE INDICATOR */}
                          {isMe && (
                            <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-background flex items-center justify-center">
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.name}</p>
                            {isMe && <Badge className="h-4 px-1 text-[9px] bg-primary/10 text-primary border-none font-bold uppercase">You</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {user.email}</div>
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={getRoleBadge(user.role)} variant="outline">{user.role}</Badge></TableCell>
                    {/* RESTORED STATUS AS IT WAS */}
                    <TableCell><Badge className={getStatusBadge(user.status)} variant="outline">{user.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setIsViewDialogOpen(true); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setFormData({ name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, password: "", profile_picture: null }); setIsEditDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" disabled={isMe} onClick={() => { setSelectedUser(user); setIsDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4 grid-cols-2">
              <div className="flex flex-col items-center col-span-2">
                <div className="relative">
                  <Avatar className="w-24 h-24 mb-2">
                    {selectedUser.profile_picture ? <AvatarImage src={selectedUser.profile_picture} /> : <AvatarFallback className="text-xl">{selectedUser.initials}</AvatarFallback>}
                  </Avatar>
                  {selectedUser.id === currentUserId && (
                    <span className="absolute bottom-3 right-1 block h-5 w-5 rounded-full bg-background flex items-center justify-center">
                      <span className="h-3.5 w-3.5 rounded-full bg-green-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-lg font-semibold">{selectedUser.name}</p>
              </div>
              <div><Label>Email</Label><p className="font-medium">{selectedUser.email}</p></div>
              <div><Label>Phone</Label><p className="font-medium">{selectedUser.phone}</p></div>
              <div><Label>Role</Label><Badge className={getRoleBadge(selectedUser.role)} variant="outline">{selectedUser.role}</Badge></div>
              <div><Label>Status</Label><Badge className={getStatusBadge(selectedUser.status)} variant="outline">{selectedUser.status}</Badge></div>
              <div><Label>Join Date</Label><p className="font-medium">{selectedUser.joinDate}</p></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsViewDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD USER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Enter details for a new user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Password</Label><Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Role</Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Profile Picture</Label><Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, profile_picture: e.target.files?.[0] || null })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Password (leave empty to keep current)</Label><Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Role</Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Profile Picture</Label><Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, profile_picture: e.target.files?.[0] || null })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedUser?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;