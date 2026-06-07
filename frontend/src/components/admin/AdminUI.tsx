import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import AppLayout from '../AppLayout';

/* ─── Layout ─── */

interface AdminLayoutProps {
  title: string;
  heading?: string;
  description?: string;
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, heading, description, breadcrumb, actions, children }: AdminLayoutProps) {
  return (
    <AppLayout title={title}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {breadcrumb && breadcrumb.length > 0 && (
              <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                <Link to="/admin" className="hover:text-brand-600">
                  Admin
                </Link>
                {breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {crumb.to ? (
                      <Link to={crumb.to} className="hover:text-brand-600">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-700">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{heading ?? title}</h2>
            {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
        {children}
      </div>
    </AppLayout>
  );
}

/* ─── KPI ─── */

export function AdminKpi({
  label,
  value,
  hint,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  variant?: 'default' | 'success' | 'warning' | 'revenue';
}) {
  const styles = {
    default: 'border-slate-200 bg-white',
    success: 'border-emerald-200 bg-emerald-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    revenue: 'border-brand-200 bg-brand-50/40',
  };
  const valueStyles = {
    default: 'text-slate-900',
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    revenue: 'text-brand-800',
  };

  return (
    <div className={`rounded-lg border px-4 py-3.5 ${styles[variant]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueStyles[variant]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ─── Card ─── */

export function AdminCard({
  title,
  subtitle,
  action,
  children,
  noPadding,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  );
}

/* ─── Table ─── */

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className = '',
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 align-middle text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

/* ─── Badges ─── */

const ROLE_STYLES: Record<string, string> = {
  client: 'bg-sky-50 text-sky-700 ring-sky-200',
  merchant: 'bg-purple-50 text-purple-700 ring-purple-200',
  driver: 'bg-orange-50 text-orange-700 ring-orange-200',
  admin: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function RoleBadge({ role, label }: { role: string; label: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[role] ?? ROLE_STYLES.admin}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Inactif
    </span>
  );
}

export function OnlineBadge({ online }: { online: boolean }) {
  return online ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      En ligne
    </span>
  ) : (
    <span className="text-xs text-slate-400">Hors ligne</span>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  const paid = status === 'COLLECTED';
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        paid ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-50 text-slate-600 ring-slate-200'
      }`}
    >
      {paid ? 'Payé' : 'Non payé'}
    </span>
  );
}

export function DeliveryBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-slate-50 text-slate-600 ring-slate-200',
    ACCEPTED: 'bg-blue-50 text-blue-700 ring-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    FAILED: 'bg-red-50 text-red-700 ring-red-200',
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status] ?? colors.AVAILABLE}`}>
      {label}
    </span>
  );
}

/* ─── Buttons ─── */

export function AdminBtn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-50',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

/* ─── States ─── */

export function AdminLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      Chargement…
    </div>
  );
}

export function AdminEmpty({ message }: { message: string }) {
  return <p className="py-12 text-center text-sm text-slate-500">{message}</p>;
}

export function AdminAlert({ message, type = 'error' }: { message: string; type?: 'error' | 'info' }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'
      }`}
    >
      {message}
    </div>
  );
}

/* ─── Quick link (dashboard) ─── */

export function AdminQuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-100">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}

/* ─── Progress bar stat row ─── */

export function StatRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium tabular-nums text-slate-900">
          {count} <span className="text-slate-400">({pct} %)</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
