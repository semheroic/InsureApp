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
};

const API_URL = "http://localhost:5000/policies";

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

/* ---------------- COMPONENT ---------------- */
const Policies = () => {
  const { toast } = useToast();

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
/* message  */
const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
const [bulkMessage, setBulkMessage] = useState("");
const [isSending, setIsSending] = useState(false);  
const handleSendMessage = async () => {
  setIsSending(true);
  try {
    // We send the array of all currently filtered/listed policies
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
    
    toast({ 
      title: "Broadcast Complete", 
      description: `Sent ${data.summary.successful} messages successfully.` 
    });
    setIsMessageDialogOpen(false);
  } catch (error) {
    toast({ title: "Error", description: "Failed to send broadcast", variant: "destructive" });
  } finally {
    setIsSending(false);
  }
};
// dialoge
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  /* ---------------- FETCH ---------------- */
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL);
      setPolicies(
        data.map((p: any) => ({
          ...p,
          days_remaining: daysBetween(p.expiry_date),
          status: p.status, // directly from backend
        }))
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
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

  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(start, start + itemsPerPage);
  }, [filteredPolicies, currentPage]);
const validateRWPhone = (phone: string) => {
  // Matches: 078..., 079..., 072..., 073... or +25078... etc.
  // Must be exactly 10 digits (if starting with 0) or 13 (if starting with +250)
  const regex = /^(\+?250|0)?(7[2389])[0-9]{7}$/;
  return regex.test(phone);
};
  /* ---------------- ADD ---------------- */
  const handleAdd = async () => {
  // 1. Validate Phone Number
  if (!validateRWPhone(formData.contact)) {
    toast({
      title: "Invalid Phone Number",
      description: "Please enter a valid Rwandan number (e.g., 078... or +250...)",
      variant: "destructive",
    });
    return; // Stop execution
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
    fetchPolicies();
    setIsAddDialogOpen(false);
    toast({ title: "Added", description: "Policy added successfully" });
    // Reset form
    setFormData({ plate: "", owner: "", company: "SORAS", startDate: "", expiryDate: "", contact: "" });
  } catch (error: any) {
    // Catch the "Phone number exists" error from your backend
    const errMsg = error.response?.data?.error || "Failed to add policy";
    toast({ title: "Error", description: errMsg, variant: "destructive" });
  }
};

  /* ---------------- EDIT ---------------- */
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
      fetchPolicies();
      setIsEditDialogOpen(false);
      toast({ title: "Updated", description: "Policy updated successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to update policy", variant: "destructive" });
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async () => {
    if (!selectedPolicy) return;
    try {
      await axios.delete(`${API_URL}/${selectedPolicy.id}`);
      fetchPolicies();
      setIsDeleteDialogOpen(false);
      toast({ title: "Deleted", description: "Policy deleted", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to delete policy", variant: "destructive" });
    }
  };

  /* ---------------- EXPORT ---------------- */
  const exportToCSV = () => {
    const headers = ["Plate", "Owner", "Company", "Start Date", "Expiry Date", "Days Remaining", "Status", "Contact"];
    const rows = filteredPolicies.map((p) => [
      p.plate,
      p.owner,
      p.company,
      p.start_date,
      p.expiry_date,
      p.days_remaining > 0 ? `${p.days_remaining} day${p.days_remaining > 1 ? "s" : ""}` : "Expired",
      p.status,
      p.contact,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "policies.csv";
    a.click();
  };

  if (loading) return <p className="text-center py-20">Loading policies...</p>;

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
            {/* Header */}
<div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold">Insurance Policies</h1>
    <p className="text-muted-foreground">Manage all vehicle insurance policies</p>
  </div>
  <div className="flex gap-2">
    {/* NEW MESSAGE BUTTON */}
    <Button variant="outline" className="gap-2" onClick={() => setIsMessageDialogOpen(true)}>
      <Search className="w-4 h-4" /> Broadcast SMS
    </Button>
    <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
      <Plus className="w-4 h-4" /> Add Policy
    </Button>
  </div>
</div>


      {/* Filters & Table */}
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No policies found
                  </TableCell>
                </TableRow>
              ) : paginatedPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>{policy.plate}</TableCell>
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
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedPolicy(policy); setIsDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredPolicies.length)} - {Math.min(currentPage * itemsPerPage, filteredPolicies.length)} of {filteredPolicies.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      {/* ===== VIEW DIALOG WITH STATUS ===== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>View details for the selected policy.</DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Plate Number</Label>
                  <p className="font-medium">{selectedPolicy.plate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">{selectedPolicy.owner}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedPolicy.company}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="font-medium">{selectedPolicy.contact}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{selectedPolicy.start_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">{selectedPolicy.expiry_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadge(selectedPolicy.status)}>{selectedPolicy.status}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Days Remaining</Label>
                  <p className="font-medium">
                    {selectedPolicy.days_remaining > 0 ? `${selectedPolicy.days_remaining} day${selectedPolicy.days_remaining > 1 ? "s" : ""}` : "Expired"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
{/* Dialogs: Add / Edit / View / Delete */}
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
              <Input id="plate" value={formData.plate} onChange={(e) => setFormData({ ...formData, plate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner Name</Label>
              <Input id="owner" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
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
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOG (original layout) ===== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update the policy details.</DialogDescription>
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
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input id="edit-startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                <Input id="edit-expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                <p className="text-sm text-muted-foreground">
                  Days Remaining: {selectedPolicy.days_remaining > 0 ? `${selectedPolicy.days_remaining} day${selectedPolicy.days_remaining > 1 ? "s" : ""}` : "Expired"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contact">Contact Number</Label>
                <Input id="edit-contact" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW DIALOG (original layout) ===== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>View details for the selected policy.</DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Plate Number</Label>
                  <p className="font-medium">{selectedPolicy.plate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">{selectedPolicy.owner}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedPolicy.company}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="font-medium">{selectedPolicy.contact}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{selectedPolicy.start_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">{selectedPolicy.expiry_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Since Start</Label>
                  <p className="font-medium">
                    {selectedPolicy.timeToStart
                      ? selectedPolicy.timeToStart.totalSeconds > 0
                        ? `Starts in ${formatSpan(selectedPolicy.timeToStart)}`
                        : `Started ${Math.abs(Math.ceil((selectedPolicy.timeToStart.totalSeconds) / 86400))} day(s) ago`
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Time Until Expiry</Label>
                  <p className={`font-medium ${selectedPolicy.timeToEnd && selectedPolicy.timeToEnd.totalSeconds <= 0 ? "text-destructive" : ""}`}>
                    {selectedPolicy.timeToEnd ? (selectedPolicy.timeToEnd.totalSeconds > 0 ? formatSpan(selectedPolicy.timeToEnd) : `${Math.abs(Math.ceil(selectedPolicy.timeToEnd.totalSeconds / 86400))} day(s) ago`) : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadge(selectedPolicy.status)} variant="outline">{selectedPolicy.status}</Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DIALOG (original layout) ===== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the policy for <strong>{selectedPolicy?.plate}</strong>. This action cannot be undone.
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
  {/* ===== PROFESSIONAL BULK MESSAGE DIALOG ===== */}
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
        You are sending a message to <span className="font-bold text-foreground">{filteredPolicies.length} recipients</span>. 
        Filters currently applied: <Badge variant="secondary" className="ml-1 uppercase text-[10px]">{statusFilter}</Badge>
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Quick Tags Info */}
      <div className="bg-muted/50 p-3 rounded-lg border border-border">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Available Personalization Tags</Label>
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
            {bulkMessage.length} / 160 characters (1 SMS)
          </span>
        </div>
        <textarea
          id="message"
          className="flex min-h-[150px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed transition-all resize-none"
          placeholder="e.g. Dear {owner}, your insurance for {plate} expires in {days} days. Please renew with SORAS."
          value={bulkMessage}
          onChange={(e) => setBulkMessage(e.target.value)}
        />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900">
        <div className="mt-0.5 text-blue-600 italic text-xs">
          💡 Pro-tip: Keep messages under 160 characters to avoid double billing from Africa's Talking.
        </div>
      </div>
    </div>

    <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="ghost" onClick={() => setIsMessageDialogOpen(false)}>
        Cancel
      </Button>
      <Button 
        onClick={handleSendMessage} 
        disabled={isSending || !bulkMessage.trim()}
        className="px-8 shadow-lg shadow-primary/20"
      >
        {isSending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Sending...
          </span>
        ) : (
          "Send Broadcast"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
};

export default Policies;
