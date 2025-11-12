/**
 * @file Message.tsx
 * @description Renders a single chat message, distinguishing between user and AI messages.
 * It also includes a collapsible accordion for AI messages to show the source chunks and query expansion details.
 */
import React, { useState } from 'react';
import { ChatMessage, Chunk } from '../types';
import { BotIcon, UserIcon, ChevronDownIcon, SparklesIcon } from './Icons';

// Let TypeScript know that the 'marked' library (for Markdown parsing)
// is available on the global window object, as it's included via a CDN script tag.
declare global {
    interface Window {
        marked: {
            parse(markdownString: string): string;
        };
    }
}

// --- SUB-COMPONENT: DetailsAccordion ---

/**
 * A collapsible UI component to display query expansion details and source chunks.
 */
const DetailsAccordion: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const [isOpen, setIsOpen] = useState(false);

    const sources = message.sources || [];
    const expandedQueries = message.expandedQueries || [];

    // Don't render anything if there's no extra detail to show.
    if (sources.length === 0 && expandedQueries.length === 0) return null;

    return (
        <div className="mt-3 border-t border-rose-200/80 pt-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-sm text-slate-600 hover:text-pink-600 focus:outline-none"
            >
                <span>Show Details</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-2 space-y-4 max-h-60 overflow-y-auto pr-2">
                    {/* Section: Query Expansion */}
                    {expandedQueries.length > 0 && (
                         <div>
                            <h4 className="text-xs font-semibold text-slate-600 flex items-center">
                                <SparklesIcon className="w-4 h-4 mr-1.5 text-sky-500" />
                                Query Expansion
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">To improve results, I also searched for:</p>
                            <ul className="mt-1.5 space-y-1">
                                {expandedQueries.map((q, index) => (
                                    <li key={index} className="text-xs text-slate-600 bg-sky-50/80 rounded px-2 py-1 italic">
                                        "{q}"
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Section: Sources */}
                    {sources.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-slate-600">Sources ({sources.length})</h4>
                            <div className="mt-1.5 space-y-2">
                                {sources.map((source, index) => (
                                    <div key={index} className="bg-rose-50/80 p-2 rounded-md">
                                        <p className="text-xs font-mono text-pink-700 flex items-center">
                                            <span>{source.source} (Chunk {source.chunkIndex})</span>
                                            {source.metadata?.contentType && (
                                                <span className={`ml-2 font-sans font-bold uppercase text-[10px] px-1.5 py-0.5 rounded-full
                                                    ${source.metadata.contentType === 'narrative' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                                                    {source.metadata.contentType}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 italic">"{source.text.substring(0, 100)}..."</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- MAIN COMPONENT: Message ---

export const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  /**
   * Parses a Markdown string into HTML using the 'marked' library.
   * Includes a security note about the importance of sanitizing HTML.
   * @param markdownText The raw Markdown text from the AI.
   * @returns An object suitable for `dangerouslySetInnerHTML`.
   */
  const createMarkup = (markdownText: string) => {
    if (typeof window !== 'undefined' && window.marked) {
        // SECURITY NOTE: In a production application, you MUST sanitize this HTML
        // using a library like DOMPurify (e.g., `DOMPurify.sanitize(window.marked.parse(markdownText))`)
        // to prevent Cross-Site Scripting (XSS) attacks. For this controlled demo environment,
        // we are trusting the AI's output and proceeding directly.
        return { __html: window.marked.parse(markdownText) };
    }
    // Fallback for server-side rendering or if 'marked' hasn't loaded yet.
    // This simple fallback escapes HTML tags to prevent them from being rendered.
    return { __html: markdownText.replace(/</g, "&lt;").replace(/>/g, "&gt;") };
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
        {/* AI Icon */}
        {!isUser && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-5 h-5 text-white" />
            </div>
        )}

      {/* Message Bubble */}
      <div
        className={`max-w-xl rounded-lg px-4 py-3 shadow-sm transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
          isUser
            ? 'bg-gradient-to-br from-sky-400 to-violet-500 text-white rounded-br-none' // User message style
            : 'bg-gradient-to-br from-white/40 to-rose-100/20 backdrop-blur-lg border border-white/20 text-slate-800 rounded-bl-none' // AI message style
        }`}
      >
        {isUser ? (
            // User messages are plain text.
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        ) : (
            // AI messages are rendered from Markdown.
            <div
                className="prose text-sm max-w-none"
                dangerouslySetInnerHTML={createMarkup(message.text)}
            />
        )}
        {/* Show details accordion only for AI messages. */}
        {!isUser && <DetailsAccordion message={message} />}
      </div>
      
      {/* User Icon */}
      {isUser && (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-slate-600" />
            </div>
        )}
    </div>
  );
};