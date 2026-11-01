import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db.select().from(categories).where(eq(categories.organizationId, req.organizationId!)).orderBy(categories.name);
    res.json(result);
  } catch (err) {
    console.error("GET /categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const [cat] = await db.insert(categories).values({ ...req.body, organizationId: req.organizationId!, id: crypto.randomUUID() }).returning();
    res.status(201).json(cat);
  } catch (err) {
    console.error("POST /categories error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const [updated] = await db.update(categories).set(req.body).where(eq(categories.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /categories error:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    await db.delete(categories).where(eq(categories.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /categories error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;