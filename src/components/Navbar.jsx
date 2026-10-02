import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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
    { name: 'NAVRATRI EDIT', path: '/collection/navratri', highlight: true },
    { name: 'ABOUT', path: '/about' }
  ];

  return (
    <>
      {/* Top Campaign Bar - Quiet Light Neutral with Neon Green Accent */}
      <div className="bg-neutral-900 border-b border-neutral-800 text-xs py-2 px-4 text-center tracking-widest text-neutral-200 font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
        <span className="text-white font-semibold">VENM × NAVRATRI: THE FESTIVE EDIT IS NOW LIVE</span>
        <Link to="/collection/navratri" className="text-lime-400 hover:text-white font-mono font-bold ml-1 flex items-center gap-0.5">
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

          {/* Right Action */}
          <div className="hidden md:flex items-center space-x-4">
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
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-800 hover:text-black"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col justify-between pt-20 pb-8 px-6 animate-fadeIn">
          <div className="space-y-6">
            <div className="text-[10px] tracking-[0.25em] text-neutral-400 font-mono border-b border-neutral-200 pb-3 uppercase">
              NAVIGATION // CATALOG 2026
            </div>
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
