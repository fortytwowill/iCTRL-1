import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, Button, Text, Title, Group, Stack, Box, AppShell } from "@mantine/core";
import { PrivacyContent } from "@/components/legal/PrivacyContent";

export default function LegalPrivacy() {
  return (
    <Box style={{ minHeight: "100vh" }}>
      <Box component="header" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Group justify="space-between" align="center" maw={1200} mx="auto" px="md" py="md">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Group gap="sm">
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "var(--mantine-color-blue-filled)",
                  color: "var(--mantine-color-white)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={20} />
              </Box>
              <div>
                <Text size="sm" fw={500} c="dimmed">InventoryCTRL</Text>
                <Text size="lg" fw={600}>Privacy Policy</Text>
              </div>
            </Group>
          </Link>
          <ThemeToggle />
        </Group>
      </Box>

      <Box component="main" maw={1200} mx="auto" px="md" py="xl">
        <Card withBorder padding={0}>
          <Card.Section p="xl" bg="var(--mantine-color-gray-0)">
            <Stack gap="md" maw={800}>
              <Text size="xs" fw={700} tt="uppercase" c="blue">Legal Policy</Text>
              <Title order={2}>Privacy Policy</Title>
              <Text size="sm" c="dimmed" maw={600}>
                Review the current Privacy Policy for InventoryCTRL.
              </Text>
            </Stack>
          </Card.Section>

          <Card.Section p="xl" style={{ maxHeight: "68vh", overflowY: "auto" }}>
            <PrivacyContent />
          </Card.Section>
        </Card>
      </Box>

      <Box
        component="footer"
        style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        px="xl"
        py="md"
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="xs" c="dimmed">
            This page is read-only. For inquiries, contact contact@capyco.ca.
          </Text>
          <Button variant="outline" component={Link} to="/login?mode=signin">
            Back to Sign In
          </Button>
        </Group>
      </Box>
    </Box>
  );
}
