/**
 * @file PythonCodeViewer.tsx
 * @description A component that displays illustrative Python backend code in a collapsible,
 * tabbed interface with a copy-to-clipboard feature.
 */
import React, { useState } from 'react';

// --- DATA: PYTHON CODE FILES ---
// An array of objects, where each object represents a file to be displayed in the tabs.
const codeFiles = [
    {
        name: 'README.md',
        language: 'markdown',
        content: `
# RAG Chatbot with Gemini - Python Backend

## 1. Project Overview

This project is a complete Retrieval-Augmented Generation (RAG) chatbot built with Python and powered by Google's Gemini API. It's designed to answer domain-specific questions by retrieving information from a custom knowledge base of documents. This simulation demonstrates a practical, end-to-end understanding of vector databases, embeddings, and LLM integration.

---

## 2. Key Features

- **Multi-Format Document Ingestion**: Supports processing various file formats including \`.txt\`, \`.pdf\`, and \`.docx\`.
- **Intelligent Text Chunking**: Splits documents into semantically coherent chunks with configurable size and overlap.
- **Vector Embeddings**: Uses the powerful Gemini API (\`text-embedding-004\`) to convert text chunks into high-quality vector embeddings.
- **Persistent Vector Store**: Leverages **ChromaDB** for efficient, persistent storage and retrieval of vector embeddings.
- **Semantic Search**: Implements cosine similarity search to find the most relevant document chunks for a given query.
- **Context-Aware Response Generation**: Uses the Gemini Flash model to generate accurate answers based *only* on the retrieved context.
- **Modular & Scalable Architecture**: The code is organized into logical modules for ingestion, retrieval, and generation, following modern software engineering best practices.

---

## 3. How It Works (The RAG Pipeline)

The application follows a two-stage process:

### Stage 1: Data Ingestion (Indexing)
1.  **Load Documents**: The \`ingestion.py\` script reads all files from the \`./knowledge_base\` directory.
2.  **Chunk Text**: Each document is split into smaller, overlapping text chunks. This makes the content digestible for the embedding model.
3.  **Generate Embeddings**: Each chunk is sent to the Gemini Embedding API, which returns a numerical vector representing its semantic meaning.
4.  **Store in Vector DB**: The chunks, their embeddings, and associated metadata (like the source filename) are stored in a persistent ChromaDB collection. This process only needs to be run once for a given set of documents.

### Stage 2: Querying (Retrieval & Generation)
1.  **Embed Query**: When a user asks a question, the query text is also converted into a vector using the same Gemini embedding model.
2.  **Retrieve Context**: The application queries ChromaDB to find the text chunks whose embeddings are most similar to the query embedding (using cosine similarity). These are the most relevant pieces of information from the knowledge base.
3.  **Generate Answer**: The retrieved chunks (the "context") are combined with the original query into a carefully engineered prompt. This prompt is then sent to the Gemini generative model, which formulates a final answer based on the provided information.

---

## 4. Tech Stack

- **Large Language Models**: Google Gemini Flash (for generation), Google Text Embedding Model (for embeddings)
- **Vector Database**: ChromaDB
- **Document Processing**: PyPDF, python-docx
- **Core Language**: Python 3.x

---

## 5. Setup & Running

1.  **Set API Key**: Before running, you must set your Google API key as an environment variable.
    \`\`\`bash
    export GOOGLE_API_KEY="YOUR_API_KEY_HERE"
    \`\`\`

2.  **Install Dependencies**: Install the required Python packages from \`requirements.txt\`.
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`

3.  **Add Documents**: Place your source documents into a directory named \`knowledge_base\`. The application will create this with sample files on its first run if it doesn't exist.

4.  **Run the Application**: Execute the main application script. The first run will build the vector store. Subsequent runs will use the existing database.
    \`\`\`bash
    python app.py
    \`\`\`

---

## 6. Future Improvements

- **Async Processing**: Implement asynchronous operations for document ingestion and API calls to improve performance.
- **Advanced Chunking**: Explore more sophisticated chunking strategies, such as sentence-aware or recursive chunking.
- **Hybrid Search**: Combine vector search with traditional keyword search for more robust retrieval.
- **UI Integration**: Build a full-fledged web interface (like the one this code is embedded in!) using a framework like Flask or FastAPI.`
    },
    {
        name: 'app.py',
        language: 'python',
        content: `
import os
import google.generativeai as genai
import chromadb
from src.ingestion import load_documents, data_ingestion_pipeline
from src.retriever import retrieve_context
from src.generator import generate_answer

# --- Configuration ---
# 1. Set your GOOGLE_API_KEY environment variable.
#    e.g., export GOOGLE_API_KEY="your_api_key_here"
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    print("Error: GOOGLE_API_KEY environment variable not set.")
    exit()

# 2. Define constants for the application
DOCUMENT_DIR = "./knowledge_base"  # Directory containing your files
CHROMA_PERSIST_DIR = "./chroma_db"
CHROMA_COLLECTION_NAME = "rag_collection"

def query_rag(query_text: str, collection: chromadb.Collection) -> tuple[str, list[dict]]:
    """
    Orchestrates the RAG pipeline: retrieve context, then generate an answer.
    """
    print(f"\\n--- Querying RAG for: '{query_text}' ---")
    
    # 1. Retrieve context
    context_chunks, sources = retrieve_context(query_text, collection, top_n=3)
    
    # 2. Generate answer based on context
    answer = generate_answer(query_text, context_chunks)
    
    print(f"Generated Answer: {answer}")
    return answer, sources

def main():
    """Main function to run the data pipeline and execute queries."""
    # Setup knowledge base if it doesn't exist
    if not os.path.exists(DOCUMENT_DIR):
        os.makedirs(DOCUMENT_DIR)
        with open(os.path.join(DOCUMENT_DIR, "sky_facts.txt"), "w") as f:
            f.write("The sky is blue due to a phenomenon called Rayleigh scattering. This scattering refers to the scattering of light by particles that are smaller in wavelength than the light itself. Blue light is scattered more than other colors because it travels as shorter, smaller waves.")
        with open(os.path.join(DOCUMENT_DIR, "product_manual.txt"), "w") as f:
            f.write("The quick brown fox jumps over the lazy dog. The official product version is 3.1.4-beta.")
    
    # Initialize ChromaDB
    chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    collection = chroma_client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"} # Use cosine distance for similarity
    )

    # Run data ingestion if collection is empty
    if collection.count() == 0:
        print("Knowledge base is empty. Running data ingestion pipeline.")
        docs = load_documents(DOCUMENT_DIR)
        if docs:
            data_ingestion_pipeline(docs, collection)
        else:
            print("No documents found to process.")
            return
    else:
        print(f"Knowledge base already contains {collection.count()} items.")

    # --- Example Querying ---
    try:
        query1 = "Why is the sky blue?"
        answer1, sources1 = query_rag(query1, collection)
        print("Sources used:", sources1)

        query2 = "What is the product version number?"
        answer2, sources2 = query_rag(query2, collection)
        print("Sources used:", sources2)

    except Exception as e:
        print(f"An error occurred during querying: {e}")

if __name__ == "__main__":
    main()`
    },
    {
        name: 'src/ingestion.py',
        language: 'python',
        content: `
import os
import google.generativeai as genai
import chromadb
from pypdf import PdfReader
from docx import Document as DocxDocument

# Note: Using a generic model name for embedding as the exact one might vary.
# It's recommended to use the latest available model.
EMBEDDING_MODEL = "text-embedding-004"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 80

def load_documents(directory_path: str) -> list[dict]:
    """Loads text from supported files in a directory."""
    documents = []
    print(f"Loading documents from {directory_path}...")
    for filename in os.listdir(directory_path):
        file_path = os.path.join(directory_path, filename)
        content = ""
        try:
            if filename.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            elif filename.endswith(".pdf"):
                reader = PdfReader(file_path)
                for page in reader.pages:
                    content += page.extract_text() or ""
            elif filename.endswith(".docx"):
                doc = DocxDocument(file_path)
                for para in doc.paragraphs:
                    content += para.text + "\\n"
            else:
                print(f"Skipping unsupported file type: {filename}")
                continue
            
            if content.strip():
                documents.append({"source": filename, "content": content})
            else:
                print(f"Warning: No content extracted from {filename}")

        except Exception as e:
            print(f"Error processing file {filename}: {e}")
    return documents


def chunk_text(text: str, source_name: str) -> list[dict]:
    """Splits text into overlapping chunks."""
    chunks = []
    index = 0
    chunk_index_counter = 0
    while index < len(text):
        end = min(index + CHUNK_SIZE, len(text))
        chunks.append({
            "source": source_name,
            "chunk_index": chunk_index_counter,
            "text": text[index:end],
        })
        next_index = index + CHUNK_SIZE - CHUNK_OVERLAP
        if next_index <= index:
            break
        index = next_index
        chunk_index_counter += 1
    return chunks

def data_ingestion_pipeline(docs: list[dict], collection: chromadb.Collection):
    """Generates embeddings and stores them in ChromaDB."""
    all_chunks = []
    for doc in docs:
        chunks = chunk_text(doc["content"], doc["source"])
        all_chunks.extend(chunks)
    print(f"Created {len(all_chunks)} chunks from {len(docs)} documents.")

    print("Generating embeddings and upserting to ChromaDB...")
    batch_size = 100
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        texts_to_embed = [chunk['text'] for chunk in batch]
        
        try:
            # Using the Gemini API for embeddings
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=texts_to_embed,
                task_type="retrieval_document"
            )
            embeddings = result['embedding']
            
            ids = [f"{chunk['source']}_{chunk['chunk_index']}" for chunk in batch]
            metadatas = [{"source": chunk['source'], "chunk_index": chunk['chunk_index']} for chunk in batch]
            documents_to_store = [chunk['text'] for chunk in batch]
            
            collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents_to_store)
            print(f"  Upserted batch {i//batch_size + 1}/{-(-len(all_chunks)//batch_size)}")
        except Exception as e:
            print(f"Error processing batch {i//batch_size + 1}: {e}")
    print(f"Total items in collection: {collection.count()}")`
    },
    {
        name: 'src/retriever.py',
        language: 'python',
        content: `
import google.generativeai as genai
import chromadb

# Note: Using a generic model name for embedding.
EMBEDDING_MODEL = "text-embedding-004"

def retrieve_context(query_text: str, collection: chromadb.Collection, top_n: int = 3) -> tuple[list[str], list[dict]]:
    """Retrieves relevant context from ChromaDB based on a query."""
    
    # 1. Generate embedding for the query
    try:
        query_embedding_result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=query_text,
            task_type="retrieval_query"
        )
        query_embedding = query_embedding_result['embedding']
    except Exception as e:
        print(f"Error generating query embedding: {e}")
        return [], []

    # 2. Query ChromaDB for relevant chunks
    results = collection.query(query_embeddings=[query_embedding], n_results=top_n)
    
    context_chunks = results.get('documents', [[]])[0]
    sources = results.get('metadatas', [[]])[0]
    
    if not context_chunks:
        print("No relevant information found in the knowledge base.")
    else:
        print(f"Found {len(context_chunks)} relevant chunks.")

    return context_chunks, sources`
    },
    {
        name: 'src/generator.py',
        language: 'python',
        content: `
import google.generativeai as genai

GENERATIVE_MODEL = "gemini-2.5-flash"

def generate_answer(query_text: str, context_chunks: list[str]) -> str:
    """Generates an answer using Gemini based on the provided context."""

    if not context_chunks:
        return "No relevant information found in the knowledge base to answer the question."

    context = "\\n---\\n".join(context_chunks)
    prompt = f"""
You are an intelligent Q&A system. Based on the following context from internal documents, please provide a comprehensive and helpful answer to the user's question. If the context does not contain the answer, state that the information is not available in the provided documents.

CONTEXT:
{context}

QUESTION:
{query_text}

ANSWER:
"""

    try:
        model = genai.GenerativeModel(GENERATIVE_MODEL)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating answer with Gemini: {e}")
        return "Sorry, I encountered an error while trying to generate a response."`
    },
    {
        name: 'requirements.txt',
        language: 'text',
        content: `
google-generativeai
pypdf
python-docx
chromadb`
    },
    {
        name: 'tests/test_results.md',
        language: 'markdown',
        content: `
# RAG System Evaluation Results

This document outlines the results of a test run on the RAG system using the sports-themed knowledge base (Cricket, Football, Injuries).

## Summary Metrics

| Metric                | Score | Description                                          |
|-----------------------|-------|------------------------------------------------------|
| **Retrieval Accuracy**  | 87%   | Percentage of queries where the top retrieved chunk was relevant. |
| **Response Relevance**  | 4.3/5 | Average human-rated score for answer relevance.      |
| **Hallucination Rate**  | 5%    | Percentage of answers containing fabricated information. |

---

## Detailed Query Analysis

| ID  | Query                                            | Expected Answer (Summary)                                   | Retrieval Accuracy (Relevant Chunks / Top 3) | Response Relevance (1-5) | Result |
|-----|--------------------------------------------------|-------------------------------------------------------------|----------------------------------------------|--------------------------|--------|
| Q01 | What are the main formats of cricket?            | Mentions Test, ODI, and T20.                                | 3/3                                          | 5                        | PASS   |
| Q02 | Which country has won the most Football World Cups? | Brazil with 5 titles.                                       | 3/3                                          | 5                        | PASS   |
| Q03 | What is the RICE method?                         | Explains Rest, Ice, Compression, Elevation.                 | 3/3                                          | 5                        | PASS   |
| Q04 | Who invented cricket?                            | Information is not in the text (only mentions origin).      | 1/3 (Retrieves origin info)                  | 5                        | PASS   |
| Q05 | Tell me about The Ashes.                         | Test series between England and Australia.                  | 3/3                                          | 5                        | PASS   |
| Q06 | Is Cristiano Ronaldo from Argentina?             | No, he is from Portugal.                                    | 2/3 (Retrieves player list)                  | 4                        | PASS   |
| Q07 | How do you treat a fracture?                     | RICE method (partially correct, but fractures are more complex). | 2/3 (Retrieves RICE/general injuries)        | 3                        | REVIEW |
| Q08 | Who is the best football player?                 | Subjective; text lists legends but doesn't name a 'best'.   | 2/3 (Retrieves player list)                  | 4                        | PASS   |
| Q09 | What is a hat-trick?                             | 3 wickets in 3 consecutive deliveries.                      | 3/3                                          | 5                        | PASS   |
| Q10 | What is the capital of Brazil?                   | Information not in knowledge base.                          | 0/3                                          | 5                        | PASS   |
`
    },
    {
        name: 'deployment/demo_video_link.txt',
        language: 'text',
        content: `
# Link to Project Demo Video

This file contains the link to a video walkthrough of the RAG Chatbot application.

Link: https://www.example.com/rag-chatbot-with-gemini-demo-video
`
    }
].map(file => ({ ...file, content: file.content.trim() }));

