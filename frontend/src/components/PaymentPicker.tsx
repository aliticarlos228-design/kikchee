import { Banknote, Smartphone } from 'lucide-react';
import { PAYMENT_OPTIONS, PaymentMethod } from '../constants/payment';

const METHODS: PaymentMethod[] = ['CASH', 'MOBILE_MONEY'];

function PaymentIcon({ method, className }: { method: PaymentMethod; className?: string }) {
  if (method === 'CASH') return <Banknote className={className} strokeWidth={2} />;
  return <Smartphone className={className} strokeWidth={2} />;
}

interface PaymentPickerProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export default function PaymentPicker({ value, onChange }: PaymentPickerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-800">Paiement à la livraison</p>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {METHODS.map((method) => {
          const active = value === method;
          const opt = PAYMENT_OPTIONS[method];
          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange(method)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg px-2 py-3 transition ${
                active
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PaymentIcon method={method} className={`h-5 w-5 ${active ? 'text-brand-600' : ''}`} />
              <span className="text-xs font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">{PAYMENT_OPTIONS[value].hint}.</p>
    </div>
  );
}
