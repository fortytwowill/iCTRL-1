import type { Request, Response, NextFunction } from "express";
import { auth } from "../auth/index.js";

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
  role?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    });

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.userId = session.user.id;
    req.organizationId = session.session.activeOrganizationId ?? undefined;
    req.role = session.user.role ?? "user";
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireOrg(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.organizationId) {
    res.status(400).json({ error: "No active organization" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}