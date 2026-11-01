import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { scheduledReports } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.organizationId, req.organizationId!))
      .orderBy(scheduledReports.createdAt);
    res.json(result);
  } catch (err) {
    console.error("GET /scheduled-reports error:", err);
    res.status(500).json({ error: "Failed to fetch scheduled reports" });
  }
});

router.post("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { name, reportType, schedule, recipients } = req.body;
    const [report] = await db.insert(scheduledReports).values({
      id: crypto.randomUUID(),
      organizationId: req.organizationId!,
      name,
      reportType,
      schedule,
      recipients: recipients ?? null,
      isActive: true,
    }).returning();
    res.status(201).json(report);
  } catch (err) {
    console.error("POST /scheduled-reports error:", err);
    res.status(500).json({ error: "Failed to create scheduled report" });
  }
});

router.patch("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;
    const [updated] = await db.update(scheduledReports)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(scheduledReports.id, id), eq(scheduledReports.organizationId, req.organizationId!)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Report not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("PATCH /scheduled-reports/:id error:", err);
    res.status(500).json({ error: "Failed to update scheduled report" });
  }
});

router.delete("/:id", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db.select().from(scheduledReports)
      .where(and(eq(scheduledReports.id, id), eq(scheduledReports.organizationId, req.organizationId!)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: "Report not found" }); return; }
    await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /scheduled-reports/:id error:", err);
    res.status(500).json({ error: "Failed to delete scheduled report" });
  }
});

export default router;