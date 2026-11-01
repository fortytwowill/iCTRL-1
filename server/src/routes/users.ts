import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { member, user as userTable } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAuth, requireOrg } from "../middleware/auth.js";

const router = Router();

// GET /api/users — list org members
router.get("/", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select({
        id: member.id,
        userId: member.userId,
        role: member.role,
        email: userTable.email,
        name: userTable.name,
      })
      .from(member)
      .leftJoin(userTable, eq(member.userId, userTable.id))
      .where(eq(member.organizationId, req.organizationId!));
    res.json(result);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH /api/users/:userId/role — update role
router.patch("/:userId/role", requireAuth, requireOrg, async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    await db
      .update(member)
      .set({ role, updatedAt: new Date() })
      .where(and(eq(member.organizationId, req.organizationId!), eq(member.userId, req.params.userId)));
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /users/role error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;