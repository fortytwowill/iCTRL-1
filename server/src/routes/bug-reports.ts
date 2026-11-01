import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { bugReports } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, screenshotUrl } = req.body;
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [report] = await db.insert(bugReports).values({
      id: crypto.randomUUID(),
      title,
      description: description ?? null,
      screenshotUrl: screenshotUrl ?? null,
      reportedBy: req.userId!,
      status: "open",
    }).returning();
    res.status(201).json(report);
  } catch (err) {
    console.error("POST /bug-reports error:", err);
    res.status(500).json({ error: "Failed to submit bug report" });
  }
});

router.get("/", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const result = await db
      .select()
      .from(bugReports)
      .orderBy(bugReports.createdAt);
    res.json(result);
  } catch (err) {
    console.error("GET /bug-reports error:", err);
    res.status(500).json({ error: "Failed to fetch bug reports" });
  }
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const [updated] = await db.update(bugReports)
      .set({ status, updatedAt: new Date() })
      .where(eq(bugReports.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Bug report not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("PATCH /bug-reports/:id error:", err);
    res.status(500).json({ error: "Failed to update bug report" });
  }
});

export default router;