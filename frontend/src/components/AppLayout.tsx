import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Truck, LayoutDashboard, Package, MapPin, Users, BarChart3,
  LogOut, User, ChevronRight, Menu, X, Home, Wallet, FileText,
} from 'lucide-react';
import { useAuth, roleHomePath } from '../context/AuthContext';
import { BRAND } from '../constants/togo';
import { requestNotificationPermission, unlockNotificationSound } from '../utils/notifications';
import { hasAcceptedDriverTerms } from '../utils/driverTermsStorage';
import DriverTermsOverlay from './driver/DriverTermsOverlay';
import type { Role } from '../api/client';

const NAV: Record<Role, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  client: [
    { to: '/client', label: 'Accueil', icon: LayoutDashboard },
    { to: '/client/orders/new', label: 'Nouvelle commande', icon: MapPin },
    { to: '/client/orders', label: 'Mes commandes', icon: Package },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  merchant: [
    { to: '/merchant', label: 'Accueil', icon: LayoutDashboard },
    { to: '/merchant/packages/ship', label: 'Expédier client', icon: MapPin },
    { to: '/merchant/packages/new', label: 'Nouveau colis', icon: Package },
    { to: '/merchant/packages', label: 'Mes colis', icon: Package },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  driver: [
    { to: '/driver', label: 'Accueil', icon: LayoutDashboard },
    { to: '/driver/available', label: 'Disponibles', icon: MapPin },
    { to: '/driver/mine', label: 'Mes livraisons', icon: Truck },
    { to: '/driver/redevance', label: 'Redevances', icon: BarChart3 },
    { to: '/driver/terms', label: 'Conditions', icon: FileText },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  admin: [
    { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Utilisateurs', icon: Users },
    { to: '/admin/finances', label: 'Finances', icon: Wallet },
    { to: '/admin/orders', label: 'Commandes', icon: Package },
    { to: '/admin/deliveries', label: 'Livraisons', icon: Truck },
    { to: '/profile', label: 'Mon compte', icon: User },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  client: 'Client',
  merchant: 'Commerçant',
  driver: 'Livreur',
  admin: 'Administrateur',
};

export default function AppLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [driverTermsOk, setDriverTermsOk] = useState(hasAcceptedDriverTerms);
  const nav = user ? NAV[user.role] : [];

  const showDriverTerms =
    user?.role === 'driver' && !driverTermsOk && location.pathname.startsWith('/driver');

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate('/login', { replace: true });
  }

  function enableNotifications() {
    requestNotificationPermission();
    unlockNotificationSound();
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {nav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={() => {
                enableNotifications();
                onNavigate?.();
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                active
                  ? 'bg-emerald-500/20 font-semibold text-emerald-300 lg:text-emerald-300'
                  : 'text-white/70 hover:bg-white/5 hover:text-white lg:text-white/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-900 text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <Link to="/" className="font-bold">{BRAND.name}</Link>
            <p className="text-xs text-white/50">🇹🇬 {BRAND.country}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLinks />
        </nav>

        <div className="border-t border-white/10 p-4">
          {user && (
            <div className="rounded-xl bg-white/5 p-3">
              <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>
              <div className="mt-2 flex gap-2">
                <Link to="/profile" className="flex items-center gap-1 text-xs text-emerald-300 hover:underline">
                  <User className="h-3 w-3" /> Profil
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-red-300 hover:underline">
                  <LogOut className="h-3 w-3" /> Sortir
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-900 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-bold">{BRAND.name}</p>
                {user && (
                  <p className="text-xs text-white/60">{user.firstName} · {ROLE_LABELS[user.role]}</p>
                )}
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="space-y-2 border-t border-white/10 p-4">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm"
              >
                <User className="h-4 w-4" /> Mon profil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  enableNotifications();
                  setMobileOpen(true);
                }}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
                  {user?.role === 'admin' ? 'Administration' : 'Application'}
                </p>
                <h1 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 lg:hidden"
                >
                  <LogOut className="h-3 w-3" /> Sortir
                </button>
                <Link
                  to={roleHomePath(user.role)}
                  onClick={enableNotifications}
                  className="hidden items-center gap-1 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 sm:flex"
                >
                  {ROLE_LABELS[user.role]} <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
      </div>

      {/* Barre navigation mobile */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="flex justify-around py-2">
            {nav.slice(0, 3).map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={enableNotifications}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
                    active ? 'font-semibold text-brand-600' : 'text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label.split(' ').slice(-1)[0]}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                enableNotifications();
                setMobileOpen(true);
              }}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] text-slate-500"
            >
              <Home className="h-5 w-5" />
              Menu
            </button>
          </div>
        </nav>
      )}

      {showDriverTerms && <DriverTermsOverlay onAccepted={() => setDriverTermsOk(true)} />}
    </div>
  );
}
