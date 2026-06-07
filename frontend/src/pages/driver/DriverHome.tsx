import { Link } from 'react-router-dom';
import { ClipboardList, Navigation, Wallet } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import RouteMap from '../../components/maps/RouteMap';
import { TOGO_LOCATIONS, IMAGES } from '../../constants/togo';
import { STATUS_LABELS } from '../../types/order';

function DriverCard({
  to,
  icon: Icon,
  title,
  subtitle,
  variant,
}: {
  to: string;
  icon: typeof Navigation;
  title: string;
  subtitle: string;
  variant: 'primary' | 'default' | 'accent';
}) {
  const styles = {
    primary: {
      card: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg',
      iconWrap: 'bg-white/15 text-white',
      subtitle: 'text-white/80',
    },
    default: {
      card: 'border border-slate-200 bg-white shadow-sm',
      iconWrap: 'bg-slate-100 text-orange-600',
      subtitle: 'text-slate-500',
    },
    accent: {
      card: 'border border-orange-200 bg-orange-50 shadow-sm',
      iconWrap: 'bg-white text-amber-700',
      subtitle: 'text-slate-500',
    },
  }[variant];

  return (
    <Link
      to={to}
      className={`card-hover flex items-center gap-3 rounded-xl p-4 ${styles.card}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.iconWrap}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className={`text-xs ${styles.subtitle}`}>{subtitle}</p>
      </div>
    </Link>
  );
}

export default function DriverHome() {
  const p = TOGO_LOCATIONS[0];
  const d = TOGO_LOCATIONS[3];

  return (
    <AppLayout title="Espace Livreur">
      <div className="mb-8 overflow-hidden rounded-2xl relative">
        <img src={IMAGES.africa} alt="" className="h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h2 className="text-2xl font-bold">Réseau livreurs kikchee</h2>
          <p className="text-white/80">Lomé et agglomération — missions triées par proximité</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DriverCard
          to="/driver/available"
          icon={Navigation}
          title="Missions disponibles"
          subtitle="Carte + tri Haversine"
          variant="primary"
        />
        <DriverCard
          to="/driver/mine"
          icon={ClipboardList}
          title="Mes livraisons"
          subtitle="Historique et en cours"
          variant="default"
        />
        <DriverCard
          to="/driver/redevance"
          icon={Wallet}
          title="Mes redevances"
          subtitle="Commission 20 % due à kikchee"
          variant="accent"
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <RouteMap
          pickup={{ lat: p.latitude, lng: p.longitude, label: p.name }}
          delivery={{ lat: d.latitude, lng: d.longitude, label: d.name }}
          height="300px"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {['AVAILABLE', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <span key={s} className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-800">
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>
    </AppLayout>
  );
}
