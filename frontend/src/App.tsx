import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LocationProvider } from './contexts/LocationContext';
import { Toaster } from 'react-hot-toast';
import { Menu, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { APIProvider } from '@vis.gl/react-google-maps';
import axios from 'axios';

// Global Axios Configuration
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUserNotFound = error.response?.status === 404 && error.response?.data?.message === "User not found";
    const isUnauthorized = error.response?.status === 401;

    if (isUnauthorized || isUserNotFound) {
      localStorage.clear();
      // Only redirect if not already on login to avoid loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// User Pages (Lazy Loaded)
// User Pages (Immediate for Landing)
import Home from './pages/Home';

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/Login'));
const ProductList = lazy(() => import('./pages/ProductList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Tracking = lazy(() => import('./pages/Tracking'));
const SupplierStore = lazy(() => import('./pages/SupplierStore'));
const BrandStore = lazy(() => import('./pages/BrandStore'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const SearchFilter = lazy(() => import('./pages/SearchFilter'));
const SubCategoryPage = lazy(() => import('./pages/SubCategoryPage'));
const Support = lazy(() => import('./pages/Support'));
const PaymentMethod = lazy(() => import('./pages/PaymentMethod'));

// Other (Lazy Loaded)
const Reports = lazy(() => import('./pages/Reports'));
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const SKUManager = lazy(() => import('./pages/admin/SKUManager'));
const SupplierManager = lazy(() => import('./pages/admin/SupplierManager'));
const CategoryManager = lazy(() => import('./pages/admin/CategoryManager'));
const SubCategoryManager = lazy(() => import('./pages/admin/SubCategoryManager'));
const UnitManager = lazy(() => import('./pages/admin/UnitManager'));
const BrandManager = lazy(() => import('./pages/admin/BrandManager'));
const SubVariantTitleManager = lazy(() => import('./pages/admin/SubVariantTitleManager'));
const DeliveryTimeManager = lazy(() => import('./pages/admin/DeliveryTimeManager'));
const PickingQueue = lazy(() => import('./pages/admin/PickingQueue'));
const RiderManager = lazy(() => import('./pages/admin/RiderManager'));
const InvoicingReports = lazy(() => import('./pages/admin/InvoicingReports'));
const OfferManager = lazy(() => import('./pages/admin/OfferManager'));
const LocationManager = lazy(() => import('./pages/admin/LocationManager'));

// Rider Pages (Lazy Loaded)
const RiderDashboard = lazy(() => import('./pages/rider/RiderDashboard'));
const TaskVerification = lazy(() => import('./pages/rider/TaskVerification'));
const DeliveryNavigation = lazy(() => import('./pages/rider/DeliveryNavigation'));
const ProofOfDelivery = lazy(() => import('./pages/rider/ProofOfDelivery'));

// Header & Footer (Immediate)
import Navbar from './components/Navbar';
import SiteFooter from './components/SiteFooter';
import Footer from './components/Footer';

import AdminSidebar from './components/admin/AdminSidebar';
import ScrollToTop from './components/ScrollToTop';
import ReloadPrompt from './components/ReloadPrompt';
// import FloatingCart from './components/FloatingCart';
import { customerSocket, supplierSocket, adminSocket, connectSocket } from './socket';
import './App.css';
import './responsive.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/admin';

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-admin-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin-sidebar', handleToggle);
  }, []);

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''} ${isDashboard ? 'on-dashboard' : ''}`}>
      {!isDashboard && (
        <button 
          className="admin-sidebar-toggle" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={20} />
        </button>
      )}
      <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="admin-content-area">
        <Outlet />
      </div>
    </div>
  );
};

const SocketManager = () => {
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const showSystemNotification = (title: string, body: string, tag: string) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const n = new Notification(title, { body, icon: '/logo192.png', tag });
        n.onclick = () => { window.focus(); n.close(); };
      }
    };

    const playSound = (file: string) => {
      const audio = new Audio(file);
      audio.play().catch(e => console.error('Audio play failed:', e));
    };
    
    // Role-based Socket Connection Management
    if (!user.role || user.role === 'End User' || user.role === 'Rider') {
      connectSocket(customerSocket);
      
      const handleStatusUpdate = (data: any) => {
        const statusText = data.status.replace(/-/g, ' ').toUpperCase();
        toast.success(`Order Update: ${statusText}`, {
          icon: '📋',
          duration: 5000,
          position: 'bottom-right'
        });
        playSound('/sounds/notification.mp3');
        showSystemNotification('📋 Order Update', `Your order status has changed to: ${statusText}`, `order-update-${data.orderId}`);
      };

      customerSocket.on('order-status-update', handleStatusUpdate);
      return () => {
        customerSocket.off('order-status-update', handleStatusUpdate);
      };
    }

    if (user.role === 'Supplier') {
      connectSocket(supplierSocket);
      const handleNewOrderProcurement = (order: any) => {
        const refId = order._id.slice(-6).toUpperCase();
        toast.success(`NEW PROCUREMENT REQUEST! #BID-${refId}`, {
          icon: '📦',
          duration: 10000,
          position: 'top-center',
          style: { background: '#0f172a', color: '#fff', border: '1px solid #f59e0b', padding: '16px', fontWeight: 'bold' }
        });
        playSound('/sounds/New Order.mpeg');
        showSystemNotification('📦 New Procurement Request!', `A new order #BID-${refId} matching your expertise is available.`, 'new-procurement');
      };

      supplierSocket.on('new-order', handleNewOrderProcurement);
      return () => {
        supplierSocket.off('new-order', handleNewOrderProcurement);
      };
    }

    if (user.role === 'Admin') {
      connectSocket(adminSocket);

      const handleNewOrder = (order: any) => {
        const refId = String(order?._id || order?.id || 'UNKNOWN').slice(-6).toUpperCase();
        toast.success(`🎉 New Order Received! (#${refId})`);
        playSound('/sounds/New Order.mpeg');
        showSystemNotification('🎉 New Order Received!', `Order #${refId} has been placed.`, 'admin-new-order');
      };

      const handleNewRequest = (request: any) => {
        toast.success(`📸 New Material Request from ${request.name}!`);
        playSound('/sounds/New request.mpeg');
        showSystemNotification('📸 New Material Request!', `New request from ${request.name}.`, 'admin-new-request');
      };

      const handleNewOnDemand = (request: any) => {
        toast.success(`📞 New On-Demand Request for ${request.productName}!`);
        playSound('/sounds/New request.mpeg');
        showSystemNotification('📞 New On-Demand Request!', `Custom request for ${request.productName}.`, 'admin-new-ondemand');
      };

      adminSocket.on('new-order', handleNewOrder);
      adminSocket.on('new-user-request', handleNewRequest);
      adminSocket.on('new-on-demand-request', handleNewOnDemand);

      return () => {
        adminSocket.off('new-order', handleNewOrder);
        adminSocket.off('new-user-request', handleNewRequest);
        adminSocket.off('new-on-demand-request', handleNewOnDemand);
      };
    }
  }, []);

  return null;
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is logged in but has wrong role, send to home
    toast.error('Access Denied: You do not have permission to view this page.');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};



