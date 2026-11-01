import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthCallbackRedirector } from "@/components/AuthCallbackRedirector";
import {
  ProtectedRoute,
  AdminRoute,
  PlatformAdminRoute,
  WriteAccessRoute,
} from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import LegalTerms from "./pages/LegalTerms";
import LegalPrivacy from "./pages/LegalPrivacy";
import Scanner from "./pages/Scanner";
import OutputLogs from "./pages/OutputLogs";
import InputLogs from "./pages/InputLogs";
import Configurations from "./pages/Configurations";
import ProfileSettings from "./pages/ProfileSettings";
import { AdminLayout } from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";
import Loading from "./pages/Loading";
import Error from "./pages/Error";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthCallbackRedirector />
      <AuthProvider>
        <Routes>
          <Route path="/loading" element={<Loading />} />
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Home />} /> 
          <Route path="/accept-invitation" element={<Home />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/input-logs" element={<InputLogs />} />
              <Route path="/output-logs" element={<OutputLogs />} />
              <Route path="/configurations" element={<Configurations />} />
              <Route path="/profile" element={<ProfileSettings />} />
              
              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/*" element={<AdminLayout />} />
              </Route>
              
              {/* Platform Admin routes */}
              <Route element={<PlatformAdminRoute />}>
                <Route path="/platform-admin/*" element={<div>Platform Admin</div>} />
              </Route>
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;