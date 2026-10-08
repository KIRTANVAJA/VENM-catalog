import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Instagram, MessageCircle } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';
import { getSettings, fetchLiveSettings } from '../data/settings';

const Footer = () => {
  const [settings, setSettings] = useState(() => getSettings());

  useEffect(() => {
    fetchLiveSettings().then((live) => {
      if (live) setSettings({ ...live });
    });
  }, []);

  const instagramUrl = settings?.social?.instagram || 'https://instagram.com/venm.exe';

  return (
    <footer className="bg-neutral-50 text-neutral-600 border-t border-neutral-200 pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={BRAND_ASSETS.LOGO_NAV}
                alt="VENM Logo"
                className="h-10 sm:h-12 w-auto object-contain max-h-12"
              />
            </Link>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {settings?.general?.footerText || "CONTEMPORARY GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR & INDO-WESTERN SILHOUETTES."}
            </p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-1 bg-neutral-200/70 border border-neutral-300 text-neutral-800 text-[10px] tracking-widest font-mono uppercase">
                CAMPAIGN: NAVRATRI EDIT
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-neutral-900 text-xs font-bold tracking-[0.2em] uppercase mb-4 font-mono">
              NAVIGATION
            </h4>
            <ul className="space-y-2.5 text-xs font-medium tracking-wider">
              <li>
                <Link to="/" className="hover:text-black transition-colors">HOME</Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-black transition-colors">ALL COLLECTIONS</Link>
              </li>
              <li>
                <Link to="/collection/navratri" className="text-neutral-900 hover:text-black font-semibold transition-colors">
                  NAVRATRI EDIT
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-black transition-colors">ABOUT VENM</Link>
              </li>
            </ul>
          </div>

          {/* Active Collections */}
          <div>
            <h4 className="text-neutral-900 text-xs font-bold tracking-[0.2em] uppercase mb-4 font-mono">
              COLLECTIONS
            </h4>
            <ul className="space-y-2.5 text-xs font-medium tracking-wider">
              <li>
                <Link to="/collection/navratri" className="hover:text-black transition-colors">NAVRATRI EDIT</Link>
              </li>
              <li>
                <Link to="/collection/indo-western" className="hover:text-black transition-colors">INDO-WESTERN</Link>
              </li>
              <li>
                <Link to="/collection/denim" className="hover:text-black transition-colors">RAW DENIM</Link>
              </li>
              <li>
                <Link to="/collection/street" className="hover:text-black transition-colors">STREETWEAR</Link>
              </li>
              <li>
                <Link to="/collection/ethnic" className="hover:text-black transition-colors">CONTEMPORARY ETHNIC</Link>
              </li>
            </ul>
          </div>

          {/* Inquiry & Socials */}
          <div className="space-y-4">
            <h4 className="text-neutral-900 text-xs font-bold tracking-[0.2em] uppercase mb-4 font-mono">
              INQUIRIES & CONNECT
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              FOR BESPOKE INQUIRIES, SIZING ASSISTANCE OR CATALOG APPOINTMENTS:
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${(settings?.whatsapp?.number || '917434096095').replace(/[^0-9]/g, '')}?text=Hello%20VENM%20Studio`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-semibold text-neutral-900 hover:text-black transition-colors group"
              >
                <MessageCircle className="w-4 h-4 text-neutral-800" />
                <span>WHATSAPP DIRECT INQUIRY</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-neutral-900 font-bold hover:text-black transition-colors"
              >
                <Instagram className="w-4 h-4 text-neutral-900" />
                <span>INSTAGRAM // @VENM.EXE</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-neutral-200 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 font-mono tracking-wider gap-4">
          <p>© {new Date().getFullYear()} VENM CATALOG. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center space-x-6">
            <span>{settings?.general?.location || "AHMEDABAD // GUJARAT"}</span>
            <span>{settings?.general?.contactEmail || "venm1310@gmail.com"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
