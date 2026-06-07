import { useEffect, useState } from 'react';
import { Users, Wallet, Package, Truck } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AdminLayout, {
  AdminKpi,
  AdminCard,
  AdminQuickLink,
  AdminLoading,
  AdminAlert,
  StatRow,
} from '../../components/admin/AdminUI';
import { AdminStats, ROLE_LABELS } from '../../types/admin';
import { STATUS_LABELS } from '../../types/order';
import { formatFcfa } from '../../utils/currency';
import { COMMISSION_RATE } from '../../constants/payment';

export default function AdminHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<AdminStats>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Impossible de charger les statistiques'))
      .finally(() => setLoading(false));
  }, []);

  const orderTotal = stats
    ? Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0)
    : 0;
  const userTotal = stats ? Object.values(stats.usersByRole).reduce((a, b) => a + b, 0) : 0;

  return (
    <AdminLayout
      title="Tableau de bord"
      heading={`Bonjour, ${user?.firstName ?? 'Admin'}`}
      description="Vue d'ensemble de la plateforme kikchee — utilisateurs, opérations et revenus."
    >
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions rapides</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminQuickLink to="/admin/users" icon={Users} title="Utilisateurs" desc="Créer, activer ou supprimer un compte" />
          <AdminQuickLink to="/admin/finances" icon={Wallet} title="Finances" desc="Paiements et commissions 20 %" />
          <AdminQuickLink to="/admin/orders" icon={Package} title="Commandes" desc="Suivi de toutes les commandes" />
          <AdminQuickLink to="/admin/deliveries" icon={Truck} title="Livraisons" desc="État des courses en cours" />
        </div>
      </section>

      {loading && <AdminLoading />}
      {error && <AdminAlert message={error} />}

      {stats && (
        <>
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Activité</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminKpi label="Utilisateurs inscrits" value={stats.totalUsers} hint={`${stats.onlineUsers} en ligne`} />
              <AdminKpi label="Comptes actifs" value={stats.activeUsers} hint={`${stats.inactiveUsers} désactivés`} variant="success" />
              <AdminKpi label="Commandes totales" value={stats.totalOrders} hint={`${stats.pendingOrders} en attente`} />
              <AdminKpi label="Courses payées" value={stats.paidOrdersCount} hint={`${stats.completedDeliveries} livrées`} variant="warning" />
            </div>
          </section>

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Revenus</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminKpi label="Chiffre d'affaires" value={formatFcfa(stats.totalRevenue)} variant="revenue" />
              <AdminKpi
                label={`Commission kikchee (${Math.round(COMMISSION_RATE * 100)} %)`}
                value={formatFcfa(stats.totalCommission)}
                variant="revenue"
              />
              <AdminKpi label="Net reversé aux livreurs" value={formatFcfa(stats.totalDriverPayout)} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Commandes par statut" subtitle="Répartition du volume">
              <div className="space-y-3">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <StatRow key={status} label={STATUS_LABELS[status] || status} count={count} total={orderTotal} />
                ))}
                {orderTotal === 0 && <p className="text-sm text-slate-500">Aucune commande</p>}
              </div>
            </AdminCard>

            <AdminCard title="Utilisateurs par rôle" subtitle="Composition de la base">
              <div className="space-y-3">
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <StatRow key={role} label={ROLE_LABELS[role] || role} count={count} total={userTotal} />
                ))}
              </div>
            </AdminCard>
          </div>

          {stats.averageDeliveryMinutes > 0 && (
            <AdminCard title="Performance livraison" subtitle="Indicateur opérationnel">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {stats.averageDeliveryMinutes} <span className="text-base font-normal text-slate-500">min en moyenne</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Du moment où le livreur accepte jusqu'à la livraison confirmée</p>
            </AdminCard>
          )}
        </>
      )}
    </AdminLayout>
  );
}
