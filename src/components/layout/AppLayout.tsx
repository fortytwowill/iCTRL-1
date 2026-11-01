import { useState, type ReactNode } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
 IconPackage, IconQrcode, IconClipboardList, IconSettings,
  IconArrowDownLeft, IconArrowUpRight, IconChevronDown, IconMenu2, IconLogout,
  IconUser, IconMapPin, IconBox, IconCalendarClock,
} from "@tabler/icons-react";
import {
  AppShell, Burger, Group, UnstyledButton, Text, Menu, Divider,
  ScrollArea, NavLink as MantineNavLink, Box, Avatar,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { BugReportDialog } from "@/components/bug-report/BugReportDialog";

const mainNavItems = [
  { path: "/", label: "Inventory", icon: IconPackage },
  { path: "/scanner", label: "Scanner", icon: IconScanLine },
  { path: "/serial-batch", label: "Serial / Batch", icon: IconClipboardList },
  { path: "/purchase-orders", label: "Purchase Orders", icon: IconArrowDownLeft },
  { path: "/locations", label: "Locations", icon: IconMapPin },
  { path: "/bundles", label: "Bundles", icon: IconBox },
  { path: "/reports", label: "Reports", icon: IconCalendarClock },
];

const logSubItems = [
  { path: "/logs/output", label: "Output Log", icon: IconArrowDownLeft },
  { path: "/logs/input", label: "Input Log", icon: IconArrowUpRight },
];

const settingsSubItems = [
  { path: "/manage", label: "Management", icon: IconPackage },
  { path: "/configurations", label: "Configurations", icon: IconSettings },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { signOut, user, profile, isAdmin, isReadOnly } = useAuth();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const isLogsActive = location.pathname.startsWith("/logs");
  const isSettingsActive = location.pathname === "/manage" || location.pathname === "/configurations";
  const userDisplayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "User";

  const renderDesktopNav = () => (
    <Group gap={4}>
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <UnstyledButton
            key={item.path}
            component={Link}
            to={item.path}
            variant="subtle"
            color={isActive ? "blue" : "gray"}
            style={{ borderRadius: "var(--mantine-radius-md)" }}
            px="md"
            py="xs"
          >
            <Group gap={6}>
              <Icon size={16} />
              <Text size="sm" fw={500}>{item.label}</Text>
            </Group>
          </UnstyledButton>
        );
      })}

      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <UnstyledButton
            variant="subtle"
            color={isLogsActive ? "blue" : "gray"}
            style={{ borderRadius: "var(--mantine-radius-md)" }}
            px="md"
            py="xs"
          >
            <Group gap={6}>
              <IconClipboardList size={16} />
              <Text size="sm" fw={500}>Logs</Text>
              <IconChevronDown size={12} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {logSubItems.map((item) => {
            const Icon = item.icon;
            return (
              <Menu.Item key={item.path} component={Link} to={item.path} leftSection={<Icon size={16} />}>
                {item.label}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>

      {isAdmin && (
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <UnstyledButton
              variant="subtle"
              color={isSettingsActive ? "blue" : "gray"}
              style={{ borderRadius: "var(--mantine-radius-md)" }}
              px="md"
              py="xs"
            >
              <Group gap={6}>
                <IconSettings size={16} />
                <Text size="sm" fw={500}>Settings</Text>
                <IconChevronDown size={12} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {settingsSubItems.map((item) => {
              const Icon = item.icon;
              return (
                <Menu.Item key={item.path} component={Link} to={item.path} leftSection={<Icon size={16} />}>
                  {item.label}
                </Menu.Item>
              );
            })}
          </Menu.Dropdown>
        </Menu>
      )}
    </Group>
  );

  const renderMobileNavLinks = () => (
    <ScrollArea h="calc(100vh - 80px)" type="never">
      <Box p="md">
        <Group justify="space-between" mb="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">Theme</Text>
          <ThemeToggle />
        </Group>

        {mainNavItems.map((item) => (
          <MantineNavLink
            key={item.path}
            component={Link}
            to={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={location.pathname === item.path}
            onClick={toggleMobile}
            variant="filled"
            color="blue"
          />
        ))}

        <Divider my="sm" />
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} ml="sm">Logs</Text>
        {logSubItems.map((item) => (
          <MantineNavLink
            key={item.path}
            component={Link}
            to={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={location.pathname === item.path}
            onClick={toggleMobile}
            variant="filled"
            color="blue"
          />
        ))}

        {isAdmin && (
          <>
            <Divider my="sm" />
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} ml="sm">Settings</Text>
            {settingsSubItems.map((item) => (
              <MantineNavLink
                key={item.path}
                component={Link}
                to={item.path}
                label={item.label}
                leftSection={<item.icon size={18} />}
                active={location.pathname === item.path}
                onClick={toggleMobile}
                variant="filled"
                color="blue"
              />
            ))}
          </>
        )}

        <Divider my="sm" />
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} ml="sm">Account</Text>
        <MantineNavLink
          component={Link}
          to="/profile-settings"
          label="Profile Settings"
          leftSection={<IconUser size={18} />}
          active={location.pathname === "/profile-settings"}
          onClick={toggleMobile}
          variant="filled"
          color="blue"
        />
        <MantineNavLink
          label="Sign Out"
          leftSection={<IconLogout size={18} />}
          color="red"
          onClick={() => { signOut(); toggleMobile(); }}
          variant="light"
        />
      </Box>
    </ScrollArea>
  );

  // ponytail: Mobile bottom nav kept as custom flex for exact UX parity; upgrade to Mantine Tabs if layout permits
  const mobileBottomItems = [
    { path: "/", label: "Inventory", icon: IconPackage },
    ...(isReadOnly ? [] : [{ path: "/scanner", label: "Scanner", icon: IconScanLine }]),
    { path: "/logs/output", label: "Logs", icon: IconClipboardList },
    ...(isAdmin ? [{ path: "/manage", label: "Manage", icon: IconSettings }] : []),
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { desktop: true, mobile: !mobileOpened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="md">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
 <Box style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--mantine-radius-lg)', backgroundColor: 'var(--mantine-color-blue-6)' }}>
                <IconPackage size={20} color="white" />
              </Box>
              <Text size="lg" fw={700} variant="gradient" gradient={{ from: "blue", to: "cyan" }}>iCTRL</Text>
            </Link>
          </Group>

          <Group visibleFrom="sm" gap="xs">
            {renderDesktopNav()}
            <ThemeToggle />
            
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={8}>
                    <Avatar radius="xl" size="sm" color="blue">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="lg">{userDisplayName}</Text>
                    <IconChevronDown size={12} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Item component={Link} to="/profile-settings" leftSection={<IconUser size={16} />}>
                  Profile Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={() => signOut()}>
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="0">
        {renderMobileNavLinks()}
      </AppShell.Navbar>

      <AppShell.Main>
        <Box className="page-enter" pb={{ base: 80, sm: 0 }}>
          {children ?? <Outlet />}
        </Box>
        
        {/* Mobile Bottom Nav */}
        <Box
          hiddenFrom="sm"
          pos="fixed"
          bottom={0}
          left={0}
          right={0}
          h={60}
          bg="var(--mantine-color-body)"
          className="border-t border-gray-200 dark:border-gray-800 z-50"
          style={{ borderTopWidth: 1, borderTopStyle: "solid" }}
        >
          <Group h="100%" justify="space-around" wrap="nowrap">
            {mobileBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/logs/output" 
                ? location.pathname.startsWith("/logs")
                : item.path === "/manage"
                ? location.pathname === "/manage" || location.pathname === "/configurations"
                : location.pathname === item.path;
              return (
                <UnstyledButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                  c={isActive ? "blue" : "dimmed"}
                >
                  <Icon size={20} stroke={isActive ? 2 : 1.5} />
                  <Text size="xs" fw={500}>{item.label}</Text>
                </UnstyledButton>
              );
            })}
          </Group>
        </Box>

        <BugReportDialog />
      </AppShell.Main>
    </AppShell>
  );
}