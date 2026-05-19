
export interface ServiceOption {
  id: string;
  name: string;
  defaultRate: number;
}

export interface InvoiceItem {
  id: string;
  date: string;
  patientName: string;
  serviceName: string; // Can be from dropdown or custom
  description: string;
  smallNote?: string;
  quantity: number;
  rate: number;
  miles: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billToName: string;
  billToAddress: string;
  billToPhone: string;
  billToEmail: string;
  mileageRate: number;
  items: InvoiceItem[];
  notes: string;
  paymentTerms: string;
  logoUrl?: string;
  footerText?: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'void';

export interface SavedInvoice extends InvoiceData {
  id: string; // Unique ID for the saved record
  savedAt: string; // ISO date string
  status: InvoiceStatus;
  totalAmount: number; // Stored for quick display in lists
}

export const DEFAULT_MILEAGE_RATE = 0.67; // 2024 IRS Standard
