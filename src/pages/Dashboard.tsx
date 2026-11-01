import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  Download,
  LayoutGrid,
  List,
  X,
  QrCode,
  Printer,
  CheckSquare,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  TextInput,
  Button,
  Card,
  Badge,
  Table,
  Select,
  Skeleton,
  Checkbox,
  Modal,
  Text,
  Group,
  Stack,
  Flex,
  ActionIcon,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  useItems,
  useABCThresholds,
  useCategories,
  useLocations,
  usePurchaseOrders,
} from "@/hooks/useInventory";
import {
  isLowStock,
  getLowStockThreshold,
  isOverstock,
  ABCThresholds,
  Item,
} from "@/types/inventory";
import { exportDashboardInventoryToExcel } from "@/lib/exportExcel";
import {
  DEFAULT_PAGE_SIZE,
  PageNavigation,
  PageSizeSelector,
} from "@/components/common/ListPaginationControls";
import { useAuth } from "@/contexts/AuthContext";
import { PREDEFINED_FORMATS } from "@/components/profile/LabelFormatSettings";
import { PuterAIAssistant } from "@/components/PuterAIAssistant";
 import { AskAICard } from "@/components/dashboard/AskAICard";

 const DASHBOARD_VIEWED_SESSION_KEY = "analytics_dashboard_viewed";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [abcFilter, setAbcFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrItem, setQrItem] = useState<Item | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItemCodes, setSelectedItemCodes] = useState<string[]>([]);
  const bulkQrRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const { profile } = useAuth();

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: thresholds, isLoading: thresholdsLoading } = useABCThresholds();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const { data: purchaseOrders } = usePurchaseOrders();

  const defaultThresholds: ABCThresholds = { A: 30, B: 20, C: 10 };
  const activeThresholds = thresholds || defaultThresholds;
  const isLoading = itemsLoading || thresholdsLoading;

  const filteredItems = useMemo(() => {
    return items?.filter((item) => {
      let matchesSearch = true;
      if (search.trim()) {
        const searchWords = search.trim().toLowerCase().split(/\s+/);
        const statusText =
          item.amount === 0
            ? "out of stock"
            : isLowStock(item, activeThresholds)
              ? "low stock"
              : isOverstock(item)
                ? "overstock"
                : "in stock";
        const searchableText = [
          item.item_code,
          item.vendors?.name || "",
          item.vendor_code || "",
          item.description,
          item.category || "",
          item.abc_curve,
          statusText,
          String(item.amount),
          String(item.initial_quantity ?? ""),
          String(item.optimal_inventory),
          (item.amount * item.unit_value).toFixed(2),
        ]
          .join(" ")
          .toLowerCase();
        matchesSearch = searchWords.every((word) =>
          searchableText.includes(word),
        );
      }

      const matchesCategory =
        !categoryFilter ||
        categoryFilter === "all" ||
        item.category === categoryFilter;

      const matchesABC =
        !abcFilter || abcFilter === "all" || item.abc_curve === abcFilter;

      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = isLowStock(item, activeThresholds);
      } else if (stockFilter === "out") {
        matchesStock = item.amount === 0;
      } else if (stockFilter === "overstock") {
        matchesStock = isOverstock(item);
      } else if (stockFilter === "ok") {
        matchesStock =
          item.amount > 0 &&
          !isLowStock(item, activeThresholds) &&
          !isOverstock(item);
      }

      const matchesLocation =
        !locationFilter ||
        locationFilter === "all" ||
        item.location_id === locationFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesABC &&
        matchesStock &&
        matchesLocation
      );
    });
  }, [
    items,
    search,
    categoryFilter,
    abcFilter,
    stockFilter,
    activeThresholds,
    locationFilter,
  ]);

  const stats = useMemo(() => {
    const total = items?.length ?? 0;
    const lowStock =
      items?.filter(
        (item) => isLowStock(item, activeThresholds) && item.amount > 0,
      ).length ?? 0;
    const outOfStock = items?.filter((item) => item.amount === 0).length ?? 0;
    const overstock = items?.filter((item) => isOverstock(item)).length ?? 0;
    const totalValue =
      items?.reduce((sum, item) => sum + item.amount * item.unit_value, 0) ?? 0;

    return { total, lowStock, outOfStock, overstock, totalValue };
  }, [items, activeThresholds]);

  const totalFilteredItems = filteredItems?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFilteredItems / pageSize));
  const paginatedItems = useMemo(() => {
    if (!filteredItems) return [];
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);
  const selectedItems = useMemo(() => {
    if (!items || selectedItemCodes.length === 0) return [];
    const selectedSet = new Set(selectedItemCodes);
    return items.filter((item) => selectedSet.has(item.item_code));
  }, [items, selectedItemCodes]);
  const allVisibleSelected = useMemo(
    () =>
      paginatedItems.length > 0 &&
      paginatedItems.every((item) => selectedItemCodes.includes(item.item_code)),
    [paginatedItems, selectedItemCodes],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, abcFilter, stockFilter]);

  useEffect(() => {
    const hasTrackedInSession =
      window.sessionStorage.getItem(DASHBOARD_VIEWED_SESSION_KEY) === "1";
    if (!hasTrackedInSession) {
      window.sessionStorage.setItem(DASHBOARD_VIEWED_SESSION_KEY, "1");
    }
  }, [viewMode]);

  useEffect(() => {
    const trimmedQuery = search.trim();
    if (!trimmedQuery) return;

    const timeoutId = window.setTimeout(() => {
      // analytics tracking placeholder preserved
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search, filteredItems?.length]);

  useEffect(() => {
    const activeFilterCount = [categoryFilter, abcFilter, stockFilter].filter(
      (value) => Boolean(value) && value !== "all",
    ).length;
    if (activeFilterCount === 0) return;
    // analytics tracking placeholder preserved
  }, [categoryFilter, abcFilter, stockFilter]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (selectionMode) return;
    setSelectedItemCodes([]);
  }, [selectionMode]);

  useEffect(() => {
    if (!items || selectedItemCodes.length === 0) return;
    const validCodes = new Set(items.map((item) => item.item_code));
    setSelectedItemCodes((prev) => prev.filter((code) => validCodes.has(code)));
  }, [items, selectedItemCodes.length]);

  const getStockStatus = (item: (typeof filteredItems)[number]) => {
    if (item.amount === 0)
      return { label: "Out of Stock", color: "red", variant: "filled" as const };
    if (isLowStock(item, activeThresholds)) {
      const threshold = getLowStockThreshold(item, activeThresholds);
      return {
        label: `Low Stock (≤${threshold})`,
        color: "orange",
        variant: "outline" as const,
      };
    }
    if (isOverstock(item))
      return { label: "Overstock", color: "orange", variant: "outline" as const };
    return { label: "In Stock", color: "green", variant: "filled" as const };
  };

  const handleExport = async () => {
    if (filteredItems) {
      await exportDashboardInventoryToExcel(
        filteredItems,
        activeThresholds,
        "inventory_dashboard",
      );
    }
  };

  const toggleItemSelection = (itemCode: string, checked: boolean) => {
    setSelectedItemCodes((prev) => {
      if (checked) {
        return prev.includes(itemCode) ? prev : [...prev, itemCode];
      }
      return prev.filter((code) => code !== itemCode);
    });
  };

  const toggleVisibleSelection = (checked: boolean) => {
    const visibleCodes = paginatedItems.map((item) => item.item_code);
    setSelectedItemCodes((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...visibleCodes]));
      }
      const visibleSet = new Set(visibleCodes);
      return prev.filter((code) => !visibleSet.has(code));
    });
  };

  const handlePrintSelectedQRCodes = () => {
    if (selectedItems.length === 0) return;

    const format = profile?.label_format || PREDEFINED_FORMATS[0];
    const u = format.unit;

    let qrHeight = "85%";
    let qrMaxWidth = "50%";
    let codeFontSize = "11px";
    let nameFontSize = "9px";
    let nameLineClamp = "3";
    let gapSize = "2.5mm";

    switch (format.id) {
      case "5163":
        codeFontSize = "18px";
        nameFontSize = "14px";
        nameLineClamp = "4";
        gapSize = "4mm";
        break;
      case "5167":
        qrHeight = "95%";
        qrMaxWidth = "65%";
        codeFontSize = "9px";
        nameFontSize = "7px";
        nameLineClamp = "2";
        gapSize = "1.5mm";
        break;
      case "5164":
        codeFontSize = "26px";
        nameFontSize = "20px";
        nameLineClamp = "6";
        gapSize = "6mm";
        break;
      case "L7160":
        codeFontSize = "16px";
        nameFontSize = "12px";
        nameLineClamp = "4";
        gapSize = "3.5mm";
        break;
      default:
        break;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const payload = selectedItems
      .map((item) => {
        const canvas = bulkQrRefs.current[item.item_code];
        if (!canvas) return null;
        return {
          item,
          dataUrl: canvas.toDataURL("image/png"),
        };
      })
      .filter(
        (entry): entry is { item: Item; dataUrl: string } => Boolean(entry),
      );

    if (payload.length === 0) {
      notifications.show({
        title: "Error",
        message: "QR codes are still rendering. Please try again.",
        color: "red",
      });
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    const cards = payload
      .map(
        ({ item, dataUrl }) => `
          <div class="label">
            <img class="qr" src="${dataUrl}" alt="QR" />
            <div class="info">
              <div class="code">${escapeHtml(item.item_code)}</div>
              <div class="name">${escapeHtml(item.description)}</div>
            </div>
          </div>
        `,
      )
      .join("");

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #111827;
              width: ${format.sheet.width}${u};
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(${format.grid.columns}, ${format.label.width}${u});
              grid-auto-rows: ${format.label.height}${u};
              column-gap: ${format.gap.horizontal}${u};
              row-gap: ${format.gap.vertical}${u};
              padding-top: ${format.margins.top}${u};
              padding-bottom: ${format.margins.bottom}${u};
              padding-left: ${format.margins.left}${u};
              padding-right: ${format.margins.right}${u};
              justify-content: start;
            }
            .label {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              page-break-inside: avoid;
              width: ${format.label.width}${u};
              height: ${format.label.height}${u};
              padding: 2mm;
              overflow: hidden;
              gap: ${gapSize};
            }
            .label img.qr {
              width: auto;
              height: ${qrHeight};
              max-width: ${qrMaxWidth};
              max-height: 40mm;
              object-fit: contain;
              flex-shrink: 0;
            }
            .info {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              flex: 1;
              min-width: 0;
            }
            .code {
              font-size: ${codeFontSize};
              font-weight: 700;
              color: #111827;
              line-height: 1.2;
              margin-bottom: 1.5mm;
              text-align: center;
              word-break: break-word;
            }
            .name {
              font-size: ${nameFontSize};
              color: #4b5563;
              line-height: 1.2;
              text-align: center;
              word-break: break-word;
              display: -webkit-box;
              -webkit-line-clamp: ${nameLineClamp};
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            @page {
              size: ${format.sheet.width}${u} ${format.sheet.height}${u};
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="grid">${cards}</div>
          <script>
            window.onload = function () {
              window.print();
              setTimeout(function () { window.close(); }, 100);
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1200);
    };
  };

  const ABCBadge = ({ curve }: { curve: string }) => {
    const color =
      curve === "A" ? "red" : curve === "B" ? "orange" : "gray";
    return (
      <Badge variant="outline" color={color} fw={700}>
        {curve}
      </Badge>
    );
  };

  const QRCodeDialog = ({
    open,
    onOpenChange,
    qrValue,
    title,
    subtitle,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    qrValue?: string;
    title?: string;
    subtitle?: string;
  }) => {
    const qrRef = useRef<HTMLCanvasElement>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    useEffect(() => {
      if (qrValue && open && qrRef.current) {
        const timer = setTimeout(() => {
          if (qrRef.current) {
            const dataUrl = qrRef.current.toDataURL("image/png");
            setQrDataUrl(dataUrl);
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }, [qrValue, open]);

    const handlePrint = () => {
      if (!qrValue || !title || !qrRef.current) return;

      try {
        const dataUrl = qrRef.current.toDataURL("image/png");

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
          document.body.removeChild(iframe);
          return;
        }

        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print QR Code - ${title}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  padding: 20px;
                }
                .qr-container { text-align: center; }
                .qr-code { margin-bottom: 20px; }
                .qr-code img { width: 200px; height: 200px; }
                .item-code { font-size: 24px; font-weight: bold; font-family: monospace; margin-bottom: 8px; }
                .item-desc { font-size: 14px; color: #666; }
                @media print {
                  body { margin: 0; padding: 0; }
                  @page { margin: 0; }
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="qr-code"><img src="${dataUrl}" alt="QR Code" /></div>
                <div class="item-code">${title}</div>
                ${subtitle ? `<div class="item-desc">${subtitle}</div>` : ""}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 100);
                }
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();

        iframe.onload = () => {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        };
      } catch (error) {
        console.error("Print error:", error);
      }
    };

    return (
      <Modal
        opened={open}
        onClose={() => onOpenChange(false)}
        title="QR Code"
        size="md"
        centered
      >
        {qrValue && (
          <Stack align="center" gap="md">
            <Box
              p="md"
              style={{
                backgroundColor: "#fff",
                borderRadius: "var(--mantine-radius-md)",
                border: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <QRCodeCanvas
                ref={qrRef}
                value={qrValue}
                size={200}
                level="M"
                includeMargin={false}
              />
            </Box>
            <div style={{ textAlign: "center" }}>
              <Text fw={700} fz="lg" ff="monospace">
                {title}
              </Text>
              {subtitle && (
                <Text c="dimmed" fz="sm">
                  {subtitle}
                </Text>
              )}
            </div>
            <Button onClick={handlePrint} fullWidth leftSection={<QrCode size={16} />}>
              Print QR Code
            </Button>
          </Stack>
        )}
      </Modal>
    );
  };

  const categoryData = [
    { value: "all", label: "All Categories" },
    ...(categories?.map((cat) => ({ value: cat.name, label: cat.name })) ?? []),
  ];

  const abcData = [
    { value: "all", label: "All ABC" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
  ];

  const stockData = [
    { value: "all", label: "All Stock" },
    { value: "ok", label: "In Stock" },
    { value: "low", label: "Low Stock" },
    { value: "out", label: "Out of Stock" },
    { value: "overstock", label: "Overstock" },
  ];

  const locationData = [
    { value: "all", label: "All Locations" },
    ...(locations?.map((loc) => ({ value: loc.id, label: loc.name })) ?? []),
  ];

  return (
    <Stack gap="lg">
 <AskAICard />
      {/* Header */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        gap="sm"
      >
        <Box style={{ minWidth: 0 }}>
          <Text fz="xl" fw={700} className="gradient-text">
            Inventory Dashboard
          </Text>
          <Text c="dimmed" fz="sm">
            Track and manage your stock levels with ABC analysis
          </Text>
        </Box>
        <Group wrap="wrap" gap="xs">
          <Button
            onClick={() => setSelectionMode((prev) => !prev)}
            variant={selectionMode ? "light" : "default"}
            leftSection={<CheckSquare size={16} />}
          >
            {selectionMode ? "Exit Selection" : "Bulk QR Print"}
          </Button>
          {selectionMode && selectedItems.length > 0 && (
            <Button
              onClick={handlePrintSelectedQRCodes}
              leftSection={<Printer size={16} />}
            >
              Print QR Codes ({selectedItems.length})
            </Button>
          )}
          <Button
            onClick={handleExport}
            variant="default"
            leftSection={<Download size={16} />}
          >
            Export
          </Button>
          <Button component="a" href="/serial-batch" variant="default">
            Serial/Batch
          </Button>
          <Button component="a" href="/purchase-orders" variant="default">
            Purchase Orders
          </Button>
          <Button component="a" href="/locations" variant="default">
            Locations
          </Button>
          <Button component="a" href="/bundles" variant="default">
            Bundles
          </Button>
          <Button component="a" href="/reports" variant="default">
            Reports
          </Button>
          <PuterAIAssistant />
        </Group>
      </Flex>
      <LowStockBanner />

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gap: "var(--mantine-spacing-md)",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fz="sm" fw={500} c="dimmed">
              Total Items
            </Text>
            <Package size={16} color="var(--mantine-color-blue-filled)" />
          </Group>
          <Text fz="xl" fw={700}>
            {stats.total}
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fz="sm" fw={500} c="dimmed">
              Stock Warnings
            </Text>
            <TrendingDown size={16} color="var(--mantine-color-orange-filled)" />
          </Group>
          <Group gap="xl">
            <div>
              <Text fz="xs" c="dimmed" mb={2}>
                Low Stock
              </Text>
              <Text fz="xl" fw={700} c="orange">
                {stats.lowStock}
              </Text>
            </div>
            <div
              style={{
                width: 1,
                height: 32,
                backgroundColor: "var(--mantine-color-default-border)",
              }}
            />
            <div>
              <Text fz="xs" c="dimmed" mb={2}>
                Overstock
              </Text>
              <Text fz="xl" fw={700} c="orange">
                {stats.overstock}
              </Text>
            </div>
          </Group>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fz="sm" fw={500} c="dimmed">
              Out of Stock
            </Text>
            <AlertTriangle size={16} color="var(--mantine-color-red-filled)" />
          </Group>
          <Text fz="xl" fw={700} c="red">
            {stats.outOfStock}
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fz="sm" fw={500} c="dimmed">
              Total Value
            </Text>
            <Package size={16} color="var(--mantine-color-green-filled)" />
          </Group>
          <Text fz="xl" fw={700} c="green">
            $
            {stats.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fz="sm" fw={500} c="dimmed">
              Purchase Orders
            </Text>
            <Package size={16} color="var(--mantine-color-blue-filled)" />
          </Group>
          <Text fz="xl" fw={700}>
            {purchaseOrders?.length || 0}
          </Text>
        </Card>
      </div>

      {/* Filters */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap="md"
        align={{ base: "stretch", sm: "center" }}
      >
        <TextInput
          placeholder="Search by item code, vendor name/code, description, category, ABC, quantity..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<Search size={16} />}
          rightSection={
            search ? (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </ActionIcon>
            ) : null
          }
          style={{ flex: 1 }}
        />

        <Group wrap="wrap" gap="xs">
          <Select
            value={categoryFilter || null}
            onChange={(val) => setCategoryFilter(val ?? "")}
            data={categoryData}
            placeholder="Category"
            clearable
            style={{ width: 140 }}
          />
          <Select
            value={abcFilter || null}
            onChange={(val) => setAbcFilter(val ?? "")}
            data={abcData}
            placeholder="ABC"
            clearable
            style={{ width: 100 }}
          />
          <Select
            value={stockFilter || null}
            onChange={(val) => setStockFilter(val ?? "")}
            data={stockData}
            placeholder="Stock"
            clearable
            style={{ width: 120 }}
          />
          <Select
            value={locationFilter || null}
            onChange={(val) => setLocationFilter(val ?? "")}
            data={locationData}
            placeholder="Location"
            clearable
            style={{ width: 140 }}
          />

          <Group gap={0}>
            <Button
              variant={viewMode === "table" ? "light" : "default"}
              size="compact-sm"
              onClick={() => setViewMode("table")}
              style={{ borderRadius: "var(--mantine-radius-sm) 0 0 var(--mantine-radius-sm)" }}
            >
              <List size={16} />
            </Button>
            <Button
              variant={viewMode === "grid" ? "light" : "default"}
              size="compact-sm"
              onClick={() => setViewMode("grid")}
              style={{ borderRadius: "0 var(--mantine-radius-sm) var(--mantine-radius-sm) 0" }}
            >
              <LayoutGrid size={16} />
            </Button>
          </Group>
        </Group>
      </Flex>

      {/* Results count */}
      {(!isLoading && filteredItems) || selectionMode ? (
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "stretch", sm: "flex-start" }}
          gap="sm"
        >
          <Stack gap={2}>
            {!isLoading && filteredItems && (
              <Text fz="sm" c="dimmed">
                Showing {filteredItems.length} of {items?.length ?? 0} items
              </Text>
            )}
            {selectionMode && (
              <Text fz="sm" c="dimmed">
                Selected {selectedItems.length} item
                {selectedItems.length === 1 ? "" : "s"} for bulk QR printing
              </Text>
            )}
          </Stack>
          {!isLoading && filteredItems && (
            <PageSizeSelector
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              className="justify-end"
            />
          )}
        </Flex>
      ) : null}

      {/* Items Display */}
      {viewMode === "table" ? (
        <Card withBorder padding={0} radius="md">
          <div style={{ overflowX: "auto" }}>
            <Table withTableBorder miw={1100}>
              <Table.Thead>
                <Table.Tr>
                  {selectionMode && (
                    <Table.Th w={46} ta="center">
                      <Checkbox
                        checked={allVisibleSelected}
                        onChange={(e) =>
                          toggleVisibleSelection(e.currentTarget.checked)
                        }
                        aria-label="Select visible items"
                      />
                    </Table.Th>
                  )}
                  <Table.Th w={140} fw={700}>
                    Code
                  </Table.Th>
                  <Table.Th w={80} fw={700}>
                    Vendor Code
                  </Table.Th>
                  <Table.Th miw={340} fw={700}>
                    Description
                  </Table.Th>
                  <Table.Th w={110} fw={700}>
                    Category
                  </Table.Th>
                  <Table.Th w={90} fw={700}>
                    Vendor
                  </Table.Th>
                  <Table.Th w={40} ta="center" fw={700}>
                    ABC
                  </Table.Th>
                  <Table.Th w={50} ta="center" fw={700}>
                    Qty
                  </Table.Th>
                  <Table.Th w={55} ta="center" fw={700}>
                    Optimal
                  </Table.Th>
                  <Table.Th w={75} ta="center" fw={700}>
                    TT Value
                  </Table.Th>
                  <Table.Th w={190} ta="center" fw={700}>
                    Status
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Table.Tr key={i}>
                      {selectionMode && (
                        <Table.Td ta="center">
                          <Skeleton h={16} w={16} mx="auto" />
                        </Table.Td>
                      )}
                      <Table.Td>
                        <Group gap="xs">
                          <Skeleton h={32} w={32} />
                          <Skeleton h={16} w={80} />
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={16} w={80} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={16} w={192} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={16} w={64} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={16} w={96} />
                      </Table.Td>
                      <Table.Td ta="center">
                        <Skeleton h={24} w={32} mx="auto" />
                      </Table.Td>
                      <Table.Td ta="center">
                        <Skeleton h={16} w={40} mx="auto" />
                      </Table.Td>
                      <Table.Td ta="center">
                        <Skeleton h={16} w={40} mx="auto" />
                      </Table.Td>
                      <Table.Td ta="center">
                        <Skeleton h={16} w={56} mx="auto" />
                      </Table.Td>
                      <Table.Td ta="center">
                        <Skeleton h={24} w={80} mx="auto" />
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : totalFilteredItems === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={selectionMode ? 11 : 10}
                      ta="center"
                      py="xl"
                      c="dimmed"
                    >
                      {search || categoryFilter || abcFilter || stockFilter
                        ? "No items match your filters"
                        : "No items in inventory"}
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedItems.map((item) => {
                    const status = getStockStatus(item);
                    const qtyColor =
                      item.amount === 0
                        ? "red"
                        : isLowStock(item, activeThresholds) && item.amount > 0
                          ? "orange"
                          : isOverstock(item)
                            ? "orange"
                            : undefined;
                    return (
                      <Table.Tr key={item.item_code}>
                        {selectionMode && (
                          <Table.Td ta="center">
                            <Checkbox
                              checked={selectedItemCodes.includes(
                                item.item_code,
                              )}
                              onChange={(e) =>
                                toggleItemSelection(
                                  item.item_code,
                                  e.currentTarget.checked,
                                )
                              }
                              aria-label={`Select ${item.item_code}`}
                            />
                          </Table.Td>
                        )}
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              size="lg"
                              onClick={() => {
                                setQrItem(item);
                                setQrDialogOpen(true);
                              }}
                              title="Generate QR Code"
                            >
                              <QrCode size={16} />
                            </ActionIcon>
                            <Text
                              ff="monospace"
                              fw={500}
                              fz="sm"
                              truncate
                            >
                              {item.item_code}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            ff="monospace"
                            c="dimmed"
                            fz="xs"
                            truncate
                            maw={90}
                            title={item.vendor_code || "-"}
                          >
                            {item.vendor_code || "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text truncate title={item.description}>
                            {item.description}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="xs" c="dimmed" truncate maw={100} title={item.category || "-"}>
                            {item.category || "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="xs" c="dimmed" truncate maw={110} title={item.vendors?.name || "-"}>
                            {item.vendors?.name || "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="center">
                          <ABCBadge curve={item.abc_curve} />
                        </Table.Td>
                        <Table.Td ta="center" fw={700} c={qtyColor}>
                          {item.amount}
                        </Table.Td>
                        <Table.Td ta="center" c="dimmed">
                          {item.optimal_inventory}
                        </Table.Td>
                        <Table.Td ta="center">
                          ${(item.amount * item.unit_value).toFixed(2)}
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge
                            variant={status.variant}
                            color={status.color}
                            size="sm"
                          >
                            {status.label}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </div>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "var(--mantine-spacing-md)",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} withBorder padding="md" radius="md">
                <Skeleton h={96} />
              </Card>
            ))
          ) : totalFilteredItems === 0 ? (
            <Card withBorder padding="xl" radius="md" ta="center">
              <Text c="dimmed">
                {search || categoryFilter || abcFilter || stockFilter
                  ? "No items match your filters"
                  : "No items in inventory"}
              </Text>
            </Card>
          ) : (
            paginatedItems.map((item) => {
              const status = getStockStatus(item);
              const qtyColor =
                item.amount === 0
                  ? "red"
                  : isLowStock(item, activeThresholds) && item.amount > 0
                    ? "orange"
                    : isOverstock(item)
                      ? "orange"
                      : undefined;
              return (
                <Card
                  key={item.item_code}
                  withBorder
                  padding="md"
                  radius="md"
                  style={{ position: "relative", cursor: "pointer" }}
                >
                  {selectionMode && (
                    <div style={{ position: "absolute", right: 12, top: 12 }}>
                      <Checkbox
                        checked={selectedItemCodes.includes(item.item_code)}
                        onChange={(e) =>
                          toggleItemSelection(
                            item.item_code,
                            e.currentTarget.checked,
                          )
                        }
                        aria-label={`Select ${item.item_code}`}
                      />
                    </div>
                  )}
                  <Group justify="space-between" align="flex-start" mb="sm">
                    <div>
                      <Text ff="monospace" fz="xs" c="dimmed">
                        {item.item_code}
                      </Text>
                      <Text fw={500} lineClamp={2}>
                        {item.description}
                      </Text>
                      <Text fz="xs" c="dimmed" mt={4}>
                        Vendor: {item.vendors?.name || "-"}
                      </Text>
                    </div>
                    <Group gap={4}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="lg"
                        onClick={() => {
                          setQrItem(item);
                          setQrDialogOpen(true);
                        }}
                        title="Generate QR Code"
                      >
                        <QrCode size={16} />
                      </ActionIcon>
                      <ABCBadge curve={item.abc_curve} />
                    </Group>
                  </Group>

                  <Group justify="space-between" mb="sm">
                    <Badge variant="light" size="sm">
                      {item.category}
                    </Badge>
                    <Text fz="xl" fw={700} c={qtyColor}>
                      {item.amount}
                    </Text>
                  </Group>

                  <Group justify="space-between" mb="sm">
                    <Text fz="xs" c="dimmed">
                      Optimal: {item.optimal_inventory}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      ${(item.amount * item.unit_value).toFixed(2)}
                    </Text>
                  </Group>

                  <Badge
                    variant={status.variant}
                    color={status.color}
                    size="sm"
                    fullWidth
                  >
                    {status.label}
                  </Badge>
                </Card>
              );
            })
          )}
        </div>
      )}

      {!isLoading && filteredItems && (
        <PageNavigation
          totalItems={totalFilteredItems}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="items"
        />
      )}

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={(open) => {
          setQrDialogOpen(open);
          if (!open) setQrItem(undefined);
        }}
        qrValue={qrItem ? `Item code: ${qrItem.item_code}` : ""}
        title={qrItem?.item_code}
        subtitle={qrItem?.description}
      />

      <div className="hidden" aria-hidden="true">
        {selectedItems.map((item) => (
          <QRCodeCanvas
            key={`bulk-${item.item_code}`}
            ref={(node) => {
              bulkQrRefs.current[item.item_code] = node;
            }}
            value={`Item code: ${item.item_code}`}
            size={144}
            level="M"
            includeMargin={false}
          />
        ))}
      </div>
    </Stack>
  );
}