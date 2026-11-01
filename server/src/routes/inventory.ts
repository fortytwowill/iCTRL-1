import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { items, transactionLogs, vendors, locations } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

// GET /api/inventory/items — list all items for current org
router.get("/items", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select({
        id: items.id,
        itemCode: items.itemCode,
        description: items.description,
        category: items.category,
        amount: items.amount,
        unitValue: items.unitValue,
        initialQuantity: items.initialQuantity,
        restockLevel: items.restockLevel,
        optimalInventory: items.optimalInventory,
        abcCurve: items.abcCurve,
        vendorId: items.vendorId,
        vendorCode: items.vendorCode,
        locationId: items.locationId,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        vendorName: vendors.name,
        locationName: locations.name,
      })
      .from(items)
      .leftJoin(vendors, eq(items.vendorId, vendors.id))
      .leftJoin(locations, eq(items.locationId, locations.id))
      .where(eq(items.organizationId, req.organizationId!))
      .orderBy(items.itemCode);

    res.json(result);
  } catch (err) {
    console.error("GET /items error:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST /api/inventory/items — create item + log initial stock
router.post("/items", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const {
      itemCode, description, category, amount, unitValue,
      initialQuantity, restockLevel, optimalInventory, abcCurve,
      vendorId, vendorCode, locationId,
    } = req.body;

    const [item] = await db.insert(items).values({
      id: crypto.randomUUID(),
      itemCode,
      description,
      category: category ?? null,
      amount: amount ?? 0,
      unitValue: unitValue ?? null,
      initialQuantity: initialQuantity ?? null,
      restockLevel: restockLevel ?? null,
      optimalInventory: optimalInventory ?? null,
      abcCurve: abcCurve ?? null,
      vendorId: vendorId ?? null,
      vendorCode: vendorCode ?? null,
      locationId: locationId ?? null,
      organizationId: req.organizationId!,
    }).returning();

    // Log initial stock entry
    if (amount && amount > 0) {
      await db.insert(transactionLogs).values({
        id: crypto.randomUUID(),
        itemCode: item.itemCode,
        quantity: amount,
        transactionType: "initial_stock",
        entryType: "added_item",
        userId: req.userId!,
        projectId: null,
      });
    }

    res.status(201).json(item);
  } catch (err) {
    console.error("POST /items error:", err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PATCH /api/inventory/items/:itemCode — update item
router.patch("/items/:itemCode", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const itemCode = req.params.itemCode as string;
    const updates = req.body;

    // Verify item belongs to org
    const [existing] = await db
      .select()
      .from(items)
      .where(and(eq(items.itemCode, itemCode), eq(items.organizationId, req.organizationId!)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const allowedFields = [
      "description", "category", "amount", "unitValue", "restockLevel",
      "optimalInventory", "abcCurve", "vendorId", "vendorCode", "locationId",
    ];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) filteredUpdates[key] = updates[key];
    }
    filteredUpdates.updatedAt = new Date();

    const [updated] = await db
      .update(items)
      .set(filteredUpdates)
      .where(eq(items.itemCode, itemCode))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error("PATCH /items/:itemCode error:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/inventory/items/:itemCode
router.delete("/items/:itemCode", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const itemCode = req.params.itemCode as string;

    const [existing] = await db
      .select()
      .from(items)
      .where(and(eq(items.itemCode, itemCode), eq(items.organizationId, req.organizationId!)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    await db.delete(items).where(eq(items.itemCode, itemCode));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /items/:itemCode error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// POST /api/inventory/restock — restock item + log transaction
router.post("/restock", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { itemCode, quantity, restockLevel } = req.body;

    const [existing] = await db
      .select()
      .from(items)
      .where(and(eq(items.itemCode, itemCode), eq(items.organizationId, req.organizationId!)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const newAmount = existing.amount + quantity;
    const updates: Record<string, unknown> = { amount: newAmount, updatedAt: new Date() };
    if (restockLevel !== undefined) updates.restockLevel = restockLevel;

    await db.update(items).set(updates).where(eq(items.itemCode, itemCode));

    await db.insert(transactionLogs).values({
      id: crypto.randomUUID(),
      itemCode,
      quantity,
      transactionType: "restock",
      entryType: "restock",
      userId: req.userId!,
      projectId: null,
    });

    res.json({ amount: newAmount });
  } catch (err) {
    console.error("POST /restock error:", err);
    res.status(500).json({ error: "Failed to restock" });
  }
});

export default router;