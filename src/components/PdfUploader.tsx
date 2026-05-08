import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden ${
          dragActive 
            ? 'border-[#C9A84C] bg-[#C9A84C]/5' 
            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && !selectedFile && inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept=".pdf,application/pdf"
          onChange={handleChange}
          disabled={isProcessing}
        />

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center mb-6 shadow-inner text-[var(--text-muted)]">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Upload Legal Document</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs">
                Drag and drop your case file (PDF) here to perform AI-powered risk analysis
              </p>
              <button 
                type="button"
                className="btn-primary"
              >
                Browse Files
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-20 h-20 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center mb-4 text-[#C9A84C]">
                <FileText size={40} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              {!isProcessing && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 mt-2"
                >
                  <X size={14} /> Remove File
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <p className="text-center text-[10px] text-[var(--text-muted)] mt-4 uppercase tracking-[2px] font-black">
        Encrypted & Secure • No documents are stored on our servers
      </p>
    </div>
  );
};

export default PdfUploader;
