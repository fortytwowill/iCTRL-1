import { useState, useEffect, useMemo } from "react";
import { Users, Crown, Shield, User, Loader2, AlertCircle, Mail, X, Clock, Trash2 } from "lucide-react";
import { useAuth, OrganizationUser, UserRole } from "@/contexts/AuthContext";
import { Button, Card, Select, Badge, Skeleton, TextInput, Modal, Group, Stack, Text, Divider, Alert, Avatar, ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
 DEFAULT_PAGE_SIZE,
 PageNavigation,
 PageSizeSelector,
} from "@/components/common/ListPaginationControls";
import { useCanWrite } from "@/hooks/useCanWrite";

const roleLabels: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
 master_admin: { label: "Master Admin", icon: <Crown className="h-3 w-3" />, color: "bg-amber-500" },
 admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, color: "bg-blue-500" },
 user: { label: "User", icon: <User className="h-3 w-3" />, color: "bg-green-500" },
 read_only: { label: "Read Only", icon: <Clock className="h-3 w-3" />, color: "bg-gray-500" },
};

const editableRoles: UserRole[] = ["admin", "user", "read_only"];

interface Invitation {
 id: string;
 email: string;
 role: string;
 status: string;
 expires_at: string;
 created_at: string;
 invited_by_name: string | null;
}

