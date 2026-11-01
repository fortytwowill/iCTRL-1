import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Building2, Users, Info, ChevronDown } from "lucide-react";
import { Button, Card, TextInput, Text, Title, Stack, Group, Skeleton, Tabs, NumberInput, Collapse } from "@mantine/core";
import { useABCThresholds, useUpdateABCThresholds, useProjectLabel, useUpdateProjectLabel } from "@/hooks/useInventory";
import { ABCThresholds } from "@/types/inventory";
import UserManagement from "@/components/UserManagement";
import { useCanWrite } from "@/hooks/useCanWrite";

export default function Configurations() {
  const { canWrite } = useCanWrite();
  const { data: thresholds, isLoading: thresholdsLoading } = useABCThresholds();
  const { data: projectLabel, isLoading: labelLoading } = useProjectLabel();
  const updateThresholds = useUpdateABCThresholds();
  const updateProjectLabel = useUpdateProjectLabel();
  
  const [formData, setFormData] = useState<ABCThresholds>({
    A: 30,
    B: 20,
    C: 10,
  });
  
  const [labelValue, setLabelValue] = useState("Projects");
  const [abcInfoOpen, setAbcInfoOpen] = useState(false);

  useEffect(() => {
    if (thresholds) {
      setFormData(thresholds);
    }
  }, [thresholds]);
  
  useEffect(() => {
    if (projectLabel) {
      setLabelValue(projectLabel);
    }
  }, [projectLabel]);

  const handleSaveThresholds = () => {
    updateThresholds.mutate(formData);
  };
  
  const handleSaveLabel = () => {
    updateProjectLabel.mutate(labelValue);
  };

  const abcInfo = [
    { curve: 'A' as const, name: 'Category A', description: 'High-value, critical items. Typically 10-20% of items representing 70-80% of value.', color: 'red' },
    { curve: 'B' as const, name: 'Category B', description: 'Medium-value items. Typically 30% of items representing 15-25% of value.', color: 'orange' },
    { curve: 'C' as const, name: 'Category C', description: 'Low-value, high-volume items. Typically 50% of items representing 5% of value.', color: 'gray' },
  ];

  const isLoading = thresholdsLoading || labelLoading;

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Configurations</Title>
        <Text c="dimmed">Manage system settings, custom options, and users</Text>
      </div>

      <Tabs defaultValue="abc">
        <Tabs.List grow mb="md">
          <Tabs.Tab value="abc" leftSection={<SettingsIcon size={16} />}>ABC Analysis</Tabs.Tab>
          <Tabs.Tab value="custom" leftSection={<Building2 size={16} />}>Custom</Tabs.Tab>
          <Tabs.Tab value="users" leftSection={<Users size={16} />}>Users & Roles</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="abc">
          <Stack gap="md">
            <Card withBorder>
              <Card.Section withBorder p="md">
                <Group gap="xs">
                  <SettingsIcon size={20} />
                  <Text fw={600}>ABC Curve Thresholds</Text>
                </Group>
                <Text size="sm" c="dimmed" mt={4}>
                  Set the percentage of optimal inventory at which items are flagged as "Low Stock" based on their ABC classification.
                </Text>
              </Card.Section>
              <Stack gap="md" p="md">
                {isLoading ? (
                  <Stack gap="sm"><Skeleton height={60} /><Skeleton height={60} /><Skeleton height={60} /></Stack>
                ) : (
                  <Group gap="md" wrap="wrap">
                    {abcInfo.map((info) => (
                      <Card key={info.curve} withBorder padding="md" bg={`var(--mantine-color-${info.color}-light)`} style={{ flex: '1 1 200px' }}>
                        <Group justify="space-between" mb="xs">
                          <Text fw={600} c={info.color}>{info.name}</Text>
                          <Group gap={4}>
                            <NumberInput
                              min={1} max={100}
                              value={formData[info.curve]}
                              onChange={(val) => setFormData((f) => ({ ...f, [info.curve]: typeof val === 'number' ? val : 0 }))}
                              w={80} size="xs"
                              disabled={!canWrite}
                            />
                            <Text size="sm" c="dimmed">%</Text>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Group>
                )}
                <Group justify="flex-end" pt="xs">
                  <Button onClick={handleSaveThresholds} disabled={updateThresholds.isPending || !canWrite} size="sm" leftSection={<Save size={16} />}>
                    {updateThresholds.isPending ? "Saving..." : "Save Thresholds"}
                  </Button>
                </Group>
              </Stack>
            </Card>

            <Button variant="outline" fullWidth onClick={() => setAbcInfoOpen((o) => !o)} rightSection={<ChevronDown size={16} style={{ transform: abcInfoOpen ? 'rotate(180deg)' : undefined, transition: 'transform 200ms' }} />} leftSection={<Info size={16} />}>
              How ABC Analysis Works
            </Button>
            <Collapse in={abcInfoOpen}>
              <Card withBorder>
                <Stack gap="md" p="md">
                  <Group gap="md" wrap="wrap">
                    {abcInfo.map((info) => (
                      <Card key={info.curve} withBorder padding="md" bg={`var(--mantine-color-${info.color}-light)`} style={{ flex: '1 1 200px' }}>
                        <Text fw={600} c={info.color} mb={4}>{info.name}</Text>
                        <Text size="xs" c="dimmed">{info.description}</Text>
                      </Card>
                    ))}
                  </Group>
                  <Text size="sm" c="dimmed">
                    ABC analysis is an inventory categorization method that divides items into three categories based on their value and importance. 
                    Category A items are high-value items that require tight control, Category B are medium-value items, 
                    and Category C are low-value items that can be managed with simpler controls.
                  </Text>
                </Stack>
              </Card>
            </Collapse>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="custom">
          <Card withBorder>
            <Card.Section withBorder p="md">
              <Group gap="xs">
                <Building2 size={20} />
                <Text fw={600}>Custom Settings</Text>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>Customize labels and naming used across InventoryCTRL</Text>
            </Card.Section>
            <Stack gap="md" p="md">
              {isLoading ? (
                <Skeleton height={60} />
              ) : (
                <div>
                  <TextInput
                    label="Label"
                    description='Rename "Projects" to better fit your workflow (e.g., "Departments", "Teams", "Locations")'
                    value={labelValue}
                    onChange={(e) => setLabelValue(e.currentTarget.value)}
                    placeholder="Projects"
                    maw={320} mb="md"
                    disabled={!canWrite}
                  />
                  <Button onClick={handleSaveLabel} disabled={updateProjectLabel.isPending || labelValue === projectLabel || !canWrite} leftSection={<Save size={16} />}>
                    {updateProjectLabel.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="users">
          <UserManagement />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
