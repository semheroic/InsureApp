import { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PolicyTable } from "@/components/Expiry/PolicyTable";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, Search, RefreshCw } from "lucide-react";

// NOTE: Assuming PolicyTable data structure is compatible with the fetched data
interface PolicyFollowUp {
  id: number;
  plate: string;
  owner: string;
  followup_status: "confirmed" | "pending" | "missed";
  // ... other policy fields
}

const API_FOLLOWUP = "http://localhost:5000/api/followup";
const API_REMINDER = "http://localhost:5000/api/policies/send-reminder";

export default function FollowUps() {
  const { toast } = useToast();
  const [data, setData] = useState<PolicyFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /** ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_FOLLOWUP);
      if (!res.ok) throw new Error("Failed to fetch policy follow-ups data.");
      const json: PolicyFollowUp[] = await res.json();
      setData(json);
      toast({ title: "Success", description: "Follow-up list updated.", duration: 2000 });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error Fetching Data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** ================= SEARCH FILTER & GROUPING ================= */
  const { filteredData, grouped } = useMemo(() => {
    // 1. Search Filter
    const currentFilteredData = data.filter(
      (p) =>
        p.plate.toLowerCase().includes(search.toLowerCase()) ||
        p.owner.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Grouping
    const currentGrouped = {
      confirmed: currentFilteredData.filter((p) => p.followup_status === "confirmed"),
      pending: currentFilteredData.filter((p) => p.followup_status === "pending"),
      missed: currentFilteredData.filter((p) => p.followup_status === "missed"),
    };

    return { filteredData: currentFilteredData, grouped: currentGrouped };
  }, [data, search]);
  
  const totalCount = data.length;

  /**
   * Status Card Component (Inline for Single File Structure)
   */
  const StatusCard = ({ title, count, icon: Icon, colorClass, className = "" }: { title: string, count: number, icon: React.ElementType, colorClass: string, className?: string }) => (
    <Card className={`p-5 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow ${className}`}>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`text-3xl font-bold mt-1 ${colorClass}`}>{count}</div>
      </div>
      <Icon className={`w-8 h-8 ${colorClass} opacity-70`} />
    </Card>
  );

  /** ================= RENDER ================= */
  return (
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* ===== HEADER & REFRESH ===== */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
         Policy Follow-Ups Dashboard
        </h1>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className={`p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Refresh Data"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ===== STATUS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Confirmed Card */}
        <StatusCard 
          title="Confirmed Renewals" 
          count={grouped.confirmed.length} 
          icon={CheckCircle} 
          colorClass="text-green-600"
          className="col-span-1 lg:col-span-1 border-l-4 border-green-500"
        />

        {/* Pending Card */}
        <StatusCard 
          title="Pending Follow-Up" 
          count={grouped.pending.length} 
          icon={Clock} 
          colorClass="text-yellow-600"
          className="col-span-1 lg:col-span-1 border-l-4 border-yellow-500"
        />

        {/* Missed Card */}
        <StatusCard 
          title="Missed Follow-Up" 
          count={grouped.missed.length} 
          icon={XCircle} 
          colorClass="text-red-600"
          className="col-span-1 lg:col-span-1 border-l-4 border-red-500"
        />
      </div>
      
      {/* ===== CONTROLS: SEARCH & TABS ===== */}
      <Card className="p-4 bg-white dark:bg-gray-800 shadow-md">
        
        {/* Search Input */}
        <div className="flex justify-end mb-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Plate or Owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border pl-10 pr-4 py-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabs List */}
        <Tabs defaultValue="pending"> {/* Default to Pending/Actionable tab */}
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="confirmed" className="py-2">
              <CheckCircle size={18} className="mr-2 text-green-600" /> 
              Confirmed ({grouped.confirmed.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="py-2">
              <Clock size={18} className="mr-2 text-yellow-600" /> 
              Pending Action ({grouped.pending.length})
            </TabsTrigger>
            <TabsTrigger value="missed" className="py-2">
              <XCircle size={18} className="mr-2 text-red-600" /> 
              Missed ({grouped.missed.length})
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB CONTENT ===== */}
          <div className="mt-4">
            
            <TabsContent value="confirmed">
              <h3 className="text-xl font-semibold mb-3">Confirmed Renewals ({grouped.confirmed.length})</h3>
              <PolicyTable
                data={grouped.confirmed}
                sendReminderEndpoint={API_REMINDER} 
                refreshData={fetchData}
                searchable={false} // Search is handled globally
              />
            </TabsContent>

            <TabsContent value="pending">
              <h3 className="text-xl font-semibold mb-3 text-yellow-600">Policies Requiring Follow-Up ({grouped.pending.length})</h3>
              <PolicyTable
                data={grouped.pending}
                sendReminderEndpoint={API_REMINDER}
                refreshData={fetchData}
                searchable={false}
              />
            </TabsContent>

            <TabsContent value="missed">
              <h3 className="text-xl font-semibold mb-3 text-red-600">Missed Follow-Ups ({grouped.missed.length})</h3>
              <PolicyTable
                data={grouped.missed}
                sendReminderEndpoint={API_REMINDER}
                refreshData={fetchData}
                searchable={false}
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}