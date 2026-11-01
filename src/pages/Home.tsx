import { Loader, Center, Text } from "@mantine/core";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import LandingPage from "./LandingPage";

function HomeLoadingScreen() {
  return (
    <Center h="100vh" className="industrial-grid">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Loader size="lg" color="blue" />
        <Text size="sm" c="dimmed">Loading InventoryCTRL...</Text>
      </div>
    </Center>
  );
}

export default function Home() {
 const { user, isLoading } = useAuth();

 if (isLoading) {
 return <HomeLoadingScreen />;
 }

 // Temporary bypass for mobile debugging
 return (
 <div style={{ padding: '2rem' }}>
 <h1>iCTRL Mobile Test</h1>
 <p>User: {user ? user.email : 'Guest'}</p>
 <p style={{ color: 'green' }}>✅ App is rendering correctly!</p>
 </div>
 );
}
