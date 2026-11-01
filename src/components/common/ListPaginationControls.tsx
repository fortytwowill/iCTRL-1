import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Select, Group, Text } from "@mantine/core";

export const PAGE_SIZE_OPTIONS = [10, 20, 40, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}

interface PageNavigationProps {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

interface ListPaginationControlsProps extends PageSizeSelectorProps, PageNavigationProps {}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  className,
}: PageSizeSelectorProps) {
  return (
    <Group gap="xs" className={className}>
      <Text size="sm" c="dimmed">Rows per page</Text>
      <Select
        value={String(pageSize)}
        onChange={(value) => value && onPageSizeChange(Number(value))}
        data={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
        size="xs"
        w={80}
        allowDeselect={false}
      />
    </Group>
  );
}

export function PageNavigation({
  totalItems,
  page,
  pageSize,
  onPageChange,
  itemLabel = "items",
  className,
}: PageNavigationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "var(--mantine-spacing-sm)", alignItems: "flex-start" }}>
      <style>{`@media (min-width: 640px) { .page-nav-responsive { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; } }`}</style>
      <div className="page-nav-responsive" style={{ display: "flex", flexDirection: "column", gap: "var(--mantine-spacing-sm)", width: "100%" }}>
        <Text size="sm" c="dimmed">
          Showing {start}-{end} of {totalItems} {itemLabel}
        </Text>
        <Group gap={4}>
          <Button
            variant="default"
            size="compact-sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || totalItems === 0}
          >
            <ChevronLeft size={16} />
          </Button>
          <Text size="sm" c="dimmed" style={{ minWidth: 80, textAlign: "center" }}>
            Page {Math.min(page, totalPages)} of {totalPages}
          </Text>
          <Button
            variant="default"
            size="compact-sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || totalItems === 0}
          >
            <ChevronRight size={16} />
          </Button>
        </Group>
      </div>
    </div>
  );
}

export function ListPaginationControls({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "items",
  className,
}: ListPaginationControlsProps) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "var(--mantine-spacing-sm)" }}>
      <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      <PageNavigation
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemLabel={itemLabel}
      />
    </div>
  );
}