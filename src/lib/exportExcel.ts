// ─── Excel Export Utilities ───────────────────────────────────────────────────
// Uses ExcelJS (actively maintained, no known CVEs) instead of the abandoned
// xlsx/SheetJS package which has unpatched HIGH + MEDIUM vulnerabilities.

import ExcelJS from 'exceljs';
import { TransactionLog, Item, PurchaseOrder, POLineItem } from '@/types/inventory';
import { format } from 'date-fns';

// ─── Public row-shape interfaces (unchanged — callers are unaffected) ─────────

export interface ExportLogRow {
  'Transaction ID': string;
  Date: string;
  Time: string;
  'Item Code': string;
  'Vendor Name': string;
  'Vendor Code': string;
  Description: string;
  Category: string;
  Quantity: number;
  'Unit Value': number;
  'Total Value': number;
  'ABC Curve': string;
  Person: string;
  Project: string;
  Type: string;
}

export interface LowStockRow {
  'Item Code': string;
  'Vendor Name': string;
  'Vendor Code': string;
  Description: string;
  Category: string;
  'Current Stock': number;
  'Optimal Stock': number;
  'Restock Level': number;
  'ABC Curve': string;
  'Low Stock Threshold': number;
  'Unit Value': number;
  'Total Value': number;
  'Shortage Value': number;
}

export interface DashboardInventoryRow {
  Code: string;
  'Vendor Name': string;
  'Vendor Code': string;
  Description: string;
  Category: string;
  ABC: string;
  Qty: number;
  Initial: number;
  Optimal: number;
  'TT Value': number;
  Status: string;
}

export interface CustomLabelRow {
  Name: string;
}

