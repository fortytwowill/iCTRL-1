import { Center, Title, Text, Anchor } from "@mantine/core";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Center h="100vh" bg="var(--mantine-color-body)">
      <div style={{ textAlign: "center" }}>
        <Title order={1} mb="md">404</Title>
        <Text size="xl" c="dimmed" mb="md">Oops! Page not found</Text>
        <Anchor href="/" underline="always">
          Return to Home
        </Anchor>
      </div>
    </Center>
  );
};

export default NotFound;
