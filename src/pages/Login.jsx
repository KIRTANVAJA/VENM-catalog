import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND_ASSETS } from '../config/assets';
import {
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
  EyeOff
} from 'lucide-react';

const Login = () => {
  const { currentUser, isAuthenticated, isAdmin, login, register, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login inputs (Username & Password)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
        if (res?.user?.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }, 500);
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
      setSuccessMsg('ACCOUNT CREATED SUCCESSFULLY!');
      setTimeout(() => {
        setLoading(false);
        navigate('/');
      }, 600);
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
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200 shadow-xl p-8 space-y-7">
        {/* Brand Representation */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group">
            <img
              src={BRAND_ASSETS.LOGO_PRIMARY}
              alt="VENM Logo"
              className="h-12 mx-auto object-contain"
            />
          </Link>
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              VENM CATALOG // CLIENT ACCESS
            </span>
            <h1 className="text-2xl font-black tracking-wider uppercase text-neutral-900">
              {isAuthenticated ? 'YOUR ACCOUNT' : activeTab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </h1>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-lime-50 border border-lime-400 text-neutral-900 text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authenticated View */}
        {isAuthenticated ? (
          <div className="space-y-5">
            <div className="p-5 bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-lg">
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
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="w-full btn-venm-secondary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 text-center"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>OPEN ADMIN PANEL</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full btn-venm-primary bg-neutral-900 text-white hover:bg-neutral-800 py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'LOGGING OUT...' : 'LOGOUT'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Unauthenticated View */
          <div className="space-y-5">
            <div className="grid grid-cols-2 border border-neutral-200 p-0.5 bg-neutral-100 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg(null);
                }}
                className={`py-2 uppercase font-bold transition-colors ${
                  activeTab === 'login'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg(null);
                }}
                className={`py-2 uppercase font-bold transition-colors ${
                  activeTab === 'register'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            {activeTab === 'login' ? (
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
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-3 text-xs text-neutral-900 outline-none font-mono"
                  />
                  <span className="text-[10px] font-mono text-neutral-400 block">
                    ✓ Accepted: Email ID (e.g. venm1310@gmail.com) or Mobile Number (e.g. 7434096095)
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
                      className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-3 text-xs text-neutral-900 outline-none font-mono pr-10"
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
                  className="w-full btn-venm-primary py-3.5 px-4 text-xs font-bold tracking-[0.2em] flex items-center justify-center gap-2 uppercase shadow-sm mt-3"
                >
                  <span>{loading ? 'AUTHENTICATING...' : 'LOGIN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase block">
                    YOUR FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
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
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
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
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase block">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 px-4 py-2.5 text-xs text-neutral-900 outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-venm-primary py-3.5 px-4 text-xs font-bold tracking-[0.2em] flex items-center justify-center gap-2 uppercase shadow-sm mt-3"
                >
                  <span>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <Link to="/" className="hover:text-black transition-colors">
            ← BACK TO HOME
          </Link>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" /> SECURE SESSION
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
