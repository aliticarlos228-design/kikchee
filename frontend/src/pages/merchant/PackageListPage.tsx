import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package, Plus, Truck, Loader2, CheckCircle2, Link2, ChevronRight,
} from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import { LinkableOrder, PackageItem, PACKAGE_STATUS_LABELS } from '../../types/package';
import { formatFcfa } from '../../utils/currency';
import { shortRef } from '../../utils/reference';

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  CREATED: { bg: 'bg-amber-50', text: 'text-amber-800' },
  READY: { bg: 'bg-emerald-50', text: 'text-emerald-800' },
  PICKED_UP: { bg: 'bg-blue-50', text: 'text-blue-800' },
  DELIVERED: { bg: 'bg-slate-100', text: 'text-slate-700' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.CREATED;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {PACKAGE_STATUS_LABELS[status] || status}
    </span>
  );
}

export default function PackageListPage() {
  const location = useLocation();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [linkableOrders, setLinkableOrders] = useState<LinkableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Record<string, string>>({});
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  async function load() {
    try {
      const [pkgRes, ordersRes] = await Promise.all([
        api.get<PackageItem[]>('/packages'),
        api.get<LinkableOrder[]>('/packages/linkable-orders'),
      ]);
      setPackages(pkgRes.data);
      setLinkableOrders(ordersRes.data);
      setError('');
    } catch {
      setError('Impossible de charger les colis');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [location.pathname]);

  async function handleLink(packageId: string) {
    const orderId = selectedOrder[packageId];
    if (!orderId) return;
    setLinkingId(packageId);
    try {
      await api.patch(`/packages/${packageId}/link-order`, { orderId });
      setExpandedLink(null);
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Association impossible');
    } finally {
      setLinkingId(null);
    }
  }

  async function markReady(packageId: string) {
    try {
      await api.patch(`/packages/${packageId}/status`, { status: 'READY' });
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Mise à jour impossible');
    }
  }

  const stats = {
    total: packages.length,
    ready: packages.filter((p) => p.status === 'READY').length,
    pending: packages.filter((p) => p.status === 'CREATED').length,
  };

  return (
    <AppLayout title="Mes colis">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-700 to-brand-900 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70">Votre activité</p>
            <h2 className="text-2xl font-bold">{stats.total} colis</h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Package className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold">{stats.ready}</p>
            <p className="text-[10px] text-white/70">Prêts</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-[10px] text-white/70">En attente</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          to="/merchant/packages/ship"
          className="flex items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 transition hover:bg-emerald-100"
        >
          <Truck className="h-5 w-5 text-emerald-700" />
          <span className="text-sm font-semibold text-emerald-800">Expédier client</span>
        </Link>
        <Link
          to="/merchant/packages/new"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <Plus className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold text-slate-800">Nouveau colis</span>
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && packages.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">Aucun colis pour l&apos;instant</p>
          <Link
            to="/merchant/packages/ship"
            className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Expédier maintenant
          </Link>
        </div>
      )}

      <div className="space-y-2 pb-4">
        {packages.map((pkg) => (
          <article
            key={pkg.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <Link
              to={`/merchant/packages/${pkg.id}`}
              className="flex items-center gap-3 px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{shortRef(pkg.id)}</span>
                  <StatusBadge status={pkg.status} />
                  {pkg.order?.hasDriver && (
                    <span className="text-[10px] font-medium text-brand-600">Livreur ✓</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {pkg.weight} kg
                  {pkg.order?.estimatedPrice != null && ` · ${formatFcfa(pkg.order.estimatedPrice)}`}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>

            {( !pkg.orderId || (pkg.orderId && pkg.status === 'CREATED') || (pkg.status === 'READY' && !pkg.order?.hasDriver) ) && (
              <div className="border-t border-slate-100 px-3 py-2">
                {!pkg.orderId &&
                  (expandedLink === pkg.id ? (
                    <div className="space-y-2">
                      <select
                        value={selectedOrder[pkg.id] || ''}
                        onChange={(e) =>
                          setSelectedOrder({ ...selectedOrder, [pkg.id]: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Choisir une commande…</option>
                        {linkableOrders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.client} — {formatFcfa(o.estimatedPrice)}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLink(pkg.id)}
                          disabled={!selectedOrder[pkg.id] || linkingId === pkg.id}
                          className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          {linkingId === pkg.id ? '…' : 'Associer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedLink(null)}
                          className="rounded-lg border px-3 py-2 text-xs text-slate-600"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : linkableOrders.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpandedLink(pkg.id)}
                      className="flex w-full items-center justify-center gap-1 py-1 text-xs font-medium text-blue-700"
                    >
                      <Link2 className="h-3 w-3" /> Associer à une commande
                    </button>
                  ) : null)}

                {pkg.orderId && pkg.status === 'CREATED' && (
                  <button
                    type="button"
                    onClick={() => markReady(pkg.id)}
                    className="flex w-full items-center justify-center gap-1 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Marquer prêt
                  </button>
                )}

                {pkg.status === 'READY' && !pkg.order?.hasDriver && pkg.orderId && (
                  <p className="py-1 text-center text-[10px] text-slate-400">En attente livreur</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </AppLayout>
  );
}
