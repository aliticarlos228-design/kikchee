import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2 } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { DriverTermsContent } from '../../components/driver/DriverTermsPanel';
import {
  hasAcceptedDriverTerms,
  markDriverTermsAccepted,
} from '../../utils/driverTermsStorage';

export { hasAcceptedDriverTerms, markDriverTermsAccepted };

export default function DriverTermsPage() {
  const [accepted, setAccepted] = useState(hasAcceptedDriverTerms());

  function handleAccept() {
    markDriverTermsAccepted();
    setAccepted(true);
  }

  return (
    <AppLayout title="Conditions livreur">
      <Link to="/driver" className="mb-4 inline-block text-sm text-orange-600 hover:underline">
        ← Accueil livreur
      </Link>

      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <DriverTermsContent />

        <div className="mt-8 border-t border-slate-100 pt-6">
          {accepted ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Conditions acceptées — vous pouvez prendre des missions.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAccept}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 font-semibold text-white hover:bg-orange-700"
            >
              <FileText className="h-5 w-5" />
              J'accepte les conditions livreur
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
