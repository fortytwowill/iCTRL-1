import { ReactNode } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { IconUsers, IconChartBar, IconLogout, IconShield } from "@tabler/icons-react";
import {
  AppShell, Burger, Group, Text, NavLink as MantineNavLink, Box, Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ThemeToggle } from "@/components/theme-toggle";

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [opened, { toggle }] = useDisclosure();

  const navItems = [
    { label: "Accounts", href: "/admin/accounts", icon: IconUsers },
    { label: "Statistics", href: "/admin/statistics", icon: IconChartBar },
    { label: "Admins", href: "/admin/admins", icon: IconShield },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { desktop: false, mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="lg" fw={700} variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
              Admin Panel
            </Text>
          </Group>

          <Group visibleFrom="sm" gap="md">
            <ThemeToggle />
            <Text size="sm" c="dimmed">{user?.email}</Text>
            <Button component={Link} to="/" variant="outline" size="xs">
              Exit Admin
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ display: "flex", flexDirection: "column" }}>
        <Box>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <MantineNavLink
                key={item.href}
                component={Link}
                to={item.href}
                label={item.label}
                leftSection={<Icon size={18} />}
                active={location.pathname === item.href}
                variant="filled"
                color="blue"
                onClick={() => { if (opened) toggle(); }}
              />
            );
          })}
        </Box>
        <Box mt="auto" pt="xl" className="border-t border-gray-200 dark:border-gray-800" style={{ borderTopWidth: 1, borderTopStyle: "solid" }}>
          <MantineNavLink
            component={Link}
            to="/"
            label="Back to App"
            leftSection={<IconLogout size={18} />}
            color="red"
            variant="light"
          />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Group justify="space-between" mb="xl" wrap={{ base: "wrap", sm: "nowrap" }}>
          <Text size="xl" fw={700} variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
            Platform Administration
          </Text>
          <Group gap="md" hiddenFrom="sm">
            <ThemeToggle />
          </Group>
        </Group>
        {children ?? <Outlet />}
      </AppShell.Main>
    </AppShell>
  );
}