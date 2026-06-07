import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Layout from '../../components/Layout';
import { DriverDelivery } from '../../types/package';
import { STATUS_LABELS } from '../../types/order';

export default function MyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DriverDelivery[]>('/deliveries/mine')
      .then((res) => setDeliveries(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Mes livraisons">
      <Link to="/driver" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Retour
      </Link>

      {loading && <p className="text-slate-500">Chargement...</p>}

      {!loading && deliveries.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">
          Aucune livraison effectuée.
        </p>
      )}

      <div className="space-y-3">
        {deliveries.map((d) => (
          <Link
            key={d.id}
            to={`/driver/deliveries/${d.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-orange-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {d.order.pickup} → {d.order.delivery}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(d.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                {STATUS_LABELS[d.status] || d.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
