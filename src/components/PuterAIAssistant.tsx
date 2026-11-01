import { useState } from "react";
import { Button, Modal, TextInput, Stack, Text, ScrollArea, Box, Loader } from "@mantine/core";
import { IconRobot, IconSend } from "@tabler/icons-react";

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string) => Promise<{ message: string }>;
      };
    };
  }
}

export function PuterAIAssistant() {
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !window.puter) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await window.puter.ai.chat(userMsg);
      setMessages(prev => [...prev, { role: "ai", text: response.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Error connecting to Puter.js AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        leftSection={<IconRobot size={16} />} 
        onClick={() => setOpened(true)}
        variant="light"
      >
        AI Assistant
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="iCTRL AI Assistant" size="lg">
        <Stack h={400}>
          <ScrollArea flex={1} p="md" bg="var(--mantine-color-body)">
            <Stack gap="md">
              {messages.map((m, i) => (
                <Box key={i} p="xs" bg={m.role === "user" ? "blue.0" : "gray.0"} style={{ borderRadius: 8 }}>
                  <Text size="sm" fw={m.role === "user" ? 600 : 400}>
                    {m.role === "user" ? "You" : "AI"}: {m.text}
                  </Text>
                </Box>
              ))}
              {loading && <Loader size="sm" />}
            </Stack>
          </ScrollArea>
          
          <TextInput
            placeholder="Ask about your inventory..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rightSection={
              <Button size="xs" onClick={handleSend} disabled={!input.trim() || loading}>
                <IconSend size={14} />
              </Button>
            }
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </Stack>
      </Modal>
    </>
  );
}