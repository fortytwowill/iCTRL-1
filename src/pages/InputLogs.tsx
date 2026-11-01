import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Download, ArrowUpRight, Package, User, FolderKanban, Filter, X, Tag, Pencil } from "lucide-react";
import { Button, Card, Badge, Skeleton, Select, Text, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTransactionLogs, useTransactionLogDateBounds, useProjectLabel } from "@/hooks/useInventory";
import { LogPeriodPicker } from "@/components/common/LogPeriodPicker";
import { getLogPeriodBounds, type LogPeriod } from "@/lib/logPeriod";
import { exportLogsToExcel } from "@/lib/exportExcel";
import { EntryType, TransactionLog } from "@/types/inventory";
import {
  DEFAULT_PAGE_SIZE,
  PageNavigation,
  PageSizeSelector,
} from "@/components/common/ListPaginationControls";
import { useAuth } from "@/contexts/AuthContext";
import { useCanWrite } from "@/hooks/useCanWrite";
import { TransactionLogEditDialog } from "@/components/transactions/TransactionLogEditDialog";

const INPUT_LOGS_VIEWED_SESSION_KEY = "analytics_logs_viewed_input";

const ENTRY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "added_item", label: "Added Item" },
  { value: "restock", label: "Restock" },
  { value: "return", label: "Return" },
];

function formatEntryType(entryType: EntryType | null): string {
  if (!entryType) return "Input";
  switch (entryType) {
    case "added_item": return "Added Item";
    case "restock": return "Restock";
    case "return": return "Return";
    default: return "Input";
  }
}

function entryTypeBadgeColor(entryType: EntryType | null): string {
  switch (entryType) {
    case "added_item": return "blue";
    case "restock": return "teal";
    case "return": return "orange";
    default: return "gray";
  }
}

function abcCurveBadgeColor(curve: string | undefined): string {
  switch (curve) {
    case "A": return "red";
    case "B": return "yellow";
    case "C": return "gray";
    default: return "gray";
  }
}

