/**
 * @file documentProcessor.ts
 * @description This service handles file reading and implements an intelligent chunking strategy
 * that adapts to the content of the document.
 */
import { Chunk } from '../types';

// --- CONFIGURATION ---

// Configuration for narrative text (e.g., articles, stories). Larger chunks preserve context.
const NARRATIVE_CHUNK_CONFIG = { size: 800, overlap: 80 };

// Configuration for atomic text (e.g., lists, facts, code). Smaller chunks isolate distinct pieces of information.
const ATOMIC_CHUNK_CONFIG = { size: 400, overlap: 40 };

// Heuristic threshold: if the density of newline characters exceeds this value,
// the content is treated as 'atomic'. This helps differentiate prose from lists or structured data.
const NEWLINE_DENSITY_THRESHOLD = 0.03;

// --- TYPES ---

export type ContentType = 'narrative' | 'atomic';

// --- FILE PROCESSING ---

/**
 * Reads the text content of a given file.
 * Currently supports only plain text files.
 * @param file The file to process.
 * @returns A promise that resolves with the text content of the file.
 */
export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type !== 'text/plain') {
      reject(new Error("Unsupported file type. Please upload a .txt file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      resolve(text);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};

// --- INTELLIGENT CHUNKING LOGIC ---

/**
 * Analyzes text to determine its likely content structure based on newline density.
 * @param text The full text content of the document.
 * @returns 'narrative' for prose-like text, 'atomic' for list-like or structured text.
 */
const analyzeContentType = (text: string): ContentType => {
    if (text.length === 0) return 'narrative';

    const newlineCount = (text.match(/\n/g) || []).length;
    const newlineDensity = newlineCount / text.length;

    // More newlines suggest lists, code, or fragmented data, which benefit from smaller, atomic chunks.
    if (newlineDensity > NEWLINE_DENSITY_THRESHOLD) {
        return 'atomic';
    }

    // Default to narrative for standard prose.
    return 'narrative';
};

/**
 * Dynamically chunks text based on its analyzed content type using a sliding window approach.
 * @param text The text content to chunk.
 * @param sourceName The name of the source file.
 * @returns An object containing the array of chunks and the detected content type.
 */
export const intelligentChunking = (text: string, sourceName: string): { chunks: Chunk[], contentType: ContentType } => {
  const contentType = analyzeContentType(text);
  const config = contentType === 'narrative' ? NARRATIVE_CHUNK_CONFIG : ATOMIC_CHUNK_CONFIG;
  
  const chunks: Chunk[] = [];
  let index = 0;
  let chunkIndex = 0;

  while (index < text.length) {
    const end = Math.min(index + config.size, text.length);
    chunks.push({
      source: sourceName,
      chunkIndex: chunkIndex++,
      text: text.substring(index, end),
      metadata: { contentType }, // Tag each chunk with its determined content type.
    });
    // Move the window forward, accounting for overlap
    const nextIndex = index + config.size - config.overlap;
    // Prevent infinite loops on very small texts or large overlaps
    if (nextIndex <= index) {
        break;
    }
    index = nextIndex;
  }

  return { chunks, contentType };
};