// Puter AI Integration for iCTRL
// Provides helper functions to interact with the Puter AI API

export interface PuterAIMessage {
 role: 'user' | 'assistant' | 'system';
 content: string;
}

export interface PuterAIResponse {
 message: string;
 success: boolean;
 error?: string;
}

/**
 * Sends a prompt to the Puter AI service and returns the response.
 * @param prompt The user's question or command.
 * @param context Optional context about the current page or data.
 */
export async function askPuterAI(prompt: string, context?: string): Promise<PuterAIResponse> {
 try {
 // Check if Puter is available in the global scope
 if (typeof window === 'undefined' || !(window as Record<string, unknown>).puter) {
 return {
 message: "Puter AI is not available. Please ensure you are running this application within the Puter environment or have the script loaded.",
 success: false,
 error: "Puter not found"
 };
 }

 const puter = (window as Record<string, unknown>).puter;
 
 // Construct the full prompt with context if provided
 let fullPrompt = prompt;
 if (context) {
 fullPrompt = `Context: ${context}\n\nQuestion: ${prompt}`;
 }

 // Use Puter's AI chat completion
 const response = await puter.ai.chat(fullPrompt);
 
 return {
 message: typeof response === 'string' ? response : response?.message || JSON.stringify(response),
 success: true
 };
 } catch (error: unknown) {
 console.error("Error calling Puter AI:", error);
 return {
 message: "Sorry, I encountered an error while processing your request.",
 success: false,
 error: error instanceof Error ? error.message : String(error)
 };
 }
}

/**
 * Checks if Puter AI is currently available and enabled.
 */
export function isPuterAIAvailable(): boolean {
 return typeof window !== 'undefined' && !!(window as Record<string, unknown>).puter && !!((window as Record<string, unknown>).puter as Record<string, unknown>)?.ai;
}