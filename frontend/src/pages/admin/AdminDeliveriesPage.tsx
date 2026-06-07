import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../api/client';
import AdminLayout, {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  DeliveryBadge,
  PaymentBadge,
} from '../../components/admin/AdminUI';
import { AdminDelivery } from '../../types/admin';
import { STATUS_LABELS } from '../../types/order';
import { formatFcfa } from '../../utils/currency';

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api
      .get<AdminDelivery[]>('/admin/deliveries')
      .then((res) => setDeliveries(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = deliveries;
    if (statusFilter) list = list.filter((d) => d.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.pickup.toLowerCase().includes(q) ||
          d.delivery.toLowerCase().includes(q) ||
          d.driver?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [deliveries, search, statusFilter]);

  const statuses = [...new Set(deliveries.map((d) => d.status))];

  return (
    <AdminLayout
      title="Livraisons"
      description="Suivez les courses : assignation livreur, progression et paiements."
      breadcrumb={[{ label: 'Livraisons' }]}
    >
      <AdminCard noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Client, livreur, adresse…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] || s}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{filtered.length} résultat(s)</span>
        </div>

        {loading ? (
          <AdminLoading />
        ) : filtered.length === 0 ? (
          <AdminEmpty message="Aucune livraison trouvée" />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <article key={d.id} className="p-4 hover:bg-slate-50/50 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">#{d.id.slice(0, 8)}</span>
                      <DeliveryBadge status={d.status} label={STATUS_LABELS[d.status] || d.status} />
                      <PaymentBadge status={d.paymentStatus} />
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {d.pickup} → {d.delivery}
                    </p>
                    <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                      <p>Client : {d.client}</p>
                      {d.driver ? (
                        <p>
                          Livreur :{' '}
                          <Link to={`/admin/users/${d.driver.id}`} className="text-brand-700 hover:underline">
                            {d.driver.name}
                          </Link>{' '}
                          · {d.driver.email}
                        </p>
                      ) : (
                        <p className="text-amber-600">Aucun livreur assigné</p>
                      )}
                      <p>Commande : {STATUS_LABELS[d.orderStatus] || d.orderStatus}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {d.estimatedPrice != null && (
                      <p className="text-lg font-semibold tabular-nums">{formatFcfa(d.estimatedPrice)}</p>
                    )}
                    {d.paymentStatus === 'COLLECTED' && d.commissionAmount != null && (
                      <p className="mt-1 text-xs text-brand-700">Commission : {formatFcfa(d.commissionAmount)}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>Créée : {new Date(d.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  {d.acceptedAt && (
                    <span>Acceptée : {new Date(d.acceptedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  )}
                  {d.completedAt && (
                    <span>Terminée : {new Date(d.completedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
