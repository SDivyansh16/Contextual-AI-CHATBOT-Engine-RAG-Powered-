/**
 * @file DocumentManager.tsx
 * @description This component displays a summary of the documents that have been uploaded
 * to form the chatbot's knowledge base.
 */
import React from 'react';
import { Document as DocType } from '../types';
import { FileTextIcon } from './Icons';

interface DocumentManagerProps {
  documents: DocType[];  // An array of document objects.
  totalChunks: number;   // The total number of text chunks created from all documents.
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, totalChunks }) => {
  return (
    <div className="w-full p-0.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg shadow-md">
      <div className="w-full bg-white/60 backdrop-blur-lg rounded-[7px] p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Knowledge Base</h3>
        
        {/* Conditional Rendering: Show a message if no documents are uploaded. */}
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">Upload documents to build your knowledge base.</p>
        ) : (
          // Display summary and list of documents if the knowledge base is not empty.
          <>
          <div className="mb-4 text-sm text-slate-600">
              <p>Total Documents: <span className="font-bold text-blue-600">{documents.length}</span></p>
              <p>Total Chunks: <span className="font-bold text-blue-600">{totalChunks}</span></p>
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {documents.map((doc, index) => (
              <li key={index} className="flex items-center bg-slate-100/80 p-2 rounded-md">
                <FileTextIcon className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm font-medium text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                  <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(2)} KB</p>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>
    </div>
  );
};