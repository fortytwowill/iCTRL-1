import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, Group, Stack, Text } from "@mantine/core";
import { ScannedCheckoutItem } from "@/types/inventory";

interface ScannedItemsListProps {
  items: ScannedCheckoutItem[];
  onUpdateQuantity: (itemCode: string, delta: number) => void;
  onRemove: (itemCode: string) => void;
}

export function ScannedItemsList({
  items,
  onUpdateQuantity,
  onRemove,
}: ScannedItemsListProps) {
  if (items.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text size="sm" c="dimmed">No items scanned yet</Text>
        <Text size="xs" c="dimmed">Scan item barcodes to add them</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      {items.map(({ item, quantity }) => (
        <Group
          key={item.item_code}
          className="success-flash"
          justify="space-between"
          p="xs"
          style={{ borderRadius: "var(--mantine-radius-lg)", border: "1px solid var(--mantine-color-default-border)", backgroundColor: "var(--mantine-color-card)" }}
          wrap="nowrap"
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>{item.description}</Text>
            <Text size="xs" c="dimmed" ff="monospace">{item.item_code}</Text>
            <Text size="xs" c="dimmed" mt={4}>
              Available: <strong>{item.amount}</strong>
            </Text>
          </div>

          <Group gap={4} wrap="nowrap">
            <Button
              variant="default"
              size="compact-sm"
              onClick={() => onUpdateQuantity(item.item_code, -1)}
              disabled={quantity <= 1}
              aria-label={`Decrease quantity for ${item.item_code}`}
              p={4}
            >
              <Minus size={12} />
            </Button>
            <Text size="sm" fw={700} w={24} ta="center">{quantity}</Text>
            <Button
              variant="default"
              size="compact-sm"
              onClick={() => onUpdateQuantity(item.item_code, 1)}
              disabled={quantity >= item.amount}
              aria-label={`Increase quantity for ${item.item_code}`}
              p={4}
            >
              <Plus size={12} />
            </Button>
            <Button
              variant="subtle"
              color="red"
              size="compact-sm"
              onClick={() => onRemove(item.item_code)}
              aria-label={`Remove ${item.item_code} from checkout`}
              p={4}
            >
              <Trash2 size={14} />
            </Button>
          </Group>
        </Group>
      ))}

      <Group justify="space-between" pt="xs" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
        <Text size="sm" c="dimmed">Total items:</Text>
        <Text size="sm" fw={700}>
          {items.reduce((sum, { quantity }) => sum + quantity, 0)}
        </Text>
      </Group>
    </Stack>
  );
}