export default function InputLogs() {
  const [period, setPeriod] = useState<LogPeriod | undefined>(undefined);
  const [entryType, setEntryType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editingLog, setEditingLog] = useState<TransactionLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { isAdmin } = useAuth();
  const { canWrite } = useCanWrite();

  const nonDateFilters = useMemo(() => ({
    type: 'restock' as const,
    entryType: entryType !== "all" ? entryType : undefined,
  }), [entryType]);

  const logsQuery = useTransactionLogs({ ...nonDateFilters, period });
  const { data: logs, isLoading } = logsQuery;
  const boundsQuery = useTransactionLogDateBounds(nonDateFilters);
  const { data: projectLabel } = useProjectLabel();
  const totalLogs = logs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const paginatedLogs = useMemo(() => {
    if (!logs) return [];
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  const hasFilters = Boolean(period) || entryType !== "all";

  const clearFilters = () => {
    setPeriod(undefined);
    setEntryType("all");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [period, entryType]);

  useEffect(() => {
    const hasTrackedInSession = window.sessionStorage.getItem(INPUT_LOGS_VIEWED_SESSION_KEY) === "1";
    if (!hasTrackedInSession) {
      window.sessionStorage.setItem(INPUT_LOGS_VIEWED_SESSION_KEY, "1");
    }
  }, []);

  useEffect(() => {
    const activeFilterCount = [period, entryType !== "all" ? entryType : ""].filter(Boolean).length;
    if (activeFilterCount === 0) return;
  }, [period, entryType]);

  const handlePeriodChange = (next: LogPeriod | undefined) => {
    setPeriod(next);
    if (next) {
      const bounds = getLogPeriodBounds(next);
    }
  };

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const exportDisabled =
    logsQuery.isPending ||
    logsQuery.isFetching ||
    logsQuery.isError ||
    isExporting ||
    !logs?.length;

  const handleExport = async () => {
    if (!logs || logs.length === 0 || isExporting) return;
    const filename = period
      ? `input_logs_${period.startDate}_to_${period.endDate}`
      : "input_logs";
    setIsExporting(true);
    try {
      await exportLogsToExcel(logs, filename, projectLabel || undefined);
    } catch {
      notifications.show({ title: "Export failed", message: "Couldn't export logs. Please try again.", color: "red" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Text size="xl" fw={700} className="gradient-text">Input Logs</Text>
          <Text size="sm" c="dimmed">Restocks, returns, and new additions</Text>
        </div>
        <Button onClick={handleExport} disabled={exportDisabled} leftSection={<Download size={16} />} style={{ flexShrink: 0 }}>
          Export Excel
        </Button>
      </Group>

      {/* Filters */}
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Group gap="xs">
            <Filter size={16} color="var(--mantine-color-dimmed)" />
            <Text size="sm" fw={500}>Filters</Text>
            {hasFilters && (
              <Button variant="subtle" size="compact-xs" onClick={clearFilters} leftSection={<X size={12} />}>
                Clear
              </Button>
            )}
          </Group>
          <div style={{ display: "grid", gap: "var(--mantine-spacing-sm)", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <Select
              value={entryType}
              onChange={(v) => setEntryType(v || "all")}
              data={ENTRY_TYPES}
              placeholder="All Types"
              allowDeselect={false}
            />
            <LogPeriodPicker
              value={period}
              onChange={handlePeriodChange}
              bounds={boundsQuery.data}
              isLoading={boundsQuery.isLoading}
              error={boundsQuery.error}
              onRetry={() => { void boundsQuery.refetch(); }}
            />
          </div>
        </Stack>
      </Card>

      {/* Results count */}
      {!logsQuery.isError && !isLoading && logs && (
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="sm" c="dimmed">
            Showing {logs.length} entr{logs.length !== 1 ? "ies" : "y"}
          </Text>
          <PageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </Group>
      )}

      {/* Logs List */}
      <Stack gap="sm">
        {logsQuery.isError ? (
          <Card withBorder padding="xl" style={{ borderColor: "var(--mantine-color-red-outline)" }}>
            <Stack align="center" gap="sm" py="xl">
              <Text size="sm" c="dimmed" ta="center">
                Couldn't load logs for the selected filters. Please try again.
              </Text>
              <Button variant="default" size="xs" onClick={() => logsQuery.refetch()}>
                Retry
              </Button>
            </Stack>
          </Card>
        ) : isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} withBorder padding="md">
              <Skeleton height={64} />
            </Card>
          ))
        ) : totalLogs === 0 ? (
          <Card withBorder padding="xl">
            <Text ta="center" c="dimmed" py="xl">No input transactions found</Text>
          </Card>
        ) : (
          paginatedLogs.map((log) => (
            <Card key={log.id} withBorder padding="md" className="hover:border-primary/30 transition-colors">
              <Group align="flex-start" gap="md" wrap="nowrap">
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "var(--mantine-color-green-1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ArrowUpRight size={20} color="var(--mantine-color-green-7)" />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
                      <Group gap="xs" wrap="wrap" style={{ minWidth: 0 }}>
                        <Package size={16} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                        <Text fw={500} style={{ wordBreak: "break-word" }}>
                          {log.items?.description || log.item_code}
                        </Text>
                        <Badge color="teal" variant="light">+{log.quantity}</Badge>
                        <Badge color={entryTypeBadgeColor(log.entry_type)} variant="outline" leftSection={<Tag size={12} />}>
                          {formatEntryType(log.entry_type)}
                        </Badge>
                        {log.items?.abc_curve && (
                          <Badge color={abcCurveBadgeColor(log.items.abc_curve)} variant="outline">
                            {log.items.abc_curve}
                          </Badge>
                        )}
                      </Group>
                      <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                        <Text size="xs" c="dimmed">
                          {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                        </Text>
                        {isAdmin && canWrite && (
                          <Button variant="default" size="compact-xs" onClick={() => setEditingLog(log)} leftSection={<Pencil size={14} />}>
                            Edit
                          </Button>
                        )}
                      </Group>
                    </Group>

                    <Group gap="md" wrap="wrap">
                      <Text size="xs" ff="monospace" c="dimmed">
                        Transaction ID: {log.id}
                      </Text>
                      <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                        <User size={12} style={{ flexShrink: 0 }} />
                        <Text size="sm" c="dimmed" truncate>{log.profile?.full_name || "System"}</Text>
                      </Group>
                      {log.projects && (
                        <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                          <FolderKanban size={12} style={{ flexShrink: 0 }} />
                          <Text size="sm" c="dimmed" truncate>{log.projects.project_name}</Text>
                        </Group>
                      )}
                      {log.items?.category && (
                        <Badge variant="light" color="gray" size="xs">{log.items.category}</Badge>
                      )}
                      {log.items?.locations?.name && (
                        <Badge variant="light" color="gray" size="xs">{log.items.locations.name}</Badge>
                      )}
                    </Group>
                  </Stack>
                </div>
              </Group>
            </Card>
          ))
        )}
      </Stack>

      {!logsQuery.isError && !isLoading && logs && (
        <PageNavigation
          totalItems={totalLogs}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="entries"
        />
      )}

      <TransactionLogEditDialog
        open={Boolean(editingLog)}
        log={editingLog}
        projectLabel={projectLabel || "Project"}
        onOpenChange={(open) => { if (!open) setEditingLog(null); }}
      />
    </Stack>
  );
}