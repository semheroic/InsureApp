import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyFilter } from "@/types/policy";

interface PageHeaderProps {
  companyFilter: CompanyFilter;
  onFilterChange: (value: CompanyFilter) => void;
  onExport: () => void;
}

export const PageHeader = ({ companyFilter, onFilterChange, onExport }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Expiry Report</h1>
        <p className="text-muted-foreground mt-2">Track and manage policy expirations</p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={companyFilter} onValueChange={onFilterChange}>
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
        <Button onClick={onExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
};
