import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { VEHICLE_LABELS, VehicleType } from '../constants/vehicles';

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  merchant: 'Commerçant',
  driver: 'Livreur',
  admin: 'Administrateur',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isLocked = user.role === 'client' || user.role === 'merchant' || user.role === 'driver';

  return (
    <Layout title="Mon profil">
      <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
        {isLocked && (
          <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Vos informations sont verrouillées après inscription. Pour toute modification, contactez
            l'administration kikchee.
          </p>
        )}

        <dl className="space-y-4">
          <Field label="Email" value={user.email} />
          <Field label="Rôle" value={ROLE_LABELS[user.role] || user.role} />
          <Field label="Prénom" value={user.firstName} />
          <Field label="Nom" value={user.lastName} />
          <Field label="Téléphone" value={user.phone || '—'} />
          {user.role === 'driver' && user.vehicleType && (
            <Field
              label="Type de véhicule"
              value={VEHICLE_LABELS[user.vehicleType as VehicleType] || user.vehicleType}
            />
          )}
        </dl>

        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Déconnexion
        </button>
      </div>
    </Layout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
