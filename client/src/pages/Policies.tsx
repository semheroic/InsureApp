import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Global config to ensure cookies are sent with every request
axios.defaults.withCredentials = true;

type Policy = {
  id: number;
  plate: string;
  owner: string;
  company: string;
  start_date: string;
  expiry_date: string;
  contact: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Renewed";
  days_remaining: number;
  timeToStart?: any;
  timeToEnd?: any;
};

const API_URL = "http://localhost:5000/policies";
const AUTH_URL = "http://localhost:5000/auth/me";

/* ---------------- HELPERS ---------------- */
const daysBetween = (date: string) => {
  const today = new Date();
  const target = new Date(`${date}T23:59:59`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    Active: "bg-success/10 text-success border-success/20",
    "Expiring Soon": "bg-warning/10 text-warning border-warning/20",
    Expired: "bg-destructive/10 text-destructive border-destructive/20",
    Renewed: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return variants[status] || "";
};

const Policies = () => {
  const { toast } = useToast();

  /* ---------------- ROLE STATE ---------------- */
  const [userRole, setUserRole] = useState<string | null>(null);

  /* ---------------- COMPONENT STATES ---------------- */
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    plate: "",
    owner: "",
    company: "SORAS",
    startDate: "",
    expiryDate: "",
    contact: "",
  });

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Helper logic for permissions
  const roleClean = userRole?.toLowerCase();
  const isAdmin = roleClean === "admin";
  const isManager = roleClean === "manager";
  // Allow both Admin and Manager to Add/Edit
  const canModify = isAdmin || isManager;

  /* ---------------- AUTH & FETCH ---------------- */
  const checkAuthAndFetch = async () => {
    setLoading(true);
    try {
      const authRes = await axios.get(AUTH_URL);
      setUserRole(authRes.data.role);

      const { data } = await axios.get(API_URL);
      setPolicies(
        data.map((p: any) => ({
          ...p,
          days_remaining: daysBetween(p.expiry_date),
          status: p.status,
        }))
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.status === 401 ? "Please login again" : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  /* ---------------- FILTERS ---------------- */
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        p.status.toLowerCase().replace(/\s+/g, "") === statusFilter;

      const matchesCompany =
        companyFilter === "all" || p.company.toLowerCase() === companyFilter;

      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [policies, searchQuery, statusFilter, companyFilter]);

  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(start, start + itemsPerPage);
  }, [filteredPolicies, currentPage]);

  const validateRWPhone = (phone: string) => {
    const regex = /^(\+?250|0)?(7[2389])[0-9]{7}$/;
    return regex.test(phone);
  };

  /* ---------------- ACTIONS ---------------- */
  const handleSendMessage = async () => {
    setIsSending(true);
    try {
      const payload = {
        template: bulkMessage,
        recipients: filteredPolicies.map(p => ({
          contact: p.contact,
          owner: p.owner,
          plate: p.plate,
          days: p.days_remaining
        }))
      };
      const { data } = await axios.post("http://localhost:5000/api/policies/broadcast", payload);
      toast({ title: "Broadcast Complete", description: `Sent ${data.summary.successful} messages.` });
      setIsMessageDialogOpen(false);
      setBulkMessage("");
    } catch {
      toast({ title: "Error", description: "Failed to send broadcast", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleAdd = async () => {
    if (!validateRWPhone(formData.contact)) {
      return toast({ title: "Invalid Phone", description: "Use Rwandan format (078...)", variant: "destructive" });
    }
    try {
      await axios.post(API_URL, {
        plate: formData.plate,
        owner: formData.owner,
        company: formData.company,
        start_date: formData.startDate,
        expiry_date: formData.expiryDate,
        contact: formData.contact,
      });
      checkAuthAndFetch();
      setIsAddDialogOpen(false);
      toast({ title: "Added", description: "Policy created" });
      setFormData({ plate: "", owner: "", company: "SORAS", startDate: "", expiryDate: "", contact: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "Failed to add", variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedPolicy) return;
    try {
      await axios.put(`${API_URL}/${selectedPolicy.id}`, {
        plate: formData.plate,
        owner: formData.owner,
        company: formData.company,
        start_date: formData.startDate,
        expiry_date: formData.expiryDate,
        contact: formData.contact,
      });
      checkAuthAndFetch();
      setIsEditDialogOpen(false);
      toast({ title: "Updated", description: "Policy saved" });
    } catch {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;
    try {
      await axios.delete(`${API_URL}/${selectedPolicy.id}`);
      checkAuthAndFetch();
      setIsDeleteDialogOpen(false);
      toast({ title: "Deleted", description: "Policy removed", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const headers = ["Plate", "Owner", "Company", "Start Date", "Expiry Date", "Days Remaining", "Status", "Contact"];
    const rows = filteredPolicies.map((p) => [p.plate, p.owner, p.company, p.start_date, p.expiry_date, p.days_remaining, p.status, p.contact]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "policies.csv";
    a.click();
  };

  if (loading) return <p className="text-center py-20 text-muted-foreground animate-pulse">Synchronizing policies...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold">Insurance Policies</h1>
    <p className="text-muted-foreground">Manage all vehicle insurance policies</p>
  </div>
  <div className="flex gap-2">
    {/* New Export Button */}
    <Button 
      variant="outline" 
      className="gap-2" 
      onClick={exportToCSV}
    >
      <Download className="w-4 h-4" /> Export CSV
    </Button>

    {isAdmin && (
      <Button variant="outline" className="gap-2" onClick={() => setIsMessageDialogOpen(true)}>
        <Search className="w-4 h-4" /> Broadcast SMS
      </Button>
    )}
    
    {/* Allow Admin OR Manager to Add */}
    {canModify && (
      <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="w-4 h-4" /> Add Policy
      </Button>
    )}
  </div>
</div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiringsoon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="renewed">Renewed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              <SelectItem value="soras">SORAS</SelectItem>
              <SelectItem value="sonarwa">SONARWA</SelectItem>
              <SelectItem value="prime">PRIME</SelectItem>
              <SelectItem value="radiant">RADIANT</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={exportToCSV}><Download className="w-4 h-4" /></Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No policies found</TableCell>
                </TableRow>
              ) : paginatedPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.plate}</TableCell>
                  <TableCell>{policy.owner}</TableCell>
                  <TableCell>{policy.company}</TableCell>
                  <TableCell>{policy.start_date}</TableCell>
                  <TableCell>{policy.expiry_date}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(policy.status)}>{policy.status}</Badge>
                  </TableCell>
                  <TableCell>{policy.days_remaining > 0 ? `${policy.days_remaining} day${policy.days_remaining > 1 ? "s" : ""}` : "Expired"}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPolicy(policy); setIsViewDialogOpen(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {/* Allow Admin OR Manager to Edit */}
                    {canModify && (
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedPolicy(policy);
                        setFormData({
                          plate: policy.plate,
                          owner: policy.owner,
                          company: policy.company,
                          startDate: policy.start_date,
                          expiryDate: policy.expiry_date,
                          contact: policy.contact,
                        });
                        setIsEditDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {/* ONLY Admin can Delete */}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedPolicy(policy); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ===== VIEW DIALOG ===== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>Full technical details for this policy.</DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Plate Number</Label>
                  <p className="font-bold text-lg">{selectedPolicy.plate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Owner</Label>
                  <p className="font-medium">{selectedPolicy.owner}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Company</Label>
                  <p className="font-medium">{selectedPolicy.company}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Contact</Label>
                  <p className="font-medium">{selectedPolicy.contact}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Start Date</Label>
                  <p className="font-medium">{selectedPolicy.start_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Expiry Date</Label>
                  <p className="font-medium">{selectedPolicy.expiry_date}</p>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <Label className="text-muted-foreground text-xs uppercase">Status Overview</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={getStatusBadge(selectedPolicy.status)}>{selectedPolicy.status}</Badge>
                    <span className="text-sm font-semibold">
                       {selectedPolicy.days_remaining > 0 ? `${selectedPolicy.days_remaining} days until expiration` : "Policy Expired"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ADD DIALOG ===== */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Policy</DialogTitle>
            <DialogDescription>Enter the details for the new insurance policy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plate">Plate Number</Label>
              <Input id="plate" placeholder="e.g. RAE 123A" value={formData.plate} onChange={(e) => setFormData({ ...formData, plate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner Name</Label>
              <Input id="owner" placeholder="Full Name" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Insurance Company</Label>
              <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SORAS">SORAS</SelectItem>
                  <SelectItem value="SONARWA">SONARWA</SelectItem>
                  <SelectItem value="PRIME">PRIME</SelectItem>
                  <SelectItem value="RADIANT">RADIANT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" placeholder="078..." value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Save Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update the existing policy details.</DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-plate">Plate Number</Label>
                <Input id="edit-plate" value={formData.plate} onChange={(e) => setFormData({ ...formData, plate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-owner">Owner Name</Label>
                <Input id="edit-owner" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Insurance Company</Label>
                <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SORAS">SORAS</SelectItem>
                    <SelectItem value="SONARWA">SONARWA</SelectItem>
                    <SelectItem value="PRIME">PRIME</SelectItem>
                    <SelectItem value="RADIANT">RADIANT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input id="edit-startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                  <Input id="edit-expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contact">Contact Number</Label>
                <Input id="edit-contact" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Update Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DIALOG ===== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the policy for <strong>{selectedPolicy?.plate}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== BROADCAST DIALOG ===== */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl">Broadcast SMS</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Sending to <span className="font-bold text-foreground">{filteredPolicies.length} recipients</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Personalization Tags</Label>
              <div className="flex gap-2 mt-2">
                {['{owner}', '{plate}', '{days}'].map(tag => (
                  <code key={tag} className="px-1.5 py-0.5 rounded bg-background border text-xs font-mono text-primary">
                    {tag}
                  </code>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="message">Message Content</Label>
                <span className={`text-[10px] font-medium ${bulkMessage.length > 160 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {bulkMessage.length} / 160 chars
                </span>
              </div>
              <textarea
                id="message"
                className="flex min-h-[150px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all resize-none"
                placeholder="e.g. Dear {owner}, your insurance for {plate} expires in {days} days."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage} disabled={isSending || !bulkMessage.trim()}>
              {isSending ? "Sending..." : "Send Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Policies;