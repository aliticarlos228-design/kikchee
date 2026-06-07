import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AdminLayout, {
  AdminCard,
  AdminEmpty,
  AdminKpi,
  AdminLoading,
  AdminTable,
  AdminTd,
  AdminTh,
} from '../../components/admin/AdminUI';
import { FinancialTransaction } from '../../types/admin';
import { formatFcfa } from '../../utils/currency';
import { COMMISSION_RATE, PAYMENT_OPTIONS } from '../../constants/payment';

export default function AdminFinancesPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<FinancialTransaction[]>('/admin/finances')
      .then((res) => setTransactions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);
  const totalDriverNet = transactions.reduce((s, t) => s + t.driverNet, 0);

  return (
    <AdminLayout
      title="Finances"
      description={`Suivi des encaissements et calcul automatique de la commission kikchee (${Math.round(COMMISSION_RATE * 100)} %).`}
      breadcrumb={[{ label: 'Finances' }]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminKpi label="Total encaissé" value={formatFcfa(totalAmount)} variant="revenue" />
        <AdminKpi label="Revenus kikchee" value={formatFcfa(totalCommission)} hint={`${transactions.length} courses`} variant="revenue" />
        <AdminKpi label="Net livreurs" value={formatFcfa(totalDriverNet)} />
      </div>

      <AdminCard title="Historique des paiements" subtitle="Courses confirmées payées par les livreurs" noPadding>
        {loading ? (
          <AdminLoading />
        ) : transactions.length === 0 ? (
          <AdminEmpty message="Aucun paiement enregistré — les courses apparaîtront ici quand un livreur confirme l'encaissement." />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <AdminTh>Date</AdminTh>
                <AdminTh>Client / Commerçant</AdminTh>
                <AdminTh>Livreur</AdminTh>
                <AdminTh>Mode</AdminTh>
                <AdminTh className="text-right">Montant</AdminTh>
                <AdminTh className="text-right">Commission</AdminTh>
                <AdminTh className="text-right">Net livreur</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.orderId} className="hover:bg-slate-50/50">
                  <AdminTd className="whitespace-nowrap text-xs text-slate-500">
                    {(t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt)).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </AdminTd>
                  <AdminTd>
                    <p className="font-medium text-slate-800">{t.client?.name ?? t.merchant ?? '—'}</p>
                    {t.client?.email && <p className="text-xs text-slate-500">{t.client.email}</p>}
                  </AdminTd>
                  <AdminTd>
                    {t.driver ? (
                      <Link to={`/admin/users/${t.driver.id}`} className="text-sm text-brand-700 hover:underline">
                        {t.driver.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </AdminTd>
                  <AdminTd className="text-xs">
                    {PAYMENT_OPTIONS[t.paymentMethod as keyof typeof PAYMENT_OPTIONS]?.label ?? t.paymentMethod}
                  </AdminTd>
                  <AdminTd className="text-right font-medium tabular-nums">{formatFcfa(t.amount)}</AdminTd>
                  <AdminTd className="text-right font-medium tabular-nums text-brand-700">{formatFcfa(t.commission)}</AdminTd>
                  <AdminTd className="text-right tabular-nums text-slate-600">{formatFcfa(t.driverNet)}</AdminTd>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <AdminTd colSpan={4}>Total</AdminTd>
                <AdminTd className="text-right tabular-nums">{formatFcfa(totalAmount)}</AdminTd>
                <AdminTd className="text-right tabular-nums text-brand-700">{formatFcfa(totalCommission)}</AdminTd>
                <AdminTd className="text-right tabular-nums">{formatFcfa(totalDriverNet)}</AdminTd>
              </tr>
            </tfoot>
          </AdminTable>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
