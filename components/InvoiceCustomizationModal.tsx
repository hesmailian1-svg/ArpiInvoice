import React from 'react';
import { X, Image as ImageIcon, Type } from 'lucide-react';
import { InvoiceData } from '../types';

interface InvoiceCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
  onUpdate: (field: keyof InvoiceData, value: any) => void;
}

export const InvoiceCustomizationModal: React.FC<InvoiceCustomizationModalProps> = ({ isOpen, onClose, data, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-900">Invoice Customization</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><ImageIcon size={16} /> Logo URL</label>
            <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={data.logoUrl || ''} onChange={(e) => onUpdate('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Type size={16} /> Footer Text</label>
            <textarea className="w-full p-2 border border-slate-200 rounded-lg" value={data.footerText || ''} onChange={(e) => onUpdate('footerText', e.target.value)} placeholder="Thank you for your business!" rows={3} />
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800">Save</button>
      </div>
    </div>
  );
};
