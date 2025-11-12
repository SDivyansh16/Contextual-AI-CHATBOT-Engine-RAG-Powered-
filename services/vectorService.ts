/**
 * @file vectorService.ts
 * @description This service simulates the creation of text embeddings using the TF-IDF
 * (Term Frequency-Inverse Document Frequency) algorithm. It also provides a function
 * to calculate the similarity between these vectors.
 */
import { Chunk } from '../types';

// --- TOKENIZATION ---

/**
 * A simple text tokenizer.
 * Converts text to lowercase, removes punctuation, and splits it into words.
 * @param text The input string to tokenize.
 * @returns An array of words (tokens).
 */
const tokenize = (text: string): string[] => {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/) // split by whitespace
        .filter(word => word.length > 0);
};

// --- TF-IDF IMPLEMENTATION ---

/**
 * Calculates Inverse Document Frequency (IDF) for all terms in a corpus of chunks.
 * IDF measures how important a term is. Common words like "the" will have a low IDF score,
 * while rare, specific words will have a high score.
 * @param chunks The entire collection of chunks from the knowledge base.
 * @returns A Map where keys are terms and values are their IDF scores.
 */
export const calculateIdf = (chunks: Chunk[]): Map<string, number> => {
    const idfMap = new Map<string, number>();
    const docFrequency = new Map<string, number>();
    const totalDocs = chunks.length;

    if (totalDocs === 0) return idfMap;

    // First, calculate document frequency (DF) for each term: how many documents contain the term.
    chunks.forEach(chunk => {
        const uniqueTerms = new Set(tokenize(chunk.text));
        uniqueTerms.forEach(term => {
            docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
        });
    });

    // Then, calculate IDF for each term using the formula: log((N+1)/(df+1)) + 1
    // This is a smoothed version of IDF to prevent division by zero and to handle
    // terms that appear in all documents more gracefully.
    docFrequency.forEach((df, term) => {
        const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
        idfMap.set(term, idf);
    });

    return idfMap;
};

/**
 * Creates a TF-IDF vector (represented as a Map) from a given text.
 * TF-IDF = Term Frequency * Inverse Document Frequency
 * This gives a weight to each term in the text, indicating its importance.
 * @param text The input string (e.g., a chunk or a user query).
 * @param idfMap A pre-calculated map of term to its IDF score for the entire corpus.
 * @returns A Map where keys are terms and values are their TF-IDF scores for the input text.
 */
export const vectorizeWithTfidf = (text: string, idfMap: Map<string, number>): Map<string, number> => {
    const tfidfVector = new Map<string, number>();
    const tokens = tokenize(text);
    if(tokens.length === 0) return tfidfVector;
    
    const termFrequency = new Map<string, number>();

    // Calculate term frequency (TF): how often a term appears in this specific text.
    tokens.forEach(token => {
        termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
    });

    // Calculate TF-IDF for each term in the text.
    termFrequency.forEach((tf, term) => {
        const idf = idfMap.get(term) || 0; // Use 0 for terms not in the corpus IDF map (e.g., new query terms)
        // Normalize TF by the number of tokens to prevent bias towards longer documents.
        const normalizedTf = tf / tokens.length;
        tfidfVector.set(term, normalizedTf * idf);
    });

    return tfidfVector;
};

// --- SIMILARITY CALCULATION ---

/**
 * Calculates the cosine similarity between two TF-IDF vectors.
 * Cosine similarity measures the cosine of the angle between two vectors,
 * providing a score between 0 (not similar) and 1 (identical).
 * @param vecA The first vector (e.g., query vector).
 * @param vecB The second vector (e.g., chunk vector).
 * @returns A similarity score.
 */
export const cosineSimilarity = (vecA: Map<string, number>, vecB: Map<string, number>): number => {
    const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);

    let dotProduct = 0;
    allKeys.forEach(key => {
        dotProduct += (vecA.get(key) || 0) * (vecB.get(key) || 0);
    });

    let magnitudeA = 0;
    vecA.forEach(value => {
        magnitudeA += value * value;
    });
    magnitudeA = Math.sqrt(magnitudeA);

    let magnitudeB = 0;
    vecB.forEach(value => {
        magnitudeB += value * value;
    });
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0; // Avoid division by zero if one of the vectors is empty.
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
};
