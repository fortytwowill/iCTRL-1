import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { locations } from '../db/schema';
import { requireAuth, AuthRequest } from '../lib/auth-middleware';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
 try {
 const result = await db.query.locations.findMany({
 where: eq(locations.organizationId, req.organizationId!),
 });
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch locations' });
 }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
 try {
 const newLocation = await db.insert(locations).values({
 ...req.body,
 organizationId: req.organizationId!,
 }).returning();
 res.status(201).json(newLocation[0]);
 } catch (error) {
 res.status(500).json({ error: 'Failed to create location' });
 }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
 try {
 const updated = await db.update(locations)
 .set(req.body)
 .where(and(eq(locations.id, req.params.id), eq(locations.organizationId, req.organizationId!)))
 .returning();
 if (!updated.length) return res.status(404).json({ error: 'Not found' });
 res.json(updated[0]);
 } catch (error) {
 res.status(500).json({ error: 'Failed to update location' });
 }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
 try {
 const deleted = await db.delete(locations)
 .where(and(eq(locations.id, req.params.id), eq(locations.organizationId, req.organizationId!)))
 .returning();
 if (!deleted.length) return res.status(404).json({ error: 'Not found' });
 res.json({ message: 'Deleted' });
 } catch (error) {
 res.status(500).json({ error: 'Failed to delete location' });
 }
});

export default router;