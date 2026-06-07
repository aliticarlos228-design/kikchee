import { Link } from 'react-router-dom';
import { Menu, X, Truck } from 'lucide-react';
import { useState } from 'react';
import { BRAND } from '../../constants/togo';

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <Truck className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">{BRAND.name}</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#services" className="text-sm text-white/80 hover:text-white">Services</a>
          <a href="#carte" className="text-sm text-white/80 hover:text-white">Carte Togo</a>
          <a href="#apropos" className="text-sm text-white/80 hover:text-white">À propos</a>
          <Link to="/login" className="text-sm text-white/90 hover:text-white">Connexion</Link>
          <Link
            to="/register"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-brand-900 hover:bg-amber-300"
          >
            Commencer
          </Link>
        </div>

        <button className="text-white md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#services" className="text-white/80" onClick={() => setOpen(false)}>Services</a>
            <a href="#carte" className="text-white/80" onClick={() => setOpen(false)}>Carte Togo</a>
            <Link to="/login" className="text-white/80">Connexion</Link>
            <Link to="/register" className="rounded-full bg-amber-400 py-2 text-center font-semibold text-brand-900">
              Commencer
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
