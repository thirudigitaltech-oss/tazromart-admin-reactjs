import { useNavigate, useLocation } from 'react-router-dom';

// Same screen names the RN app used with react-navigation, mapped to routes.
export const SCREEN_PATHS = {
  AdminLogin:       '/admin/login',
  AdminDashboard:   '/admin',
  AdminOrders:      '/admin/orders',
  AdminBookings:    '/admin/bookings',
  AdminProducts:    '/admin/products',
  AdminAddProduct:  '/admin/products/add',
  AdminEditProduct: '/admin/products/edit',
  AdminWorkers:     '/admin/workers',
  AdminAddWorker:   '/admin/workers/add',
  AdminZones:       '/admin/zones', 
  AdminOffers:      '/admin/offers',
  AdminCRM:         '/admin/crm',
  AdminStockReport: '/admin/products/stock-report',
};

// Drop-in replacement for the `navigation` prop react-navigation gave the
// RN screens, so screen code (navigation.navigate/goBack/replace) is unchanged.
export function useAdminNavigation() {
  const navigate = useNavigate();
  return {
    navigate: (screen, params) => navigate(SCREEN_PATHS[screen] || `/admin/${screen}`, { state: params }),
    replace:  (screen, params) => navigate(SCREEN_PATHS[screen] || `/admin/${screen}`, { state: params, replace: true }),
    goBack:   () => navigate(-1),
  };
}

// Drop-in replacement for the `route` prop (route.params.product etc.)
export function useAdminRoute() {
  const location = useLocation();
  return { params: location.state || {} };
}
