import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { RotateCcw, CheckCircle2, User, Package, Undo2 } from "lucide-react";
import { Button, Card, TextInput, Select, Text, Stack, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { ScannedItemsList } from "@/components/scanner/ScannedItemsList";
import { Item, ScannedCheckoutItem } from "@/types/inventory";
import {
  useLookupItemByCode,
  useCheckoutItemsBatch,
  useProjects,
  useProjectLabel,
  useReturnItem,
  useItemReturnAllocations,
} from "@/hooks/useInventory";
import { useAuth } from "@/contexts/AuthContext";
import {
  parseQRCode,
  validateQRForStep,
  playSuccessBeep,
  playErrorBeep,
} from "@/lib/qrParser";
import {
  type ScanType,
} from "@/lib/qrParser";

const SCAN_COOLDOWN_MS = 1500;
type ScannerMode = "checkout" | "return";
const modeToScanType = (mode: ScannerMode): ScanType => (mode === "checkout" ? "output" : "input");

export default function Scanner() {
  const [mode, setMode] = useState<ScannerMode>("checkout");
  const [scannedItems, setScannedItems] = useState<ScannedCheckoutItem[]>([]);
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);
  const checkoutSessionStartedAtRef = useRef<number | null>(null);

  const { user, profile, isReadOnly } = useAuth();
  const canUseReturnMode = !isReadOnly;
  const lookupItem = useLookupItemByCode();
  const checkoutItemsBatch = useCheckoutItemsBatch();
  const returnItem = useReturnItem();
  const { data: projects } = useProjects();
  const { data: projectLabel } = useProjectLabel();
  const { data: returnAllocations, isLoading: allocationsLoading } = useItemReturnAllocations(
    mode === "return" && scannedItem ? scannedItem.item_code : undefined
  );

  const activeProjects = useMemo(
    () => (projects || []).filter((project) => project.is_active !== false),
    [projects]
  );

  const selectedReturnAllocation = useMemo(
    () => returnAllocations?.find((entry) => entry.project_id === selectedProjectId),
    [returnAllocations, selectedProjectId]
  );

  const checkoutTotalQuantity = useMemo(
    () => scannedItems.reduce((sum, entry) => sum + entry.quantity, 0),
    [scannedItems]
  );

  const clearCheckoutSession = useCallback(() => {
    setScannedItems([]);
    setSelectedProjectId("");
    checkoutSessionStartedAtRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    clearCheckoutSession();
    setScannedItem(null);
    setSelectedProjectId("");
    setQuantity(1);
    lastScanRef.current = null;
  }, [clearCheckoutSession]);

  const addOrIncrementScannedItem = useCallback((item: Item) => {
    let incrementBlocked = false;
    let addedFirstItem = false;

    setScannedItems((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.item.item_code === item.item_code);
      if (existingIndex === -1) {
        addedFirstItem = prev.length === 0;
        return [...prev, { item, quantity: 1 }];
      }

      const existingEntry = prev[existingIndex];
      const maxQty = Math.max(0, item.amount);
      if (existingEntry.quantity >= maxQty) {
        incrementBlocked = true;
        const next = [...prev];
        next[existingIndex] = {
          item,
          quantity: Math.min(existingEntry.quantity, maxQty || existingEntry.quantity),
        };
        return next;
      }

      const next = [...prev];
      next[existingIndex] = {
        item,
        quantity: existingEntry.quantity + 1,
      };
      return next;
    });

    if (addedFirstItem && checkoutSessionStartedAtRef.current === null) {
      checkoutSessionStartedAtRef.current = Date.now();
    }

    if (incrementBlocked) {
      playErrorBeep();
      notifications.show({ color: "red", message: `Maximum available quantity reached for ${item.item_code}.` });
      return false;
    }

    return true;
  }, []);

  const updateScannedItemQuantity = useCallback((itemCode: string, delta: number) => {
    setScannedItems((prev) =>
      prev.map((entry) => {
        if (entry.item.item_code !== itemCode) return entry;
        const nextQuantity = Math.max(1, Math.min(entry.item.amount, entry.quantity + delta));
        return { ...entry, quantity: nextQuantity };
      })
    );
  }, []);

  const removeScannedItem = useCallback((itemCode: string) => {
    setScannedItems((prev) => prev.filter((entry) => entry.item.item_code !== itemCode));
  }, []);

  const handleModeChange = (nextMode: ScannerMode) => {
    if (nextMode === "return" && !canUseReturnMode) return;
    if (nextMode === mode) return;
    setMode(nextMode);
    handleReset();
  };

  useEffect(() => {
    if (mode === "return" && !canUseReturnMode) {
      setMode("checkout");
      handleReset();
    }
  }, [mode, canUseReturnMode, handleReset]);

  useEffect(() => {
    if (mode !== "checkout") return;
    if (!selectedProjectId) return;
    const stillAvailable = activeProjects.some((project) => project.project_id === selectedProjectId);
    if (!stillAvailable) {
      setSelectedProjectId("");
    }
  }, [activeProjects, selectedProjectId, mode]);

  useEffect(() => {
    if (mode !== "checkout") return;
    if (scannedItems.length === 0 || selectedProjectId || activeProjects.length !== 1) return;
    setSelectedProjectId(activeProjects[0].project_id);
  }, [activeProjects, scannedItems.length, selectedProjectId, mode]);

  useEffect(() => {
    if (mode !== "return") return;
    if (!scannedItem) return;
    if (!returnAllocations || returnAllocations.length === 0) {
      setSelectedProjectId("");
      return;
    }
    const stillAvailable = returnAllocations.some((entry) => entry.project_id === selectedProjectId);
    if (!stillAvailable) {
      setSelectedProjectId(returnAllocations[0].project_id);
      setQuantity(1);
    }
  }, [mode, scannedItem, returnAllocations, selectedProjectId]);

  useEffect(() => {
    if (mode !== "return") return;
    if (!selectedReturnAllocation) return;
    setQuantity((prev) => Math.min(Math.max(1, prev), selectedReturnAllocation.allocated_quantity));
  }, [mode, selectedReturnAllocation]);

  const handleScan = useCallback(
    async (code: string) => {
      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.code === code &&
        now - lastScanRef.current.time < SCAN_COOLDOWN_MS
      ) {
        return;
      }
      lastScanRef.current = { code, time: now };

      const parsed = parseQRCode(code);
      const validation = validateQRForStep(parsed, "items");
      if (!validation.valid) {
        playErrorBeep();
        notifications.show({ color: "red", message: validation.error });
        return;
      }

      const lookupValue = parsed.value;
      setIsProcessing(true);

      const scanStartTime = Date.now();
      try {
        const item = await lookupItem.mutateAsync(lookupValue);

        if (mode === "checkout") {
          if (item.amount <= 0) {
            playErrorBeep();
            notifications.show({ color: "red", message: "Item out of stock!" });
            return;
          }

          const didAdd = addOrIncrementScannedItem(item);
          if (!didAdd) return;
        } else {
          setScannedItem(item);
          setQuantity(1);
        }

        playSuccessBeep();
        notifications.show({ color: "green", message: `Item found: ${item.description}` });
      } catch {
        playErrorBeep();
        notifications.show({
          color: "red",
          message: `Code ${lookupValue} not found in the registry. Please check if the item is registered.`,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [lookupItem, mode, addOrIncrementScannedItem]
  );

  const handleConfirmCheckout = async () => {
    if (scannedItems.length === 0 || !selectedProjectId) return;

    setIsProcessing(true);
    try {
      const result = await checkoutItemsBatch.mutateAsync({
        project_id: selectedProjectId,
        items: scannedItems.map(({ item, quantity: itemQuantity }) => ({
          item_code: item.item_code,
          quantity: itemQuantity,
        })),
      });

      notifications.show({
        color: "green",
        message: `Checkout complete: ${result.total_unique_items} item${result.total_unique_items === 1 ? "" : "s"}, ${result.total_quantity} total.`,
      });

      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!scannedItem || !selectedProjectId || !selectedReturnAllocation) return;

    const safeQuantity = Math.min(quantity, selectedReturnAllocation.allocated_quantity);
    if (safeQuantity <= 0) {
      notifications.show({ color: "red", message: "Return quantity must be greater than zero." });
      return;
    }

    setIsProcessing(true);
    try {
      await returnItem.mutateAsync({
        project_id: selectedProjectId,
        item_code: scannedItem.item_code,
        quantity: safeQuantity,
      });
      notifications.show({ color: "green", message: "Inventory return complete!" });
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const projectSelectData = useMemo(
    () => activeProjects.map((p) => ({ value: p.project_id, label: p.project_name })),
    [activeProjects]
  );

  const returnAllocationsSelectData = useMemo(
    () =>
      (returnAllocations || []).map((a) => ({
        value: a.project_id,
        label: `${a.project_name} (${a.allocated_quantity} allocated)`,
      })),
    [returnAllocations]
  );

  const checkoutHeader = mode === "checkout";
  const showResetButton = mode === "checkout" ? scannedItems.length > 0 : Boolean(scannedItem);

  return (
    <Stack gap="md" maw={512} mx="auto">
      <Group justify="space-between" align="flex-start" gap="sm">
        <div>
          <Text size="lg" fw={700} className="gradient-text">
            {checkoutHeader ? "Checkout Scanner" : "Inventory Return"}
          </Text>
          <Text size="xs" c="dimmed">
            {checkoutHeader ? "Scan to check out items" : "Scan to return items to inventory"}
          </Text>
        </div>
        {showResetButton && (
          <Button variant="default" size="compact-sm" onClick={handleReset} disabled={isProcessing} leftSection={<RotateCcw size={16} />}>
            {mode === "checkout" ? "Clear All" : "Cancel"}
          </Button>
        )}
      </Group>

      <Group gap={4} p={4} style={{ borderRadius: "var(--mantine-radius-lg)", border: "1px solid var(--mantine-color-default-border)", backgroundColor: "var(--mantine-color-card)" }}>
        <Button
          variant={mode === "checkout" ? "filled" : "subtle"}
          size="compact-sm"
          onClick={() => handleModeChange("checkout")}
          style={{ flex: 1 }}
        >
          Checkout
        </Button>
        <Button
          variant={mode === "return" ? "filled" : "subtle"}
          size="compact-sm"
          onClick={() => handleModeChange("return")}
          style={{ flex: 1 }}
          disabled={!canUseReturnMode}
        >
          Return Items
        </Button>
      </Group>

      {profile && (
        <Group gap="xs">
          <User size={16} style={{ color: "var(--mantine-color-dimmed)" }} />
          <Text size="sm" c="dimmed">
            Operating as: <strong>{profile.full_name || user?.email || "You"}</strong>
          </Text>
        </Group>
      )}

      {mode === "checkout" ? (
        <>
          <Card withBorder className="glass-card">
            <Card.Section p="md" pb="xs">
              <Text fw={600}>Scan QR Code</Text>
            </Card.Section>
            <Card.Section p="md" pt={0}>
              <BarcodeScanner
                onScan={handleScan}
                isActive={!isProcessing}
                placeholder="Type description or code..."
              />
            </Card.Section>
          </Card>

          <Card withBorder className="glass-card">
            <Card.Section p="md" pb="xs">
              <Group gap="xs">
                <Package size={16} style={{ color: "var(--mantine-color-blue-filled)" }} />
                <Text fw={600}>Scanned Items</Text>
              </Group>
            </Card.Section>
            <Card.Section p="md" pt={0}>
              <ScannedItemsList
                items={scannedItems}
                onUpdateQuantity={updateScannedItemQuantity}
                onRemove={removeScannedItem}
              />
            </Card.Section>
          </Card>

          <Card withBorder className="glass-card">
            <Card.Section p="md">
              <Stack gap="sm">
                <Select
                  label={projectLabel || "Project"}
                  placeholder={`Select ${(projectLabel || "project").toLowerCase()}...`}
                  data={projectSelectData}
                  value={selectedProjectId}
                  onChange={(v) => setSelectedProjectId(v || "")}
                  aria-label={projectLabel || "Project"}
                />

                {activeProjects.length === 0 && (
                  <div style={{ borderRadius: "var(--mantine-radius-lg)", border: "1px solid var(--mantine-color-orange-light)", backgroundColor: "var(--mantine-color-orange-light-hover)", padding: 12 }}>
                    <Text size="sm" c="orange">No active projects available for checkout.</Text>
                  </div>
                )}

                <Group gap="xs" wrap="wrap">
                  <Button
                    variant="default"
                    size="compact-sm"
                    onClick={handleReset}
                    disabled={isProcessing || scannedItems.length === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    size="compact-sm"
                    onClick={handleConfirmCheckout}
                    disabled={isProcessing || scannedItems.length === 0 || !selectedProjectId}
                    leftSection={<CheckCircle2 size={16} />}
                    style={{ flex: 1 }}
                  >
                    Complete Checkout ({checkoutTotalQuantity} item{checkoutTotalQuantity === 1 ? "" : "s"})
                  </Button>
                </Group>
              </Stack>
            </Card.Section>
          </Card>
        </>
      ) : !scannedItem ? (
        <Card withBorder className="glass-card">
          <Card.Section p="md" pb="xs">
            <Text fw={600}>Scan QR Code</Text>
          </Card.Section>
          <Card.Section p="md" pt={0}>
            <BarcodeScanner
              onScan={handleScan}
              isActive={!isProcessing}
              placeholder="Type description or code..."
            />
          </Card.Section>
        </Card>
      ) : (
        <Stack gap="lg">
          <div>
            <Text size="lg" fw={600}>Return Details</Text>
            <Text size="sm" c="dimmed">
              Review the scanned item, choose the allocation, and confirm the quantity to return.
            </Text>
          </div>

          <Card withBorder className="glass-card">
            <Card.Section p="md" pb="xs">
              <Group gap="xs">
                <Package size={16} style={{ color: "var(--mantine-color-blue-filled)" }} />
                <Text fw={600}>Item Summary</Text>
              </Group>
            </Card.Section>
            <Card.Section p="md" pt={0}>
              <div style={{ borderRadius: "var(--mantine-radius-xl)", backgroundColor: "var(--mantine-color-gray-light-hover)", padding: 16 }}>
                <Text fw={600}>{scannedItem.description}</Text>
                <Text size="sm" c="dimmed" ff="monospace" mt={4}>{scannedItem.item_code}</Text>
                <Text size="sm" c="dimmed" mt="sm">
                  Current inventory: <strong>{scannedItem.amount}</strong> units
                </Text>
                <Text size="xs" fw={600} tt="uppercase" c="blue" mt={4}>
                  Ready to return
                </Text>
              </div>
            </Card.Section>
          </Card>

          <Card withBorder className="glass-card">
            <Card.Section p="md" pb="xs">
              <Group gap="xs">
                <Undo2 size={16} style={{ color: "var(--mantine-color-blue-filled)" }} />
                <Text fw={600}>Return Setup</Text>
              </Group>
            </Card.Section>
            <Card.Section p="md" pt={0}>
              {allocationsLoading ? (
                <Text size="sm" c="dimmed">Loading allocated projects...</Text>
              ) : !returnAllocations || returnAllocations.length === 0 ? (
                <div style={{ borderRadius: "var(--mantine-radius-xl)", border: "1px solid var(--mantine-color-orange-light)", backgroundColor: "var(--mantine-color-orange-light-hover)", padding: 16 }}>
                  <Text size="sm" c="orange">No active allocations found for this item. It cannot be returned yet.</Text>
                </div>
              ) : (
                <Stack gap="md">
                  <Select
                    label={`${projectLabel || "Project"} *`}
                    placeholder={`Select ${(projectLabel || "project").toLowerCase()} allocation...`}
                    data={returnAllocationsSelectData}
                    value={selectedProjectId}
                    onChange={(v) => setSelectedProjectId(v || "")}
                  />

                  <TextInput
                    label="Return Quantity"
                    type="number"
                    min={1}
                    max={selectedReturnAllocation?.allocated_quantity || 1}
                    value={quantity}
                    onChange={(e) => {
                      const maxQty = selectedReturnAllocation?.allocated_quantity || 1;
                      setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.currentTarget.value, 10) || 1)));
                    }}
                    description={
                      selectedReturnAllocation
                        ? `Allocated to this ${projectLabel || "project"}: ${selectedReturnAllocation.allocated_quantity}`
                        : undefined
                    }
                  />
                </Stack>
              )}
            </Card.Section>
          </Card>

          <Card withBorder className="glass-card">
            <Card.Section p="md" pt="lg">
              <Group gap="xs" grow>
                <Button variant="default" onClick={handleReset} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReturn}
                  leftSection={<Undo2 size={16} />}
                  disabled={
                    isProcessing ||
                    !selectedProjectId ||
                    !selectedReturnAllocation ||
                    quantity < 1 ||
                    quantity > selectedReturnAllocation.allocated_quantity
                  }
                >
                  Confirm Return
                </Button>
              </Group>
            </Card.Section>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}