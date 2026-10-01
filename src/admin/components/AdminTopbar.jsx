import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ExternalLink } from 'lucide-react';

const AdminTopbar = ({ setMobileOpen }) => {
  const location = useLocation();

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes('/products/new')) return 'ADD NEW PRODUCT';
    if (path.includes('/products/') && path.includes('/edit')) return 'EDIT PRODUCT';
    if (path.includes('/products')) return 'PRODUCT MANAGEMENT';
    if (path.includes('/collections/new')) return 'CREATE COLLECTION';
    if (path.includes('/collections/') && path.includes('/edit')) return 'EDIT COLLECTION';
    if (path.includes('/collections')) return 'COLLECTION MANAGEMENT';
    if (path.includes('/categories')) return 'CATEGORY MANAGEMENT';
    if (path.includes('/homepage')) return 'HOMEPAGE CMS MANAGER';
    if (path.includes('/campaigns')) return 'CAMPAIGN MANAGER';
    if (path.includes('/media')) return 'MEDIA LIBRARY';
    if (path.includes('/settings/whatsapp')) return 'WHATSAPP SETTINGS';
    if (path.includes('/settings/social')) return 'SOCIAL SETTINGS';
    if (path.includes('/settings/seo')) return 'SEO METADATA SETTINGS';
    if (path.includes('/settings')) return 'GENERAL SETTINGS';
    return 'ADMIN DASHBOARD';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 py-3.5 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-neutral-700 hover:text-black"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase block font-semibold">
            VENM ADMIN // CONTROL PANEL
          </span>
          <h1 className="text-base sm:text-lg font-extrabold tracking-wider text-neutral-900 uppercase">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono tracking-widest uppercase font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>CMS ONLINE</span>
        </div>

        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-mono text-neutral-800 border border-neutral-200 transition-colors uppercase"
        >
          <span>LIVE SITE</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
        </Link>

        <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200">
          <div className="w-8 h-8 bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
            VA
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-neutral-900 tracking-wider">STUDIO ADMIN</span>
            <span className="text-[9px] font-mono text-neutral-500">venm1310@gmail.com</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
