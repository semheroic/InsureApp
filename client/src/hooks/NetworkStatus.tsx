import { useEffect } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";

const NetworkStatus = () => {
  useEffect(() => {
    const handleOnline = () => {
      // 1. Immediately remove the offline toast using its ID
      toast.dismiss("network-status-toast");

      // 2. Show the success message
      toast.success("Back Online", {
        description: "Your internet connection has been restored.",
        duration: 4000,
        icon: <Wifi className="h-4 w-4" />,
      });
    };

    const handleOffline = () => {
      // 3. Show the error message with a fixed ID
      toast.error("Offline Mode", {
        id: "network-status-toast", // This ID lets us control this specific toast
        description: "Please check your internet connection.",
        duration: Infinity, // Doesn't disappear until we call toast.dismiss()
        icon: <WifiOff className="h-4 w-4" />,
      });
    };

    // Listeners for browser events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check (if the user loads the app while already offline)
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null; 
};

export default NetworkStatus;