import React, { useState } from 'react';
import { X, Edit2, Trash2, Save, Users, Settings } from 'lucide-react';
import { Customer } from '../types';

interface CustomerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerManagerModal: React.FC<CustomerManagerModalProps> = ({
  isOpen, onClose, customers, onUpdateCustomer, onDeleteCustomer
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Customer | null>(null);

  if (!isOpen) return null;

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditForm({ ...customer });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm) {
      onUpdateCustomer(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      onDeleteCustomer(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-blue-900 p-6 flex justify-between items-center text-white shrink-0 rounded-t-xl">
           <div className="flex items-center gap-3">
             <Settings size={24} />
             <h2 className="text-xl font-bold">Manage Saved Clients</h2>
           </div>
           <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
           {customers.length === 0 ? (
             <div className="text-center text-slate-500 py-10 flex flex-col items-center">
               <div className="bg-slate-200 p-4 rounded-full mb-4">
                 <Users size={32} className="text-slate-400" />
               </div>
               <p className="font-bold text-lg">No clients saved yet.</p>
               <p className="text-sm mt-2 max-w-xs">Use the <span className="font-bold text-emerald-600">Save</span> button on the invoice form to add clients to this list.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {customers.map(customer => (
                 <div key={customer.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 transition-all hover:shadow-md">
                    {editingId === customer.id && editForm ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Editing Client</span>
                        </div>
                        <input
                          className="w-full p-2 border border-slate-300 rounded text-sm font-bold focus:border-blue-500 focus:outline-none"
                          value={editForm.name}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          placeholder="Company / Agency Name"
                        />
                        <textarea
                          className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none resize-none"
                          value={editForm.address}
                          onChange={e => setEditForm({...editForm, address: e.target.value})}
                          placeholder="Address"
                          rows={2}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <input
                            className="p-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            value={editForm.phone}
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            placeholder="Phone Number"
                           />
                           <input
                            className="p-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            value={editForm.email}
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                            placeholder="Email Address"
                           />
                        </div>
                        <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-3">
                          <button 
                            onClick={cancelEdit} 
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={saveEdit} 
                            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm"
                          >
                            <Save size={16} /> Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-lg text-slate-800">{customer.name}</h3>
                          <p className="text-sm text-slate-600 whitespace-pre-line mt-1">{customer.address || "No address saved"}</p>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {customer.phone && (
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {customer.phone}
                              </span>
                            )}
                            {customer.email && (
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => startEdit(customer)} 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id)} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                 </div>
               ))}
             </div>
           )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
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
