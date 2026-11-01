import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { items } from '../db/schema';
import { requireAuth, AuthRequest } from '../lib/auth-middleware';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
 try {
 const result = await db.query.items.findMany({
 where: eq(items.organizationId, req.organizationId!),
 });
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch items' });
 }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
 try {
 const newItem = await db.insert(items).values({
 ...req.body,
 organizationId: req.organizationId!,
 }).returning();
 res.status(201).json(newItem[0]);
 } catch (error) {
 res.status(500).json({ error: 'Failed to create item' });
 }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
 try {
 const updated = await db.update(items)
 .set(req.body)
 .where(and(eq(items.id, req.params.id), eq(items.organizationId, req.organizationId!)))
 .returning();
 if (!updated.length) return res.status(404).json({ error: 'Not found' });
 res.json(updated[0]);
 } catch (error) {
 res.status(500).json({ error: 'Failed to update item' });
 }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
 try {
 const deleted = await db.delete(items)
 .where(and(eq(items.id, req.params.id), eq(items.organizationId, req.organizationId!)))
 .returning();
 if (!deleted.length) return res.status(404).json({ error: 'Not found' });
 res.json({ message: 'Deleted' });
 } catch (error) {
 res.status(500).json({ error: 'Failed to delete item' });
 }
});

export default router;