import { SegmentedControl } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun, IconDeviceDesktop } from "@tabler/icons-react";

// ponytail: three-mode toggle via Mantine built-in; no custom state or mount guard needed.
// Upgrade path: add transition or tooltip per segment if UX demands it.

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControl
      data={[
        { value: "light", label: <IconSun size={16} /> },
        { value: "auto", label: <IconDeviceDesktop size={16} /> },
        { value: "dark", label: <IconMoon size={16} /> },
      ]}
      value={colorScheme}
      onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
      size="xs"
      radius="md"
      data-testid="theme-toggle"
      aria-label="Theme"
    />
  );
}