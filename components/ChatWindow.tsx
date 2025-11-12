/**
 * @file ChatWindow.tsx
 * @description The main chat interface component, responsible for displaying messages
 * and handling user input.
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Message } from './Message';
import { SendIcon, SparklesIcon } from './Icons';
import Spinner from './Spinner';

interface ChatWindowProps {
  messages: ChatMessage[];                   // The list of messages to display.
  onSendMessage: (message: string) => void;  // Callback to send a new message.
  isAiLoading: boolean;                      // Flag indicating if the AI is processing a response.
  isKnowledgeBaseReady: boolean;             // Flag indicating if documents have been uploaded.
  onLoadSampleData: () => void;              // Callback to load the sample dataset.
  isSampleLoading: boolean;                  // Flag indicating if the sample data is being loaded.
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    messages, 
    onSendMessage, 
    isAiLoading, 
    isKnowledgeBaseReady,
    onLoadSampleData,
    isSampleLoading
}) => {
  // State for the user's current input in the text box.
  const [input, setInput] = useState('');
  
  // Ref to the end of the messages container, used for auto-scrolling.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Smoothly scrolls the message list to the bottom.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to auto-scroll whenever a new message is added.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handles the submission of the message input form.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send if the input is not empty, the AI is not already loading, and a knowledge base exists.
    if (input.trim() && !isAiLoading && isKnowledgeBaseReady) {
      onSendMessage(input.trim());
      setInput(''); // Clear the input field after sending.
    }
  };

  return (
    <div className="h-full w-full p-0.5 bg-gradient-to-br from-cyan-300 via-purple-400 to-rose-400 rounded-lg shadow-lg">
      <div className="flex flex-col h-full w-full bg-white/60 backdrop-blur-lg rounded-[7px] overflow-hidden">
        {/* Message Display Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.length === 0 ? (
              // Show a welcome message with an option to load sample data if the chat is empty.
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-lg font-semibold text-slate-700">Welcome to the RAG Chatbot!</p>
                  <p className="mt-2 max-w-md text-slate-500">Upload your own documents, or get started right away by loading our sample knowledge base.</p>
                  <button
                      onClick={onLoadSampleData}
                      disabled={isSampleLoading}
                      className="mt-6 inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                      {isSampleLoading ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Loading...</span>
                          </>
                      ) : (
                          <>
                              <SparklesIcon className="w-5 h-5 mr-2 -ml-1" />
                              Try with Sample Data
                          </>
                      )}
                  </button>
              </div>
          ) : (
              // Render the list of messages.
              messages.map((msg) => <Message key={msg.id} message={msg} />)
          )}
          
          {/* "Thinking..." indicator for when the AI is loading. */}
          {isAiLoading && (
              <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <Spinner size="sm"/>
                  </div>
                  <div className="max-w-xl rounded-lg px-4 py-3 bg-gradient-to-br from-white/40 to-rose-100/20 backdrop-blur-lg border border-white/20 shadow-sm text-slate-800 rounded-bl-none">
                      <p className="text-sm italic">Thinking...</p>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input Form */}
        <div className="p-4 border-t border-slate-200/80">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                  !isKnowledgeBaseReady 
                  ? "Please upload a document first..." 
                  : "Ask a question about your documents..."
              }
              className="flex-1 w-full bg-slate-100 rounded-full py-2 px-4 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              disabled={isAiLoading || !isKnowledgeBaseReady}
            />
            <button
              type="submit"
              className="p-2 rounded-full text-white bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
              disabled={isAiLoading || !input.trim() || !isKnowledgeBaseReady}
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};