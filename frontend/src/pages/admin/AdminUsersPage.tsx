import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../../api/client';
import AdminLayout, {
  AdminBtn,
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminTable,
  AdminTh,
  AdminTd,
  OnlineBadge,
  RoleBadge,
  StatusBadge,
} from '../../components/admin/AdminUI';
import VehiclePicker from '../../components/VehiclePicker';
import { AdminUser, ROLE_LABELS } from '../../types/admin';
import { VehicleType } from '../../constants/vehicles';

type RoleFilter = '' | 'client' | 'merchant' | 'driver' | 'admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const params = roleFilter ? `?role=${roleFilter}` : '';
    const { data } = await api.get<AdminUser[]>(`/admin/users${params}`);
    setUsers(data);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [roleFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q)
    );
  }, [users, search]);

  async function toggleActive(user: AdminUser) {
    setUpdating(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/active`, { active: !user.active });
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Action impossible');
    } finally {
      setUpdating(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    const roleMsg =
      user.role === 'client'
        ? 'Toutes ses commandes et missions seront supprimées. Les livreurs ne les verront plus.'
        : user.role === 'merchant'
          ? 'Toutes ses expéditions et commandes liées seront supprimées.'
          : 'Son historique de livraisons restera anonymisé dans les commandes passées.';

    if (
      !confirm(
        `Supprimer définitivement ${user.firstName} ${user.lastName} ?\n\n${roleMsg}\n\nCette action est irréversible.`
      )
    ) {
      return;
    }
    setUpdating(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Suppression impossible');
    } finally {
      setUpdating(null);
    }
  }

  const online = filtered.filter((u) => u.online).length;
  const active = filtered.filter((u) => u.active).length;

  return (
    <AdminLayout
      title="Utilisateurs"
      description="Gérez les comptes clients, commerçants et livreurs. Créez, activez ou supprimez un accès."
      breadcrumb={[{ label: 'Utilisateurs' }]}
      actions={
        <AdminBtn onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Nouveau compte
        </AdminBtn>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Affichés" value={filtered.length} />
        <MiniStat label="Actifs" value={active} />
        <MiniStat label="En ligne" value={online} accent />
      </div>

      <AdminCard noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher nom, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['', 'client', 'merchant', 'driver', 'admin'] as RoleFilter[]).map((r) => (
              <button
                key={r || 'all'}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  roleFilter === r ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r ? ROLE_LABELS[r] : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <AdminLoading />
        ) : filtered.length === 0 ? (
          <AdminEmpty message="Aucun utilisateur trouvé" />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <AdminTh>Utilisateur</AdminTh>
                <AdminTh>Rôle</AdminTh>
                <AdminTh>Statut</AdminTh>
                <AdminTh>Connexion</AdminTh>
                <AdminTh>Inscription</AdminTh>
                <AdminTh className="text-right">Actions</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <AdminTd>
                    <div>
                      {user.role === 'driver' ? (
                        <Link to={`/admin/users/${user.id}`} className="font-medium text-brand-700 hover:underline">
                          {user.firstName} {user.lastName}
                        </Link>
                      ) : (
                        <p className="font-medium text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <RoleBadge role={user.role} label={ROLE_LABELS[user.role] || user.role} />
                  </AdminTd>
                  <AdminTd>
                    <StatusBadge active={user.active} />
                  </AdminTd>
                  <AdminTd>
                    <OnlineBadge online={user.online} />
                  </AdminTd>
                  <AdminTd className="text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </AdminTd>
                  <AdminTd className="text-right">
                    {user.role !== 'admin' && (
                      <div className="flex justify-end gap-1.5">
                        {user.role === 'driver' && (
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          >
                            Redevances
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleActive(user)}
                          disabled={updating === user.id}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {user.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user)}
                          disabled={updating === user.id}
                          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${accent ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client' as 'client' | 'merchant' | 'driver',
    vehicleType: 'TAXI' as VehicleType,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/users', {
        ...form,
        phone: form.phone || undefined,
        vehicleType: form.role === 'driver' ? form.vehicleType : undefined,
      });
      onCreated();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Créer un compte</h3>
          <p className="text-xs text-slate-500">Le compte sera actif immédiatement</p>
        </div>
        {error && <p className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Prénom" required value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Nom" required value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          </div>
          <Field label="Email" required type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field
            label="Mot de passe"
            required
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            hint="8 caractères minimum"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rôle</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="client">Client</option>
              <option value="merchant">Commerçant</option>
              <option value="driver">Livreur</option>
            </select>
          </div>
          {form.role === 'driver' && (
            <>
              <Field label="Téléphone" required type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <VehiclePicker value={form.vehicleType} onChange={(v) => setForm({ ...form, vehicleType: v })} />
            </>
          )}
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <AdminBtn type="submit" disabled={loading}>
              {loading ? 'Création…' : 'Créer le compte'}
            </AdminBtn>
            <AdminBtn variant="secondary" onClick={onClose}>
              Annuler
            </AdminBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        required={required}
        minLength={type === 'password' ? 8 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
