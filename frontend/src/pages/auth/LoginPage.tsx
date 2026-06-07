import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth, roleHomePath } from '../../context/AuthContext';
import { BRAND, IMAGES } from '../../constants/togo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user ? roleHomePath(user.role) : '/');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Image panel */}
      <div className="relative hidden w-1/2 lg:block">
        <img src={IMAGES.login} alt="Logistique Togo" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 to-brand-700/70" />
        <div className="absolute bottom-0 left-0 p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Truck className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">{BRAND.name}</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold">{BRAND.tagline}</h2>
          <p className="mt-3 max-w-md text-white/70">
            Accédez à votre espace professionnel — client, commerçant, livreur ou administrateur.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16">
        <Link to="/" className="mb-8 flex items-center gap-2 text-brand-700 lg:hidden">
          <Truck className="h-5 w-5" /> {BRAND.name}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Bon retour 👋</h1>
        <p className="mt-2 text-slate-500">Connectez-vous à votre espace {BRAND.name}</p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="client@demo.fr"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Pas de compte ?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            S'inscrire gratuitement
          </Link>
        </p>
        <Link to="/" className="mt-4 block text-center text-sm text-slate-400 hover:text-brand-600">
          ← Retour au site
        </Link>
      </div>
    </div>
  );
}
