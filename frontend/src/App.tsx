import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ClientHome from './pages/client/ClientHome';
import OrderListPage from './pages/client/OrderListPage';
import NewOrderPage from './pages/client/NewOrderPage';
import OrderDetailPage from './pages/client/OrderDetailPage';
import MerchantHome from './pages/merchant/MerchantHome';
import ShipPackagePage from './pages/merchant/ShipPackagePage';
import NewPackagePage from './pages/merchant/NewPackagePage';
import PackageListPage from './pages/merchant/PackageListPage';
import PackageDetailPage from './pages/merchant/PackageDetailPage';
import DriverHome from './pages/driver/DriverHome';
import AvailableDeliveriesPage from './pages/driver/AvailableDeliveriesPage';
import MyDeliveriesPage from './pages/driver/MyDeliveriesPage';
import DeliveryDetailPage from './pages/driver/DeliveryDetailPage';
import AdminHome from './pages/admin/AdminHome';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminDeliveriesPage from './pages/admin/AdminDeliveriesPage';
import AdminFinancesPage from './pages/admin/AdminFinancesPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import DriverRedevancePage from './pages/driver/DriverRedevancePage';
import DriverTermsPage from './pages/driver/DriverTermsPage';

export default function App() {
  return (
    <Routes>
      {/* Site vitrine public */}
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['client']} />}>
        <Route path="/client" element={<ClientHome />} />
        <Route path="/client/orders" element={<OrderListPage />} />
        <Route path="/client/orders/new" element={<NewOrderPage />} />
        <Route path="/client/orders/:id" element={<OrderDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['merchant']} />}>
        <Route path="/merchant" element={<MerchantHome />} />
        <Route path="/merchant/packages" element={<PackageListPage />} />
        <Route path="/merchant/packages/ship" element={<ShipPackagePage />} />
        <Route path="/merchant/packages/new" element={<NewPackagePage />} />
        <Route path="/merchant/packages/:id" element={<PackageDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['driver']} />}>
        <Route path="/driver" element={<DriverHome />} />
        <Route path="/driver/available" element={<AvailableDeliveriesPage />} />
        <Route path="/driver/mine" element={<MyDeliveriesPage />} />
        <Route path="/driver/deliveries/:id" element={<DeliveryDetailPage />} />
        <Route path="/driver/redevance" element={<DriverRedevancePage />} />
        <Route path="/driver/terms" element={<DriverTermsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/finances" element={<AdminFinancesPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/deliveries" element={<AdminDeliveriesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