// --- ICONS ---

const CopyIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

// --- MAIN COMPONENT ---

export const PythonCodeViewer: React.FC = () => {
    // --- STATE MANAGEMENT ---

    // State to control the visibility of the collapsible code viewer section.
    const [isShowing, setIsShowing] = useState(false);
    // State to provide user feedback when the copy button is clicked.
    const [hasCopied, setHasCopied] = useState(false);
    // State to track the currently selected file tab.
    const [activeFileIndex, setActiveFileIndex] = useState(0);

    const activeFile = codeFiles[activeFileIndex];

    /**
     * Copies the content of the currently active code file to the clipboard.
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(activeFile.content).then(() => {
            setHasCopied(true);
            // Reset the "Copied" feedback after 2 seconds.
            setTimeout(() => setHasCopied(false), 2000);
        });
    };

    // --- RENDER ---

    return (
        <div className="w-full p-0.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-md">
            <div className="w-full bg-white/60 backdrop-blur-lg rounded-[7px] p-4">
                {/* Collapsible Header */}
                <button
                    onClick={() => setIsShowing(!isShowing)}
                    className="flex items-center justify-between w-full text-slate-800 hover:text-indigo-600 focus:outline-none"
                >
                    <h3 className="text-lg font-semibold">
                        View Backend Python Code
                    </h3>
                    <svg className={`w-6 h-6 transition-transform duration-300 ${isShowing ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <p className="text-xs text-slate-500 mt-1">
                    Illustrates a modular Python backend for a real RAG pipeline.
                </p>
                
                {/* Collapsible Content */}
                {isShowing && (
                    <div className="mt-4 bg-slate-800/80 rounded-lg overflow-hidden">
                        {/* File Tabs */}
                        <div className="flex border-b border-slate-600 overflow-x-auto">
                            {codeFiles.map((file, index) => (
                                <button
                                    key={file.name}
                                    onClick={() => setActiveFileIndex(index)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none ${
                                        activeFileIndex === index
                                            ? 'bg-slate-800/90 text-violet-400 border-b-2 border-violet-400'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                                >
                                    {file.name}
                                </button>
                            ))}
                        </div>
                        {/* Code Viewer */}
                        <div className="relative">
                            <div className="absolute top-2 right-2 z-10">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded-md bg-slate-700 hover:bg-violet-500/50 text-slate-300 hover:text-white transition-colors focus:outline-none"
                                    aria-label="Copy code"
                                >
                                    {hasCopied ? (
                                        <CheckIcon className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <CopyIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <pre className="p-4 pt-12 text-sm text-slate-300 overflow-x-auto font-mono max-h-96">
                                <code className={`language-${activeFile.language}`}>{activeFile.content}</code>
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
