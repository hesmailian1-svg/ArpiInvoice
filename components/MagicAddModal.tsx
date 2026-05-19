import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader2, Upload, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { parseInvoiceItems } from '../ai-service';

interface MagicAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: any[]) => void;
  defaultDate: string;
}

export const MagicAddModal: React.FC<MagicAddModalProps> = ({ isOpen, onClose, onAddItems, defaultDate }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG) or PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size too large. Please upload a file smaller than 10MB.");
      return;
    }

    // Create preview if it's an image
    let preview = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setSelectedFile({ file, preview });
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!input.trim() && !selectedFile) {
      setError("Please provide text or upload a file.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let mediaData = undefined;
      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile.file);
        mediaData = {
          mimeType: selectedFile.file.type,
          data: base64
        };
      }

      const items = await parseInvoiceItems(input, defaultDate, mediaData);
      
      if (items && items.length > 0) {
        onAddItems(items);
        setInput('');
        setSelectedFile(null);
        onClose();
      } else {
        setError("Could not find any clear invoice items. Please try again with clearer text or images.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while analyzing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Magic Add with Gemini</h2>
              <p className="text-blue-100 text-sm">Upload logs or paste rough notes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-slate-600 text-sm mb-4">
            Upload a photo of your timesheet/log OR type details below. The AI will extract dates, patients, and services.
          </p>

          {/* Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-all ${
              selectedFile ? 'border-blue-300 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            
            {!selectedFile ? (
              <div 
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                  <Upload size={24} className="text-blue-900" />
                </div>
                <p className="font-bold text-slate-700">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-500 mt-1">Photos (JPG, PNG) or PDF</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                    {selectedFile.preview ? (
                      <img src={selectedFile.preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="font-bold text-sm text-slate-800 truncate max-w-[200px]">{selectedFile.file.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none text-slate-700 placeholder:text-slate-400"
              placeholder="And/or type notes here: &#10;Example: Saw John Doe on Monday for Wound Care, 15 miles."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-50 text-red-600 text-sm p-2 rounded border border-red-100">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};