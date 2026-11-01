import { useState } from "react";
import { Modal, TextInput, Button, Text, Stack, Group } from "@mantine/core";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmWord?: string;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmWord = "DELETE",
  loading = false,
}: ConfirmDeleteDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const isValid = inputValue.trim() === confirmWord;

  const handleConfirm = () => {
    if (isValid && !loading) {
      onConfirm();
      setInputValue("");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setInputValue("");
  };

  return (
    <Modal opened={open} onClose={handleClose} title={title} size={425}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {description}
        </Text>
        <Text size="sm" c="dimmed">
          Type <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{confirmWord}</span> to confirm this action.
        </Text>
        <TextInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Type "${confirmWord}"`}
          autoComplete="off"
          autoFocus
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm} disabled={!isValid || loading}>
            {loading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}