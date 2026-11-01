import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select()
      .from(vendors)
      .where(eq(vendors.organizationId, req.organizationId!))
      .orderBy(vendors.name);
    res.json(result);
  } catch (err) {
    console.error("GET /vendors error:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.post("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { name, contactInfo } = req.body;
    const [vendor] = await db.insert(vendors).values({
      id: crypto.randomUUID(),
      name,
      contactInfo: contactInfo ?? null,
      organizationId: req.organizationId!,
    }).returning();
    res.status(201).json(vendor);
  } catch (err) {
    console.error("POST /vendors error:", err);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

router.patch("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db.select().from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.organizationId, req.organizationId!)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: "Vendor not found" }); return; }
    const { name, contactInfo } = req.body;
    const [updated] = await db.update(vendors)
      .set({ name, contactInfo, updatedAt: new Date() })
      .where(eq(vendors.id, id)).returning();
    res.json(updated);
  } catch (err) {
    console.error("PATCH /vendors/:id error:", err);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

router.delete("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db.select().from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.organizationId, req.organizationId!)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: "Vendor not found" }); return; }
    await db.delete(vendors).where(eq(vendors.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /vendors/:id error:", err);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

export default router;