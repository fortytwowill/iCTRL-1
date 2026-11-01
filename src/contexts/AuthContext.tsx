import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { z } from "zod";
import { authClient } from "@/lib/authClient";
import { api } from "@/lib/api";

export type UserRole = "admin" | "user" | "master_admin" | "read_only";

export interface LabelFormatConfig {
 paperSize: "4x6" | "A4";
 orientation: "portrait" | "landscape";
 fontSize: number;
 includeLogo: boolean;
 includeBarcode: boolean;
}

export interface Profile {
 id: string;
 userId: string;
 displayName: string | null;
 labelFormat: LabelFormatConfig | null;
 isPlatformAdmin: boolean;
}

const orgRoleSchema = z.enum(["admin", "user", "master_admin", "read_only"]);

const labelFormatSchema = z.object({
 paperSize: z.enum(["4x6", "A4"]),
 orientation: z.enum(["portrait", "landscape"]),
 fontSize: z.number(),
 includeLogo: z.boolean(),
 includeBarcode: z.boolean(),
});

function isLabelFormatConfig(value: unknown): value is LabelFormatConfig {
 return labelFormatSchema.safeParse(value).success;
}

export interface OrganizationUser {
 id: string;
 organizationId: string;
 userId: string;
 role: UserRole;
 createdAt: Date;
 updatedAt: Date;
}

export interface AuthContextType {
 user: any | null;
 session: any | null;
 profile: Profile | null;
 currentOrg: any | null;
 currentOrgUser: OrganizationUser | null;
 isLoading: boolean;
 signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
 signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
 signOut: () => Promise<void>;
 updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
 acceptInvitation: (token: string) => Promise<{ error: Error | null }>;
 canWrite: boolean;
 isAdmin: boolean;
 isPlatformAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<any | null>(null);
 const [session, setSession] = useState<any | null>(null);
 const [profile, setProfile] = useState<Profile | null>(null);
 const [currentOrg, setCurrentOrg] = useState<any | null>(null);
 const [currentOrgUser, setCurrentOrgUser] = useState<OrganizationUser | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 const loadSession = useCallback(async () => {
 try {
 const { data } = await authClient.getSession();
 if (data?.session) {
 setSession(data.session);
 setUser(data.user);
 // Fetch org/user details from our API
 try {
 const me = await api.auth.me();
 setProfile(me.profile);
 setCurrentOrg(me.currentOrg);
 setCurrentOrgUser(me.currentOrgUser);
 } catch (e) {
 console.error("Failed to fetch user details", e);
 }
 } else {
 setSession(null);
 setUser(null);
 setProfile(null);
 setCurrentOrg(null);
 setCurrentOrgUser(null);
 }
 } catch (e) {
 console.error("Failed to load session", e);
 } finally {
 setIsLoading(false);
 }
 }, []);

 useEffect(() => {
 loadSession();
 }, [loadSession]);

 const signIn = useCallback(async (email: string, password: string) => {
 try {
 await authClient.signIn.email({ email, password });
 await loadSession();
 return { error: null };
 } catch (e: any) {
 return { error: e };
 }
 }, [loadSession]);

 const signUp = useCallback(async (email: string, password: string, name: string) => {
 try {
 await authClient.signUp.email({ email, password, name });
 await loadSession();
 return { error: null };
 } catch (e: any) {
 return { error: e };
 }
 }, [loadSession]);

 const signOut = useCallback(async () => {
 await authClient.signOut();
 setUser(null);
 setSession(null);
 setProfile(null);
 setCurrentOrg(null);
 setCurrentOrgUser(null);
 }, []);

 const updateProfile = useCallback(async (updates: Partial<Profile>) => {
 try {
 const updated = await api.auth.updateProfile(updates);
 setProfile(updated.profile);
 return { error: null };
 } catch (e: any) {
 return { error: e };
 }
 }, []);

 const acceptInvitation = useCallback(async (token: string) => {
 try {
 await api.auth.acceptInvitation(token);
 await loadSession();
 return { error: null };
 } catch (e: any) {
 return { error: e };
 }
 }, [loadSession]);

 const canWrite = currentOrgUser?.role !== "read_only";
 const isAdmin = currentOrgUser?.role === "admin" || currentOrgUser?.role === "master_admin";
 const isPlatformAdmin = profile?.isPlatformAdmin || false;

 return (
 <AuthContext.Provider
 value={{
 user,
 session,
 profile,
 currentOrg,
 currentOrgUser,
 isLoading,
 signIn,
 signUp,
 signOut,
 updateProfile,
 acceptInvitation,
 canWrite,
 isAdmin,
 isPlatformAdmin,
 }}
 >
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 const context = useContext(AuthContext);
 if (context === undefined) {
 throw new Error("useAuth must be used within an AuthProvider");
 }
 return context;
}