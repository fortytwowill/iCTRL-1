import { useState } from "react";
import { Bug, Loader2, Paperclip } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { Button, Modal, TextInput, Textarea, FileInput, Group, Stack } from "@mantine/core";
import { useAuth } from "@/contexts/AuthContext";

interface BugReportDialogProps {
 open: boolean;
 onClose: () => void;
}

export function BugReportDialog({ open, onClose }: BugReportDialogProps) {
 const { user } = useAuth();
 const [description, setDescription] = useState("");
 const [file, setFile] = useState<File | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!description.trim()) return;

 setIsSubmitting(true);
 try {
 const formData = new FormData();
 formData.append("description", description);
 if (file) formData.append("screenshot", file);
 if (user) formData.append("userId", user.id);

 const res = await fetch("/api/bug-reports", {
 method: "POST",
 body: formData,
 });

 if (!res.ok) throw new Error("Failed to submit report");

 notifications.show({
 title: "Report Submitted",
 message: "Thank you for helping us improve iCTRL.",
 color: "green",
 });

 setDescription("");
 setFile(null);
 onClose();
 } catch (error) {
 notifications.show({
 title: "Submission Failed",
 message: "Please try again later.",
 color: "red",
 });
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <Modal opened={open} onClose={onClose} title={<Group><Bug size={20} /> Report a Bug</Group>} size="lg">
 <form onSubmit={handleSubmit}>
 <Stack>
 <Textarea
 label="Description"
 placeholder="Describe what happened..."
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 required
 minRows={4}
 />
 <FileInput
 label="Screenshot (optional)"
 placeholder="Click to upload"
 accept="image/png,image/jpeg"
 value={file}
 onChange={setFile}
 leftSection={<Paperclip size={16} />}
 />
 <Group justify="flex-end" mt="md">
 <Button variant="subtle" onClick={onClose} disabled={isSubmitting}>
 Cancel
 </Button>
 <Button type="submit" loading={isSubmitting} leftSection={!isSubmitting && <Bug size={16} />}>
 Submit Report
 </Button>
 </Group>
 </Stack>
 </form>
 </Modal>
 );
}