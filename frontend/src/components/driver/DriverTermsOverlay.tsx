import { useState } from 'react';
import { DriverTermsContent } from './DriverTermsPanel';
import { markDriverTermsAccepted } from '../../utils/driverTermsStorage';

/** Popup bloquante (style cookies) — affichée à la première visite de l'espace livreur. */
export default function DriverTermsOverlay({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);

  function handleValidate() {
    if (!checked) return;
    markDriverTermsAccepted();
    onAccepted();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-terms-title"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <p id="driver-terms-title" className="text-base font-semibold text-slate-900">
            Conditions partenaire livreur
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Veuillez lire le document ci-dessous avant d'utiliser l'application
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DriverTermsContent compact />
        </div>

        <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              J'ai lu et j'accepte les conditions livreur, y compris la redevance de 20 % sur chaque
              course payée.
            </span>
          </label>
          <button
            type="button"
            disabled={!checked}
            onClick={handleValidate}
            className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Valider et continuer
          </button>
        </div>
      </div>
    </div>
  );
}
