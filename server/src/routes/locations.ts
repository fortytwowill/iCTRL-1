import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { locations } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db.select().from(locations).where(eq(locations.organizationId, req.organizationId!)).orderBy(locations.name);
    res.json(result);
  } catch (err) {
    console.error("GET /locations error:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

router.post("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const [loc] = await db.insert(locations).values({ ...req.body, organizationId: req.organizationId!, id: crypto.randomUUID() }).returning();
    res.status(201).json(loc);
  } catch (err) {
    console.error("POST /locations error:", err);
    res.status(500).json({ error: "Failed to create location" });
  }
});

router.patch("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const [updated] = await db.update(locations).set(req.body).where(eq(locations.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /locations error:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
});

router.delete("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    await db.delete(locations).where(eq(locations.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /locations error:", err);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;