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

  /* ---------------- ADD ---------------- */
  const handleAdd = async () => {
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
    } catch {
      toast({ title: "Error", description: "Failed to add policy", variant: "destructive" });
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
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Add Policy
        </Button>
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
    </div>
  );
};

export default Policies;
