import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Policies from "./pages/Policies";
import Users from "./pages/Users";
import AnalyticsReport from "./pages/AnalyticsReport";
import ExpiryReport from "./pages/ExpiryReport";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AddUser from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword"; 
import VerifyOtp from "./pages/VerifyOtp";
import FollowUp from "./pages/Followup";
import { EditProfile } from "./components/Layout/EditProfile";
import PolicyHistoryTracker from "./pages/PolicyHistory";
import NetworkStatus from "./hooks/NetworkStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* NetworkStatus is placed here to listen for browser events. 
          It will trigger notifications via the <Sonner /> component below.
      */}
      <NetworkStatus />
      
      <Toaster />
      <Sonner position="bottom-center" expand={false} richColors />
      
      <BrowserRouter 
        future={{ 
          v7_startTransition: true, 
          v7_relativeSplatPath: true 
        }}
      >
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Login/>} />
          <Route path="/signup" element={<AddUser/>} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/verify-otp" element={<VerifyOtp/>} />

          {/* Protected/Main Routes wrapped in MainLayout */}
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/policies" element={<MainLayout><Policies /></MainLayout>} />
          <Route path="/users" element={<MainLayout><Users /></MainLayout>} />
          <Route path="/users/edit/:id" element={<EditProfile/>} />
          <Route path="/reports/analytics" element={<MainLayout><AnalyticsReport /></MainLayout>} />
          <Route path="/reports/expiry" element={<MainLayout><ExpiryReport /></MainLayout>} />
          <Route path="/reports/Followups" element={<MainLayout><FollowUp /></MainLayout>} />
          <Route path="/reports/history" element={<MainLayout><PolicyHistoryTracker/></MainLayout>} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;