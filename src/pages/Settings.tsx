import { useState, useEffect } from "react";
 import { Settings as SettingsIcon, Save, Building2, Sparkles } from "lucide-react";
 import { Button, Card, TextInput, Text, Title, Stack, Group, Skeleton, NumberInput, Switch } from "@mantine/core";
import { useABCThresholds, useUpdateABCThresholds, useProjectLabel, useUpdateProjectLabel } from "@/hooks/useInventory";
import { ABCThresholds } from "@/types/inventory";
import UserManagement from "@/components/UserManagement";

export default function Settings() {
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
    {
      curve: 'A' as const,
      name: 'Category A',
      description: 'High-value, critical items. Typically 10-20% of items representing 70-80% of value.',
      color: 'red',
    },
    {
      curve: 'B' as const,
      name: 'Category B',
      description: 'Medium-value items. Typically 30% of items representing 15-25% of value.',
      color: 'orange',
    },
    {
      curve: 'C' as const,
      name: 'Category C',
      description: 'Low-value, high-volume items. Typically 50% of items representing 5% of value.',
      color: 'gray',
    },
  ];

  const isLoading = thresholdsLoading || labelLoading;

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Settings</Title>
        <Text c="dimmed">Configure system parameters and organization settings</Text>
      </div>

      {/* Custom Settings */}
      <Card withBorder>
        <Card.Section withBorder p="md">
          <Group gap="xs">
            <Building2 size={20} />
            <Text fw={600}>Custom Settings</Text>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Customize labels and naming used across InventoryCTRL
          </Text>
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
                maw={320}
                mb="md"
              />
              <Button 
                onClick={handleSaveLabel} 
                disabled={updateProjectLabel.isPending || labelValue === projectLabel}
                leftSection={<Save size={16} />}
              >
                {updateProjectLabel.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </Stack>
      </Card>

      {/* ABC Thresholds */}
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
            <Stack gap="md">
              <Skeleton height={80} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </Stack>
          ) : (
            <>
              {abcInfo.map((info) => (
                <Card key={info.curve} withBorder padding="md" bg={`var(--mantine-color-${info.color}-light)`}>
                  <Text fw={600} c={info.color}>{info.name}</Text>
                  <Text size="sm" c="dimmed" mb="sm">{info.description}</Text>
                  <NumberInput
                    label="Low Stock Threshold (%)"
                    min={1}
                    max={100}
                    value={formData[info.curve]}
                    onChange={(val) =>
                      setFormData((f) => ({
                        ...f,
                        [info.curve]: typeof val === 'number' ? val : 0,
                      }))
                    }
                    w={120}
                    suffix="%"
                  />
                </Card>
              ))}

              <Group justify="flex-end" pt="md">
                <Button onClick={handleSaveThresholds} disabled={updateThresholds.isPending} leftSection={<Save size={16} />}>
                  {updateThresholds.isPending ? "Saving..." : "Save Thresholds"}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>

      {/* Info Card */}
      <Card withBorder>
        <Card.Section withBorder p="md">
          <Text fw={600}>How ABC Analysis Works</Text>
        </Card.Section>
        <Stack gap="sm" p="md">
          <Text size="sm" c="dimmed">
            ABC analysis is an inventory categorization method that divides items into three categories:
          </Text>
          <ul style={{ paddingLeft: 20 }}>
            <li><Text component="span" size="sm" c="red" fw={600}>A-items:</Text> <Text component="span" size="sm" c="dimmed">Very important items that require tight control and frequent attention.</Text></li>
            <li><Text component="span" size="sm" c="orange" fw={600}>B-items:</Text> <Text component="span" size="sm" c="dimmed">Important items with moderate control needs.</Text></li>
            <li><Text component="span" size="sm" fw={600}>C-items:</Text> <Text component="span" size="sm" c="dimmed">Less important items with simpler controls.</Text></li>
          </ul>
        </Stack>
      </Card>
      {/* AI Assistant */}
      <Card withBorder>
        <Card.Section withBorder p="md">
          <Group gap="xs">
            <Sparkles size={20} />
            <Text fw={600}>AI Assistant</Text>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Enable or disable the Puter AI integration across the application.
          </Text>
        </Card.Section>
        <Stack gap="md" p="md">
          <Switch
            label="Enable AI Assistant"
            description="Allows access to AI-powered inventory queries and suggestions."
            checked={true} 
            onChange={() => {}} 
          />
        </Stack>
      </Card>

      {/* User Management */}
      <UserManagement />
    </Stack>
  );
}