const LoadingFallback = () => (
  <div className="loading-fallback">
    <div className="shimmer-container">
      <div className="shimmer-header"></div>
      <div className="shimmer-content">
        <div className="shimmer-block"></div>
        <div className="shimmer-block"></div>
        <div className="shimmer-block"></div>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isRiderPath = location.pathname.startsWith('/rider');
  const isSupplierPath = location.pathname.startsWith('/supplier') || location.pathname === '/reports';
  const isLoginPage = location.pathname === '/login';

  const isCartPath = location.pathname === '/cart';
  const isCheckoutPath = location.pathname === '/checkout';
  const isPaymentPath = location.pathname === '/payment';

  const showNavbar = !isAdminPath && !isRiderPath && !isSupplierPath && !isLoginPage && !isPaymentPath;
  const showSiteFooter = !isAdminPath && !isRiderPath && !isSupplierPath && !isLoginPage && !isCartPath && !isCheckoutPath && !isPaymentPath;
  const showBottomNav = !isAdminPath && !isRiderPath && !isSupplierPath && !isPaymentPath;

  return (
    <div className={`app-container app-container-responsive ${showBottomNav ? 'with-footer-padding' : ''}`}>
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        containerStyle={{
          zIndex: 999999,
        }}
        toastOptions={{
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <SocketManager />
      {showNavbar && <Navbar />}
      <ReloadPrompt />
      {/* <FloatingCart /> */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Prioritize specific routes */}
          <Route path="/search" element={<SearchFilter />} />
          
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/category/:categoryName" element={<SubCategoryPage />} />
          <Route path="/brand/:brandName" element={<BrandStore />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<PaymentMethod />} />
          <Route path="/tracking/:id" element={<Tracking />} />
          <Route path="/supplier/:id" element={<SupplierStore />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/support" element={<Support />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="inventory" element={<SKUManager />} />
            <Route path="suppliers" element={<SupplierManager />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="sub-categories" element={<SubCategoryManager />} />
            <Route path="units" element={<UnitManager />} />
            <Route path="brands" element={<BrandManager />} />
            <Route path="variant-titles" element={<SubVariantTitleManager />} />
            <Route path="delivery-times" element={<DeliveryTimeManager />} />
            <Route path="queue" element={<PickingQueue />} />
            <Route path="fleet" element={<RiderManager />} />
            <Route path="invoices" element={<InvoicingReports />} />
            <Route path="offers" element={<OfferManager />} />
            <Route path="locations" element={<LocationManager />} />
          </Route>


          {/* Rider Routes */}
          <Route 
            path="/rider" 
            element={
              <ProtectedRoute allowedRoles={['Rider']}>
                <RiderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/rider/verify/:id" element={<ProtectedRoute allowedRoles={['Rider']}><TaskVerification /></ProtectedRoute>} />
          <Route path="/rider/delivery/:id" element={<ProtectedRoute allowedRoles={['Rider']}><DeliveryNavigation /></ProtectedRoute>} />
          <Route path="/rider/pod/:id" element={<ProtectedRoute allowedRoles={['Rider']}><ProofOfDelivery /></ProtectedRoute>} />

          {/* Supplier Routes */}
          <Route 
            path="/supplier" 
            element={
              <ProtectedRoute allowedRoles={['Supplier']}>
                <SupplierDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['Supplier']}><Reports /></ProtectedRoute>} />
        </Routes>
      </Suspense>

      {showSiteFooter && <SiteFooter />}
      {showBottomNav && <Footer />}
    </div>
  );
};

const ServiceBanner = () => {
  const { isCurrentlyEnabled, settings } = useSettings();
  if (isCurrentlyEnabled) return null;
  return (
    <div style={{
      background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '12px 20px',
      fontSize: '0.95rem',
      fontWeight: '700',
      position: 'sticky',
      top: 0,
      zIndex: 10000,
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      letterSpacing: '0.5px'
    }}>
      <AlertTriangle size={20} />
      <span>{settings.offlineMessage}</span>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <ServiceBanner />
          <APIProvider 
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""} 
            libraries={['places', 'geocoding', 'drawing']}
          >
            <LocationProvider>
              <AppContent />
            </LocationProvider>
          </APIProvider>
        </Router>
      </CartProvider>
    </SettingsProvider>
  );
};

export default App;
