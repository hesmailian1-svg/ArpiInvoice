import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, User, MapPin, Hash, DollarSign, Mail, RotateCcw, Sparkles, Wand2, Loader2, AlertTriangle, Save, Users, Settings, Clock, History, Printer, FileDown, FileText, FilePlus, FileCheck, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProviderHeader } from './components/ProviderHeader';
import { InvoiceControls } from './components/InvoiceControls';
import { MagicAddModal } from './components/MagicAddModal';
import { CustomerManagerModal } from './components/CustomerManagerModal';
import { InvoiceHistoryModal } from './components/InvoiceHistoryModal';
import { InvoiceCustomizationModal } from './components/InvoiceCustomizationModal';
import { polishText, parseInvoiceItems } from './ai-service';
import { InvoiceData, InvoiceItem, Customer, SavedInvoice, InvoiceStatus, DEFAULT_MILEAGE_RATE } from './types';
import { SERVICE_OPTIONS, DEFAULT_TERMS } from './constants';

// Declare globals loaded via CDN
declare var html2pdf: any;

const SortableItem = ({ item, index, updateItem, removeItem }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-white'}`}>
      <td className="p-2 cursor-grab" {...attributes} {...listeners}><GripVertical size={16} className="text-slate-300" /></td>
      <td className="p-2"><input type="date" className="w-full outline-none bg-transparent" value={item.date} onChange={(e) => updateItem(item.id, 'date', e.target.value)} /></td>
      <td className="p-2"><input type="text" placeholder="Patient" className="w-full font-bold outline-none bg-transparent" value={item.patientName} onChange={(e) => updateItem(item.id, 'patientName', e.target.value)} /></td>
      <td className="p-2">
        <select className="w-full font-bold text-blue-900 outline-none bg-transparent appearance-none" value={item.serviceName} onChange={(e) => updateItem(item.id, 'serviceName', e.target.value)}>
          {SERVICE_OPTIONS.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
        </select>
        <input type="text" placeholder="Add note..." className="w-full text-[10px] text-slate-500 outline-none bg-transparent mt-1" value={item.smallNote || ''} onChange={(e) => updateItem(item.id, 'smallNote', e.target.value)} />
      </td>
      <td className="p-2 text-center"><input type="number" className="w-full text-center outline-none bg-transparent" value={item.miles} onChange={(e) => updateItem(item.id, 'miles', parseFloat(e.target.value) || 0)} /></td>
      <td className="p-2 text-center"><input type="number" className="w-full text-center outline-none bg-transparent" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} /></td>
      <td className="p-2 pt-4 text-right flex flex-row items-center justify-end gap-0.5">
        <span className="text-[9px] text-slate-400">$</span>
        <input type="number" className="w-16 text-right outline-none bg-transparent font-bold" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
      </td>
      <td className="p-2 pt-3 text-right font-black text-rose-600 text-sm">${(item.quantity * item.rate).toFixed(2)}</td>
      <td className="no-print text-center"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></td>
    </tr>
  );
};

