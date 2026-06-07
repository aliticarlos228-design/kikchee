import { X } from 'lucide-react';
import { DRIVER_TERMS_FOOTER, DRIVER_TERMS_SECTIONS, DRIVER_TERMS_TITLE } from '../../constants/driverTerms';

interface DriverTermsContentProps {
  compact?: boolean;
}

export function DriverTermsContent({ compact }: DriverTermsContentProps) {
  return (
    <div className={compact ? 'space-y-4 text-sm' : 'space-y-5'}>
      <div>
        <h2 className={`font-bold text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}>{DRIVER_TERMS_TITLE}</h2>
        <p className="mt-1 text-xs text-slate-500">À lire attentivement avant d'accepter des missions</p>
      </div>
      {DRIVER_TERMS_SECTIONS.map((section) => (
        <section key={section.title}>
          <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.body}</p>
        </section>
      ))}
      <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">{DRIVER_TERMS_FOOTER}</p>
    </div>
  );
}

export function DriverTermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Conditions livreur</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Fermer">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <DriverTermsContent compact />
        </div>
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
