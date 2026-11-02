import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminLoginScreen from './screens/admin/AdminLoginScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from './screens/admin/AdminOrdersScreen';
//import AdminBookingsScreen from './screens/admin/AdminBookingsScreen';
import AdminProductsScreen from './screens/admin/AdminProductsScreen';
import AdminAddProductScreen from './screens/admin/AdminAddProductScreen';
import AdminEditProductScreen from './screens/admin/AdminEditProductScreen';
import AdminWorkersScreen from './screens/admin/AdminWorkersScreen';
import AdminAddWorkerScreen from './screens/admin/AdminAddWorkerScreen';
import AdminOffersScreen from './screens/admin/AdminOffersScreen';
import AdminCRMScreen from './screens/admin/AdminCRMScreen';
import AdminStockReportScreen from './screens/admin/AdminStockReportScreen';
import AdminZonesScreen from './screens/admin/AdminZonesScreen';

// Support both Remember Me modes. Authentication must still be checked server-side.
function hasAdminToken() {
  return Boolean(
    localStorage.getItem('admin_token') ||
    sessionStorage.getItem('admin_token')
  );
}

function RequireAuth({ children }) {
  return hasAdminToken()
    ? children
    : <Navigate to="/admin/login" replace />;
}

function LoginRoute() {
  return hasAdminToken()
    ? <Navigate to="/admin" replace />
    : <AdminLoginScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginRoute />} />

        <Route path="/admin" element={<RequireAuth><AdminDashboardScreen /></RequireAuth>} />
        <Route path="/admin/orders" element={<RequireAuth><AdminOrdersScreen /></RequireAuth>} />
        <Route path="/admin/products" element={<RequireAuth><AdminProductsScreen /></RequireAuth>} />
        <Route path="/admin/products/add" element={<RequireAuth><AdminAddProductScreen /></RequireAuth>} />
        <Route path="/admin/products/edit" element={<RequireAuth><AdminEditProductScreen /></RequireAuth>} />
        <Route path="/admin/workers" element={<RequireAuth><AdminWorkersScreen /></RequireAuth>} />
        <Route path="/admin/workers/add" element={<RequireAuth><AdminAddWorkerScreen /></RequireAuth>} />
        <Route path="/admin/offers" element={<RequireAuth><AdminOffersScreen /></RequireAuth>} />
        <Route path="/admin/crm" element={<RequireAuth><AdminCRMScreen /></RequireAuth>} />
        <Route path="/admin/products/stock-report" element={<RequireAuth><AdminStockReportScreen /></RequireAuth>} />
        <Route path="/admin/zones" element={<RequireAuth><AdminZonesScreen /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
