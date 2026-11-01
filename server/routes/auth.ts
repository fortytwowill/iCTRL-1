import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { user, organization, member, invitation } from '../db/schema';
import { requireAuth, AuthRequest } from '../lib/auth-middleware';

const router = Router();

// GET /api/auth/me - Get current user details with org context
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
 try {
 const userId = req.user!.id;
 const orgId = req.organizationId!;

 // Fetch user profile (simplified for now)
 const userProfile = await db.query.user.findFirst({
 where: eq(user.id, userId),
 });

 // Fetch current org
 const currentOrg = await db.query.organization.findFirst({
 where: eq(organization.id, orgId),
 });

 // Fetch membership
 const currentOrgUser = await db.query.member.findFirst({
 where: eq(member.userId, userId),
 });

 res.json({
 profile: {
 id: userProfile?.id,
 userId: userProfile?.id,
 displayName: userProfile?.name,
 labelFormat: null, // Placeholder
 isPlatformAdmin: false, // Placeholder
 },
 currentOrg,
 currentOrgUser: currentOrgUser ? {
 id: currentOrgUser.id,
 organizationId: currentOrgUser.organizationId,
 userId: currentOrgUser.userId,
 role: currentOrgUser.role,
 createdAt: currentOrgUser.createdAt,
 updatedAt: new Date(), // Placeholder
 } : null,
 });
 } catch (error) {
 console.error('Error fetching /me:', error);
 res.status(500).json({ error: 'Failed to fetch user details' });
 }
});

// PATCH /api/auth/profile - Update user profile
router.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
 try {
 const userId = req.user!.id;
 const updates = req.body;

 // For now, we only support updating name/image in the user table
 const updatedUser = await db.update(user)
 .set({
 name: updates.displayName || undefined,
 image: updates.image || undefined,
 })
 .where(eq(user.id, userId))
 .returning();

 res.json({
 profile: {
 id: updatedUser[0].id,
 userId: updatedUser[0].id,
 displayName: updatedUser[0].name,
 labelFormat: null,
 isPlatformAdmin: false,
 },
 });
 } catch (error) {
 console.error('Error updating profile:', error);
 res.status(500).json({ error: 'Failed to update profile' });
 }
});

// POST /api/auth/invitations/accept - Accept an invitation
router.post('/invitations/accept', requireAuth, async (req: AuthRequest, res) => {
 try {
 const { token } = req.body;
 const userId = req.user!.id;

 // Find invitation by ID (token is the invitation ID in better-auth)
 const invite = await db.query.invitation.findFirst({
 where: eq(invitation.id, token),
 });

 if (!invite) {
 return res.status(404).json({ error: 'Invitation not found' });
 }

 if (invite.status !== 'pending') {
 return res.status(400).json({ error: 'Invitation already used or expired' });
 }

 if (new Date(invite.expiresAt) < new Date()) {
 return res.status(400).json({ error: 'Invitation expired' });
 }

 // Add user to organization
 await db.insert(member).values({
 id: crypto.randomUUID(),
 organizationId: invite.organizationId,
 userId: userId,
 role: invite.role || 'member',
 createdAt: new Date(),
 });

 // Mark invitation as accepted
 await db.update(invitation)
 .set({ status: 'accepted' })
 .where(eq(invitation.id, token));

 res.json({ message: 'Invitation accepted' });
 } catch (error) {
 console.error('Error accepting invitation:', error);
 res.status(500).json({ error: 'Failed to accept invitation' });
 }
});

export default router;