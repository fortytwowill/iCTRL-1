import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/projects
router.get("/", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const result = await db
      .select()
      .from(projects)
      .orderBy(projects.projectName);
    res.json(result);
  } catch (err) {
    console.error("GET /projects error:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST /api/projects
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectName, isActive } = req.body;
    const [project] = await db
      .insert(projects)
      .values({
        projectId: crypto.randomUUID(),
        projectName,
        isActive: isActive ?? true,
      })
      .returning();
    res.status(201).json(project);
  } catch (err) {
    console.error("POST /projects error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PATCH /api/projects/:id
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const [updated] = await db
      .update(projects)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(projects.projectId, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("PATCH /projects/:id error:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

export default router;