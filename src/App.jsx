import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public Catalog Components & Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BrandLoader from './components/BrandLoader';
import AdminPasskeyModal from './components/AdminPasskeyModal';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/Home';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Admin Panel Components & Pages
import AdminLogin from './admin/pages/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminProducts from './admin/pages/AdminProducts';
import AdminProductForm from './admin/pages/AdminProductForm';
import AdminCollections from './admin/pages/AdminCollections';
import AdminCollectionForm from './admin/pages/AdminCollectionForm';
import AdminCategories from './admin/pages/AdminCategories';
import AdminHomepageCMS from './admin/pages/AdminHomepageCMS';
import AdminCampaigns from './admin/pages/AdminCampaigns';
import AdminActiveFest from './admin/pages/AdminActiveFest';
import AdminMediaLibrary from './admin/pages/AdminMediaLibrary';
import AdminSettings from './admin/pages/AdminSettings';
import AdminUsers from './admin/pages/AdminUsers';

import { useAuth } from './context/AuthContext';
import { apiSendHeartbeat } from './services/api';

// Helper component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Real-time visitor presence heartbeat tracker for live admin analytics
const VisitorPresenceTracker = () => {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    let sessionId = sessionStorage.getItem('venm_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('venm_session_id', sessionId);
    }

    const sendBeat = () => {
      apiSendHeartbeat({
        sessionId,
        user: currentUser,
        currentPath: pathname
      });
    };

    sendBeat();
    const interval = setInterval(sendBeat, 20000);

    return () => clearInterval(interval);
  }, [pathname, currentUser]);

  return null;
};

// Public Storefront Layout Wrapper
const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col justify-between">
    <Navbar />
    <main className="flex-grow">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Initial Application Startup & Brand Introduction Boot Timer
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <BrandLoader message="INITIALIZING VENM CATALOG..." />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <VisitorPresenceTracker />
        {/* Global Shortcut Listener for Ctrl+Shift+A Passkey Modal */}
        <AdminPasskeyModal />
        {/* Global Client & Admin Authentication Modal */}
        <AuthModal />

        <Routes>
          {/* PUBLIC CATALOG ROUTES */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/collections"
            element={
              <PublicLayout>
                <Collections />
              </PublicLayout>
            }
          />
          <Route
            path="/collection/:slug"
            element={
              <PublicLayout>
                <CollectionDetail />
              </PublicLayout>
            }
          />
          <Route
            path="/product/:slug"
            element={
              <PublicLayout>
                <ProductDetail />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <PublicLayout>
                <Profile />
              </PublicLayout>
            }
          />

          {/* ADMIN PANEL ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />

          {/* Products */}
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm mode="create" />} />
          <Route path="products/:id/edit" element={<AdminProductForm mode="edit" />} />

          {/* Collections */}
          <Route path="collections" element={<AdminCollections />} />
          <Route path="collections/new" element={<AdminCollectionForm mode="create" />} />
          <Route path="collections/:id/edit" element={<AdminCollectionForm mode="edit" />} />

          {/* Categories */}
          <Route path="categories" element={<AdminCategories />} />

          {/* CMS & Content */}
          <Route path="active-fest" element={<AdminActiveFest />} />
          <Route path="activist" element={<AdminActiveFest />} />
          <Route path="homepage" element={<AdminHomepageCMS />} />
          <Route path="campaigns" element={<AdminCampaigns />} />

          {/* Media */}
          <Route path="media" element={<AdminMediaLibrary />} />

          {/* Settings */}
          <Route path="settings" element={<Navigate to="/admin/settings/general" replace />} />
          <Route path="settings/general" element={<AdminSettings />} />
          <Route path="settings/whatsapp" element={<AdminSettings />} />
          <Route path="settings/social" element={<AdminSettings />} />
          <Route path="settings/seo" element={<AdminSettings />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
};

export default App;
