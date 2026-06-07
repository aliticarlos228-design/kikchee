import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import VehiclePicker from '../../components/VehiclePicker';
import AdminLayout, {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminKpi,
  AdminLoading,
  AdminTable,
  AdminTd,
  AdminTh,
  OnlineBadge,
  RoleBadge,
  StatusBadge,
} from '../../components/admin/AdminUI';
import { AdminUserDetail, ROLE_LABELS } from '../../types/admin';
import { VEHICLE_LABELS, VehicleType } from '../../constants/vehicles';
import { formatFcfa } from '../../utils/currency';
import { COMMISSION_RATE } from '../../constants/payment';

export default function AdminUserDetailPage() {
  const { id: userId } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    vehicleType: 'TAXI' as VehicleType,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!userId) return;
    api
      .get<AdminUserDetail>(`/admin/users/${userId}`)
      .then((res) => {
        setData(res.data);
        const { user } = res.data;
        setEditForm({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          vehicleType: (user.vehicleType as VehicleType) || 'TAXI',
        });
      })
      .catch(() => setError('Utilisateur introuvable'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload: Record<string, string> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
      };
      if (data?.user.role === 'driver') {
        payload.vehicleType = editForm.vehicleType;
      }
      const { data: updated } = await api.patch(`/admin/users/${userId}`, payload);
      setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...updated } } : prev));
      setSaveMsg('Modifications enregistrées.');
    } catch {
      setSaveMsg('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Fiche utilisateur" breadcrumb={[{ label: 'Utilisateurs', to: '/admin/users' }, { label: '…' }]}>
        <AdminLoading />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Fiche utilisateur" breadcrumb={[{ label: 'Utilisateurs', to: '/admin/users' }]}>
        <AdminAlert message={error || 'Introuvable'} />
      </AdminLayout>
    );
  }

  const { user, ledger } = data;

  return (
    <AdminLayout
      title={`${user.firstName} ${user.lastName}`}
      description={user.email}
      breadcrumb={[
        { label: 'Utilisateurs', to: '/admin/users' },
        { label: `${user.firstName} ${user.lastName}` },
      ]}
    >
      <AdminCard title="Informations du compte">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Rôle" value={<RoleBadge role={user.role} label={ROLE_LABELS[user.role] || user.role} />} />
          <Info label="Statut" value={<StatusBadge active={user.active} />} />
          <Info label="Connexion" value={<OnlineBadge online={user.online} />} />
          <Info label="Inscription" value={new Date(user.createdAt).toLocaleDateString('fr-FR')} />
          {user.phone && <Info label="Téléphone" value={user.phone} />}
          {user.vehicleType && (
            <Info label="Véhicule" value={VEHICLE_LABELS[user.vehicleType as VehicleType] || user.vehicleType} />
          )}
        </dl>
      </AdminCard>

      {user.role !== 'admin' && (
        <AdminCard title="Modifier le profil" subtitle="Seul l'administrateur peut modifier ces informations">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Prénom</span>
                <input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Nom</span>
                <input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Téléphone</span>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
            </div>
            {user.role === 'driver' && (
              <VehiclePicker
                value={editForm.vehicleType}
                onChange={(vehicleType) => setEditForm({ ...editForm, vehicleType })}
              />
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
              {saveMsg && <span className="text-sm text-slate-600">{saveMsg}</span>}
            </div>
          </form>
        </AdminCard>
      )}

      {ledger && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminKpi label="Courses payées" value={ledger.paidTripsCount} />
            <AdminKpi label="Total encaissé" value={formatFcfa(ledger.totalCollected)} variant="revenue" />
            <AdminKpi label="Net livreur" value={formatFcfa(ledger.totalDriverNet)} />
            <AdminKpi
              label={`Redevance due (${Math.round(COMMISSION_RATE * 100)} %)`}
              value={formatFcfa(ledger.totalCommissionDue)}
              variant="warning"
            />
          </div>

          <AdminCard
            title="Relevé des courses"
            subtitle="Montant, commission kikchee et net par course payée"
            noPadding
          >
            {ledger.trips.length === 0 ? (
              <AdminEmpty message="Ce livreur n'a pas encore de course payée enregistrée." />
            ) : (
              <AdminTable>
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <AdminTh>Date</AdminTh>
                    <AdminTh>Client</AdminTh>
                    <AdminTh className="text-right">Montant</AdminTh>
                    <AdminTh className="text-right">Commission</AdminTh>
                    <AdminTh className="text-right">Net livreur</AdminTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.trips.map((trip) => (
                    <tr key={trip.orderId} className="hover:bg-slate-50/50">
                      <AdminTd className="text-xs text-slate-500">
                        {(trip.completedAt ? new Date(trip.completedAt) : new Date(trip.createdAt)).toLocaleDateString(
                          'fr-FR'
                        )}
                      </AdminTd>
                      <AdminTd>{trip.client?.name ?? '—'}</AdminTd>
                      <AdminTd className="text-right font-medium tabular-nums">{formatFcfa(trip.amount)}</AdminTd>
                      <AdminTd className="text-right font-medium tabular-nums text-brand-700">
                        {formatFcfa(trip.commission)}
                      </AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatFcfa(trip.driverNet)}</AdminTd>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <tr>
                    <AdminTd colSpan={2}>Total dû à kikchee</AdminTd>
                    <AdminTd className="text-right tabular-nums">{formatFcfa(ledger.totalCollected)}</AdminTd>
                    <AdminTd className="text-right tabular-nums text-brand-700">
                      {formatFcfa(ledger.totalCommissionDue)}
                    </AdminTd>
                    <AdminTd className="text-right tabular-nums">{formatFcfa(ledger.totalDriverNet)}</AdminTd>
                  </tr>
                </tfoot>
              </AdminTable>
            )}
          </AdminCard>

          <p className="text-xs text-slate-500">
            Le livreur encaisse le montant total auprès du client et doit reverser {Math.round(COMMISSION_RATE * 100)} %
            à kikchee sur chaque course confirmée payée.
          </p>
        </>
      )}

      {!ledger && user.role !== 'driver' && (
        <AdminCard>
          <p className="text-sm text-slate-500">Les redevances s'appliquent uniquement aux comptes livreur.</p>
        </AdminCard>
      )}
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
