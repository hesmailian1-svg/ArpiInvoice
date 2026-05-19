import React from 'react';
import { Printer, Save, FilePlus } from 'lucide-react';

interface InvoiceControlsProps {
  onDownload: () => void;
  onSaveToHistory: () => void;
  onNewInvoice: () => void;
  hasEmail: boolean;
}

export const InvoiceControls: React.FC<InvoiceControlsProps> = ({ onDownload, onSaveToHistory, onNewInvoice }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col md:flex-row justify-end items-center gap-4 z-50 no-print md:sticky md:top-0 md:bottom-auto md:border-b md:border-t-0 md:shadow-sm">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 w-full print:hidden">
        <span className="text-sm text-blue-900 font-bold uppercase tracking-wide hidden md:inline-block">
          Professional Nursing Invoice Generator
        </span>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* New Invoice Button */}
          <button
            type="button"
            onClick={onNewInvoice}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-3 rounded-lg font-bold transition-all shadow-sm text-sm cursor-pointer whitespace-nowrap"
            title="Start a fresh invoice with the next number"
          >
            <FilePlus size={18} />
            <span className="hidden lg:inline">New Invoice</span>
          </button>

          {/* Save to History Button */}
          <button
            type="button"
            onClick={onSaveToHistory}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-3 rounded-lg font-bold transition-all shadow-sm text-sm cursor-pointer whitespace-nowrap"
            title="Save to local database archive"
          >
            <Save size={18} />
            <span className="hidden lg:inline">Save History</span>
          </button>

          <div className="h-8 w-px bg-slate-300 hidden md:block mx-1"></div>

          {/* Download / Print Button (Primary) */}
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md text-base border-2 cursor-pointer whitespace-nowrap bg-blue-900 border-blue-900 text-white hover:bg-blue-950 hover:border-blue-950 shadow-lg shadow-blue-900/20"
          >
            <Printer size={20} />
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
};