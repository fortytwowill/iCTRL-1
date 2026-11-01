import { useEffect, useMemo, useState } from "react";
import { Building2, Lock, Save, User as UserIcon } from "lucide-react";
import { Card, Button, TextInput, Text, Title, Stack, Group, Skeleton, Switch } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@/contexts/AuthContext";
import LabelFormatSettings from "@/components/profile/LabelFormatSettings";

function meetsPasswordRequirements(value: string) {
  return (
    value.length >= 10 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  );
}

export default function ProfileSettings() {
  const {
    profile,
    organizationName,
    isLoading,
    updateProfileName,
    changePassword,
  } = useAuth();

  const [nameValue, setNameValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setNameValue(profile?.full_name || "");
  }, [profile?.full_name]);

  const trimmedName = nameValue.trim();
  const canSaveName =
    !isLoading &&
    !isSavingName &&
    trimmedName.length > 0 &&
    trimmedName !== (profile?.full_name || "").trim();

  const passwordValidationMessage = useMemo(() => {
    if (!newPassword) return "";
    if (newPassword.length < 10) return "Password must be at least 10 characters.";
    if (!meetsPasswordRequirements(newPassword)) {
      return "Password must include at least one uppercase letter, one lowercase letter, and one number.";
    }
    if (currentPassword && currentPassword === newPassword) {
      return "New password must be different from current password.";
    }
    if (confirmPassword && confirmPassword !== newPassword) {
      return "Passwords do not match.";
    }
    return "";
  }, [confirmPassword, currentPassword, newPassword]);

  const canChangePassword =
    !isChangingPassword &&
    currentPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword === confirmPassword &&
    currentPassword !== newPassword &&
    meetsPasswordRequirements(newPassword);

  const handleSaveName = async () => {
    if (!canSaveName) return;

    setIsSavingName(true);
    try {
      const { error } = await updateProfileName(trimmedName);
      if (error) {
        notifications.show({ color: "red", title: "Error", message: error.message });
        return;
      }
      notifications.show({ color: "green", title: "Success", message: "Profile updated successfully." });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!canChangePassword) return;

    setIsChangingPassword(true);
    try {
      const { error } = await changePassword(currentPassword, newPassword);
      if (error) {
        notifications.show({ color: "red", title: "Error", message: error.message });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notifications.show({ color: "green", title: "Success", message: "Password updated successfully." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Profile Settings</Title>
        <Text c="dimmed">Manage your account profile and security settings.</Text>
      </div>

      {/* Notification Preferences */}
      <Card withBorder>
        <Card.Section withBorder p="md">
          <Group gap="xs">
            <UserIcon size={20} />
            <Text fw={600}>Notification Preferences</Text>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Configure how you receive inventory alerts and reports
          </Text>
        </Card.Section>
        <Stack gap="md" p="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>Low Stock Alerts</Text>
              <Text size="xs" c="dimmed">Receive notifications when items fall below reorder point</Text>
            </div>
            <Switch defaultChecked />
          </Group>
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>Scheduled Reports</Text>
              <Text size="xs" c="dimmed">Receive automated inventory summaries via email</Text>
            </div>
            <Switch defaultChecked />
          </Group>
        </Stack>
      </Card>

      <Card withBorder>
        <Card.Section withBorder p="md">
          <Group gap="xs">
            <Building2 size={20} />
            <Text fw={600}>Organization</Text>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>Your organization details</Text>
        </Card.Section>
        <Stack gap="md" p="md">
          {isLoading ? (
            <Skeleton height={36} />
          ) : (
            <TextInput
              label="Organization Name"
              value={organizationName || "No organization assigned"}
              readOnly
              disabled
            />
          )}
        </Stack>
      </Card>

      <Card withBorder>
        <Card.Section withBorder p="md">
          <Group gap="xs">
            <UserIcon size={20} />
            <Text fw={600}>Profile</Text>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>Update your display name</Text>
        </Card.Section>
        <Stack gap="md" p="md">
          {isLoading ? (
            <Skeleton height={36} />
          ) : (
            <>
              <TextInput
                label="User Name"
                value={nameValue}
                onChange={(event) => setNameValue(event.currentTarget.value)}
                placeholder="Your name"
              />
              <Group justify="flex-end">
                <Button onClick={handleSaveName} disabled={!canSaveName} leftSection={<Save size={16} />}>
                  {isSavingName ? "Saving..." : "Save Changes"}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>

      <Card withBorder>
        <Card.Section withBorder p="md">
          <Group gap="xs">
            <Lock size={20} />
            <Text fw={600}>Security</Text>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Passwords must be at least 10 characters and include at least one uppercase letter,
            one lowercase letter, and one number.
          </Text>
        </Card.Section>
        <Stack gap="md" p="md">
          <TextInput
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
            placeholder="Enter your current password"
          />
          <TextInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            placeholder="Enter a new password"
          />
          <TextInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            placeholder="Confirm your new password"
          />

          {passwordValidationMessage ? (
            <Text size="sm" c="red">{passwordValidationMessage}</Text>
          ) : (
            <Text size="sm" c="dimmed">
              Enter your current password before setting a new one.
            </Text>
          )}

          <Group justify="flex-end">
            <Button onClick={handleChangePassword} disabled={!canChangePassword} leftSection={<Lock size={16} />}>
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </Group>
        </Stack>
      </Card>

      <LabelFormatSettings />
    </Stack>
  );
}
