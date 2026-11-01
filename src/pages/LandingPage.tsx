import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Menu,
  Package,
  ScanLine,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  Text,
  Group,
  Stack,
  Drawer,
  Box,
  Flex,
  Anchor,
  Divider,
  ActionIcon,
  Container,
  Title,
  SimpleGrid,
  Accordion,
} from "@mantine/core";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildLoginHref } from "@/lib/authNavigation";

const implementedFeatures = [
  {
    title: "Real-time tracking",
    description: "Monitor inventory levels and movements as they happen.",
    icon: ScanLine,
  },
  {
    title: "Project allocation",
    description: "Tie every item to a specific job or project for accurate costing.",
    icon: Users,
  },
  {
    title: "Detailed logs",
    description: "Complete audit trail of every check-in and check-out.",
    icon: FileText,
  },
  {
    title: "Barcode scanning",
    description: "Fast workflows using standard barcode scanners or mobile cameras.",
    icon: CheckCircle2,
  },
];

const showcaseFeatures = [
  {
    title: "Open Source",
    description: "Fully self-hosted with no subscription fees or hidden limits.",
    icon: ShieldCheck,
  },
  {
    title: "Unlimited Scale",
    description: "Track as many items and users as your infrastructure can handle.",
    icon: BarChart3,
  },
  {
    title: "Flexible Workflows",
    description: "Adapt the system to your unique operational processes.",
    icon: ClipboardList,
  },
  {
    title: "Data Ownership",
    description: "Your data stays on your servers, ensuring complete privacy and control.",
    icon: Package,
  },
];