export interface ProjectItemsRow {
  Code: string;
  'Vendor Name': string;
  'Vendor Code': string;
  Description: string;
  Category: string;
  ABC: string;
  'Qty Used': number;
  Returned: number;
  'Unit Value': number;
  'Total Value': number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Triggers a browser download for an ExcelJS workbook. */
async function triggerDownload(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Applies bold + light-grey fill to the header row of a worksheet. */
function styleHeaderRow(worksheet: ExcelJS.Worksheet): void {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  headerRow.commit();
}

// ─── Public export functions ──────────────────────────────────────────────────

/**
 * Exports transaction logs to an `.xlsx` file and triggers a browser download.
 * Now async — callers should `await` or `.catch()` this call.
 */
export async function exportLogsToExcel(
  logs: TransactionLog[],
  filename: string = 'transaction_logs',
  projectLabel?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMStool';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Transactions');

  const projectHeader = projectLabel || 'Project';
  worksheet.columns = [
    { header: 'Transaction ID', key: 'TransactionID', width: 40 },
    { header: 'Date',          key: 'Date',         width: 14 },
    { header: 'Time',          key: 'Time',         width: 12 },
    { header: 'Item Code',     key: 'ItemCode',     width: 18 },
    { header: 'Vendor Name',   key: 'VendorName',   width: 24 },
    { header: 'Vendor Code', key: 'ExternalCode', width: 18 },
    { header: 'Description',   key: 'Description',  width: 32 },
    { header: 'Category',      key: 'Category',     width: 16 },
    { header: 'Quantity',      key: 'Quantity',     width: 12 },
    { header: 'Unit Value',    key: 'UnitValue',   width: 14 },
    { header: 'Total Value',   key: 'TotalValue',  width: 14 },
    { header: 'ABC Curve',     key: 'ABCCurve',    width: 12 },
    { header: 'Person',        key: 'Person',       width: 22 },
    { header: projectHeader,   key: 'Project',      width: 22 },
    { header: 'Type',          key: 'Type',        width: 10 },
  ];

  styleHeaderRow(worksheet);

  for (const log of logs) {
    const unitValue = log.items?.unit_value ?? 0;
    worksheet.addRow({
      TransactionID: log.id,
      Date:         format(new Date(log.created_at), 'yyyy-MM-dd'),
      Time:         format(new Date(log.created_at), 'HH:mm:ss'),
      ItemCode:     log.item_code,
      VendorName:   log.items?.vendors?.name ?? '',
      ExternalCode: log.items?.vendor_code ?? '',
      Description:  log.items?.description ?? '',
      Category:     log.items?.category ?? '',
      Quantity:     log.quantity,
      UnitValue:    unitValue,
      TotalValue:   log.quantity * unitValue,
      ABCCurve:     log.items?.abc_curve ?? '',
      Person:       log.profile?.full_name ?? 'Unknown',
      Project:      log.projects?.project_name ?? 'Unknown',
      Type:         log.entry_type === 'return' ? 'Return' : (log.transaction_type === 'checkout' ? 'Output' : 'Input'),
    });
  }

  // Right-align numeric columns
  ['Quantity', 'UnitValue', 'TotalValue'].forEach((key) => {
    worksheet.getColumn(key).alignment = { horizontal: 'right' };
  });

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  await triggerDownload(workbook, `${filename}_${dateStr}.xlsx`);
}

/**
 * Exports low-stock items report to an `.xlsx` file and triggers a browser download.
 * Now async — callers should `await` or `.catch()` this call.
 */
export async function exportLowStockToExcel(
  items: Item[],
  thresholds: { A: number; B: number; C: number },
  filename: string = 'low_stock_report'
): Promise<void> {
  const lowStockItems = items.filter((item) => {
    const threshold = thresholds[item.abc_curve as keyof typeof thresholds] ?? 10;
    const lowStockLevel = (item.optimal_inventory * threshold) / 100;
    return item.amount <= lowStockLevel;
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMStool';
  workbook.created = new Date();

  // ── Main sheet ──────────────────────────────────────────────────────────────
  const worksheet = workbook.addWorksheet('Low Stock');

  worksheet.columns = [
    { header: 'Item Code',           key: 'ItemCode',          width: 18 },
    { header: 'Vendor Name',         key: 'VendorName',        width: 24 },
    { header: 'Vendor Code',       key: 'ExternalCode',      width: 18 },
    { header: 'Description',         key: 'Description',       width: 32 },
    { header: 'Category',            key: 'Category',          width: 16 },
    { header: 'Current Stock',       key: 'CurrentStock',      width: 16 },
    { header: 'Optimal Stock',       key: 'OptimalStock',      width: 16 },
    { header: 'Restock Level',       key: 'RestockLevel',      width: 16 },
    { header: 'ABC Curve',           key: 'ABCCurve',          width: 12 },
    { header: 'Low Stock Threshold', key: 'LowStockThreshold', width: 22 },
    { header: 'Unit Value',          key: 'UnitValue',         width: 14 },
    { header: 'Total Value',         key: 'TotalValue',        width: 14 },
    { header: 'Shortage Value',      key: 'ShortageValue',     width: 16 },
  ];

  styleHeaderRow(worksheet);

  let totalShortageValue = 0;

  for (const item of lowStockItems) {
    const threshold = thresholds[item.abc_curve as keyof typeof thresholds] ?? 10;
    const lowStockThreshold = Math.ceil((item.optimal_inventory * threshold) / 100);
    const shortage = Math.max(0, item.optimal_inventory - item.amount);
    const shortageValue = shortage * item.unit_value;
    totalShortageValue += shortageValue;

    worksheet.addRow({
      ItemCode:          item.item_code,
      VendorName:        item.vendors?.name ?? '',
      ExternalCode:      item.vendor_code ?? '',
      Description:       item.description,
      Category:          item.category,
      CurrentStock:      item.amount,
      OptimalStock:      item.optimal_inventory,
      RestockLevel:      item.restock_level,
      ABCCurve:          item.abc_curve,
      LowStockThreshold: lowStockThreshold,
      UnitValue:         item.unit_value,
      TotalValue:        item.amount * item.unit_value,
      ShortageValue:     shortageValue,
    });
  }

  // Right-align numeric columns
  ['CurrentStock', 'OptimalStock', 'RestockLevel', 'LowStockThreshold',
   'UnitValue', 'TotalValue', 'ShortageValue'].forEach((key) => {
    worksheet.getColumn(key).alignment = { horizontal: 'right' };
  });

  // ── Summary sheet ───────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary');

  summarySheet.columns = [
    { header: 'Metric', key: 'Metric', width: 28 },
    { header: 'Value',  key: 'Value',  width: 18 },
  ];

  styleHeaderRow(summarySheet);

  summarySheet.addRows([
    { Metric: 'Total Low Stock Items', Value: lowStockItems.length },
    { Metric: 'Total Shortage Value',  Value: parseFloat(totalShortageValue.toFixed(2)) },
  ]);

  summarySheet.getColumn('Value').alignment = { horizontal: 'right' };

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  await triggerDownload(workbook, `${filename}_${dateStr}.xlsx`);
}

/**
 * Exports inventory items shown on the dashboard table view.
 * Output columns intentionally match the dashboard UI headers.
 */
export async function exportDashboardInventoryToExcel(
  items: Item[],
  thresholds: { A: number; B: number; C: number },
  filename: string = 'inventory_dashboard'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMStool';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Inventory');
  worksheet.columns = [
    { header: 'Code',        key: 'Code',       width: 18 },
    { header: 'Vendor Name', key: 'VendorName', width: 24 },
    { header: 'Vendor Code', key: 'VendorCode', width: 18 },
    { header: 'Description', key: 'Description', width: 32 },
    { header: 'Category',    key: 'Category',   width: 18 },
    { header: 'ABC',         key: 'ABC',        width: 10 },
    { header: 'Qty',         key: 'Qty',        width: 10 },
    { header: 'Initial',     key: 'Initial',    width: 10 },
    { header: 'Optimal',     key: 'Optimal',    width: 10 },
    { header: 'TT Value',    key: 'TTValue',    width: 14 },
    { header: 'Status',      key: 'Status',     width: 22 },
  ];

  styleHeaderRow(worksheet);

  for (const item of items) {
    const thresholdPercent = thresholds[item.abc_curve as keyof typeof thresholds] ?? 10;
    const thresholdValue = Math.ceil((item.optimal_inventory * thresholdPercent) / 100);
    let status = 'In Stock';

    if (item.amount === 0) {
      status = 'Out of Stock';
    } else if (item.amount <= thresholdValue) {
      status = `Low Stock (≤${thresholdValue})`;
    } else if (item.amount > item.optimal_inventory) {
      status = 'Overstock';
    }

    worksheet.addRow({
      Code: item.item_code,
      VendorName: item.vendors?.name ?? '-',
      VendorCode: item.vendor_code ?? '-',
      Description: item.description,
      Category: item.category || '-',
      ABC: item.abc_curve,
      Qty: item.amount,
      Initial: item.initial_quantity ?? 0,
      Optimal: item.optimal_inventory,
      TTValue: item.amount * item.unit_value,
      Status: status,
    });
  }

  ['Qty', 'Initial', 'Optimal', 'TTValue'].forEach((key) => {
    worksheet.getColumn(key).alignment = { horizontal: 'right' };
  });

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  await triggerDownload(workbook, `${filename}_${dateStr}.xlsx`);
}

/**
 * Exports custom-label entries from the Management page list.
 * Output columns intentionally match the table UI headers.
 */
export async function exportCustomLabelItemsToExcel(
  names: string[],
  columnHeader: string,
  filename: string = 'custom_label_items'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMStool';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Items');
  worksheet.columns = [
    { header: columnHeader, key: 'Name', width: 40 },
  ];

  styleHeaderRow(worksheet);

  for (const name of names) {
    worksheet.addRow({ Name: name });
  }

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  await triggerDownload(workbook, `${filename}_${dateStr}.xlsx`);
}

/**
 * Exports all items associated to a specific project with summarized quantities.
 */
export async function exportProjectItemsToExcel(
  rows: Array<{
    item_code: string;
    quantity: number;
    entry_type?: string | null;
    items?: {
      vendor_code: string | null;
      external_item_code?: string | null;
      vendors?: {
        name: string;
      } | null;
      description: string;
      category: string;
      abc_curve: string;
      unit_value: number | null;
    } | null;
  }>,
  projectName: string,
  filename: string = 'project_items'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMStool';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Project Items');

