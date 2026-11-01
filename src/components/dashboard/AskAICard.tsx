import { useState } from 'react';
import { Card, Textarea, Button, Stack, Text, Loader, Alert } from '@mantine/core';
import { Sparkles } from 'lucide-react';
import { askPuterAI, isPuterAIAvailable } from '@/lib/puterAI';
import { notifications } from '@mantine/notifications';

export function AskAICard() {
 const [prompt, setPrompt] = useState('');
 const [loading, setLoading] = useState(false);
 const [response, setResponse] = useState<string | null>(null);
 const available = isPuterAIAvailable();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!prompt.trim()) return;

 setLoading(true);
 setResponse(null);

 try {
 const res = await askPuterAI(prompt, "This is an inventory management dashboard.");
 if (res.success) {
 setResponse(res.message);
 } else {
 notifications.show({ title: 'Error', message: res.error || 'Failed to get response', color: 'red' });
 }
 } catch (error) {
 notifications.show({ title: 'Error', message: 'An unexpected error occurred', color: 'red' });
 } finally {
 setLoading(false);
 }
 };

 if (!available) {
 return (
 <Card withBorder p="md" radius="md">
 <Stack gap="xs">
 <Text fw={600} size="sm">Ask AI Assistant</Text>
 <Alert color="yellow" variant="light">
 Puter AI is not available in this environment.
 </Alert>
 </Stack>
 </Card>
 );
 }

 return (
 <Card withBorder p="md" radius="md">
 <Stack gap="md">
 <Group justify="space-between">
 <Text fw={600} size="sm">Ask AI Assistant</Text>
 <Sparkles size={16} color="var(--mantine-color-primary-filled)" />
 </Group>

 <form onSubmit={handleSubmit}>
 <Stack gap="xs">
 <Textarea
 placeholder="Ask about your inventory, trends, or how to optimize..."
 value={prompt}
 onChange={(e) => setPrompt(e.currentTarget.value)}
 disabled={loading}
 minRows={2}
 />
 <Button type="submit" loading={loading} fullWidth rightSection={!loading && <Sparkles size={14} />}>
 Ask Puter AI
 </Button>
 </Stack>
 </form>

 {response && (
 <Stack gap="xs" mt="md">
 <Text size="xs" fw={500} c="dimmed">Response:</Text>
 <Text size="sm">{response}</Text>
 </Stack>
 )}
 </Stack>
 </Card>
 );
}

// Helper import missing in previous snippet
import { Group } from '@mantine/core';