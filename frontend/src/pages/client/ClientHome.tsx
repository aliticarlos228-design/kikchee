import { Link } from 'react-router-dom';
import { Package, Plus, TrendingUp, Clock, ArrowRight, MapPin } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import LomeMap from '../../components/maps/LomeMap';
import { IMAGES, BRAND } from '../../constants/togo';
import { STATUS_LABELS } from '../../types/order';

const STATUS_DOTS: { key: string; color: string }[] = [
  { key: 'PENDING', color: 'bg-amber-400' },
  { key: 'ASSIGNED', color: 'bg-sky-500' },
  { key: 'IN_TRANSIT', color: 'bg-indigo-500' },
  { key: 'DELIVERED', color: 'bg-emerald-500' },
];

export default function ClientHome() {
  return (
    <AppLayout title="Espace Client">
      {/* Hero banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <img src={IMAGES.delivery} alt="" className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 to-brand-900/20" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Bienvenue sur {BRAND.name}</h2>
          <p className="mt-1 text-white/80">Vos livraisons partout à Lomé, en quelques clics</p>
        </div>
      </div>

      {/* CTA principal — le plus visible */}
      <Link
        to="/client/orders/new"
        className="card-hover group mb-6 flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-brand-700 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl font-bold backdrop-blur-sm">
            +
          </span>
          <div>
            <h3 className="text-xl font-extrabold sm:text-2xl">Nouvelle commande</h3>
            <p className="mt-1 text-sm text-white/85">Carte interactive + tarif instantané</p>
          </div>
        </div>
        <ArrowRight className="h-7 w-7 shrink-0 transition group-hover:translate-x-1" />
      </Link>

      {/* Accès rapides secondaires */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/client/orders"
          className="card-hover flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Package className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-lg font-bold">Mes commandes</h3>
            <p className="text-sm text-slate-500">Historique & suivi en temps réel</p>
          </div>
        </Link>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <TrendingUp className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-lg font-bold">Livraison moyenne</h3>
            <p className="text-2xl font-bold text-brand-700">~45 min</p>
            <p className="text-xs text-slate-500">Zone Lomé</p>
          </div>
        </div>
      </div>

      {/* Carte + statuts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <MapPin className="h-4 w-4 text-brand-600" /> Lomé en direct
          </h3>
          <LomeMap height="300px" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Clock className="h-4 w-4 text-brand-600" /> Statuts de livraison
          </h3>
          <div className="mt-4 space-y-3">
            {STATUS_DOTS.map(({ key, color }) => (
              <div key={key} className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${color}`} />
                <span className="text-sm text-slate-700">{STATUS_LABELS[key]}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
            <Plus className="mr-1 inline h-4 w-4" />
            Couverture : toute la ville de Lomé et la région Maritime.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
