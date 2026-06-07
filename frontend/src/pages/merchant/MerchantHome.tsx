import { Link } from 'react-router-dom';
import { Truck, Package, Camera } from 'lucide-react';
import Layout from '../../components/Layout';
import { PACKAGE_STATUS_LABELS } from '../../types/package';

export default function MerchantHome() {
  return (
    <Layout title="Espace Commerçant">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-900 p-6 text-white">
        <h2 className="text-xl font-bold">Deux façons de travailler</h2>
        <p className="mt-2 text-sm text-emerald-100">
          Expédiez directement à un client (même sans appli) ou préparez un colis pour une commande
          déjà passée par un client sur kikchee.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/merchant/packages/ship"
          className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-6 hover:bg-emerald-100"
        >
          <Truck className="h-8 w-8 text-emerald-700" />
          <h2 className="mt-3 text-lg font-semibold text-emerald-800">Expédier à un client</h2>
          <p className="mt-2 text-sm text-emerald-700">
            Client hors appli : nom, téléphone, adresse → livreur envoie le colis.
          </p>
        </Link>
        <Link
          to="/merchant/packages/new"
          className="rounded-xl border border-emerald-200 bg-white p-6 hover:bg-emerald-50"
        >
          <Camera className="h-8 w-8 text-emerald-600" />
          <h2 className="mt-3 text-lg font-semibold text-emerald-700">Préparer un colis</h2>
          <p className="mt-2 text-sm text-emerald-600">
            2 photos — pour associer à une commande client déjà sur l&apos;appli.
          </p>
        </Link>
        <Link
          to="/merchant/packages"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:bg-slate-50 sm:col-span-2 lg:col-span-1"
        >
          <Package className="h-8 w-8 text-slate-600" />
          <h2 className="mt-3 text-lg font-semibold">Mes colis</h2>
          <p className="mt-2 text-sm text-slate-600">Suivi et association aux commandes</p>
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-medium">Statuts colis</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(PACKAGE_STATUS_LABELS).map(([k, v]) => (
            <span key={k} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
              {v}
            </span>
          ))}
        </div>
      </div>
    </Layout>
  );
}

