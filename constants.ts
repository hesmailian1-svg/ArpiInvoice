
import { ServiceOption } from './types';

export const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'soc', name: 'Start of Care (SOC)', defaultRate: 150.00 },
  { id: 'recert', name: 'Recertification', defaultRate: 125.00 },
  { id: 'roc', name: 'Resumption of Care (ROC)', defaultRate: 130.00 },
  { id: 'sn', name: 'Skilled Nursing Visit', defaultRate: 85.00 },
  { id: 'dc', name: 'Discharge', defaultRate: 100.00 },
  { id: 'iv', name: 'IV Service', defaultRate: 110.00 },
  { id: 'eval', name: 'Evaluation', defaultRate: 95.00 },
  { id: 'wound', name: 'Wound Care', defaultRate: 90.00 },
  { id: 'meds', name: 'Medication Management', defaultRate: 65.00 },
  { id: 'teach', name: 'Patient Teaching/Training', defaultRate: 75.00 },
  { id: 'supervision', name: 'HHA Supervision', defaultRate: 60.00 },
  { id: 'other', name: 'Other', defaultRate: 0.00 },
];

export const PROVIDER_INFO = {
  name: "Arpi Moradi, RN",
  title: "Registered Nurse",
  address: "5239 Harter Lane\nLa Canada, CA 91101",
  phone: "818-515-8980",
  email: "amoradi2310@gmail.com"
};

export const DEFAULT_TERMS = "Make Check Payable to Bloom Drip Co";
