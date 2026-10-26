import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, ChevronDown } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';
import { getSettings, fetchLiveSettings } from '../data/settings';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState(() => getSettings());
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchLiveSettings().then((live) => {
      if (live) setSettings(live);
    });

    const handleSettingsUpdated = (e) => {
      if (e.detail) setSettings(e.detail);
    };

    window.addEventListener('venm_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('venm_settings_updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMobileDropdown(null);
  }, [location.pathname]);

  const activeFest = settings?.active_fest;
  const festName = activeFest?.navLabel || activeFest?.name || 'ACTIVE FEST';
  const festSlug = activeFest?.slug || 'active-fest';
  const announcementText = activeFest?.announcement || 
    (settings?.general?.brandName && settings?.general?.tagline 
      ? `${settings.general.brandName} // ${settings.general.tagline}` 
      : 'VENM × ACTIVE FEST: THE FESTIVE EDIT IS NOW LIVE');

  const whatsappRaw = ((String(settings?.whatsapp?.number || settings?.whatsapp?.rawNumber || '917434096095')).replace(/[^0-9]/g, '')).replace(/^919664984749$|^9664984749$/, '917434096095') || '917434096095';

  const navLinks = [
    { name: 'HOME', path: '/' },
    {
      name: 'MEN',
      path: '/men',
      dropdown: [
        { name: 'ALL MEN', path: '/men' },
        { name: 'ETHNIC & KURTAS', path: '/men/ethnic' },
        { name: 'TOPS & SHIRTS', path: '/men/tops' },
        { name: 'JACKETS & OUTERWEAR', path: '/men/outerwear' },
        { name: 'PANTS & DENIM', path: '/men/bottoms' },
        { name: 'ACCESSORIES', path: '/men/accessories' }
      ]
    },
    {
      name: 'WOMEN',
      path: '/women',
      dropdown: [
        { name: 'ALL WOMEN', path: '/women' },
        { name: 'ETHNIC & KURTAS', path: '/women/ethnic' },
        { name: 'TOPS & SHIRTS', path: '/women/tops' },
        { name: 'JACKETS & OUTERWEAR', path: '/women/outerwear' },
        { name: 'PANTS & DENIM', path: '/women/bottoms' },
        { name: 'ACCESSORIES', path: '/women/accessories' }
      ]
    },
    { name: 'COLLECTIONS', path: '/collections' },
    { name: festName, path: `/collection/${festSlug}`, highlight: true },
    { name: 'ABOUT', path: '/about' }
  ];

  return (
    <>
      {/* Top Campaign Bar - Quiet Light Neutral with Neon Green Accent */}
      <div className="bg-neutral-900 border-b border-neutral-800 text-xs py-2 px-4 text-center tracking-widest text-neutral-200 font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
        <span className="text-white font-semibold uppercase">{announcementText}</span>
        <Link to={`/collection/${festSlug}`} className="text-lime-400 hover:text-white font-mono font-bold ml-1 flex items-center gap-0.5">
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
          <nav className="hidden md:flex items-center space-x-7">
            {navLinks.map((link) => {
              const isDropdown = Boolean(link.dropdown);
              const isActive = link.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.path);

              if (isDropdown) {
                return (
                  <div key={link.path} className="relative group py-2">
                    <Link
                      to={link.path}
                      className={`text-xs tracking-[0.18em] font-semibold transition-colors relative py-1 uppercase flex items-center gap-1 ${
                        isActive ? 'text-black font-extrabold' : 'text-neutral-700 hover:text-black'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-black group-hover:rotate-180 transition-transform duration-200" />
                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-lime-400" />
                      )}
                    </Link>

                    {/* Popover Dropdown Panel */}
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 min-w-[210px]">
                      <div className="bg-white border border-neutral-200 shadow-xl py-2 px-1">
                        <div className="text-[9px] font-mono tracking-widest text-neutral-400 px-3 py-1 uppercase border-b border-neutral-100 mb-1">
                          {link.name} CATEGORIES
                        </div>
                        {link.dropdown.map((sub) => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              className={`flex items-center justify-between px-3 py-2 text-[11px] font-mono tracking-wider transition-colors uppercase font-bold group/item ${
                                isSubActive
                                  ? 'bg-neutral-900 text-lime-400'
                                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                              }`}
                            >
                              <span>{sub.name}</span>
                              <ArrowUpRight className={`w-3 h-3 transition-opacity ${isSubActive ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100 text-neutral-900'}`} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

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

          {/* Right Action: Inquiry */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href={`https://wa.me/${whatsappRaw}?text=${encodeURIComponent("Hello VENM! I'd like to request a look from your reference catalog.")}`}
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
        <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col justify-between pt-20 pb-8 px-6 animate-fadeIn overflow-y-auto">
          <div className="space-y-6">
            <div className="text-[10px] tracking-[0.25em] text-neutral-400 font-mono border-b border-neutral-200 pb-3 uppercase flex items-center justify-between">
              <span>NAVIGATION // CATALOG 2026</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-neutral-600 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-4">
              {navLinks.map((link) => {
                const isDropdown = Boolean(link.dropdown);
                const isActive = link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);

                if (isDropdown) {
                  const isExpanded = openMobileDropdown === link.name;
                  return (
                    <div key={link.path} className="space-y-2 border-b border-neutral-100 pb-3">
                      <div className="flex items-center justify-between">
                        <Link
                          to={link.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`text-xl font-bold tracking-wider uppercase transition-colors ${
                            isActive ? 'text-black font-extrabold' : 'text-neutral-700 hover:text-black'
                          }`}
                        >
                          {link.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setOpenMobileDropdown(isExpanded ? null : link.name)}
                          className="p-2 text-neutral-500 hover:text-black"
                          aria-label={`Toggle ${link.name} categories`}
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Expanded Mobile Category Sublinks */}
                      {isExpanded && (
                        <div className="pl-3 py-1 space-y-2 border-l-2 border-lime-400 ml-1 bg-neutral-50 p-2">
                          {link.dropdown.map((sub) => (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-xs font-mono font-bold tracking-wider text-neutral-600 hover:text-black uppercase py-0.5"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-xl font-bold tracking-wider uppercase transition-colors border-b border-neutral-100 pb-3 ${
                      isActive ? 'text-black' : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-neutral-200">
            <a
              href={`https://wa.me/${whatsappRaw}?text=${encodeURIComponent("Hello VENM Catalog Inquiry")}`}
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
