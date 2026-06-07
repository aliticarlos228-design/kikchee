import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, User, ArrowRight, Phone } from 'lucide-react';
import { useAuth, roleHomePath } from '../../context/AuthContext';
import { BRAND, IMAGES } from '../../constants/togo';
import VehiclePicker from '../../components/VehiclePicker';
import { VehicleType } from '../../constants/vehicles';

type Role = 'client' | 'merchant' | 'driver';

const ROLES: { value: Role; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'merchant', label: 'Commerçant' },
  { value: 'driver', label: 'Livreur' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client' as Role,
    vehicleType: 'TAXI' as VehicleType,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDriver = form.role === 'driver';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (isDriver) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 8) {
        setError('Téléphone requis pour les livreurs (min. 8 chiffres)');
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        role: form.role,
        vehicleType: isDriver ? form.vehicleType : undefined,
      });
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user ? roleHomePath(user.role) : '/');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <img src={IMAGES.warehouse} alt="Logistique" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 to-brand-700/70" />
        <div className="absolute bottom-0 left-0 p-12 text-white">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-amber-400" />
            <span className="text-2xl font-bold">{BRAND.name}</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold">Rejoignez la révolution logistique au Togo</h2>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="mt-2 text-slate-500">Client, commerçant ou livreur — c'est gratuit</p>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-xl border py-3 pl-10 pr-3 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nom</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-xl border px-3 py-3 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border py-3 pl-10 pr-3 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border py-3 pl-10 pr-3 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">Je m'inscris en tant que</legend>
            <div className="space-y-1">
              {ROLES.map(({ value, label }) => {
                const active = form.role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition ${
                        active ? 'border-brand-600' : 'border-slate-300'
                      }`}
                      aria-hidden
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                    </span>
                    <span className={`text-[15px] ${active ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {isDriver && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+228 90 00 00 00"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border bg-white py-3 pl-10 pr-3 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Pour que les clients puissent vous joindre</p>
              </div>

              <VehiclePicker
                value={form.vehicleType}
                onChange={(vehicleType) => setForm({ ...form, vehicleType })}
              />
            </div>
          )}

          {!isDriver && (
            <div>
              <label className="mb-1 block text-sm font-medium">Téléphone (optionnel)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+228 90 00 00 00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border py-3 pl-10 pr-3 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Inscription...' : <>S'inscrire <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ? <Link to="/login" className="font-semibold text-brand-600">Se connecter</Link>
        </p>
        <Link to="/" className="mt-4 block text-center text-sm text-slate-400">← Retour au site</Link>
      </div>
    </div>
  );
}