const App: React.FC = () => {
  // --- State Initialization ---
  const [data, setData] = useState<InvoiceData>(() => {
    const saved = localStorage.getItem('invoiceData');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.paymentTerms && (parsed.paymentTerms.includes("Please make checks payable") || parsed.paymentTerms.includes("Arpi Moradi"))) {
        parsed.paymentTerms = DEFAULT_TERMS;
      }
      return parsed;
    }

    return {
      invoiceNumber: '2310',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billToName: '',
      billToAddress: '',
      billToPhone: '',
      billToEmail: '',
      mileageRate: DEFAULT_MILEAGE_RATE,
      items: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          patientName: '',
          serviceName: SERVICE_OPTIONS[0].name,
          description: '',
          quantity: 1,
          rate: SERVICE_OPTIONS[0].defaultRate,
          miles: 0,
        }
      ],
      notes: '',
      paymentTerms: DEFAULT_TERMS,
      logoUrl: '',
      footerText: ''
    };
  });

  const [savedCustomers, setSavedCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('savedCustomers');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoiceHistory, setInvoiceHistory] = useState<SavedInvoice[]>(() => {
    const saved = localStorage.getItem('invoiceHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isCustomerManagerOpen, setIsCustomerManagerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [isPolishingNotes, setIsPolishingNotes] = useState(false);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

  const matchingCustomer = data.billToName 
    ? savedCustomers.find(c => c.name.trim().toLowerCase() === data.billToName.trim().toLowerCase()) 
    : null;

  useEffect(() => {
    localStorage.setItem('invoiceData', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('savedCustomers', JSON.stringify(savedCustomers));
  }, [savedCustomers]);

  useEffect(() => {
    localStorage.setItem('invoiceHistory', JSON.stringify(invoiceHistory));
  }, [invoiceHistory]);

  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalMiles = data.items.reduce((sum, item) => sum + item.miles, 0);
  const mileageTotal = totalMiles > 20 ? totalMiles * 0.70 : 0;
  const grandTotal = subtotal + mileageTotal;

  const formattedDueDate = new Date(data.dueDate).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const updateField = (field: keyof InvoiceData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          date: prev.date,
          patientName: '',
          serviceName: SERVICE_OPTIONS[0].name,
          description: '',
          smallNote: '',
          quantity: 1,
          rate: SERVICE_OPTIONS[0].defaultRate,
          miles: 0,
        }
      ]
    }));
  };

  const handleNewInvoice = (skipConfirm = false) => {
    if (skipConfirm || confirm("Create a new invoice?")) {
      const historyNumbers = invoiceHistory.map(inv => parseInt(inv.invoiceNumber)).filter(n => !isNaN(n));
      const currentInvoiceNumber = parseInt(data.invoiceNumber);
      
      const maxNumber = Math.max(...historyNumbers, currentInvoiceNumber, 2309);
      const nextNum = maxNumber + 1;

      setData(prev => ({
        ...prev,
        invoiceNumber: nextNum.toString(),
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billToName: '',
        billToAddress: '',
        billToPhone: '',
        billToEmail: '',
        items: [{
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          patientName: '',
          serviceName: SERVICE_OPTIONS[0].name,
          description: '',
          smallNote: '',
          quantity: 1,
          rate: SERVICE_OPTIONS[0].defaultRate,
          miles: 0,
        }],
        notes: '',
      }));
    }
  };

  const handleMagicAddItems = (newItems: any[]) => {
    const formattedItems: InvoiceItem[] = newItems.map(item => {
      const matchedService = SERVICE_OPTIONS.find(s => 
        s.name.toLowerCase() === item.serviceName?.toLowerCase() || 
        (item.serviceName && s.name.toLowerCase().includes(item.serviceName.toLowerCase()))
      );
      return {
        id: crypto.randomUUID(),
        date: item.date || data.date,
        patientName: item.patientName || '',
        serviceName: matchedService ? matchedService.name : (item.serviceName || SERVICE_OPTIONS[0].name),
        description: item.description || '',
        smallNote: item.smallNote || '',
        quantity: item.quantity || 1,
        rate: matchedService ? matchedService.defaultRate : 0,
        miles: item.miles || 0
      };
    });
    setData(prev => ({ ...prev, items: [...prev.items, ...formattedItems] }));
  };

  const handlePolishNotes = async () => {
    if (!data.notes.trim()) return;
    setIsPolishingNotes(true);
    try {
      const polished = await polishText(data.notes);
      updateField('notes', polished);
    } catch (error) {
      console.error(error);
      alert("AI Service error.");
    } finally {
      setIsPolishingNotes(false);
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        if (field === 'serviceName') {
          const service = SERVICE_OPTIONS.find(s => s.name === value);
          if (service) return { ...item, [field]: value, rate: service.defaultRate };
        }
        return { ...item, [field]: value };
      })
    }));
  };

  const removeItem = (id: string) => {
    if (data.items.length === 1) return;
    setData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setData(prev => {
        const oldIndex = prev.items.findIndex(item => item.id === active.id);
        const newIndex = prev.items.findIndex(item => item.id === over.id);
        return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) };
      });
    }
  };

  const handleSaveCustomer = () => {
    if (!data.billToName) return alert("Enter Agency Name first.");
    const newCustomer: Customer = { id: crypto.randomUUID(), name: data.billToName, address: data.billToAddress, phone: data.billToPhone, email: data.billToEmail };
    const existingIndex = savedCustomers.findIndex(c => c.name.toLowerCase() === newCustomer.name.toLowerCase());
    if (existingIndex >= 0) {
      if (confirm(`Update client "${newCustomer.name}"?`)) {
        const updated = [...savedCustomers];
        updated[existingIndex] = newCustomer;
        setSavedCustomers(updated);
      }
    } else {
      setSavedCustomers(prev => [...prev, newCustomer]);
    }
  };

  const handleLoadCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customer = savedCustomers.find(c => c.id === e.target.value);
    if (customer) {
      setData(prev => ({ ...prev, billToName: customer.name, billToAddress: customer.address, billToPhone: customer.phone, billToEmail: customer.email }));
    }
  };

  const handleSaveToHistory = () => {
    const newRecord: SavedInvoice = { ...data, id: crypto.randomUUID(), savedAt: new Date().toISOString(), status: 'pending', totalAmount: grandTotal };
    const existingIndex = invoiceHistory.findIndex(i => i.invoiceNumber === data.invoiceNumber);
    if (existingIndex >= 0) {
      if (confirm(`Invoice #${data.invoiceNumber} already exists. Overwrite?`)) {
        const updated = [...invoiceHistory];
        newRecord.status = updated[existingIndex].status; 
        updated[existingIndex] = newRecord;
        setInvoiceHistory(updated);
      }
    } else {
      setInvoiceHistory(prev => [newRecord, ...prev]);
      if (confirm("Invoice saved to history. Would you like to start a new invoice?")) {
        handleNewInvoice(true); // Passing true to skip confirm inside handleNewInvoice if we already confirmed here
      }
    }
  };

  const handleDownloadPDF = () => {
    setIsDownloadOptionsOpen(false);
    const element = document.getElementById('invoice-container');
    if (!element) return;
    const opt = {
      margin: 0,
      filename: `Invoice_${data.invoiceNumber || 'Draft'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white pb-24 md:pb-0">
      <MagicAddModal isOpen={isMagicModalOpen} onClose={() => setIsMagicModalOpen(false)} onAddItems={handleMagicAddItems} defaultDate={data.date} />
      <CustomerManagerModal isOpen={isCustomerManagerOpen} onClose={() => setIsCustomerManagerOpen(false)} customers={savedCustomers} onUpdateCustomer={(c) => setSavedCustomers(prev => prev.map(old => old.id === c.id ? c : old))} onDeleteCustomer={(id) => setSavedCustomers(prev => prev.filter(c => c.id !== id))} />
      <InvoiceHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={invoiceHistory} onLoad={(inv) => { const { id, savedAt, status, totalAmount, ...loaded } = inv; setData(loaded); setIsHistoryModalOpen(false); }} onToggleStatus={(id, s) => setInvoiceHistory(p => p.map(i => i.id === id ? {...i, status: s} : i))} onDelete={(id) => confirm("Delete?") && setInvoiceHistory(p => p.filter(i => i.id !== id))} />
      <InvoiceCustomizationModal isOpen={isCustomizationModalOpen} onClose={() => setIsCustomizationModalOpen(false)} data={data} onUpdate={updateField} />

      {isDownloadOptionsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-900"><Printer size={24} /> Export Options</h3>
            <div className="space-y-3">
              <button onClick={handleDownloadPDF} className="w-full flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors group">
                <div className="text-left"><span className="block font-bold text-rose-900 text-lg">PDF Document</span><span className="block text-xs text-rose-700">Highest quality for printing</span></div>
                <FileCheck size={24} className="text-rose-600" />
              </button>
            </div>
            <button onClick={() => setIsDownloadOptionsOpen(false)} className="mt-6 w-full py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <InvoiceControls 
        onSaveToHistory={handleSaveToHistory} 
        onDownload={() => setIsDownloadOptionsOpen(true)} 
        onNewInvoice={() => handleNewInvoice()}
        hasEmail={!!data.billToEmail} 
      />

      <div className="container mx-auto max-w-4xl flex justify-between px-4 pt-6 md:px-0 no-print">
        <div className="flex gap-2">
           <button onClick={() => handleNewInvoice()} className="flex items-center gap-2 text-white font-bold bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg shadow-md"><FilePlus size={18} />New Invoice</button>
           <button onClick={handleSaveToHistory} className="flex items-center gap-2 text-slate-700 font-bold bg-white hover:bg-slate-50 px-4 py-2 rounded-lg shadow-sm border border-slate-200"><Save size={18} />Save</button>
           <button onClick={() => setIsCustomizationModalOpen(true)} className="flex items-center gap-2 text-slate-700 font-bold bg-white hover:bg-slate-50 px-4 py-2 rounded-lg shadow-sm border border-slate-200"><Settings size={18} />Customize</button>
        </div>
        <button onClick={() => setIsHistoryModalOpen(true)} className="flex items-center gap-2 text-slate-600 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"><History size={18} />View History</button>
      </div>

      <main className="container mx-auto max-w-4xl p-4 md:py-8 lg:px-0 no-print:pb-32 print:p-0">
        <div id="invoice-container" className="bg-white shadow-xl rounded-xl p-8 md:p-10 print:shadow-none print:p-8 print:rounded-none mx-auto w-full">
          
          {data.logoUrl && (
            <div className="mb-6">
              <img src={data.logoUrl} alt="Logo" className="max-h-24" />
            </div>
          )}

          <ProviderHeader />

          <div className="grid grid-cols-2 gap-10 mb-8">
            {/* Bill To */}
            <div className="bg-slate-50/50 rounded-lg p-5 border border-slate-100 print:bg-transparent print:border-none print:p-0">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Bill To</h2>
                <div className="flex gap-2 no-print">
                   <select onChange={handleLoadCustomer} value="" className="text-[10px] font-bold py-1 px-2 rounded border border-blue-200 bg-blue-50 text-blue-900 outline-none">
                     <option value="" disabled>Saved Clients</option>
                     {savedCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <button onClick={handleSaveCustomer} className="p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200"><Save size={14} /></button>
                </div>
              </div>
              <div className="space-y-2">
                <input type="text" placeholder="Company Name" className="w-full font-bold text-xl text-slate-900 border-b border-dashed border-slate-200 focus:border-blue-700 outline-none pb-1" value={data.billToName} onChange={(e) => updateField('billToName', e.target.value)} />
                <textarea placeholder="Address" className="w-full text-sm font-medium text-slate-700 border-b border-dashed border-slate-200 focus:border-blue-700 outline-none leading-relaxed" rows={2} value={data.billToAddress} onChange={(e) => updateField('billToAddress', e.target.value)} />
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Mail size={12} className="text-indigo-400 shrink-0" />
                  <input type="email" placeholder="Email Address" className="w-full border-b border-dashed border-slate-200 focus:border-blue-700 outline-none" value={data.billToEmail} onChange={(e) => updateField('billToEmail', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-col items-end pt-2">
              <h2 className="text-4xl font-black text-blue-900 uppercase tracking-tighter mb-4">Invoice</h2>
              <div className="w-full max-w-[200px] space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1 text-sm">
                  <label className="font-bold text-slate-400">Invoice #</label>
                  <input type="text" className="text-right font-mono font-bold w-24 outline-none" value={data.invoiceNumber} onChange={(e) => updateField('invoiceNumber', e.target.value)} />
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1 text-sm">
                  <label className="font-bold text-slate-400">Date</label>
                  <input type="date" className="text-right font-bold w-32 outline-none" value={data.date} onChange={(e) => updateField('date', e.target.value)} />
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1 text-sm">
                  <label className="font-bold text-slate-400">Due Date</label>
                  <input type="date" className="text-right font-bold w-32 text-rose-600 outline-none" value={data.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.items} strategy={verticalListSortingStrategy}>
              <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white print:bg-slate-800">
                      <th className="py-2 px-3 text-left font-bold uppercase w-[5%]"></th>
                      <th className="py-2 px-3 text-left font-bold uppercase w-[15%]">Date</th>
                      <th className="py-2 px-3 text-left font-bold uppercase w-[20%]">Patient</th>
                      <th className="py-2 px-3 text-left font-bold uppercase w-[30%]">Service</th>
                      <th className="py-2 px-2 text-center font-bold uppercase w-[8%]">Miles</th>
                      <th className="py-2 px-2 text-center font-bold uppercase w-[7%]">Qty</th>
                      <th className="py-2 px-3 text-right font-bold uppercase w-[10%]">Rate</th>
                      <th className="py-2 px-3 text-right font-bold uppercase w-[10%]">Amount</th>
                      <th className="no-print w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, i) => (
                      <SortableItem key={item.id} item={item} index={i} updateItem={updateItem} removeItem={removeItem} />
                    ))}
                  </tbody>
                </table>
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2 mb-8 no-print">
            <button onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"><Plus size={14} /> Add Line</button>
            <button onClick={() => setIsMagicModalOpen(true)} className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"><Sparkles size={14} /> Magic Add</button>
          </div>

          <div className="grid grid-cols-2 gap-10 print-break-inside-avoid">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</h3>
                  <button onClick={handlePolishNotes} disabled={isPolishingNotes} className="text-[10px] font-bold text-blue-600 no-print flex items-center gap-1">{isPolishingNotes ? '...' : <Wand2 size={10} />} AI Polish</button>
                </div>
                <textarea className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded focus:outline-none focus:border-blue-700 print:bg-transparent print:p-0 print:border-none" rows={3} value={data.notes} onChange={(e) => updateField('notes', e.target.value)} />
              </div>
              <div className="bg-slate-900 text-white p-4 rounded-lg print:bg-transparent print:text-black print:p-0 print:border-t print:border-slate-100 print:pt-4">
                <input className="w-full font-bold text-sm bg-transparent outline-none mb-1" value={data.paymentTerms} onChange={(e) => updateField('paymentTerms', e.target.value)} />
                <div className="text-xs font-medium text-rose-400 print:text-rose-600 uppercase tracking-wider">Due By {formattedDueDate}</div>
                <div className="mt-3 p-2 bg-blue-600 rounded text-white font-bold text-sm border-2 border-blue-400 print:bg-transparent print:text-black print:border-black">
                  Zelle Payment to: Arpi@bloomdrip.com
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Service Subtotal</span>
                <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Mileage Reimbursement ({totalMiles > 20 ? totalMiles : 0} mi)</span>
                <span className="font-bold text-slate-800">${mileageTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-4">
                <span className="text-xl font-black text-slate-800 uppercase tracking-tight">Invoice Total</span>
                <span className="text-4xl font-black text-rose-600 leading-none">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {data.footerText && (
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
              {data.footerText}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;