import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, User, LogOut, ShieldCheck } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { currentUser, isAuthenticated, isAdmin, openLoginModal, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'COLLECTIONS', path: '/collections' },
    { name: 'ACTIVE FEST', path: '/collection/active-fest', highlight: true },
    { name: 'ABOUT', path: '/about' }
  ];

  return (
    <>
      {/* Top Campaign Bar - Quiet Light Neutral with Neon Green Accent */}
      <div className="bg-neutral-900 border-b border-neutral-800 text-xs py-2 px-4 text-center tracking-widest text-neutral-200 font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
        <span className="text-white font-semibold">VENM × ACTIVE FEST: THE FESTIVE EDIT IS NOW LIVE</span>
        <Link to="/collection/active-fest" className="text-lime-400 hover:text-white font-mono font-bold ml-1 flex items-center gap-0.5">
          <span>EXPLORE</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Clean Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled ? 'bg-white/95 backdrop-blur-md py-3 border-b border-neutral-200 shadow-sm' : 'bg-white py-4 border-b border-neutral-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Official Persistent Navigation Logo (logo2.png) */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={BRAND_ASSETS.LOGO_NAV}
              alt="VENM Catalog Logo"
              className="h-10 sm:h-12 md:h-14 max-h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs tracking-[0.18em] font-semibold transition-colors relative py-1 uppercase flex items-center gap-1.5 ${
                    isActive
                      ? 'text-black font-extrabold'
                      : link.highlight
                      ? 'text-neutral-900 hover:text-black font-bold'
                      : 'text-neutral-700 hover:text-black'
                  }`}
                >
                  {link.highlight && <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>}
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-lime-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Auth (Login/Logout) + Inquiry */}
          <div className="hidden md:flex items-center space-x-3">
            {/* User Login / Logout Controls */}
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  type="button"
                  className="text-xs tracking-wider uppercase font-mono font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 flex items-center gap-2 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                  <span className="max-w-[110px] truncate">{currentUser?.name || 'ACCOUNT'}</span>
                </button>

                {/* Dropdown Menu on hover */}
                <div className="absolute right-0 top-full pt-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  <div className="w-60 bg-white border border-neutral-200 shadow-2xl p-3 space-y-2 text-xs font-mono">
                    <div className="border-b border-neutral-200 pb-2">
                      <p className="font-extrabold text-neutral-900 truncate uppercase">{currentUser?.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{currentUser?.email || currentUser?.phone}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-bold bg-lime-400 text-neutral-900 uppercase">
                        {currentUser?.role === 'ADMIN' ? 'STUDIO ADMIN' : 'REGISTERED CLIENT'}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 py-1.5 px-2 hover:bg-neutral-100 text-neutral-900 font-bold uppercase transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>MY PROFILE & INQUIRIES</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 py-1.5 px-2 hover:bg-neutral-100 text-neutral-900 font-bold uppercase transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ADMIN PANEL</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 py-1.5 px-2 hover:bg-red-50 text-red-600 font-bold uppercase transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>LOGOUT</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal('login')}
                className="text-xs tracking-wider uppercase font-mono font-bold px-3.5 py-2 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black flex items-center gap-1.5 transition-colors"
                title="Login with Email ID or Phone Number"
              >
                <User className="w-3.5 h-3.5" />
                <span>LOGIN</span>
              </button>
            )}

            <a
              href="https://wa.me/919664984749?text=Hello%20VENM!%20I'd%20like%20to%20request%20a%20look%20from%20your%20reference%20catalog."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-venm-primary text-xs px-5 py-2.5 flex items-center gap-1.5 font-bold tracking-wider"
            >
              <span>REQUEST A LOOK</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => openLoginModal('login')}
                className="p-2 text-neutral-800 hover:text-black"
                title="Login"
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal('login')}
                className="p-1.5 text-xs font-mono font-bold bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-center gap-1"
                title="Account"
              >
                <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                <span className="text-[10px] uppercase truncate max-w-[60px]">{currentUser?.name?.split(' ')[0]}</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-800 hover:text-black"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col justify-between pt-20 pb-8 px-6 animate-fadeIn">
          <div className="space-y-6">
            <div className="text-[10px] tracking-[0.25em] text-neutral-400 font-mono border-b border-neutral-200 pb-3 uppercase flex items-center justify-between">
              <span>NAVIGATION // CATALOG 2026</span>
              {isAuthenticated && (
                <span className="px-1.5 py-0.5 bg-lime-400 text-neutral-900 font-bold text-[8px]">
                  {currentUser?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'}
                </span>
              )}
            </div>

            {/* Mobile Nav Links */}
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block text-xl font-bold tracking-wider uppercase transition-colors ${
                    isActive ? 'text-black' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-neutral-200 space-y-3 font-mono">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <p className="font-bold text-xs uppercase text-neutral-900">{currentUser?.name}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{currentUser?.email || currentUser?.phone}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="w-full btn-venm-secondary py-2.5 text-center text-xs font-bold uppercase flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>MY PROFILE & INQUIRIES</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="w-full btn-venm-secondary py-2.5 text-center text-xs font-bold uppercase flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ADMIN DASHBOARD</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full py-2.5 text-xs font-bold uppercase bg-red-600 text-white flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>LOGOUT</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal('login')}
                  className="w-full btn-venm-secondary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>LOGIN / REGISTER</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-neutral-200">
            <a
              href="https://wa.me/919664984749?text=Hello%20VENM%20Catalog%20Inquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-venm-primary py-3 text-center text-xs font-semibold tracking-widest flex items-center justify-center gap-2 uppercase"
            >
              <span>DIRECT WHATSAPP INQUIRY</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <p className="text-center text-xs text-neutral-400 tracking-wider font-mono uppercase">
              VENM CATALOG // AHMEDABAD
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
