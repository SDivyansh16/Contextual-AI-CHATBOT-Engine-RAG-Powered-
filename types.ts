/**
 * @file types.ts
 * @description This file defines the core TypeScript interfaces used throughout the application,
 * ensuring type safety and consistent data structures.
 */

/**
 * Represents a document uploaded by the user.
 */
export interface Document {
  name: string;      // The original filename of the document.
  type: string;      // The MIME type of the file (e.g., 'text/plain').
  size: number;      // The size of the file in bytes.
}

/**
 * Represents a single chunk of text extracted from a document.
 */
export interface Chunk {
  source: string;      // The name of the document this chunk came from.
  chunkIndex: number;  // The sequential index of this chunk within the document.
  text: string;        // The actual text content of the chunk.
  metadata?: {         // (Optional) Metadata about the chunk's content.
    contentType: 'narrative' | 'atomic'; // The structural type of the content.
  };
}

/**
 * Represents a single message in the chat history.
 */
export interface ChatMessage {
  id: string;                      // A unique identifier for the message.
  sender: 'user' | 'ai';           // Indicates whether the message is from the user or the AI.
  text: string;                    // The text content of the message.
  sources?: Chunk[];               // (Optional) For AI messages, the source chunks used to generate the response.
  expandedQueries?: string[];      // (Optional) For AI messages, the alternative queries used for retrieval.
}