  worksheet.columns = [
    { header: 'Code',        key: 'Code',       width: 18 },
    { header: 'Vendor Name', key: 'VendorName', width: 24 },
    { header: 'Vendor Code', key: 'VendorCode', width: 18 },
    { header: 'Description', key: 'Description', width: 32 },
    { header: 'Category',    key: 'Category',   width: 18 },
    { header: 'ABC',         key: 'ABC',        width: 10 },
    { header: 'Qty Used',    key: 'TotalQty',   width: 12 },
    { header: 'Returned',    key: 'Returned',   width: 12 },
    { header: 'Unit Value',  key: 'UnitValue',  width: 14 },
    { header: 'Total Value', key: 'TotalValue', width: 14 },
  ];

  styleHeaderRow(worksheet);

  const byItem = new Map<string, {
    code: string;
    vendorName: string;
    vendorCode: string;
    description: string;
    category: string;
    abc: string;
    checkoutQty: number;
    returnedQty: number;
    unitValue: number;
  }>();

  for (const row of rows) {
    const existing = byItem.get(row.item_code);
    const qty = Number(row.quantity) || 0;
    const unitValue = row.items?.unit_value ?? existing?.unitValue ?? 0;
    const isReturn = row.entry_type === 'return';

    if (existing) {
      if (isReturn) {
        existing.returnedQty += qty;
      } else {
        existing.checkoutQty += qty;
      }
      continue;
    }

    byItem.set(row.item_code, {
      code: row.item_code,
      vendorName: row.items?.vendors?.name ?? '-',
      vendorCode: row.items?.vendor_code ?? row.items?.external_item_code ?? '-',
      description: row.items?.description ?? '-',
      category: row.items?.category ?? '-',
      abc: row.items?.abc_curve ?? '-',
      checkoutQty: isReturn ? 0 : qty,
      returnedQty: isReturn ? qty : 0,
      unitValue,
    });
  }

