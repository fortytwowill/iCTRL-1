import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { purchaseOrders, poLineItems, vendors } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        createdAt: purchaseOrders.createdAt,
        vendorName: vendors.name,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(eq(purchaseOrders.organizationId, req.organizationId!))
      .orderBy(purchaseOrders.createdAt);
    res.json(result);
  } catch (err) {
    console.error("GET /purchase-orders error:", err);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

router.get("/:id/line-items", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select()
      .from(poLineItems)
      .where(eq(poLineItems.purchaseOrderId, req.params.id as string))
      .orderBy(poLineItems.itemCode);
    res.json(result);
  } catch (err) {
    console.error("GET /purchase-orders/:id/line-items error:", err);
    res.status(500).json({ error: "Failed to fetch line items" });
  }
});

router.post("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { poNumber, vendorId, totalAmount, lineItems } = req.body;
    const [po] = await db.insert(purchaseOrders).values({
      id: crypto.randomUUID(),
      poNumber,
      vendorId,
      organizationId: req.organizationId!,
      totalAmount: totalAmount ?? "0",
      status: "draft",
    }).returning();

    if (lineItems?.length) {
      await db.insert(poLineItems).values(
        lineItems.map((li: Record<string, unknown>) => ({
          id: crypto.randomUUID(),
          purchaseOrderId: po.id,
          itemCode: li.item_code as string,
          quantity: li.quantity as number,
          unitPrice: li.unit_price as string | undefined,
          receivedQuantity: 0,
        }))
      );
    }
    res.status(201).json(po);
  } catch (err) {
    console.error("POST /purchase-orders error:", err);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

router.patch("/:id/receive", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { lineItems } = req.body;
    for (const li of lineItems) {
      await db.update(poLineItems)
        .set({ receivedQuantity: li.received_quantity })
        .where(eq(poLineItems.id, li.id));
    }
    // Check if all received
    const lines = await db.select().from(poLineItems)
      .where(eq(poLineItems.purchaseOrderId, req.params.id as string));
    const allReceived = lines.every(l => l.receivedQuantity >= l.quantity);
    if (allReceived) {
      await db.update(purchaseOrders)
        .set({ status: "received" })
        .where(eq(purchaseOrders.id, req.params.id as string));
    }
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /purchase-orders/:id/receive error:", err);
    res.status(500).json({ error: "Failed to receive PO" });
  }
});

router.patch("/:id/close", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    await db.update(purchaseOrders)
      .set({ status: "closed" })
      .where(eq(purchaseOrders.id, req.params.id as string));
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /purchase-orders/:id/close error:", err);
    res.status(500).json({ error: "Failed to close PO" });
  }
});

export default router;