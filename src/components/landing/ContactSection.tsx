import { useState } from "react";
import { z } from "zod";
import { Mail, Send } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { Button, Card, TextInput, Textarea, Group, Stack } from "@mantine/core";

const contactFormSchema = z.object({
 name: z.string().min(2, "Name must be at least 2 characters"),
 email: z.string().email("Invalid email address"),
 message: z.string().min(10, "Message must be at least 10 characters"),
});

export function ContactSection() {
 const [formData, setFormData] = useState({ name: "", email: "", message: "" });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errors, setErrors] = useState<Record<string, string>>({});

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrors({});

 const result = contactFormSchema.safeParse(formData);
 if (!result.success const fieldErrors: Record<string, string> = {};
 result.error.issues.forEach((issue) => {
 if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
 });
 setErrors(fieldErrors);
 return;
 }

 setIsSubmitting(true);
 try {
 const res = await fetch("/api/contact", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(formData),
 });

 if (!res.ok) throw new Error("Failed to send message");

 notifications.show({
 title: "Message Sent",
 message: "We'll get back to you soon.",
 color: "green",
 });

 setFormData({ name: "", email: "", message: "" });
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
 <section id="contact" className="py-16 bg-surface">
 <div className="max-w-4xl mx-auto px-4">
 <Card withBorder p="xl" radius="md">
 <Group mb="md">
 <Mail size={24} />
 <h2 className="text-2xl font-bold">Contact Us</h2>
 </Group>
 <form onSubmit={handleSubmit}>
 <Stack>
 <TextInput
 label="Name"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 error={errors.name}
 required
 />
 <TextInput
 label="Email"
 type="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 error={errors.email}
 required
 />
 <Textarea
 label="Message"
 value={formData.message}
 onChange={(e) => setFormData({ ...formData, message: e.target.value })}
 error={errors.message}
 minRows={4}
 required
 />
 <Button type="submit" loading={isSubmitting} leftSection={!isSubmitting && <Send size={16} />}>
 Send Message
 </Button>
 </Stack>
 </form>
 </Card>
 </div>
 </section>
 );
}