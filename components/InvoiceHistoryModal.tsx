
import React, { useState } from 'react';
import { X, CheckCircle, Clock, Trash2, RotateCcw, FileText, Search, DollarSign, TrendingUp, AlertCircle, PieChart, Ban, Filter } from 'lucide-react';
import { SavedInvoice, InvoiceStatus } from '../types';

interface InvoiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedInvoice[];
  onLoad: (invoice: SavedInvoice) => void;
  onToggleStatus: (id: string, newStatus: InvoiceStatus) => void;
  onDelete: (id: string) => void;
}

type FilterType = 'all' | 'pending' | 'paid' | 'void' | 'analytics' | 'data';

export const InvoiceHistoryModal: React.FC<InvoiceHistoryModalProps> = ({
  isOpen, onClose, history, onLoad, onToggleStatus, onDelete
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Sort by date descending (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  // Filter Logic
  const filteredHistory = sortedHistory.filter(inv => {
    const matchesFilter = filter === 'all' || inv.status === filter;
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.billToName && inv.billToName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Financial Calculations (Excluding Voids)
  const totalPaid = history
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalPending = history
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalInvoiced = totalPaid + totalPending;

  const TabButton = ({ type, label, icon: Icon, colorClass }: { type: FilterType, label: string, icon: any, colorClass: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
        filter === type 
          ? `bg-slate-800 text-white border-slate-800 shadow-md` 
          : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50`
      }`}
    >
      <Icon size={16} className={filter === type ? 'text-white' : colorClass} />
      {label}
      <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${filter === type ? 'bg-white/20' : 'bg-slate-100'}`}>
        {type === 'all' ? history.length : history.filter(i => i.status === type).length}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 flex justify-between items-center text-white shrink-0 rounded-t-xl">
           <div className="flex items-center gap-3">
             <Clock size={24} className="text-blue-300" />
             <div>
               <h2 className="text-xl font-bold">Invoice History & Earnings</h2>
               <p className="text-slate-300 text-xs">Track payments and manage archives</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
           
           {/* Financial Summary Dashboard */}
           {history.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Collected */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} className="text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                            <DollarSign size={16} />
                        </div>
                        <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-widest">Total Collected</span>
                    </div>
                    <span className="text-3xl font-black text-emerald-800 tracking-tight">${totalPaid.toFixed(2)}</span>
                    <span className="text-emerald-600 text-xs font-medium mt-1">{history.filter(i => i.status === 'paid').length} Paid Invoices</span>
                </div>
                
                {/* Pending */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-col shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={64} className="text-amber-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                            <Clock size={16} />
                        </div>
                        <span className="text-amber-700 text-xs font-extrabold uppercase tracking-widest">Pending / Due</span>
                    </div>
                    <span className="text-3xl font-black text-amber-800 tracking-tight">${totalPending.toFixed(2)}</span>
                    <span className="text-amber-600 text-xs font-medium mt-1">{history.filter(i => i.status === 'pending').length} Pending Invoices</span>
                </div>

                {/* Total */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart size={64} className="text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                            <FileText size={16} />
                        </div>
                        <span className="text-blue-700 text-xs font-extrabold uppercase tracking-widest">Total Invoiced</span>
                    </div>
                    <span className="text-3xl font-black text-blue-900 tracking-tight">${totalInvoiced.toFixed(2)}</span>
                    <span className="text-blue-600 text-xs font-medium mt-1">{history.length} Total Invoices</span>
                </div>
             </div>
           )}

           {/* Tabs / Filter */}
           <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-4">
              <TabButton type="all" label="All Invoices" icon={Filter} colorClass="text-slate-500" />
              <TabButton type="pending" label="Pending" icon={Clock} colorClass="text-amber-500" />
              <TabButton type="paid" label="Paid" icon={CheckCircle} colorClass="text-emerald-500" />
              <TabButton type="void" label="Void" icon={Ban} colorClass="text-slate-400" />
           </div>
           
           {filteredHistory.length === 0 ? (
             <div className="text-center text-slate-500 py-16 flex flex-col items-center bg-white rounded-xl border border-dashed border-slate-300">
               <div className="bg-slate-100 p-6 rounded-full mb-4">
                 <FileText size={48} className="text-slate-400" />
               </div>
               <p className="font-bold text-xl text-slate-700">No invoices found.</p>
               <p className="text-sm mt-2 max-w-xs text-slate-500">
                 {filter === 'all' 
                   ? 'Save your first invoice to see it here.' 
                   : `You have no ${filter} invoices.`}
               </p>
             </div>
           ) : (
             <div className="space-y-3">
               {filteredHistory.map(invoice => (
                 <div 
                   key={invoice.id} 
                   className={`bg-white p-4 rounded-lg shadow-sm border transition-all hover:shadow-md flex flex-col md:flex-row md:items-center gap-4 ${
                     invoice.status === 'paid' ? 'border-emerald-100 bg-emerald-50/10' : 
                     invoice.status === 'void' ? 'border-slate-200 bg-slate-50 opacity-70 grayscale' : 
                     'border-slate-200'
                   }`}
                 >
                    {/* Status Badge Dropdown */}
                    <div className="shrink-0 w-full md:w-auto">
                      <div className="relative group">
                        <select
                          value={invoice.status}
                          onChange={(e) => onToggleStatus(invoice.id, e.target.value as InvoiceStatus)}
                          className={`appearance-none cursor-pointer flex items-center gap-2 px-3 py-1.5 pl-8 rounded-full text-xs font-bold uppercase tracking-wider transition-all w-full md:w-32 text-center focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:ring-emerald-400' : 
                            invoice.status === 'void' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 focus:ring-slate-400 line-through decoration-2' :
                            'bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-400'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="void">Void</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                          {invoice.status === 'paid' && <CheckCircle size={14} className="text-emerald-700" />}
                          {invoice.status === 'pending' && <Clock size={14} className="text-amber-700" />}
                          {invoice.status === 'void' && <Ban size={14} className="text-slate-600" />}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoice #</p>
                        <p className={`font-bold text-slate-800 text-base truncate ${invoice.status === 'void' ? 'line-through decoration-slate-400 decoration-2' : ''}`} title={invoice.invoiceNumber}>{invoice.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</p>
                        <p className="font-medium text-slate-700 text-sm">{invoice.date}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bill To</p>
                        <p className="font-medium text-slate-700 text-sm truncate" title={invoice.billToName || 'Unknown'}>
                          {invoice.billToName || <span className="italic text-slate-400">No Name</span>}
                        </p>
                      </div>
                      <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                         <p className={`font-black text-slate-800 text-lg ${invoice.status === 'void' ? 'line-through opacity-50' : ''}`}>${invoice.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 justify-end w-full md:w-auto">
                      {invoice.status !== 'paid' && (
                        <button 
                          onClick={() => onLoad(invoice)}
                          className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50 rounded text-sm font-bold transition-colors"
                          title="Load this invoice to edit/print"
                        >
                          <RotateCcw size={16} /> <span className="hidden md:inline">Edit</span>
                        </button>
                      )}
                      {invoice.status !== 'paid' && <div className="w-px h-6 bg-slate-200 hidden md:block"></div>}
                      <button 
                        onClick={() => onDelete(invoice.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end items-center">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};
