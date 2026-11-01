import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

// GET /api/settings — get all settings for current org as key-value map
router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.organizationId, req.organizationId!));

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    res.json(result);
  } catch (err) {
    console.error("GET /settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/settings — upsert multiple settings at once
router.put("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const entries = Object.entries(req.body as Record<string, unknown>);
    const results = [];

    for (const [key, value] of entries) {
      const [existing] = await db
        .select({ id: settings.id })
        .from(settings)
        .where(and(eq(settings.organizationId, req.organizationId!), eq(settings.key, key)))
        .limit(1);

      let row;
      if (existing) {
        [row] = await db.update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.id, existing.id))
          .returning();
      } else {
        [row] = await db.insert(settings).values({
          id: crypto.randomUUID(),
          organizationId: req.organizationId!,
          key,
          value,
        }).returning();
      }
      results.push(row);
    }

    res.json(results);
  } catch (err) {
    console.error("PUT /settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;