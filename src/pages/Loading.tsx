import { Center, Loader, Title, Text } from "@mantine/core";

const Loading = () => {
  return (
    <Center h="100vh" bg="var(--mantine-color-body)">
      <div style={{ textAlign: "center" }}>
        <Loader size="xl" mb="md" />
        <Title order={3} mb="xs">Loading iCTRL</Title>
        <Text size="sm" c="dimmed">Please wait while we prepare your dashboard...</Text>
      </div>
    </Center>
  );
};

export default Loading;