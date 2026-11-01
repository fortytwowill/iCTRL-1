export type ABCClassification = 'A' | 'B' | 'C';

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_info: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  item_code: string;
  vendor_code: string | null;
  vendor_id: string | null;
  category: string;
  description: string;
  amount: number;
  initial_quantity: number;
  restock_level: number;
  abc_curve: ABCClassification;
  optimal_inventory: number;
  unit_value: number;
  created_at: string;
  reorder_point: number | null;
  location_id: string | null;
  updated_at: string;
  vendors?: Pick<Vendor, "id" | "name" | "contact_info"> | null;
}

export interface Project {
  project_id: string;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EntryType = 'added_item' | 'restock' | 'checkout' | 'return';

export interface TransactionLog {
  id: string;
  user_id: string | null;
  project_id: string | null;
  item_code: string;
  quantity: number;
  transaction_type: 'checkout' | 'restock';
  entry_type: EntryType | null;
  created_at: string;
  profile?: { id: string; full_name: string | null } | null;
  projects?: Project | null;
  items?: Item;
}

export interface ScannedCheckoutItem {
  item: Item;
  quantity: number;
}

export interface BatchCheckoutInputItem {
  item_code: string;
  quantity: number;
}

export type ScanStep = 'items';

export interface ScanSession {
  project: Project | null;
  scannedItems: ScannedCheckoutItem[];
}

export interface ABCThresholds {
  A: number;
  B: number;
  C: number;
}

export interface Settings {
  id: string;
  key: string;
  value: ABCThresholds | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Helper function to check if item is low stock based on ABC classification
export function isLowStock(item: Item, thresholds: ABCThresholds): boolean {
  const threshold = thresholds[item.abc_curve] || 10;
  const lowStockLevel = (item.optimal_inventory * threshold) / 100;
  return item.amount <= lowStockLevel;
}

// Helper function to get low stock threshold value
export function getLowStockThreshold(item: Item, thresholds: ABCThresholds): number {
  const threshold = thresholds[item.abc_curve] || 10;
  return Math.ceil((item.optimal_inventory * threshold) / 100);
}

// Helper function to check if item is overstocked (Qty > Optimal)
export function isOverstock(item: Item): boolean {
  return item.amount > item.optimal_inventory;
}
export interface InventoryAlert {
  id: string;
  organization_id: string;
  item_code: string;
  alert_type: "low_stock" | "reorder";
  threshold_value: number;
  current_amount: number;
  is_dismissed: boolean;
  created_at: string;
  dismissed_at: string | null;
}
export interface SerialNumber {
  id: string;
  organization_id: string;
  item_code: string;
  serial_number: string;
  status: 'available' | 'sold' | 'returned' | 'defective';
  created_at: string;
  updated_at: string;
}

export interface BatchLot {
  id: string;
  organization_id: string;
  item_code: string;
  lot_number: string;
  expiry_date: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  po_number: string;
  vendor_id: string | null;
  status: 'draft' | 'sent' | 'received' | 'closed';
  order_date: string;
  expected_delivery: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface POLineItem {
  id: string;
  purchase_order_id: string;
  item_code: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
}
export interface Location {
id: string;
organization_id: string;
name: string;
address: string | null;
is_active: boolean;
created_at: string;
updated_at: string;
}
export interface ItemBundle {
id: string;
organization_id: string;
bundle_item_code: string;
component_item_code: string;
quantity_required: number;
created_at: string;
}
export interface ScheduledReport {
id: string;
organization_id: string;
user_id: string;
report_type: 'inventory_summary' | 'low_stock' | 'transaction_log';
frequency: 'daily' | 'weekly' | 'monthly';
email_recipients: string[];
is_active: boolean;
last_run_at: string | null;
created_at: string;
updated_at: string;
}
