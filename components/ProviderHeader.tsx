import React from 'react';
import { PROVIDER_INFO } from '../constants';

const CaduceusLogo = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-20 md:h-20 text-blue-900 drop-shadow-sm shrink-0" fill="currentColor">
    {/* Staff */}
    <rect x="47" y="10" width="6" height="85" rx="3" />
    <circle cx="50" cy="10" r="8" />
    
    {/* Wings */}
    <path d="M50 35 C 80 15, 95 25, 90 40 C 85 55, 60 50, 53 45" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    <path d="M50 35 C 20 15, 5 25, 10 40 C 15 55, 40 50, 47 45" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    
    {/* Snakes */}
    <path d="M50 90 C 75 80, 75 60, 50 50 C 25 40, 25 20, 50 15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 90 C 25 80, 25 60, 50 50 C 75 40, 75 20, 50 15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const ProviderHeader: React.FC = () => {
  return (
    <header className="flex flex-row justify-between items-center border-b-2 border-blue-900 pb-4 mb-6 w-full min-w-0 print:border-b-2 print:pb-4 print:mb-6">
      <div className="flex items-center gap-4 text-left shrink-0">
        <CaduceusLogo />
        <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-serif font-black text-blue-900 tracking-tight leading-none whitespace-nowrap print:text-4xl">
                Arpi Moradi
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-rose-600 font-black tracking-widest text-lg md:text-xl">RN</span>
                <span className="h-4 w-px bg-slate-300"></span>
                <span className="text-blue-900/80 font-bold text-xs uppercase tracking-widest whitespace-nowrap">Registered Nurse</span>
            </div>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <div className="flex flex-col items-end">
            <p className="font-bold text-sm md:text-base text-slate-800 whitespace-pre-line leading-snug">{PROVIDER_INFO.address}</p>
            <p className="text-sm text-slate-600 font-medium mt-0.5">📞 {PROVIDER_INFO.phone}</p>
            <p className="text-sm text-blue-800 font-bold">📧 {PROVIDER_INFO.email}</p>
        </div>
      </div>
    </header>
  );
};