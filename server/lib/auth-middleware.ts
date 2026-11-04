import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth';

export interface AuthRequest extends Request {
 user?: {
  id: string;
  email: string;
  name: string;
 };
 organizationId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
 const session = await auth.api.getSession({
  headers: req.headers as Record<string, string>,
 });

 if (!session?.user) {
  return res.status(401).json({ error: 'Unauthorized' });
 }

 req.user = session.user;
 req.organizationId = session.session?.activeOrganizationId;

 if (!req.organizationId) {
  return res.status(403).json({ error: 'No active organization' });
 }

 next();
}