/**
 * @file FileUpload.tsx
 * @description A component that provides a user-friendly interface for uploading files,
 * supporting both drag-and-drop and traditional file selection.
 */
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';
import Spinner from './Spinner';

interface FileUploadProps {
  onFileUpload: (file: File) => void; // Callback function to handle the uploaded file.
  isProcessing: boolean;                // Flag to indicate if a file is currently being processed.
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  // State to manage the visual feedback for drag-and-drop.
  const [isDragging, setIsDragging] = useState(false);

  // --- DRAG AND DROP EVENT HANDLERS ---

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    // This is necessary to allow a drop event.
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData(); // Recommended to clear the drag data cache.
    }
  }, [onFileUpload]);
  
  // --- FILE INPUT CHANGE HANDLER ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFileUpload(e.target.files[0]);
        // Reset the input value. This is crucial to allow uploading the same file again
        // after it has been selected once.
        e.target.value = '';
    }
  };

  return (
    <div className="w-full p-0.5 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg shadow-md">
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-[7px] cursor-pointer transition-colors duration-300
                    ${isDragging ? 'border-teal-400 bg-teal-100/80' : 'border-transparent bg-white/60 hover:bg-teal-50/80'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          {isProcessing ? (
            // Show spinner and processing text when busy
            <div className="flex flex-col items-center">
              <Spinner />
              <p className="mt-2 text-sm text-slate-700">Processing...</p>
            </div>
          ) : (
            // Show upload prompt when idle
            <>
              <UploadIcon className="w-8 h-8 mb-2 text-slate-400" />
              <p className="mb-1 text-sm text-slate-700"><span className="font-semibold text-teal-600">Click to upload</span> or drag & drop</p>
              <p className="text-xs text-slate-500">TXT files only (max 5MB)</p>
            </>
          )}
        </div>
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt" disabled={isProcessing}/>
      </label>
    </div>
  );
};