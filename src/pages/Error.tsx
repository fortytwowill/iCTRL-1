import { Center, Title, Text, Anchor, Button } from "@mantine/core";
import { useRouteError } from "react-router-dom";

const Error = () => {
  const error = useRouteError() as Error;

  return (
    <Center h="100vh" bg="var(--mantine-color-body)">
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <Title order={1} c="red" mb="md">Something went wrong</Title>
        <Text size="lg" mb="md">
          {error?.message || "An unexpected error occurred."}
        </Text>
        <Button component="a" href="/" variant="filled">
          Return to Home
        </Button>
      </div>
    </Center>
  );
};

export default Error;