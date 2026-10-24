import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import { apiGetMe } from '../services/api';
import { ShieldAlert, LogIn } from 'lucide-react';

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAdminAuth = async () => {
      try {
        const data = await apiGetMe();
        if (!isMounted) return;

        if (data?.user && data.user.role === 'ADMIN') {
          setIsAuthenticated(true);
          setIsVerifying(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
          }
        } else {
          setIsAuthenticated(false);
          setIsVerifying(false);
          navigate(`/admin/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
        }
      } catch (err) {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setIsVerifying(false);
        navigate(`/admin/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      }
    };

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleExpired = (e) => {
      const msg = e.detail?.message || 'YOUR ADMIN SESSION HAS EXPIRED. PLEASE LOG IN AGAIN.';
      setSessionExpiredMsg(msg);
      setIsAuthenticated(false);
    };

    window.addEventListener('venm-session-expired', handleExpired);
    return () => window.removeEventListener('venm-session-expired', handleExpired);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 font-mono space-y-4">
        <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold tracking-[0.25em] text-lime-400 uppercase">
            STUDIO CONTROL PANEL
          </p>
          <p className="text-xs font-black tracking-wider uppercase text-neutral-300">
            VERIFYING ADMIN CREDENTIALS...
          </p>
        </div>
      </div>
    );
  }

  if (sessionExpiredMsg) {
    return (
      <div className="min-h-screen bg-neutral-900/90 text-white flex flex-col items-center justify-center p-6 font-mono space-y-6">
        <div className="max-w-md w-full bg-white text-neutral-900 p-8 border border-neutral-300 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-red-600 font-bold uppercase block">
              SECURITY WARNING // AUTHENTICATION REQUIRED
            </span>
            <h2 className="text-xl font-black uppercase text-neutral-900 tracking-wider">
              SESSION EXPIRED
            </h2>
            <p className="text-xs text-neutral-600 font-sans">
              {sessionExpiredMsg}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/login', { replace: true })}
            className="w-full btn-venm-primary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>RETURN TO ADMIN LOGIN</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans selection:bg-black selection:text-white flex">
      {/* Sidebar Navigation */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Right Content Panel */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <AdminTopbar setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 bg-neutral-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
