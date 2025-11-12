/**
 * @file geminiService.ts
 * @description This service is responsible for all communication with the Google Gemini API.
 * It constructs the prompt and sends requests to the generative model.
 */
import { GoogleGenAI } from "@google/genai";
import { Chunk } from '../types';

/**
 * Initializes the GoogleGenAI client.
 * Throws an error if the API key is not set in the environment variables.
 * @returns An instance of the GoogleGenAI client.
 */
const getGeminiService = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates a response from the Gemini model based on a user query and provided context.
 * @param query The user's question.
 * @param contextChunks An array of relevant document chunks to be used as context.
 * @returns A promise that resolves to the AI-generated response as a string.
 */
export const getChatbotResponse = async (query: string, contextChunks: Chunk[]): Promise<string> => {
    const ai = getGeminiService();

    // Combine the text from all context chunks into a single string, including metadata.
    const context = contextChunks.map(c => {
        const tag = c.metadata?.contentType ? `[${c.metadata.contentType.toUpperCase()}]` : '[GENERAL]';
        return `${tag}\n${c.text}`;
    }).join("\n---\n");

    // --- PROMPT ENGINEERING ---
    // This prompt template instructs the model on its role, constraints, and the format of the input.
    // Key instructions include:
    // - Answer *only* from the provided context.
    // - Use Markdown for formatting.
    // - Pay attention to content type tags ([NARRATIVE], [ATOMIC]) to understand structure.
    // - Explicitly state when the answer is not in the context.
    const prompt = `
You are a helpful and precise Q&A assistant. Your task is to answer the user's question based *only* on the provided context.
- Analyze the context carefully.
- If the context contains the information to answer the question, provide a clear and concise answer. Use Markdown formatting (like headings, lists, and bold text) to improve the readability and structure of your answer.
- If the context does NOT contain the information, you MUST state: "Based on the provided documents, I cannot answer that question." Do not try to answer from your own knowledge.

The provided context has chunks tagged with their content type, like [NARRATIVE] for prose or [ATOMIC] for specific facts. Use these tags to better understand the structure of the information and formulate your answer.

CONTEXT:
---
${context}
---

QUESTION:
${query}

ANSWER:
`;

    try {
        // Send the request to the Gemini API.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        return "Sorry, I encountered an error while trying to generate a response. Please try again.";
    }
};