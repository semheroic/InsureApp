import { Download, Building2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyFilter } from "@/types/policy";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  companyFilter: CompanyFilter;
  onFilterChange: (value: CompanyFilter) => void;
  onExport: () => void;
}

export const PageHeader = ({ companyFilter, onFilterChange, onExport }: PageHeaderProps) => {
  
  // Logic to handle export with a small loading state simulation or direct call
  const handleExportClick = () => {
    // We call the passed function which should handle the CSV/Excel logic
    onExport();
  };

  return (
    <div className="relative pb-6 mb-2 border-b border-slate-100 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      {/* Left Side: Titles */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Expiry Report
          </h1>
        </div>
        <p className="text-[13px] font-medium text-slate-500 max-w-md">
          Real-time monitoring of insurance policy lifecycles and upcoming renewals.
        </p>
      </div>

      {/* Right Side: Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Filter:
          </span>
        </div>
        
        <Select value={companyFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[160px] bg-white border-slate-200 shadow-sm hover:border-blue-400 transition-colors h-9 text-xs font-semibold">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all" className="text-xs">All Companies</SelectItem>
            <SelectItem value="soras" className="text-xs">SORAS</SelectItem>
            <SelectItem value="sonarwa" className="text-xs">SONARWA</SelectItem>
            <SelectItem value="prime" className="text-xs">PRIME</SelectItem>
            <SelectItem value="radiant" className="text-xs">RADIANT</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden sm:block" />

        <Button 
          onClick={handleExportClick} 
          className="gap-2 bg-slate-900 hover:bg-blue-600 text-white transition-all duration-300 shadow-md h-9 px-4 rounded-lg text-xs font-bold"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  );
};