import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Center, Stack, Text, Loader } from "@mantine/core";

interface ProtectedRouteProps {
 children: React.ReactNode;
}

interface RoleRouteProps {
 children: React.ReactNode;
}

function RouteLoadingScreen() {
 return (
 <Center h="100vh">
 <Stack align="center" gap="md">
 <Loader size="lg" />
 <Text c="dimmed">Loading...</Text>
 </Stack>
 </Center>
 );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
 const { user, isLoading, requiresInvitationCompletion, pendingInvitationToken } = useAuth();
 const location = useLocation();

 if (isLoading) {
 return <RouteLoadingScreen />;
 }

 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 if (requiresInvitationCompletion && location.pathname !== "/accept-invitation") {
 const redirectSearch = pendingInvitationToken
 ? `?token=${encodeURIComponent(pendingInvitationToken)}`
 : "";
 return <Navigate to={`/accept-invitation${redirectSearch}`} replace />;
 }

 return <>{children}</>;
}

export function AdminRoute({ children }: RoleRouteProps) {
 const { user, isLoading, isAdmin } = useAuth();
 const location = useLocation();

 if (isLoading) {
 return <RouteLoadingScreen />;
 }

 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 if (!isAdmin) {
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
}

export function WriteAccessRoute({ children }: RoleRouteProps) {
 const { user, isLoading: isAuthLoading, isReadOnly } = useAuth();
 const location = useLocation();

 if (isAuthLoading) {
 return <RouteLoadingScreen />;
 }

 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 if (isReadOnly) {
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
}

export function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
 const { isPlatformAdmin, isLoading } = useAuth();

 if (isLoading) {
 return (
 <Center h="100vh">
 <Loader size="lg" />
 </Center>
 );
 }

 if (!isPlatformAdmin) {
 return <Navigate to="/" replace />;
 }

 return <>{children}</>;
}