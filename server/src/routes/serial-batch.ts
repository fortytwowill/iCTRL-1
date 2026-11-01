import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { serialNumbers, batchLots, items } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

// Serial Numbers
router.get("/serials", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select({
        id: serialNumbers.id,
        itemId: serialNumbers.itemId,
        serialNumber: serialNumbers.serialNumber,
        status: serialNumbers.status,
        assignedTo: serialNumbers.assignedTo,
        createdAt: serialNumbers.createdAt,
        updatedAt: serialNumbers.updatedAt,
        itemCode: items.itemCode,
      })
      .from(serialNumbers)
      .leftJoin(items, eq(serialNumbers.itemId, items.id))
      .where(eq(items.organizationId, req.organizationId!))
      .orderBy(serialNumbers.createdAt);
    res.json(result);
  } catch (err) {
    console.error("GET /serials error:", err);
    res.status(500).json({ error: "Failed to fetch serial numbers" });
  }
});

router.post("/serials", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { itemCode, serialNumber } = req.body;
    // Resolve itemCode → itemId within org
    const [item] = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.itemCode, itemCode), eq(items.organizationId, req.organizationId!)))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }

    const [serial] = await db.insert(serialNumbers).values({
      id: crypto.randomUUID(),
      itemId: item.id,
      serialNumber,
      status: "available",
    }).returning();
    res.status(201).json(serial);
  } catch (err) {
    console.error("POST /serials error:", err);
    res.status(500).json({ error: "Failed to create serial number" });
  }
});

router.patch("/serials/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status, assignedTo } = req.body;
    // Verify ownership via item join
    const [existing] = await db
      .select({ id: serialNumbers.id })
      .from(serialNumbers)
      .leftJoin(items, eq(serialNumbers.itemId, items.id))
      .where(and(eq(serialNumbers.id, id), eq(items.organizationId, req.organizationId!)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: "Serial not found" }); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    const [updated] = await db.update(serialNumbers)
      .set(updates)
      .where(eq(serialNumbers.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error("PATCH /serials/:id error:", err);
    res.status(500).json({ error: "Failed to update serial" });
  }
});

// Batch Lots
router.get("/batches", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select({
        id: batchLots.id,
        itemId: batchLots.itemId,
        batchNumber: batchLots.batchNumber,
        quantity: batchLots.quantity,
        expiryDate: batchLots.expiryDate,
        receivedAt: batchLots.receivedAt,
        createdAt: batchLots.createdAt,
        updatedAt: batchLots.updatedAt,
        itemCode: items.itemCode,
      })
      .from(batchLots)
      .leftJoin(items, eq(batchLots.itemId, items.id))
      .where(eq(items.organizationId, req.organizationId!))
      .orderBy(batchLots.createdAt);
    res.json(result);
  } catch (err) {
    console.error("GET /batches error:", err);
    res.status(500).json({ error: "Failed to fetch batch lots" });
  }
});

router.post("/batches", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { itemCode, batchNumber, quantity, expiryDate } = req.body;
    const [item] = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.itemCode, itemCode), eq(items.organizationId, req.organizationId!)))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }

    const [batch] = await db.insert(batchLots).values({
      id: crypto.randomUUID(),
      itemId: item.id,
      batchNumber,
      quantity: quantity ?? 0,
      expiryDate: expiryDate ?? null,
    }).returning();
    res.status(201).json(batch);
  } catch (err) {
    console.error("POST /batches error:", err);
    res.status(500).json({ error: "Failed to create batch lot" });
  }
});

export default router;