const faqs = [
  {
    question: "Is iCTRL really free?",
    answer: "Yes. iCTRL is open-source software released under the MIT license. You can deploy it on your own infrastructure without any licensing fees.",
  },
  {
    question: "Do I need special hardware?",
    answer: "No. iCTRL works with any standard USB barcode scanner. You can also use a smartphone camera for scanning via the web interface.",
  },
  {
    question: "Can I migrate from my current spreadsheet?",
    answer: "Absolutely. We provide import tools to help you move your existing inventory data into iCTRL quickly and accurately.",
  },
  {
    question: "How difficult is it to set up?",
    answer: "If you are familiar with Docker, you can have iCTRL running in minutes using our provided docker-compose configuration.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box style={{ minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid var(--mantine-color-border)" }}>
        <Container size="xl" px="md">
          <Flex h={64} align="center" justify="space-between">
            <Group gap="xs">
              <Anchor href="#hero" underline="never">
                <Flex align="center" gap="xs">
                  <Box
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: "var(--mantine-radius-xl)",
                      backgroundColor: "var(--mantine-color-primary-filled)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Package size={20} color="var(--mantine-color-white)" />
                  </Box>
                  <Text fw={700} size="lg">iCTRL</Text>
                </Flex>
              </Anchor>
            </Group>

            <Group gap="md" visibleFrom="md">
              <Anchor href="#features" underline="never" c="dimmed" fw={500}>Features</Anchor>
              <Anchor href="#faq" underline="never" c="dimmed" fw={500}>FAQ</Anchor>
              <Anchor href="https://github.com/fortytwowill/iCTRL" target="_blank" rel="noreferrer" underline="never" c="dimmed" fw={500}>GitHub</Anchor>
            </Group>

            <Group gap="xs">
              <ThemeToggle />
              <Group gap="xs" visibleFrom="lg">
                <Button component={Link} to={buildLoginHref({ mode: "signin" })} variant="subtle">Sign In</Button>
                <Button component={Link} to={buildLoginHref({ mode: "signup" })}>Self-host free</Button>
              </Group>

              <ActionIcon
                variant="subtle"
                size="lg"
                hiddenFrom="lg"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </ActionIcon>
            </Group>
          </Flex>
        </Container>

        <Drawer
          opened={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          position="right"
          size={256}
          padding="md"
          withCloseButton={false}
        >
          <Stack gap="sm" mt="md">
            <Flex align="center" justify="space-between" px="sm" pb="xs">
              <Text size="xs" fw={600} tt="uppercase" c="dimmed">Theme</Text>
              <ThemeToggle />
            </Flex>

            <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm">Navigation</Text>
            <Anchor href="#features" onClick={() => setMobileMenuOpen(false)} underline="never" c="dimmed" fw={500} py={8} px="sm" style={{ borderRadius: "var(--mantine-radius-md)" }}>Features</Anchor>
            <Anchor href="#faq" onClick={() => setMobileMenuOpen(false)} underline="never" c="dimmed" fw={500} py={8} px="sm" style={{ borderRadius: "var(--mantine-radius-md)" }}>FAQ</Anchor>

            <Divider my="xs" />
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm">Account</Text>
            <Anchor component={Link} to={buildLoginHref({ mode: "signin" })} onClick={() => setMobileMenuOpen(false)} underline="never" c="dimmed" fw={500} py={8} px="sm" style={{ borderRadius: "var(--mantine-radius-md)" }}>Sign In</Anchor>
            <Anchor component={Link} to={buildLoginHref({ mode: "signup" })} onClick={() => setMobileMenuOpen(false)} underline="never" c="var(--mantine-color-primary-filled)" fw={500} py={8} px="sm" style={{ borderRadius: "var(--mantine-radius-md)" }}>Self-host free</Anchor>
          </Stack>
        </Drawer>
      </header>

      <main>
        <section id="hero" style={{ borderBottom: "1px solid var(--mantine-color-border)" }}>
          <Container size="md" px="md" py={80}>
            <Stack gap="xl" align="center">
              <Stack gap="md" align="center">
                <Title order={1} ta="center" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1 }}>
                  Track every item leaving the warehouse and tie it back to the work that used it.
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={600}>
                  iCTRL gives operations teams a clean dashboard, fast scanning workflows, and detailed logs — fully self-hosted, open source, no subscriptions.
                </Text>
              </Stack>

              <Group gap="sm">
                <Button component={Link} to={buildLoginHref({ mode: "signup" })} size="lg" rightSection={<ArrowRight size={16} />}>
                  Self-host free
                </Button>
                <Button component="a" href="https://github.com/fortytwowill/iCTRL" target="_blank" rel="noreferrer" size="lg" variant="outline">
                  View on GitHub
                </Button>
              </Group>

              <Text size="sm" c="dimmed">
                Unlimited users and items. MIT licensed. Deploy on your own infrastructure.
              </Text>
            </Stack>
          </Container>
        </section>

        <section id="features" style={{ borderBottom: "1px solid var(--mantine-color-border)" }}>
          <Container size="xl" px="md" py={80}>
            <Stack gap="xl">
              <Title order={2} ta="center" maw={600} mx="auto">
                Inventory built for the way jobs actually run.
              </Title>

              <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="lg">
                {showcaseFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} p="xl" radius="md" withBorder>
                      <Stack gap="md">
                        <Box
                          style={{
                            height: 48,
                            width: 48,
                            borderRadius: "var(--mantine-radius-xl)",
                            backgroundColor: "var(--mantine-color-primary-light)",
                            color: "var(--mantine-color-primary-filled)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={24} />
                        </Box>
                        <Stack gap="xs">
                          <Text size="lg" fw={600}>{feature.title}</Text>
                          <Text size="sm" c="dimmed">{feature.description}</Text>
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </Container>
        </section>

        <section id="implementation-details" style={{ borderBottom: "1px solid var(--mantine-color-border)" }}>
          <Container size="xl" px="md" py={80}>
            <Stack gap="xl">
              <Title order={2} ta="center" maw={600} mx="auto">
                Match the software to the way your team actually moves materials.
              </Title>

              <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="lg">
                {implementedFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} p="xl" radius="md" withBorder>
                      <Stack gap="md">
                        <Box
                          style={{
                            height: 48,
                            width: 48,
                            borderRadius: "var(--mantine-radius-xl)",
                            backgroundColor: "var(--mantine-color-primary-light)",
                            color: "var(--mantine-color-primary-filled)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={24} />
                        </Box>
                        <Stack gap="xs">
                          <Text size="lg" fw={600}>{feature.title}</Text>
                          <Text size="sm" c="dimmed">{feature.description}</Text>
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </Container>
        </section>

        <section id="faq">
          <Container size="lg" px="md" py={80}>
            <Stack gap="xl">
              <Title order={2} ta="center" maw={600} mx="auto">
                Questions teams ask before switching from spreadsheets and paper logs.
              </Title>

              <Accordion variant="separated">
                {faqs.map((item) => (
                  <Accordion.Item key={item.question} value={item.question}>
                    <Accordion.Control icon={<ShieldCheck size={20} color="var(--mantine-color-primary-filled)" />}>
                      <Text fw={600}>{item.question}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Text c="dimmed">{item.answer}</Text>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Stack>
          </Container>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--mantine-color-border)" }}>
        <Container size="xl" px="md" py="md">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap="md">
            <Group gap="md">
              <Text size="sm" c="dimmed">&copy; 2026 iCTRL contributors. MIT License.</Text>
              <Anchor component={Link} to="/legal/terms" size="sm" c="dimmed" underline="never">Terms</Anchor>
              <span aria-hidden="true">&middot;</span>
              <Anchor component={Link} to="/legal/privacy" size="sm" c="dimmed" underline="never">Privacy</Anchor>
            </Group>
            <Group gap="xs">
              <ActionIcon component="a" href="https://github.com/fortytwowill/iCTRL" target="_blank" rel="noreferrer" variant="subtle" aria-label="GitHub">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </ActionIcon>
            </Group>
          </Flex>
        </Container>
      </footer>
    </Box>
  );
}