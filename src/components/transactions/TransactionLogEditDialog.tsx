import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Modal, Button, TextInput, Select, Stack, Group, NumberInput, Text } from "@mantine/core";
import { TransactionLog } from "@/types/inventory";
import { useCategories, useItems, useProjects, useUpdateTransactionLog } from "@/hooks/useInventory";

type TransactionType = "checkout" | "restock";
type EditEntryType = "added_item" | "restock" | "checkout" | "return";

interface TransactionLogEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: TransactionLog | null;
  projectLabel?: string;
}

function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TransactionLogEditDialog({
  open,
  onOpenChange,
  log,
  projectLabel,
}: TransactionLogEditDialogProps) {
  const { data: items } = useItems();
  const { data: projects } = useProjects();
  const { data: categories } = useCategories();
  const updateTransactionLog = useUpdateTransactionLog();

  const [itemCode, setItemCode] = useState("");
  const [projectId, setProjectId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [transactionType, setTransactionType] = useState<TransactionType>("checkout");
  const [entryType, setEntryType] = useState<EditEntryType>("checkout");
  const [createdAtLocal, setCreatedAtLocal] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  useEffect(() => {
    if (log && open) {
      setItemCode(log.item_code);
      setProjectId(log.project_id || "");
      setQuantity(log.quantity);
      setCreatedAtLocal(toLocalDateTimeInput(log.created_at));
      setItemCategory(log.items?.category || "");
      setTransactionType(log.entry_type === "checkout" ? "checkout" : "restock");
      setEntryType(log.entry_type as EditEntryType);
    }
  }, [log, open]);

  useEffect(() => {
    if (transactionType === "checkout") {
      setEntryType("checkout");
    } else if (entryType === "checkout") {
      setEntryType("restock");
    }
  }, [transactionType, entryType]);

  const selectedItem = useMemo(
    () => items?.find((item) => item.item_code === itemCode),
    [items, itemCode]
  );

  useEffect(() => {
    if (selectedItem?.category && !itemCategory) {
      setItemCategory(selectedItem.category);
    }
  }, [selectedItem]);

  if (!log) return null;

  const isProjectRequired = entryType === "checkout" || entryType === "return";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemCode || !quantity || quantity <= 0) return;
    if (isProjectRequired && !projectId) return;

    const updated = await updateTransactionLog.mutateAsync({
      id: log.id,
      item_code: itemCode,
      project_id: projectId || null,
      quantity,
      entry_type: entryType,
      created_at: new Date(createdAtLocal).toISOString(),
    });

    onOpenChange(false);
  };

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction Log" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group grow>
            <Select
              label="Item"
              value={itemCode}
              onChange={(v) => setItemCode(v || "")}
              data={items?.map((i) => ({ value: i.item_code, label: `${i.item_code} — ${i.description}` })) || []}
              searchable
              required
            />
            <TextInput
              label="Category"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              placeholder="Category"
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Quantity"
              value={quantity}
              onChange={(v) => setQuantity(typeof v === "number" ? v : 1)}
              min={1}
              required
            />
            <TextInput
              label="Created At"
              type="datetime-local"
              value={createdAtLocal}
              onChange={(e) => setCreatedAtLocal(e.target.value)}
              required
            />
          </Group>

          <Group grow>
            <Select
              label="Transaction Type"
              value={transactionType}
              onChange={(v) => setTransactionType((v as TransactionType) || "checkout")}
              data={[
                { value: "checkout", label: "Checkout" },
                { value: "restock", label: "Restock" },
              ]}
              required
            />
            <Select
              label="Entry Type"
              value={entryType}
              onChange={(v) => setEntryType((v as EditEntryType) || "checkout")}
              data={[
                { value: "added_item", label: "Added Item" },
                { value: "restock", label: "Restock" },
                { value: "checkout", label: "Checkout" },
                { value: "return", label: "Return" },
              ]}
              required
            />
          </Group>

          <Select
            label={`${projectLabel || "Project"} ${isProjectRequired ? "*" : ""}`}
            value={projectId || null}
            onChange={(v) => setProjectId(v || "")}
            data={projects?.map((p) => ({ value: p.project_id, label: p.project_name })) || []}
            searchable
            clearable
            required={isProjectRequired}
            disabled={!isProjectRequired}
          />

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTransactionLog.isPending} leftSection={<Save size={16} />}>
              {updateTransactionLog.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}