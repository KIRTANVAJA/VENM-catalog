import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND_ASSETS } from '../config/assets';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

const AuthModal = () => {
  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    authModalReason,
    closeLoginModal
  } = useAuth();

  const navigate = useNavigate();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await login(username, password);
      setSuccessMsg('LOGIN SUCCESSFUL!');
      setTimeout(() => {
        setLoading(false);
        closeLoginModal();
        if (res?.user?.role === 'ADMIN') {
          // If admin, option to keep on page or toast
        }
      }, 600);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'INVALID USERNAME OR PASSWORD');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail && !regPhone) {
      setErrorMsg('PLEASE ENTER EITHER AN EMAIL ADDRESS OR PHONE NUMBER');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword
      });
      setSuccessMsg('ACCOUNT CREATED & LOGGED IN!');
      setTimeout(() => {
        setLoading(false);
        closeLoginModal();
      }, 700);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'FAILED TO CREATE ACCOUNT');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
    setSuccessMsg('LOGGED OUT SUCCESSFULLY');
    setTimeout(() => {
      closeLoginModal();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white text-neutral-900 border border-neutral-200 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          aria-label="Close auth modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src={BRAND_ASSETS.LOGO_PRIMARY}
            alt="VENM Logo"
            className="h-10 mx-auto object-contain"
          />
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              VENM CATALOG // CLIENT ACCESS
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-neutral-900">
              {isAuthenticated ? 'YOUR ACCOUNT' : authModalTab === 'login' ? 'ACCOUNT LOGIN' : 'CREATE ACCOUNT'}
            </h2>
          </div>
        </div>

        {/* Context-aware reason banner */}
        {!isAuthenticated && authModalReason === 'inquiry_required' && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold block uppercase">SIGN IN REQUIRED TO INQUIRE</span>
              <span className="text-[10px] text-amber-800 font-sans block">
                Please log in with your Email ID or Phone Number to submit requests and receive quotes.
              </span>
            </div>
          </div>
        )}

        {!isAuthenticated && authModalReason === 'initial_visit' && (
          <div className="p-3 bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-mono flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-600 flex-shrink-0" />
              <span className="text-[11px] font-semibold">Sign in to track inquiries or cancel to browse as guest.</span>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-lime-50 border border-lime-300 text-neutral-900 text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* LOGGED IN VIEW */}
        {/* ==================================================== */}
        {isAuthenticated ? (
          <div className="space-y-5">
            <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-none bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-lg">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold uppercase text-neutral-900">
                    {currentUser?.name || 'VENM USER'}
                  </h3>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-lime-400 text-neutral-900">
                    {currentUser?.role === 'ADMIN' ? 'STUDIO ADMIN' : 'REGISTERED CLIENT'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 text-xs font-mono space-y-1.5 text-neutral-600">
                {currentUser?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{currentUser.email}</span>
                  </div>
                )}
                {currentUser?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  closeLoginModal();
                  navigate('/profile');
                }}
                className="w-full btn-venm-primary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 bg-lime-400 text-neutral-900 hover:bg-lime-300"
              >
                <User className="w-4 h-4" />
                <span>MY PROFILE & INQUIRIES</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    closeLoginModal();
                    navigate('/admin/dashboard');
                  }}
                  className="w-full btn-venm-secondary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>GO TO ADMIN PANEL</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full btn-venm-secondary border-neutral-300 text-neutral-700 hover:text-red-600 hover:border-red-600 py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'LOGGING OUT...' : 'LOGOUT'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* LOGGED OUT VIEW (LOGIN / REGISTER TABS) */
          /* ==================================================== */
          <div className="space-y-5">
            {/* Tabs */}
            <div className="grid grid-cols-2 border border-neutral-200 p-0.5 bg-neutral-100 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setErrorMsg(null);
                }}
                className={`py-2 uppercase font-bold transition-colors ${
                  authModalTab === 'login'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setErrorMsg(null);
                }}
                className={`py-2 uppercase font-bold transition-colors ${
                  authModalTab === 'register'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                REGISTER
              </button>
            </div>

            {authModalTab === 'login' ? (
              /* --- LOGIN FORM --- */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    <span>USERNAME (EMAIL ID OR PHONE NUMBER)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter email ID or phone number"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2.5 text-xs text-neutral-900 outline-none font-mono"
                  />
                  <span className="text-[10px] font-mono text-neutral-400 block">
                    ✓ Use either your email (e.g. venm1310@gmail.com) or 10-digit mobile (e.g. 7434096095)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>PASSWORD</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2.5 text-xs text-neutral-900 outline-none font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-venm-primary py-3 px-4 text-xs font-bold tracking-[0.2em] flex items-center justify-center gap-2 uppercase shadow-sm mt-2"
                >
                  <span>{loading ? 'AUTHENTICATING...' : 'LOGIN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* --- REGISTER FORM --- */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase block">
                    YOUR NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase block">
                    EMAIL ADDRESS (OPTIONAL IF PHONE PROVIDED)
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase block">
                    PHONE NUMBER (OPTIONAL IF EMAIL PROVIDED)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase block">
                    CREATE PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-3.5 py-2 text-xs text-neutral-900 outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-venm-primary py-3 px-4 text-xs font-bold tracking-[0.2em] flex items-center justify-center gap-2 uppercase shadow-sm mt-3"
                >
                  <span>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Guest Dismissal / Cancel Button */}
            <div className="pt-2 text-center border-t border-neutral-100">
              <button
                type="button"
                onClick={closeLoginModal}
                className="text-[11px] font-mono font-bold text-neutral-500 hover:text-black py-1 transition-colors uppercase tracking-wider"
              >
                ✕ CANCEL & CONTINUE BROWSING AS GUEST
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>VENM SECURE AUTH</span>
          <span className="flex items-center gap-1 text-neutral-600">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" /> ENCRYPTED
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
