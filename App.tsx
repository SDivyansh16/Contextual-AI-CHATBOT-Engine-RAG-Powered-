/**
 * @file App.tsx
 * @description The main component of the RAG Chatbot application.
 * It manages the application's state and orchestrates the entire RAG pipeline,
 * from document ingestion to response generation.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Document as DocType, Chunk, ChatMessage } from './types';
import { FileUpload } from './components/FileUpload';
import { DocumentManager } from './components/DocumentManager';
import { ChatWindow } from './components/ChatWindow';
import { processFile, intelligentChunking } from './services/documentProcessor';
import { getChatbotResponse } from './services/geminiService';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { calculateIdf, vectorizeWithTfidf, cosineSimilarity } from './services/vectorService';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { UploadIcon, DocumentTextIcon, CodeBracketIcon, ChartBarIcon } from './components/Icons';
import { expandQuery } from './services/queryExpansionService';

// --- HELPERS & CONSTANTS ---

/**
 * Creates a unique identifier for a chunk based on its source and index.
 * @param chunk The chunk object.
 * @returns A unique string ID.
 */
const getChunkId = (chunk: Chunk): string => `${chunk.source}_${chunk.chunkIndex}`;

/**
 * Configuration for the animated tab bar in the left panel.
 */
const tabs = [
  { id: 'upload', name: 'Upload', icon: UploadIcon, color: 'text-pink-600' },
  { id: 'knowledge', name: 'Knowledge', icon: DocumentTextIcon, color: 'text-blue-600' },
  { id: 'code', name: 'Code', icon: CodeBracketIcon, color: 'text-indigo-600' },
  { id: 'performance', name: 'Perf.', icon: ChartBarIcon, color: 'text-teal-600' },
];

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---

  // Knowledge Base State
  const [documents, setDocuments] = useState<DocType[]>([]); // Metadata for uploaded documents.
  const [chunks, setChunks] = useState<Chunk[]>([]);          // All text chunks from all documents.
  
  // State for TF-IDF based Vectorization
  const [idfMap, setIdfMap] = useState<Map<string, number>>(new Map()); // Maps terms to their Inverse Document Frequency.
  const [chunkTfidfVectors, setChunkTfidfVectors] = useState<Map<string, Map<string, number>>>(new Map()); // Maps chunk IDs to their TF-IDF vectors.

  // UI & Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);         // The history of the chat conversation.
  const [isFileProcessing, setIsFileProcessing] = useState(false);  // True when a file is being processed.
  const [isAiLoading, setIsAiLoading] = useState(false);            // True when waiting for a response from the AI.
  const [isSampleLoading, setIsSampleLoading] = useState(false);    // True when loading the sample dataset.
  const [activeTab, setActiveTab] = useState('upload');               // The currently active tab in the left panel.

  // --- EFFECTS ---

  /**
   * This effect hook recalculates the TF-IDF model whenever the knowledge base (chunks) changes.
   * This ensures that the retrieval system is always up-to-date with the latest documents.
   */
  useEffect(() => {
    // If there are no chunks, reset the TF-IDF model.
    if (chunks.length === 0) {
      setIdfMap(new Map());
      setChunkTfidfVectors(new Map());
      return;
    }
    
    // 1. Calculate the new IDF map from the entire corpus of chunks.
    const newIdfMap = calculateIdf(chunks);
    setIdfMap(newIdfMap);

    // 2. Pre-calculate and store the TF-IDF vector for each chunk for efficient retrieval later.
    const newChunkVectors = new Map<string, Map<string, number>>();
    chunks.forEach(chunk => {
      const chunkId = getChunkId(chunk);
      const vector = vectorizeWithTfidf(chunk.text, newIdfMap);
      newChunkVectors.set(chunkId, vector);
    });
    setChunkTfidfVectors(newChunkVectors);

  }, [chunks]); // Dependency array: this effect runs only when `chunks` state changes.

  // --- EVENT HANDLERS & LOGIC ---

  /**
   * A reusable function that processes text content and adds it to the knowledge base.
   * This centralizes the chunking and state update logic.
   */
  const addDocumentToKnowledgeBase = useCallback((fileName: string, fileType: string, fileSize: number, textContent: string) => {
    // Step 1: Perform intelligent chunking on the text content.
    const { chunks: newChunks, contentType } = intelligentChunking(textContent, fileName);
    
    // Step 2: Update the application's state with the new document metadata and text chunks.
    setDocuments(prev => [...prev, { name: fileName, type: fileType, size: fileSize }]);
    setChunks(prev => [...prev, ...newChunks]);

    // Step 3: Provide feedback to the user in the chat window.
    const confirmationMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `Successfully processed "${fileName}". I've analyzed its structure and tagged each information chunk with metadata (**${contentType}**). You can now ask questions about it.`,
        sources: []
    };

    // Prevent adding duplicate "Successfully processed..." messages when loading multiple sample files.
    // This is a simple check; a more robust solution might use message IDs or types.
    setMessages(prev => {
        const lastMessageText = prev[prev.length - 1]?.text || "";
        if (lastMessageText.startsWith("Successfully processed")) {
            return [...prev, confirmationMessage];
        }
        return [...prev, confirmationMessage];
    });

  }, []); // Setters from useState are stable and don't need to be in the dependency array.

  /**
   * Handles the file upload event from the FileUpload component.
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setIsFileProcessing(true);
    try {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error("File size exceeds 5MB limit.");
      }
      // Read the file's text content.
      const textContent = await processFile(file);
      // Add the processed document to the knowledge base.
      addDocumentToKnowledgeBase(file.name, file.type, file.size, textContent);
      // Automatically switch to the knowledge base tab after a successful upload.
      setActiveTab('knowledge');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("File processing error:", errorMessage);
        alert(`Error: ${errorMessage}`);
    } finally {
      setIsFileProcessing(false);
    }
  }, [addDocumentToKnowledgeBase]);

  /**
   * Loads a pre-packaged set of sample documents into the knowledge base.
   */
  const handleLoadSampleData = useCallback(async () => {
    setIsSampleLoading(true);
    
    // Define the expanded sample documents to be loaded.
    const sampleDocs = [
      { 
        name: 'cricket_rules_and_history.txt', 
        content: `Cricket is a bat-and-ball game played between two teams of eleven players on a field at the center of which is a 22-yard pitch with a wicket at each end.
        
History: The game originated in south-east England in the 16th century. It became the country's national sport in the 18th century and has developed globally in the 19th and 20th centuries. The International Cricket Council (ICC) is the sport's global governing body.

Formats of Cricket:
- Test cricket: The traditional form of the game, played over five days. It is considered the highest standard.
- One Day Internationals (ODIs): A limited-overs format where each team faces a fixed number of overs, currently 50.
- Twenty20 (T20): A fast-paced format where each team faces 20 overs. It is the shortest form of the game.

Ways to get a batsman out:
- Bowled: The bowler hits the wicket with the ball.
- Caught: A fielder catches the ball after the batsman has hit it, before it bounces.
- Leg Before Wicket (LBW): The ball hits the batsman's body instead of the bat and would have gone on to hit the wicket.
- Run out: A fielder dismisses the batsman while he is running between wickets.
- Stumped: The wicket-keeper dismisses the batsman who is out of his crease when the ball is delivered.

Key Terms:
- Hat-trick: When a bowler takes three wickets in three consecutive deliveries.
- The Ashes: A famous Test cricket series played between England and Australia.`
      },
      { 
        name: 'football_world_cup.txt', 
        content: `The FIFA World Cup is an international football competition contested by the senior men's national teams of the members of the Fédération Internationale de Football Association (FIFA), the sport's global governing body.

History: The first tournament was held in 1930 in Uruguay. It has been held every four years since, except in 1942 and 1946 because of the Second World War.

Most Successful Teams:
- Brazil: 5 titles
- Germany: 4 titles
- Italy: 4 titles
- Argentina: 3 titles

Legendary Players:
- Pelé (Brazil): Widely regarded as one of the greatest players of all time, he won three World Cups.
- Diego Maradona (Argentina): Famous for his "Hand of God" goal and leading Argentina to victory in 1986.
- Lionel Messi (Argentina): Led his country to victory in the 2022 World Cup.
- Cristiano Ronaldo (Portugal): One of the most prolific goalscorers in the history of the sport.
`
      },
      {
        name: 'sports_injuries_and_prevention.txt',
        content: `Common sports injuries are an unfortunate part of athletic activities. Understanding them is key to prevention and treatment.

Types of Injuries:
- Sprains: Stretching or tearing of ligaments, the tough bands of fibrous tissue that connect two bones together in your joints.
- Strains: Stretching or tearing of muscle or tendon. Tendons are fibrous cords of tissue that connect muscles to bones.
- Fractures: Broken bones.
- ACL Tear: A tear or sprain of the anterior cruciate ligament (ACL) — one of the major ligaments in your knee. Common in sports like football that involve sudden stops and changes in direction.

Prevention Strategies:
- Proper Warm-up and Cool-down: Prepares muscles for activity and helps in recovery.
- Strength Training: Strong muscles provide better support for joints.
- Flexibility: Stretching improves the range of motion of your muscles and joints.
- Proper Equipment: Using well-fitting shoes and protective gear.

The RICE Method:
A common treatment for acute soft tissue injuries.
- Rest: Stop the activity that caused the injury.
- Ice: Apply ice packs for 15-20 minutes at a time, several times a day.
- Compression: Use an elastic bandage to reduce swelling.
- Elevation: Keep the injured area elevated above the level of your heart.`
      }
    ];

    try {
        // Clear any existing documents before loading samples
        setDocuments([]);
        setChunks([]);

        // Process each sample document.
        for (const doc of sampleDocs) {
            // Simulate file properties like size for consistency.
            const fileSize = new Blob([doc.content]).size;
            const { chunks: newChunks } = intelligentChunking(doc.content, doc.name);
            setDocuments(prev => [...prev, { name: doc.name, type: 'text/plain', size: fileSize }]);
            setChunks(prev => [...prev, ...newChunks]);
        }
        
        // Add a single, comprehensive confirmation message with sample questions.
        const confirmationMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: `I've successfully loaded the new sample knowledge base, which includes documents about **Cricket**, the **Football World Cup**, and **Sports Injuries**.

Here are some questions you can ask to get started:
1.  What are the three main formats of international cricket?
2.  Who is the governing body for world football?
3.  How can an ACL tear be prevented?
4.  Which country has won the most Football World Cups?
5.  What is the RICE method for treating injuries?
6.  Explain the LBW rule in cricket.
7.  Who were Pelé and Maradona?
8.  What is the difference between a sprain and a strain?
9.  When was the first Football World Cup held?
10. What is a "hat-trick" in cricket?`,
            sources: []
        };
        setMessages([confirmationMessage]);

        // Switch to the knowledge tab to show the newly loaded documents.
        setActiveTab('knowledge');
    } catch (error) {
        console.error("Error loading sample data:", error);
        alert("An error occurred while loading the sample data.");
    } finally {
        setIsSampleLoading(false);
    }

  }, []);

  /**
   * Finds the most relevant chunks for a given query using TF-IDF and cosine similarity.
   * This is the "Retrieval" part of the RAG pipeline.
   */
  const findRelevantChunks = useCallback((query: string): Chunk[] => {
    if (chunks.length === 0 || chunkTfidfVectors.size === 0 || idfMap.size === 0) return [];
    
    // 1. Vectorize the user's query using the existing IDF map.
    const queryVector = vectorizeWithTfidf(query, idfMap);

    // 2. Calculate the cosine similarity between the query vector and each chunk vector.
    const scoredChunks = chunks.map(chunk => {
      const chunkId = getChunkId(chunk);
      const chunkVector = chunkTfidfVectors.get(chunkId);
      
      if (!chunkVector) {
        return { chunk, score: 0 };
      }
      const score = cosineSimilarity(queryVector, chunkVector);
      return { chunk, score };
    });

    // 3. Sort chunks by score in descending order.
    scoredChunks.sort((a, b) => b.score - a.score);
    
    // 4. Return the top 3 most relevant chunks, filtering out very low-scoring results.
    return scoredChunks.filter(sc => sc.score > 0.01).slice(0, 3).map(sc => sc.chunk);
  }, [chunks, chunkTfidfVectors, idfMap]);

  /**
   * Handles sending a user's message, retrieving context, and getting an AI response.
   * This orchestrates the "Retrieval" and "Generation" steps.
   */
  const handleSendMessage = useCallback(async (query: string) => {
    if (!query) return;

    // Add user's message to the chat history.
    const userMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);

    try {
      // Step 1: Expand the user's query for better retrieval.
      const expandedQueries = await expandQuery(query);
      
      // Combine original and expanded queries for a richer search context.
      const retrievalQuery = [query, ...expandedQueries].join(' ');

      // Step 2: Retrieve relevant context chunks using the expanded query.
      const relevantChunks = findRelevantChunks(retrievalQuery);
      
      // Step 3: Generate a response from the AI using the ORIGINAL query and context.
      // This is crucial for ensuring the AI answers the user's actual question.
      const aiResponseText = await getChatbotResponse(query, relevantChunks);

      // Add AI's response to the chat history, including sources and expansion details.
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: aiResponseText,
        sources: relevantChunks,
        expandedQueries: expandedQueries,
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Sorry, I encountered an issue connecting to the AI service. Please check your API key and try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  }, [findRelevantChunks]);

  // --- RENDER ---

  return (
    <div className="min-h-screen">
      <header className="bg-white/70 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <h1 className="text-xl sm:text-2l font-bold tracking-tight text-slate-800">
                RAG Chatbot with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-sky-600">Gemini</span>
                </h1>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
          
          {/* Left Panel: Tools */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
              <div className="relative p-0.5 bg-gradient-to-br from-cyan-300 via-purple-400 to-rose-400 rounded-lg shadow-md">
                <nav className="relative flex items-center justify-around bg-white/60 backdrop-blur-lg rounded-[7px] p-1" role="tablist">
                    {/* Animated underline for the active tab */}
                    <div 
                        className={`absolute top-0 left-0 h-full bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out border-b-2 ${
                            tabs.find(t => t.id === activeTab)?.color.replace('text-', 'border-')
                        }`} 
                        style={{ 
                            width: `${100 / tabs.length}%`,
                            transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)` 
                        }}
                    />
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative z-10 flex-1 flex items-center justify-center p-2 text-sm font-medium transition-colors duration-300 focus:outline-none ${
                                activeTab === tab.id ? tab.color : 'text-slate-500 hover:text-slate-800'
                            }`}
                            id={`tab-${tab.id}`}
                            aria-controls={`panel-${tab.id}`}
                            aria-selected={activeTab === tab.id}
                            role="tab"
                        >
                            <tab.icon className="w-5 h-5 lg:mr-2" />
                            <span className="hidden lg:inline">{tab.name}</span>
                        </button>
                    ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-grow">
                  <div role="tabpanel" id="panel-upload" aria-labelledby="tab-upload" hidden={activeTab !== 'upload'}>
                      <FileUpload onFileUpload={handleFileUpload} isProcessing={isFileProcessing} />
                  </div>
                  <div role="tabpanel" id="panel-knowledge" aria-labelledby="tab-knowledge" hidden={activeTab !== 'knowledge'}>
                      <DocumentManager documents={documents} totalChunks={chunks.length} />
                  </div>
                  <div role="tabpanel" id="panel-code" aria-labelledby="tab-code" hidden={activeTab !== 'code'}>
                      <PythonCodeViewer />
                  </div>
                  <div role="tabpanel" id="panel-performance" aria-labelledby="tab-performance" hidden={activeTab !== 'performance'}>
                      <PerformanceDashboard />
                  </div>
              </div>
          </div>


          {/* Right Panel: Chat Interface */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <ChatWindow 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isAiLoading={isAiLoading}
              isKnowledgeBaseReady={chunks.length > 0}
              onLoadSampleData={handleLoadSampleData}
              isSampleLoading={isSampleLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;