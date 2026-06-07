import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Package, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import { formatFcfa } from '../../utils/currency';
import { OrderSummary, STATUS_LABELS } from '../../types/order';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ASSIGNED: 'bg-sky-100 text-sky-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-200 text-slate-600',
  FAILED: 'bg-red-100 text-red-700',
};

const ONGOING = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'ACCEPTED', 'IN_PROGRESS'];

type Filter = 'all' | 'ongoing' | 'done';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'ongoing', label: 'En cours' },
  { id: 'done', label: 'Terminées' },
];

export default function OrderListPage() {
  const location = useLocation();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    setLoading(true);
    api
      .get<OrderSummary[]>('/orders')
      .then((res) => setOrders(res.data))
      .catch(() => setError('Impossible de charger les commandes'))
      .finally(() => setLoading(false));
  }, [location.pathname]);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    const ongoing = filter === 'ongoing';
    return orders.filter((o) => ONGOING.includes(o.status) === ongoing);
  }, [orders, filter]);

  return (
    <AppLayout title="Mes commandes">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link
          to="/client/orders/new"
          className="hidden items-center gap-1 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-brand-900 hover:bg-amber-300 sm:flex"
        >
          <Plus className="h-4 w-4" /> Nouvelle
        </Link>
      </div>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-slate-500">Aucune commande dans cette catégorie.</p>
          <Link
            to="/client/orders/new"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Créer une commande
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((order) => (
          <Link
            key={order.id}
            to={`/client/orders/${order.id}`}
            className="card-hover block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {order.pickup} <ArrowRight className="inline h-3 w-3 text-slate-400" /> {order.delivery}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleString('fr-FR')} · {order.weight} kg
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            {order.estimatedPrice != null && (
              <p className="mt-3 text-lg font-bold text-brand-700">{formatFcfa(order.estimatedPrice)}</p>
            )}
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