export default function UserManagement() {
 const { fetchOrganizationUsers, updateUserRole, removeUser, user, isMasterAdmin, inviteUser, fetchOrganizationInvitations, deleteInvitation } = useAuth();
 const { canWrite } = useCanWrite();
 const [users, setUsers] = useState<OrganizationUser[]>([]);
 const [invitations, setInvitations] = useState<Invitation[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [updatingId, setUpdatingId] = useState<string | null>(null);
 const [removingId, setRemovingId] = useState<string | null>(null);
 
 // Invitation dialog state
 const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
 const [inviteEmail, setInviteEmail] = useState("");
 const [inviteRole, setInviteRole] = useState<UserRole>("read_only");
 const [isInviting, setIsInviting] = useState(false);
 const [userLimitReached, setUserLimitReached] = useState(false);
 const [userLimitMessage, setUserLimitMessage] = useState<string | null>(null);
 const [usersPage, setUsersPage] = useState(1);
 const [usersPageSize, setUsersPageSize] = useState(DEFAULT_PAGE_SIZE);
 const [invitationsPage, setInvitationsPage] = useState(1);
 const [invitationsPageSize, setInvitationsPageSize] = useState(DEFAULT_PAGE_SIZE);

 const pendingInvitationEmails = useMemo(() => {
 return new Set(
 invitations
 .filter((invitation) => invitation.status.trim().toLowerCase() === "pending")
 .map((invitation) => invitation.email.trim().toLowerCase())
 );
 }, [invitations]);

 const visibleUsers = useMemo(() => {
 return users.filter((orgUser) => !pendingInvitationEmails.has(orgUser.email.trim().toLowerCase()));
 }, [users, pendingInvitationEmails]);

 const totalUsers = visibleUsers.length;
 const userTotalPages = Math.max(1, Math.ceil(totalUsers / usersPageSize));
 const paginatedUsers = useMemo(() => {
 const start = (usersPage - 1) * usersPageSize;
 return visibleUsers.slice(start, start + usersPageSize);
 }, [visibleUsers, usersPage, usersPageSize]);

 const totalInvitations = invitations.length;
 const invitationTotalPages = Math.max(1, Math.ceil(totalInvitations / invitationsPageSize));
 const paginatedInvitations = useMemo(() => {
 const start = (invitationsPage - 1) * invitationsPageSize;
 return invitations.slice(start, start + invitationsPageSize);
 }, [invitations, invitationsPage, invitationsPageSize]);

 useEffect(() => {
 loadUsersAndLimits();
 loadInvitationsAndLimits();
 }, []);

 useEffect(() => {
 setUsersPage((prev) => Math.min(prev, userTotalPages));
 }, [userTotalPages]);

 useEffect(() => {
 setInvitationsPage((prev) => Math.min(prev, invitationTotalPages));
 }, [invitationTotalPages]);

 const refreshUserLimit = async () => {
 try {
 setUserLimitReached(reached);
 if (reached) {
 const seatsUsed = snapshot.currentUsers + snapshot.pendingInvitations;
 setUserLimitMessage(
 `Plan user limit reached (${seatsUsed}/${snapshot.maxUsers}: ${snapshot.currentUsers} active + ${snapshot.pendingInvitations} pending). Upgrade your plan to invite more users.`
 );
 } else {
 setUserLimitMessage(null);
 }
 } catch {
 // Keep UI usable even if limit lookup fails.
 setUserLimitReached(false);
 setUserLimitMessage(null);
 }
 };

 const loadUsers = async () => {
 setIsLoading(true);
 const data = await fetchOrganizationUsers();
 setUsers(data);
 setIsLoading(false);
 };

 const loadUsersAndLimits = async () => {
 await loadUsers();
 await refreshUserLimit();
 };

 const loadInvitations = async () => {
 const data = await fetchOrganizationInvitations();
 setInvitations(data);
 };

 const loadInvitationsAndLimits = async () => {
 await loadInvitations();
 await refreshUserLimit();
 };

 const handleInvite = async () => {
 if (!inviteEmail.trim()) {
 notifications.show({ title: "Error", message: "Please enter an email address", color: "red" });
 return;
 }

 if (userLimitReached) {
 notifications.show({ title: "Plan limit reached", message: userLimitMessage || "You have reached your user limit for this plan. Upgrade to invite more users.", color: "red" });
 return;
 }
 
 setIsInviting(true);
 const { error, code } = await inviteUser(inviteEmail, inviteRole);
 
 if (code === "already_pending") {
 notifications.show({ title: "Invitation Already Pending", message: `An invitation is already pending for ${inviteEmail}.` });
 setInviteDialogOpen(false);
 await loadInvitationsAndLimits();
 } else if (code === "email_failed") {
 notifications.show({ title: "Invitation Saved — Email Delivery Failed", message: `The invitation for ${inviteEmail} was saved but the email could not be sent. It will appear in Pending Invitations.` });
 setInviteEmail("");
 setInviteRole("read_only");
 setInviteDialogOpen(false);
 await loadInvitationsAndLimits();
 } else if (error) {
 notifications.show({ title: "Error", message: error.message, color: "red" });
 } else {
 notifications.show({ title: "Invitation Sent", message: `Invitation email sent to ${inviteEmail}. In development mode, check Supabase Dashboard → Email → Inbucket to view the email.` });
 setInviteEmail("");
 setInviteRole("read_only");
 setInviteDialogOpen(false);
 await loadInvitationsAndLimits();
 }
 
 setIsInviting(false);
 };

 const handleCancelInvitation = async (invitationId: string) => {
 const { error } = await deleteInvitation(invitationId);
 
 if (error) {
 notifications.show({ title: "Error", message: error.message, color: "red" });
 } else {
 notifications.show({ title: "Success", message: "Invitation cancelled successfully" });
 await loadInvitations();
 await refreshUserLimit();
 }
 };

 const handleRoleChange = async (userId: string, newRole: UserRole) => {
 setUpdatingId(userId);
 const { error } = await updateUserRole(userId, newRole);
 
 if (error) {
 notifications.show({ title: "Error", message: error.message, color: "red" });
 } else {
 notifications.show({ title: "Success", message: "User role updated successfully" });
 await loadUsersAndLimits();
 }
 
 setUpdatingId(null);
 };

 const handleRemoveUser = async (orgUser: OrganizationUser) => {
 if (orgUser.id === user?.id) {
 notifications.show({ title: "Action blocked", message: "You cannot remove your own account.", color: "red" });
 return;
 }

 const confirmed = window.confirm(
 `Remove ${orgUser.full_name || orgUser.email} from the organization?\n\nThis will permanently delete their access account.`
 );
 if (!confirmed) return;

 setRemovingId(orgUser.id);
 const { error } = await removeUser(orgUser.id);

 if (error) {
 notifications.show({ title: "Error", message: error.message, color: "red" });
 } else {
 notifications.show({ title: "User removed", message: `${orgUser.email} has been removed.` });
 await loadUsers();
 }

 setRemovingId(null);
 };

 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleDateString("en-US", {
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 };

 if (!isMasterAdmin) {
 return (
 <Card className="glass-card">
 <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
 <AlertCircle className="h-5 w-5 text-muted-foreground" />
 <p className="text-sm text-muted-foreground">
 You need to be a Master Admin to manage user roles.
 </p>
 </div>
 </Card>
 );
 }

 return (
 <Card className="glass-card">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-6 pb-0">
 <div className="flex items-center gap-2">
 <Users className="h-5 w-5 text-primary" />
 <Text fw={700} size="lg">User Management</Text>
 </div>
 <Button size="sm" className="w-full sm:w-auto" disabled={userLimitReached || !canWrite} onClick={() => setInviteDialogOpen(true)}>
 <Mail className="h-4 w-4 mr-2" />
 Invite User
 </Button>
 </div>
 <div className="px-6 pb-6">
 <Text size="sm" c="dimmed">
 Manage users in your organization. Master Admin is reserved for the organization owner and cannot be reassigned.
 </Text>
 </div>
 <Divider />
 <div className="p-6 space-y-6">
 {userLimitReached && (
 <Alert icon={<AlertCircle className="h-4 w-4 shrink-0" />} color="red" variant="light">
 {userLimitMessage}
 </Alert>
 )}

 {/* Pending Invitations Section */}
 {invitations.length > 0 && (
 <div className="space-y-3">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <Text size="sm" fw={500} c="dimmed">Pending Invitations</Text>
 <PageSizeSelector
 pageSize={invitationsPageSize}
 onPageSizeChange={(size) => {
 setInvitationsPageSize(size);
 setInvitationsPage(1);
 }}
 className="justify-end"
 />
 </div>
 {paginatedInvitations.map((invitation) => (
 <div
 key={invitation.id}
 className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
 >
 <div className="flex min-w-0 items-center gap-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
 <Mail className="h-4 w-4 text-yellow-500" />
 </div>
 <div className="min-w-0">
 <p className="font-medium text-sm break-all">{invitation.email}</p>
 <p className="text-xs text-muted-foreground">
 Role: {roleLabels[invitation.role as UserRole]?.label || invitation.role} • 
 Expires: {formatDate(invitation.expires_at)}
 </p>
 </div>
 </div>
 <ActionIcon
 variant="subtle"
 color="gray"
 onClick={() => handleCancelInvitation(invitation.id)}
 title="Cancel invitation"
 disabled={!canWrite}
 >
 <X className="h-4 w-4" />
 </ActionIcon>
 </div>
 ))}
 <PageNavigation
 totalItems={totalInvitations}
 page={invitationsPage}
 pageSize={invitationsPageSize}
 onPageChange={setInvitationsPage}
 itemLabel="invitations"
 />
 </div>
 )}
 
 {/* Users List Section */}
 <div className="space-y-3">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <Text size="sm" fw={500} c="dimmed">Organization Users</Text>
 <PageSizeSelector
 pageSize={usersPageSize}
 onPageSizeChange={(size) => {
 setUsersPageSize(size);
 setUsersPage(1);
 }}
 className="justify-end"
 />
 </div>
 {isLoading ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-20 w-full" />
 ))}
 </div>
 ) : visibleUsers.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 No users found in your organization.
 </div>
 ) : (
 <div className="space-y-3">
 {paginatedUsers.map((orgUser) => {
 const isCurrentUser = orgUser.id === user?.id;
 const roleInfo = roleLabels[orgUser.role];
 const canEditRole = !isCurrentUser && orgUser.role !== "master_admin";
 
 return (
 <div
 key={orgUser.id}
 className="flex flex-col gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors sm:flex-row sm:items-start sm:justify-between"
 >
 <div className="flex min-w-0 items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
 {roleInfo.icon}
 </div>
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <p className="font-medium break-words">
 {orgUser.full_name || "Unknown"}
 </p>
 {isCurrentUser && (
 <Badge variant="outline" size="xs">
 You
 </Badge>
 )}
 </div>
 <p className="text-sm text-muted-foreground break-all">
 {orgUser.email}
 </p>
 <p className="text-xs text-muted-foreground">
 Joined {formatDate(orgUser.created_at)}
 </p>
 </div>
 </div>
 
 <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
 <Badge className={`${roleInfo.color} w-fit text-white`}>
 {roleInfo.icon}
 <span className="ml-1">{roleInfo.label}</span>
 </Badge>
 
 {canEditRole && (
 <>
 <Select
 value={orgUser.role}
 onChange={(value) => handleRoleChange(orgUser.id, value as UserRole)}
 disabled={updatingId === orgUser.id || removingId === orgUser.id || !canWrite}
 className="w-full sm:w-32"
 data={editableRoles.map((role) => ({
 value: role,
 label: roleLabels[role].label,
 }))}
 />
 <Button
 variant="light"
 color="red"
 size="xs"
 className="w-full sm:w-auto"
 onClick={() => handleRemoveUser(orgUser)}
 disabled={removingId === orgUser.id || updatingId === orgUser.id || !canWrite}
 >
 {removingId === orgUser.id ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="h-4 w-4" />
 )}
 Remove
 </Button>
 </>
 )}
 </div>
 </div>
 );
 })}
 <PageNavigation
 totalItems={totalUsers}
 page={usersPage}
 pageSize={usersPageSize}
 onPageChange={setUsersPage}
 itemLabel="users"
 />
 </div>
 )}
 </div>
 </div>
 
 <Modal opened={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} title="Invite New User">
 <Stack gap="md">
 <TextInput
 label="Email Address"
 placeholder="user@example.com"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 disabled={isInviting}
 />
 <div className="space-y-2">
 <Text size="sm" fw={500}>Initial Role</Text>
 <Select
 value={inviteRole}
 onChange={(value) => setInviteRole(value as UserRole)}
 disabled={isInviting}
 data={[
 { value: "read_only", label: "Read Only (can view only)" },
 { value: "user", label: "User (can checkout items)" },
 { value: "admin", label: "Admin" },
 ]}
 />
 <p className="text-xs text-muted-foreground">
 The selected role will be applied automatically when the invited user completes signup.
 </p>
 </div>
 <Group justify="end">
 <Button variant="default" onClick={() => setInviteDialogOpen(false)} disabled={isInviting}>
 Cancel
 </Button>
 <Button onClick={handleInvite} loading={isInviting}>
 Send Invitation
 </Button>
 </Group>
 </Stack>
 </Modal>
 </Card>
 );
}
