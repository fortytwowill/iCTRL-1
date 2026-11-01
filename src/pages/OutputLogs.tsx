import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Download, ArrowDownLeft, Package, User, FolderKanban, Filter, X, Pencil, Undo2 } from "lucide-react";
import { Button, Card, Badge, Skeleton, Select, Text, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTransactionLogs, useTransactionLogDateBounds, useCategories, useProjects, useProjectLabel } from "@/hooks/useInventory";
import { LogPeriodPicker } from "@/components/common/LogPeriodPicker";
import { getLogPeriodBounds, type LogPeriod } from "@/lib/logPeriod";
import { exportLogsToExcel } from "@/lib/exportExcel";
import {
  DEFAULT_PAGE_SIZE,
  PageNavigation,
  PageSizeSelector,
} from "@/components/common/ListPaginationControls";
import { useAuth } from "@/contexts/AuthContext";
import { useCanWrite } from "@/hooks/useCanWrite";
import { TransactionLog } from "@/types/inventory";
import { TransactionLogEditDialog } from "@/components/transactions/TransactionLogEditDialog";

const OUTPUT_LOGS_VIEWED_SESSION_KEY = "analytics_logs_viewed_output";

const ENTRY_TYPE_FILTER = [
  { value: "all", label: "All Types" },
  { value: "checkout", label: "Checkouts" },
  { value: "return", label: "Returns" },
];

export default function OutputLogs() {
  const [category, setCategory] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [period, setPeriod] = useState<LogPeriod | undefined>(undefined);
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editingLog, setEditingLog] = useState<TransactionLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { isAdmin } = useAuth();
  const { canWrite } = useCanWrite();

  const entryTypes = useMemo((): ('checkout' | 'return')[] => {
    if (entryTypeFilter === "checkout") return ["checkout"];
    if (entryTypeFilter === "return") return ["return"];
    return ["checkout", "return"];
  }, [entryTypeFilter]);

  const nonDateFilters = useMemo(() => ({
    entryTypes,
    category: category && category !== "all" ? category : undefined,
    projectId: projectId && projectId !== "all" ? projectId : undefined,
  }), [entryTypes, category, projectId]);

  const logsQuery = useTransactionLogs({ ...nonDateFilters, period });
  const { data: logs, isLoading } = logsQuery;
  const boundsQuery = useTransactionLogDateBounds(nonDateFilters);
  const { data: categories } = useCategories();
  const { data: projects } = useProjects();
  const { data: projectLabel } = useProjectLabel();
  const totalLogs = logs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const paginatedLogs = useMemo(() => {
    if (!logs) return [];
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  const hasFilters =
    Boolean(period) ||
    (category && category !== "all") ||
    (projectId && projectId !== "all") ||
    entryTypeFilter !== "all";

  const clearFilters = () => {
    setCategory("");
    setProjectId("");
    setPeriod(undefined);
    setEntryTypeFilter("all");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [category, projectId, period, entryTypeFilter]);

  useEffect(() => {
    const hasTrackedInSession = window.sessionStorage.getItem(OUTPUT_LOGS_VIEWED_SESSION_KEY) === "1";
    if (!hasTrackedInSession) {
      window.sessionStorage.setItem(OUTPUT_LOGS_VIEWED_SESSION_KEY, "1");
    }
  }, []);

  useEffect(() => {
    const activeFilterCount = [
      period,
      category,
      projectId,
      entryTypeFilter !== "all" ? entryTypeFilter : "",
    ]
      .filter(Boolean)
      .length;
    if (activeFilterCount === 0) return;
  }, [category, projectId, period, entryTypeFilter]);

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
      ? `output_logs_${period.startDate}_to_${period.endDate}`
      : "output_logs";
    setIsExporting(true);
    try {
      await exportLogsToExcel(logs, filename, projectLabel || undefined);
    } catch {
      notifications.show({ title: "Export failed", message: "Couldn't export logs. Please try again.", color: "red" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCategoryChange = (value: string | null) => {
    setCategory(value === "all" ? "" : (value || ""));
  };

  const handleProjectChange = (value: string | null) => {
    setProjectId(value === "all" ? "" : (value || ""));
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Text size="xl" fw={700} className="gradient-text">Output Logs</Text>
          <Text size="sm" c="dimmed">Item withdrawals, checkouts, and returns</Text>
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
          <div style={{ display: "grid", gap: "var(--mantine-spacing-sm)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Select
              value={entryTypeFilter}
              onChange={(v) => setEntryTypeFilter(v || "all")}
              data={ENTRY_TYPE_FILTER}
              placeholder="All Types"
              allowDeselect={false}
            />

            <Select
              value={category || "all"}
              onChange={handleCategoryChange}
              data={[{ value: "all", label: "All Categories" }, ...(categories?.map((cat) => ({ value: cat.name, label: cat.name })) || [])]}
              placeholder="All Categories"
              allowDeselect={false}
            />

            <Select
              value={projectId || "all"}
              onChange={handleProjectChange}
              data={[{ value: "all", label: `All ${projectLabel || "Projects"}` }, ...(projects?.map((proj) => ({ value: proj.project_id, label: proj.project_name })) || [])]}
              placeholder={`All ${projectLabel || "Projects"}`}
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
            Showing {logs.length} transaction{logs.length !== 1 ? "s" : ""}
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
            <Text ta="center" c="dimmed" py="xl">No output transactions found</Text>
          </Card>
        ) : (
          paginatedLogs.map((log) => {
            const isReturn = log.entry_type === "return";
            return (
              <Card key={log.id} withBorder padding="md" className="hover:border-primary/30 transition-colors">
                <Group align="flex-start" gap="md" wrap="nowrap">
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: isReturn ? "var(--mantine-color-green-1)" : "var(--mantine-color-red-1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isReturn ? (
                      <Undo2 size={20} color="var(--mantine-color-green-7)" />
                    ) : (
                      <ArrowDownLeft size={20} color="var(--mantine-color-red-7)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
                        <Group gap="xs" wrap="wrap" style={{ minWidth: 0 }}>
                          <Package size={16} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                          <Text fw={500} style={{ wordBreak: "break-word" }}>
                            {log.items?.description || log.item_code}
                          </Text>
                          <Badge
                            color={isReturn ? "green" : "gray"}
                            variant="light"
                          >
                            {isReturn ? `+${log.quantity} returned` : `x${log.quantity}`}
                          </Badge>
                          {isReturn && (
                            <Badge color="green" variant="outline" leftSection={<Undo2 size={12} />}>
                              Return
                            </Badge>
                          )}
                          {log.items?.abc_curve && (
                            <Badge
                              color={log.items.abc_curve === 'A' ? "red" : log.items.abc_curve === 'B' ? "yellow" : "gray"}
                              variant="outline"
                            >
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
                          <Text size="sm" c="dimmed" truncate>{log.profile?.full_name || "Unknown"}</Text>
                        </Group>
                        <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                          <FolderKanban size={12} style={{ flexShrink: 0 }} />
                          <Text size="sm" c="dimmed" truncate>{log.projects?.project_name || "Unknown"}</Text>
                        </Group>
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
            );
          })
        )}
      </Stack>

      {!logsQuery.isError && !isLoading && logs && (
        <PageNavigation
          totalItems={totalLogs}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="transactions"
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