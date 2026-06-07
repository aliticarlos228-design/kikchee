import { Link } from 'react-router-dom';
import {
  Truck, MapPin, Zap, Navigation, Radio, ArrowRight, CheckCircle2,
  ShoppingBag, Package, Bike, Quote, Star,
} from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LomeMap from '../components/maps/LomeMap';
import { BRAND, IMAGES } from '../constants/togo';

const stats = [
  { value: '2 500+', label: 'Livraisons/mois' },
  { value: '98%', label: 'Satisfaction client' },
  { value: '45 min', label: 'Délai moyen Lomé' },
  { value: '120+', label: 'Livreurs actifs' },
];

const features = [
  { icon: Radio, title: 'Cartographie en temps réel', desc: 'Suivez chaque colis en direct sur la carte de Lomé.' },
  { icon: Navigation, title: 'Livreur le plus proche', desc: 'Affectation intelligente automatique (algorithme Haversine).' },
  { icon: Zap, title: 'Tarification intelligente', desc: 'Prix calculé selon distance, poids, zone et véhicule.' },
  { icon: MapPin, title: 'Suivi en direct', desc: 'Le client voit son livreur avancer jusqu’à sa porte.' },
];

const audiences = [
  {
    icon: ShoppingBag,
    title: 'Client',
    desc: 'Publiez votre course, choisissez le véhicule (moto, taxi, fourgon) et un livreur prend en charge. Suivez la livraison en direct sur la carte.',
    color: 'emerald',
  },
  {
    icon: Package,
    title: 'Commerçant',
    desc: 'Expédiez vos colis à vos clients, même sans compte, en quelques photos. Gérez tout votre stock.',
    color: 'amber',
  },
  {
    icon: Bike,
    title: 'Livreur',
    desc: 'Recevez les missions de votre catégorie de véhicule, acceptez une course et livrez. Le tarif est affiché à l’avance.',
    color: 'sky',
  },
];

const testimonials = [
  {
    name: 'Koffi A.',
    role: 'Commerçant — Grand Marché, Lomé',
    text: 'Je livre mes clients à Adidogomé et Agoè sans me déplacer. Mes ventes ont augmenté.',
  },
  {
    name: 'Aminata D.',
    role: 'Cliente — Tokoin',
    text: 'J’ai publié ma course en deux minutes, un livreur moto l’a prise tout de suite. Je l’ai suivi sur la carte.',
  },
  {
    name: 'Yao M.',
    role: 'Livreur taxi — Lomé',
    text: 'Je ne reçois que les courses pour taxi. J’accepte les missions qui me conviennent et je travaille quand je veux.',
  },
];

const audienceClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="gradient-hero relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${IMAGES.hero})` }}
        />
        <LandingNavbar />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-32 pb-24 text-center lg:pt-44">
          <div className="animate-fade-in">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-sm text-emerald-200">
              🇹🇬 {BRAND.tagline}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
              Livrez partout à{' '}
              <span className="text-gradient">Lomé</span>
              <br />
              avec intelligence.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              kikchee connecte clients, commerçants et livreurs sur une plateforme
              professionnelle — partout dans la ville de Lomé et la région Maritime.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 font-bold text-brand-900 shadow-lg hover:bg-amber-300"
              >
                Démarrer gratuitement <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 font-semibold text-white hover:bg-white/10"
              >
                Accéder à l'application
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b bg-white py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FONCTIONNALITÉS CLÉS */}
      <section id="services" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Une logistique pensée pour Lomé
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Quatre piliers pour livrer vite, au bon prix, partout dans le pays.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POUR QUI ? */}
      <section id="pour-qui" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Pour qui ?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Une seule plateforme, trois métiers connectés.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${audienceClasses[color]}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARTOGRAPHIE TOGO */}
      <section id="carte" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                📍 Lomé · Région Maritime
              </span>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                Cartographie de Lomé intégrée
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Visualisez vos livraisons sur OpenStreetMap — du Grand Marché au Port,
                d’Agoè à Adidogomé. Adresses, trajets et livreurs en temps réel dans toute la ville.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Points de collecte et de livraison géolocalisés',
                  'Itinéraire tracé en temps réel dans Lomé',
                  'Affectation du livreur le plus proche (Haversine)',
                  'Saisie d’adresse libre, même hors carte',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <LomeMap height="440px" />
              <p className="mt-3 text-center text-xs text-slate-400">
                Carte interactive — quartiers de Lomé
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PREUVE DE CONFIANCE */}
      <section id="apropos" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Ils livrent déjà avec kikchee
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Commerçants, clients et livreurs des quartiers de Lomé.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <Quote className="h-8 w-8 text-brand-200" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">“{t.text}”</p>
                <div className="mt-6 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Prêt à transformer votre logistique ?</h2>
          <p className="mt-4 text-white/70">
            Rejoignez kikchee — la référence de la livraison à Lomé.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-10 py-4 font-bold text-brand-900 shadow-xl hover:bg-amber-300"
          >
            Créer un compte <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-brand-900 py-12 text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white">{BRAND.name}</span>
            <span className="text-sm">— {BRAND.city}, {BRAND.country}</span>
          </div>
          <p className="text-sm">© 2026 kikchee. Livraison & logistique à Lomé, Togo.</p>
        </div>
      </footer>
    </div>
  );
}
