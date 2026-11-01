import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { categories } from '../db/schema';
import { requireAuth, AuthRequest } from '../lib/auth-middleware';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
 try {
 const result = await db.query.categories.findMany({
 where: eq(categories.organizationId, req.organizationId!),
 });
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch categories' });
 }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
 try {
 const newCategory = await db.insert(categories).values({
 ...req.body,
 organizationId: req.organizationId!,
 }).returning();
 res.status(201).json(newCategory[0]);
 } catch (error) {
 res.status(500).json({ error: 'Failed to create category' });
 }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
 try {
 const updated = await db.update(categories)
 .set(req.body)
 .where(and(eq(categories.id, req.params.id), eq(categories.organizationId, req.organizationId!)))
 .returning();
 if (!updated.length) return res.status(404).json({ error: 'Not found' });
 res.json(updated[0]);
 } catch (error) {
 res.status(500).json({ error: 'Failed to update category' });
 }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
 try {
 const deleted = await db.delete(categories)
 .where(and(eq(categories.id, req.params.id), eq(categories.organizationId, req.organizationId!)))
 .returning();
 if (!deleted.length) return res.status(404).json({ error: 'Not found' });
 res.json({ message: 'Deleted' });
 } catch (error) {
 res.status(500).json({ error: 'Failed to delete category' });
 }
});

export default router;