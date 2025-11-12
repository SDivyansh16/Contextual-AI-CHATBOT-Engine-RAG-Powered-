/**
 * @file queryExpansionService.ts
 * @description This service uses the Gemini API to expand a user's query into
 * alternative phrasings, improving retrieval accuracy.
 */
import { GoogleGenAI, Type } from "@google/genai";

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

// Define the expected JSON schema for the model's response.
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        expanded_queries: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: 'An alternative phrasing of the original user query.'
            },
            description: 'A list of 3-4 alternative phrasings of the original query to improve search results.'
        }
    },
    required: ['expanded_queries']
};

/**
 * Expands a user query by generating alternative phrasings using the Gemini API.
 * @param query The original user query.
 * @returns A promise that resolves to an array of expanded query strings.
 */
export const expandQuery = async (query: string): Promise<string[]> => {
    const ai = getGeminiService();

    // Prompt engineered to instruct the model to rephrase the query for better retrieval.
    const prompt = `
You are a query expansion expert. Your task is to rephrase the following user query to improve the accuracy of a semantic search system.
Generate 3 to 4 alternative phrasings that capture the user's intent from different angles. Consider synonyms, related concepts, and different ways of asking the same question.
Return your answer in the specified JSON format.

Original Query: "${query}"
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        // The response text is a JSON string, parse it.
        const jsonResponse = JSON.parse(response.text);
        
        // Validate the parsed JSON against what we expect.
        if (jsonResponse && Array.isArray(jsonResponse.expanded_queries)) {
            return jsonResponse.expanded_queries;
        } else {
            console.warn("Query expansion response was not in the expected format:", response.text);
            return []; // Return empty array on format mismatch
        }
    } catch (error) {
        console.error("Error expanding query with Gemini:", error);
        // On error, we don't want to break the whole flow. Just return an empty array.
        // The RAG pipeline can proceed with just the original query.
        return [];
    }
};