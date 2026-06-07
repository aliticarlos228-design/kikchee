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
import { AdminOrder, PAYMENT_STATUS_LABELS } from '../../types/admin';
import { STATUS_LABELS } from '../../types/order';
import { PACKAGE_STATUS_LABELS } from '../../types/package';
import { formatFcfa } from '../../utils/currency';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api
      .get<AdminOrder[]>('/admin/orders')
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.pickup.toLowerCase().includes(q) ||
          o.delivery.toLowerCase().includes(q) ||
          o.client?.name.toLowerCase().includes(q) ||
          o.client?.email.toLowerCase().includes(q) ||
          o.driver?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, statusFilter]);

  const statuses = [...new Set(orders.map((o) => o.status))];

  return (
    <AdminLayout
      title="Commandes"
      description="Consultez l'état de toutes les commandes, paiements et livreurs assignés."
      breadcrumb={[{ label: 'Commandes' }]}
    >
      <AdminCard noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="ID, client, adresse…"
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
          <AdminEmpty message="Aucune commande trouvée" />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((order) => (
              <article key={order.id} className="p-4 hover:bg-slate-50/50 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
                      <DeliveryBadge status={order.status} label={STATUS_LABELS[order.status] || order.status} />
                      <PaymentBadge status={order.paymentStatus} />
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {order.pickup} → {order.delivery}
                    </p>
                    <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                      {order.client && (
                        <p>
                          Client : {order.client.name} · {order.client.email} · {order.weight} kg
                        </p>
                      )}
                      {order.merchant && <p>Commerçant : {order.merchant}</p>}
                      {order.driver && (
                        <p>
                          Livreur :{' '}
                          <Link to={`/admin/users/${order.driver.id}`} className="text-brand-700 hover:underline">
                            {order.driver.name}
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {order.estimatedPrice != null && (
                      <p className="text-lg font-semibold tabular-nums text-slate-900">{formatFcfa(order.estimatedPrice)}</p>
                    )}
                    {order.paymentStatus === 'COLLECTED' && order.commissionAmount != null && (
                      <p className="mt-1 text-xs text-brand-700">
                        Commission : {formatFcfa(order.commissionAmount)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                {(order.deliveryStatus || order.packageStatus) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    {order.deliveryStatus && (
                      <span>Livraison : {STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}</span>
                    )}
                    {order.packageStatus && (
                      <span>Colis : {PACKAGE_STATUS_LABELS[order.packageStatus] || order.packageStatus}</span>
                    )}
                    <span>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
