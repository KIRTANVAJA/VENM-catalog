import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGetMyInquiries } from '../services/api';
import { BRAND_ASSETS } from '../config/assets';
import { getSettings } from '../data/settings';
import {
  User,
  Mail,
  Phone,
  Clock,
  Shirt,
  MessageCircle,
  ArrowUpRight,
  LogOut,
  ShieldCheck,
  Eye,
  Package,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const Profile = () => {
  const { currentUser, isAuthenticated, isAdmin, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const settings = getSettings();

  const loadInquiries = async () => {
    setLoading(true);
    try {
      // 1. Fetch from backend API
      const contact = currentUser?.email || currentUser?.phone || '';
      const apiData = await apiGetMyInquiries({
        userId: currentUser?.id,
        contact
      }).catch(() => []);

      // 2. Fetch from local storage fallback
      let localData = [];
      try {
        const storageKey = currentUser?.id ? `venm_inquiries_${currentUser.id}` : 'venm_guest_inquiries';
        localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch (e) {}

      // Combine and deduplicate by id or product + date
      const combined = Array.isArray(apiData) ? [...apiData] : [];
      if (Array.isArray(localData)) {
        localData.forEach((item) => {
          if (!combined.some((c) => c.id === item.id || (c.productName === item.productName && c.createdAt === item.createdAt))) {
            combined.push(item);
          }
        });
      }

      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setInquiries(combined);
    } catch (err) {
      console.warn('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInquiries();
    } else {
      setLoading(false);
    }

    const handleUpdate = () => {
      loadInquiries();
    };

    window.addEventListener('venm-inquiries-updated', handleUpdate);
    return () => window.removeEventListener('venm-inquiries-updated', handleUpdate);
  }, [isAuthenticated, currentUser]);

  const handleLogoutClick = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center py-20 px-4 font-sans">
        <div className="max-w-md w-full bg-neutral-50 p-8 border border-neutral-200 text-center space-y-6">
          <div className="w-16 h-16 bg-neutral-900 text-white rounded-none mx-auto flex items-center justify-center font-mono">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              CLIENT PORTAL
            </span>
            <h1 className="text-2xl font-black tracking-wider uppercase text-neutral-900">
              PLEASE SIGN IN
            </h1>
            <p className="text-xs text-neutral-600 font-sans">
              Sign in with your Email ID or Phone Number to view your profile and see all your product inquiries.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openLoginModal('login')}
            className="w-full btn-venm-primary py-3.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>LOGIN / SIGN IN</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 py-12 px-4 sm:px-6 lg:px-8 font-sans space-y-12 pb-24">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
          <Link to="/" className="hover:text-black transition-colors">HOME</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-black font-bold">CLIENT ACCOUNT</span>
        </nav>

        {/* Profile Card Header */}
        <div className="bg-neutral-50 p-6 sm:p-8 border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-900 text-white flex items-center justify-center font-mono font-black text-2xl flex-shrink-0 shadow-sm">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-black tracking-wider uppercase text-neutral-900">
                  {currentUser?.name || 'VALUED CLIENT'}
                </h1>
                <span className="px-2.5 py-0.5 bg-lime-400 text-neutral-900 font-mono text-[9px] font-bold uppercase tracking-widest">
                  {currentUser?.role === 'ADMIN' ? '★ STUDIO ADMIN' : 'REGISTERED CLIENT'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-neutral-600">
                {currentUser?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{currentUser.email}</span>
                  </div>
                )}
                {currentUser?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="btn-venm-secondary text-xs px-4 py-2.5 font-bold tracking-wider uppercase flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ADMIN PANEL</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogoutClick}
              className="btn-venm-primary bg-neutral-900 text-white hover:bg-neutral-800 text-xs px-5 py-2.5 font-bold tracking-wider uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* INQUIRIES SECTION */}
        {/* ---------------------------------------------------- */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-neutral-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
                  ACTIVITY & SAVED INQUIRIES
                </span>
                <span className="px-2 py-0.5 bg-neutral-900 text-white font-mono text-[9px] font-bold">
                  {inquiries.length} LOOKS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-neutral-900 uppercase">
                MY PRODUCT INQUIRIES & CUSTOM REQUESTS
              </h2>
            </div>

            <button
              type="button"
              onClick={loadInquiries}
              className="self-start sm:self-auto text-xs font-mono text-neutral-500 hover:text-black flex items-center gap-1 uppercase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-neutral-400 uppercase">
              LOADING YOUR INQUIRIES...
            </div>
          ) : inquiries.length === 0 ? (
            <div className="bg-neutral-50 p-12 text-center border border-dashed border-neutral-300 space-y-4">
              <Package className="w-12 h-12 text-neutral-400 mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-extrabold uppercase text-neutral-900">
                  NO INQUIRIES LOGGED YET
                </h3>
                <p className="text-xs text-neutral-500 font-sans">
                  Browse our reference catalog and click "Request This Look" or "Inquire" on any product to start customizing.
                </p>
              </div>
              <Link
                to="/collections"
                className="inline-block btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest uppercase"
              >
                EXPLORE REFERENCE COLLECTIONS
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiries.map((inq, index) => {
                const dateStr = inq.createdAt
                  ? new Date(inq.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Recent Inquiry';

                const whatsappMsg = encodeURIComponent(
                  `Hello VENM! I previously inquired about "${inq.productName}". I'd like to check the styling update.`
                );
                const whatsappUrl = `https://wa.me/${settings.whatsapp.number.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

                return (
                  <div
                    key={inq.id || index}
                    className="p-5 bg-white border border-neutral-200 hover:border-neutral-900 transition-all flex flex-col justify-between space-y-4 shadow-xs group"
                  >
                    <div className="space-y-4">
                      {/* Top Bar with Status and Date */}
                      <div className="flex items-center justify-between text-[10px] font-mono border-b border-neutral-100 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                          <span className="font-extrabold text-neutral-900 uppercase">
                            {inq.status || 'INQUIRY SUBMITTED'}
                          </span>
                        </div>
                        <span className="text-neutral-400">{dateStr}</span>
                      </div>

                      {/* Product Preview Snippet */}
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-24 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 relative">
                          <img
                            src={inq.productImage || BRAND_ASSETS.FALLBACK_PRODUCT}
                            alt={inq.productName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block truncate">
                            {inq.collectionName || 'VENM REFERENCE'}
                          </span>
                          <h3 className="text-sm font-black text-neutral-900 uppercase truncate">
                            {inq.productName}
                          </h3>
                          {inq.productPrice && (
                            <p className="text-xs font-mono font-bold text-neutral-700">
                              {inq.productPrice}
                            </p>
                          )}
                          {inq.selectedSize && (
                            <p className="text-[10px] font-mono text-neutral-500">
                              SIZE: <strong className="text-neutral-800">{inq.selectedSize}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Request Details & Note */}
                      <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-800 uppercase">
                          <Shirt className="w-3.5 h-3.5 text-neutral-500" />
                          <span>MODE: {inq.requestType || 'BESPOKE CUSTOM'}</span>
                        </div>
                        {inq.note && (
                          <p className="text-[11px] text-neutral-600 font-sans italic line-clamp-2">
                            "{inq.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                      {inq.productSlug && (
                        <Link
                          to={`/product/${inq.productSlug}`}
                          className="flex-1 btn-venm-secondary py-2 text-[11px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 text-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>VIEW PIECE</span>
                        </Link>
                      )}

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-venm-primary bg-lime-400 hover:bg-lime-300 text-neutral-900 py-2 text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-1 text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>CHAT STUDIO</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
