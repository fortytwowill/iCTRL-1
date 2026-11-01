import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import { db } from "../db/index.js";

const serverUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error(
    "BETTER_AUTH_SECRET is required. Generate one with: openssl rand -base64 32",
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: serverUrl,
  secret,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // self-hosted: skip email verification by default
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "master_admin",
    }),
    admin({
      defaultRole: "user",
      roles: {
        platform_admin: { authorize: () => ({ success: true }), statements: {} },
        user: { authorize: () => ({ success: true }), statements: {} },
      },
    }),
  ],
  trustedOrigins: [serverUrl],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;