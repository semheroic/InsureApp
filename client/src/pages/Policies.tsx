import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Edit, Trash2, Eye } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Policy = {
  id: number;
  plate: string;
  owner: string;
  company: string;
  startDate: string;
  expiryDate: string;
  status: string;
  daysRemaining: number;
  contact: string;
};

const initialPolicies: Policy[] = [
  {
    id: 1,
    plate: "RAD 123 A",
    owner: "John Mukiza",
    company: "SORAS",
    startDate: "2024-01-15",
    expiryDate: "2025-01-15",
    status: "Active",
    daysRemaining: 55,
    contact: "+250788123456",
  },
  {
    id: 2,
    plate: "RAB 456 B",
    owner: "Marie Uwase",
    company: "SONARWA",
    startDate: "2024-11-20",
    expiryDate: "2024-12-05",
    status: "Expiring Soon",
    daysRemaining: 14,
    contact: "+250788234567",
  },
  {
    id: 3,
    plate: "RAC 789 C",
    owner: "Patrick Nkusi",
    company: "PRIME",
    startDate: "2024-09-01",
    expiryDate: "2024-11-15",
    status: "Expired",
    daysRemaining: -6,
    contact: "+250788345678",
  },
  {
    id: 4,
    plate: "RAE 321 D",
    owner: "Grace Ingabire",
    company: "RADIANT",
    startDate: "2024-10-10",
    expiryDate: "2024-11-10",
    status: "Renewed",
    daysRemaining: 0,
    contact: "+250788456789",
  },
];

const Policies = () => {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    plate: "",
    owner: "",
    company: "SORAS",
    startDate: "",
    expiryDate: "",
    contact: "",
  });

  const itemsPerPage = 10;

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "bg-success/10 text-success border-success/20",
      "Expiring Soon": "bg-warning/10 text-warning border-warning/20",
      Expired: "bg-destructive/10 text-destructive border-destructive/20",
      Renewed: "bg-primary/10 text-primary border-primary/20",
    };
    return variants[status as keyof typeof variants] || "";
  };

  const calculateStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return { status: "Expired", daysRemaining };
    if (daysRemaining === 0) return { status: "Renewed", daysRemaining };
    if (daysRemaining <= 30) return { status: "Expiring Soon", daysRemaining };
    return { status: "Active", daysRemaining };
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch = searchQuery === "" || 
        policy.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        policy.status.toLowerCase().replace(" ", "") === statusFilter;
      
      const matchesCompany = companyFilter === "all" || 
        policy.company.toLowerCase() === companyFilter;
      
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [policies, searchQuery, statusFilter, companyFilter]);

  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPolicies, currentPage]);

  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);

  const handleAdd = () => {
    const { status, daysRemaining } = calculateStatus(formData.expiryDate);
    const newPolicy: Policy = {
      id: Math.max(...policies.map(p => p.id)) + 1,
      ...formData,
      status,
      daysRemaining,
    };
    setPolicies([...policies, newPolicy]);
    setIsAddDialogOpen(false);
    setFormData({
      plate: "",
      owner: "",
      company: "SORAS",
      startDate: "",
      expiryDate: "",
      contact: "",
    });
    toast({
      title: "Policy Added",
      description: "The insurance policy has been added successfully.",
    });
  };

  const handleEdit = () => {
    if (!selectedPolicy) return;
    const { status, daysRemaining } = calculateStatus(formData.expiryDate);
    setPolicies(policies.map(p => 
      p.id === selectedPolicy.id 
        ? { ...p, ...formData, status, daysRemaining }
        : p
    ));
    setIsEditDialogOpen(false);
    setSelectedPolicy(null);
    toast({
      title: "Policy Updated",
      description: "The insurance policy has been updated successfully.",
    });
  };

  const handleDelete = () => {
    if (!selectedPolicy) return;
    setPolicies(policies.filter(p => p.id !== selectedPolicy.id));
    setIsDeleteDialogOpen(false);
    setSelectedPolicy(null);
    toast({
      title: "Policy Deleted",
      description: "The insurance policy has been deleted successfully.",
      variant: "destructive",
    });
  };

  const openEditDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFormData({
      plate: policy.plate,
      owner: policy.owner,
      company: policy.company,
      startDate: policy.startDate,
      expiryDate: policy.expiryDate,
      contact: policy.contact,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsDeleteDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Plate Number", "Owner", "Company", "Start Date", "Expiry Date", "Days Left", "Status", "Contact"];
    const rows = filteredPolicies.map(p => [
      p.plate, p.owner, p.company, p.startDate, p.expiryDate, p.daysRemaining, p.status, p.contact
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "policies.csv";
    a.click();
    toast({
      title: "Export Successful",
      description: "Policies have been exported to CSV.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insurance Policies</h1>
          <p className="text-muted-foreground mt-1">Manage all vehicle insurance policies</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Add Policy</span>
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by plate, owner, or company..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiringsoon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="renewed">Renewed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              <SelectItem value="soras">SORAS</SelectItem>
              <SelectItem value="sonarwa">SONARWA</SelectItem>
              <SelectItem value="prime">PRIME</SelectItem>
              <SelectItem value="radiant">RADIANT</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No policies found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.plate}</TableCell>
                    <TableCell>{policy.owner}</TableCell>
                    <TableCell>{policy.company}</TableCell>
                    <TableCell>{policy.startDate}</TableCell>
                    <TableCell>{policy.expiryDate}</TableCell>
                    <TableCell>
                      <span className={policy.daysRemaining < 0 ? "text-destructive font-medium" : ""}>
                        {policy.daysRemaining < 0 ? `${Math.abs(policy.daysRemaining)} days ago` : `${policy.daysRemaining} days`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(policy.status)} variant="outline">
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={() => openViewDialog(policy)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8"
                          onClick={() => openEditDialog(policy)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(policy)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredPolicies.length)}</span> of <span className="font-medium">{filteredPolicies.length}</span> policies
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Policy Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Policy</DialogTitle>
            <DialogDescription>Enter the details for the new insurance policy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plate">Plate Number</Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner Name</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Insurance Company</Label>
              <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update the policy details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-plate">Plate Number</Label>
              <Input
                id="edit-plate"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-owner">Owner Name</Label>
              <Input
                id="edit-owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Insurance Company</Label>
              <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-expiryDate">Expiry Date</Label>
              <Input
                id="edit-expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Policy Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
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
                  <p className="font-medium">{selectedPolicy.startDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">{selectedPolicy.expiryDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Days Remaining</Label>
                  <p className={`font-medium ${selectedPolicy.daysRemaining < 0 ? "text-destructive" : ""}`}>
                    {selectedPolicy.daysRemaining < 0 
                      ? `${Math.abs(selectedPolicy.daysRemaining)} days ago` 
                      : `${selectedPolicy.daysRemaining} days`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadge(selectedPolicy.status)} variant="outline">
                    {selectedPolicy.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