  for (const entry of byItem.values()) {
    const netQty = Math.max(0, entry.checkoutQty - entry.returnedQty);
    worksheet.addRow({
      Code: entry.code,
      VendorName: entry.vendorName,
      VendorCode: entry.vendorCode,
      Description: entry.description,
      Category: entry.category,
      ABC: entry.abc,
      TotalQty: netQty,
      Returned: entry.returnedQty,
      UnitValue: entry.unitValue,
      TotalValue: netQty * entry.unitValue,
    });
  }

  ['TotalQty', 'Returned', 'UnitValue', 'TotalValue'].forEach((key) => {
    worksheet.getColumn(key).alignment = { horizontal: 'right' };
  });

  worksheet.getCell('A1').note = `Project: ${projectName}`;

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  await triggerDownload(workbook, `${filename}_${dateStr}.xlsx`);
}

/** Input shape for PO export — extends PurchaseOrder with line items and resolved vendor name. */
export interface PurchaseOrderExportRow {
  po: PurchaseOrder;
  lineItems: POLineItem[];
  vendorName?: string;
}

/**
 * Exports purchase orders to an `.xlsx` file with two sheets:
 * - Sheet 1 "PO Summary": po_number, vendor, status, order_date, total
 * - Sheet 2 "PO Line Items": po_number, item_code, quantity, unit_price, received
 * Triggers a browser download.
 */
export async function exportPurchaseOrdersToExcel(
  rows: PurchaseOrderExportRow[],
  filename: string = 'purchase_orders'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMStool';
  workbook.created = new Date();

  // ── Sheet 1: PO Summary ────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('PO Summary');
  summarySheet.columns = [
    { header: 'PO Number', key: 'PONumber',   width: 18 },
    { header: 'Vendor',    key: 'Vendor',     width: 24 },
    { header: 'Status',    key: 'Status',     width: 14 },
    { header: 'Order Date',key: 'OrderDate',  width: 14 },
    { header: 'Total',     key: 'Total',      width: 14 },
  ];
  styleHeaderRow(summarySheet);

  for (const row of rows) {
    summarySheet.addRow({
      PONumber: row.po.po_number,
      Vendor: row.vendorName ?? row.po.vendor_id ?? '-',
      Status: row.po.status,
      OrderDate: row.po.order_date,
      Total: row.po.total_amount,
    });
  }
  summarySheet.getColumn('Total').alignment = { horizontal: 'right' };

  // ── Sheet 2: PO Line Items ─────────────────────────────────────────────────
  const lineItemsSheet = workbook.addWorksheet('PO Line Items');
  lineItemsSheet.columns = [
    { header: 'PO Number', key: 'PONumber',  width: 18 },
    { header: 'Item Code', key: 'ItemCode',  width: 18 },
    { header: 'Quantity',  key: 'Quantity',  width: 12 },
    { header: 'Unit Price',key: 'UnitPrice', width: 14 },
    { header: 'Received',  key: 'Received',  width: 12 },
  ];
  styleHeaderRow(lineItemsSheet);

  for (const row of rows) {
    for (const li of row.lineItems) {
      lineItemsSheet.addRow({
        PONumber: row.po.po_number,
        ItemCode: li.item_code,
        Quantity: li.quantity,
        UnitPrice: li.unit_price,
        Received: li.received_quantity,
      });
    }
  }
  ['Quantity', 'UnitPrice', 'Received'].forEach((key) => {
    lineItemsSheet.getColumn(key).alignment = { horizontal: 'right' };
  });

  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  await triggerDownload(workbook, `${filename}_${dateStr}.xlsx`);
}
