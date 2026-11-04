import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
 getLogPeriodBounds,
 type LogDateBounds,
 type LogPeriod,
} from "@/lib/logPeriod";
import { useAuth } from "@/contexts/AuthContext";

export interface ItemProjectAllocation {
 project_id: string;
 allocated_quantity: number;
}

// Items
export function useItems() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["items", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/inventory?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch items");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

export function useCreateItem() {
 const queryClient = useQueryClient();
 const { currentOrg } = useAuth();
 return useMutation({
 mutationFn: async (item: unknown) => {
 if (!currentOrg) throw new Error("No organization selected");
 const res = await fetch("/api/inventory", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...item, organizationId: currentOrg.id }),
 });
 if (!res.ok) throw new Error("Failed to create item");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["items"] });
 notifications.show({ title: "Success", message: "Item created", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

export function useUpdateItem() {
 const queryClient = useQueryClient();
 return useMutation({
 mutationFn: async ({ item_code, updates }: { item_code: string; updates: unknown }) => {
 const res = await fetch(`/api/inventory/${item_code}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(updates),
 });
 if (!res.ok) throw new Error("Failed to update item");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["items"] });
 notifications.show({ title: "Success", message: "Item updated", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

export function useDeleteItem() {
 const queryClient = useQueryClient();
 return useMutation({
 mutationFn: async (item_code: string) => {
 const res = await fetch(`/api/inventory/${item_code}`, { method: "DELETE" });
 if (!res.ok) throw new Error("Failed to delete item");
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["items"] });
 notifications.show({ title: "Success", message: "Item deleted", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

// Projects
export function useProjects() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["projects", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/projects?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch projects");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

export function useCreateProject() {
 const queryClient = useQueryClient();
 const { currentOrg } = useAuth();
 return useMutation({
 mutationFn: async (project: unknown) => {
 if (!currentOrg) throw new Error("No organization selected");
 const res = await fetch("/api/projects", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...project, organizationId: currentOrg.id }),
 });
 if (!res.ok) throw new Error("Failed to create project");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["projects"] });
 notifications.show({ title: "Success", message: "Project created", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

export function useUpdateProject() {
 const queryClient = useQueryClient();
 return useMutation({
 mutationFn: async ({ id, updates }: { id: string; updates: unknown }) => {
 const res = await fetch(`/api/projects/${id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(updates),
 });
 if (!res.ok) throw new Error("Failed to update project");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["projects"] });
 notifications.show({ title: "Success", message: "Project updated", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

export function useDeleteProject() {
 const queryClient = useQueryClient();
 return useMutation({
 mutationFn: async (id: string) => {
 const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
 if (!res.ok) throw new Error("Failed to delete project");
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["projects"] });
 notifications.show({ title: "Success", message: "Project deleted", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

// Transaction Logs
export interface TransactionLogFilters {
 period?: LogPeriod;
 customStartDate?: string;
 customEndDate?: string;
 entry_type?: string;
 item_code?: string;
 user_id?: string;
 project_id?: string;
}

export function useTransactionLogs(filters?: TransactionLogFilters) {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["transactionLogs", currentOrg?.id, filters],
 queryFn: async () => {
 if (!currentOrg) return [];
 const params = new URLSearchParams({ orgId: currentOrg.id });
 if (filters?.period) params.set("period", filters.period);
 if (filters?.customStartDate) params.set("startDate", filters.customStartDate);
 if (filters?.customEndDate) params.set("endDate", filters.customEndDate);
 if (filters?.entry_type) params.set("entryType", filters.entry_type);
 if (filters?.item_code) params.set("itemCode", filters.item_code);
 
 const res = await fetch(`/api/inventory/logs?${params}`);
 if (!res.ok) throw new Error("Failed to fetch logs");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Settings
export function useSettings() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["settings", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return null;
 const res = await fetch(`/api/settings?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch settings");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Categories
export function useCategories() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["categories", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/inventory/categories?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch categories");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Vendors
export function useVendors() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["vendors", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/vendors?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch vendors");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Locations
export function useLocations() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["locations", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/locations?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch locations");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Serial Numbers
export function useSerialNumbers() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["serials", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/serial-batch/serials?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch serials");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Batch Lots
export function useBatchLots() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["batches", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/serial-batch/batches?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch batches");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Purchase Orders
export function usePurchaseOrders() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["purchaseOrders", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/purchase-orders?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch POs");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

// Scheduled Reports
export function useScheduledReports() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["scheduledReports", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/scheduled-reports?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch reports");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}
// Scanner helpers
export function useLookupItemByCode() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["lookupItem"],
 queryFn: async ({ queryKey }: { queryKey: [string, string] }) => {
 const [, code] = queryKey;
 if (!currentOrg || !code) return null;
 const res = await fetch(`/api/inventory/${code}?orgId=${currentOrg.id}`);
 if (!res.ok) return null;
 return res.json();
 },
 enabled: false, // Manual trigger
 });
}

export function useCheckoutItemsBatch() {
 const queryClient = useQueryClient();
 const { currentOrg } = useAuth();
 return useMutation({
 mutationFn: async (items: unknown[]) => {
 if (!currentOrg) throw new Error("No organization selected");
 const res = await fetch("/api/inventory/checkout-batch", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ items, organizationId: currentOrg.id }),
 });
 if (!res.ok) throw new Error("Failed to checkout items");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["items"] });
 queryClient.invalidateQueries({ queryKey: ["transactionLogs"] });
 notifications.show({ title: "Success", message: "Items checked out", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}
// Returns
export function useReturnItem() {
 const queryClient = useQueryClient();
 const { currentOrg } = useAuth();
 return useMutation({
 mutationFn: async (data: unknown) => {
 if (!currentOrg) throw new Error("No organization selected");
 const res = await fetch("/api/inventory/return", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...data, organizationId: currentOrg.id }),
 });
 if (!res.ok) throw new Error("Failed to process return");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["items"] });
 queryClient.invalidateQueries({ queryKey: ["transactionLogs"] });
 notifications.show({ title: "Success", message: "Return processed", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

export function useItemReturnAllocations() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["returnAllocations", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return [];
 const res = await fetch(`/api/inventory/returns/allocations?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch return allocations");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}
// Project helpers
export function useProjectLabel() {
 const { projects } = useProjects();
 return (projectId: string) => {
 if (!projects) return projectId;
 const project = projects.find((p): p is { id: string; name?: string } => typeof p === 'object' && p !== null && 'id' in p && p.id === projectId);
 return project?.name || projectId;
 };
}
// Transaction Logs
export function useUpdateTransactionLog() {
 const queryClient = useQueryClient();
 return useMutation({
 mutationFn: async ({ id, updates }: { id: string; updates: unknown }) => {
 const res = await fetch(`/api/inventory/logs/${id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(updates),
 });
 if (!res.ok) throw new Error("Failed to update transaction log");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["transactionLogs"] });
 notifications.show({ title: "Success", message: "Log updated", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}
// Transaction Log Date Bounds
export function useTransactionLogDateBounds() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["transactionLogDateBounds", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return null;
 const res = await fetch(`/api/inventory/logs/date-bounds?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch date bounds");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}
// ABC Thresholds
export function useABCThresholds() {
 const { currentOrg } = useAuth();
 return useQuery({
 queryKey: ["abcThresholds", currentOrg?.id],
 queryFn: async () => {
 if (!currentOrg) return null;
 const res = await fetch(`/api/settings/abc-thresholds?orgId=${currentOrg.id}`);
 if (!res.ok) throw new Error("Failed to fetch ABC thresholds");
 return res.json();
 },
 enabled: !!currentOrg,
 });
}

export function useUpdateABCThresholds() {
 const queryClient = useQueryClient();
 const { currentOrg } = useAuth();
 return useMutation({
 mutationFn: async (thresholds: unknown) => {
 if (!currentOrg) throw new Error("No organization selected");
 const res = await fetch("/api/settings/abc-thresholds", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...thresholds, organizationId: currentOrg.id }),
 });
 if (!res.ok) throw new Error("Failed to update ABC thresholds");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["abcThresholds"] });
 notifications.show({ title: "Success", message: "ABC thresholds updated", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}

// Project Label Update
export function useUpdateProjectLabel() {
 const queryClient = useQueryClient();
 return useMutation({
 mutationFn: async ({ id, label }: { id: string; label: string }) => {
 const res = await fetch(`/api/projects/${id}/label`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ label }),
 });
 if (!res.ok) throw new Error("Failed to update project label");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["projects"] });
 notifications.show({ title: "Success", message: "Project label updated", color: "green" });
 },
 onError: (e: unknown) => {
 notifications.show({ title: "Error", message: e instanceof Error ? e.message : String(e), color: "red" });
 },
 });
}