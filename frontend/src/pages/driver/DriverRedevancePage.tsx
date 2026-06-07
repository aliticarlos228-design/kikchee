import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import { DriverLedger } from '../../types/admin';
import { formatFcfa } from '../../utils/currency';
import { COMMISSION_RATE } from '../../constants/payment';
import { PAYMENT_OPTIONS } from '../../constants/payment';

export default function DriverRedevancePage() {
  const [ledger, setLedger] = useState<DriverLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DriverLedger>('/deliveries/redevance')
      .then((res) => setLedger(res.data))
      .catch(() => setError('Impossible de charger vos redevances'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Mes redevances">
      <Link to="/driver" className="mb-4 inline-block text-sm text-orange-600 hover:underline">
        ← Accueil livreur
      </Link>

      <p className="mb-4 text-sm text-slate-600">
        Sur chaque course payée, vous encaissez le montant total et devez reverser{' '}
        <strong>{Math.round(COMMISSION_RATE * 100)} %</strong> à kikchee.{' '}
        <Link to="/driver/terms" className="font-medium text-orange-600 hover:underline">
          Lire les conditions livreur
        </Link>
      </p>

      {loading && <p className="text-slate-500">Chargement...</p>}
      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {ledger && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Courses payées" value={String(ledger.paidTripsCount)} />
            <Stat label="Total encaissé" value={formatFcfa(ledger.totalCollected)} />
            <Stat label="Votre net" value={formatFcfa(ledger.totalDriverNet)} />
            <Stat label="À reverser à kikchee" value={formatFcfa(ledger.totalCommissionDue)} highlight />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Votre net</th>
                  <th className="p-3">Redevance kikchee</th>
                </tr>
              </thead>
              <tbody>
                {ledger.trips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Aucune course payée pour l'instant
                    </td>
                  </tr>
                )}
                {ledger.trips.map((trip) => (
                  <tr key={trip.orderId} className="border-b last:border-0">
                    <td className="p-3 text-slate-500">
                      {(trip.completedAt ? new Date(trip.completedAt) : new Date(trip.createdAt)).toLocaleDateString(
                        'fr-FR'
                      )}
                    </td>
                    <td className="p-3">{trip.client?.name ?? '—'}</td>
                    <td className="p-3 font-medium">{formatFcfa(trip.amount)}</td>
                    <td className="p-3 text-green-700">{formatFcfa(trip.driverNet)}</td>
                    <td className="p-3 font-medium text-orange-700">{formatFcfa(trip.commission)}</td>
                  </tr>
                ))}
              </tbody>
              {ledger.trips.length > 0 && (
                <tfoot className="border-t bg-orange-50 font-semibold">
                  <tr>
                    <td className="p-3" colSpan={2}>
                      Total dû à kikchee
                    </td>
                    <td className="p-3">{formatFcfa(ledger.totalCollected)}</td>
                    <td className="p-3">{formatFcfa(ledger.totalDriverNet)}</td>
                    <td className="p-3 text-orange-700">{formatFcfa(ledger.totalCommissionDue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Paiements en{' '}
            {Object.values(PAYMENT_OPTIONS)
              .map((o) => o.label.toLowerCase())
              .join(' ou ')}
            . Contactez kikchee pour régler vos redevances.
          </p>
        </>
      )}
    </AppLayout>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? 'text-orange-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
