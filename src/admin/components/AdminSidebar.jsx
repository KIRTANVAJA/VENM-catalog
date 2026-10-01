import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BRAND_ASSETS } from '../../config/assets';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Home,
  Sparkles,
  Image,
  Settings,
  MessageCircle,
  Share2,
  Search,
  ExternalLink,
  LogOut,
  X
} from 'lucide-react';

const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { name: 'Products', path: '/admin/products', icon: Package },
        { name: 'Collections', path: '/admin/collections', icon: Layers },
        { name: 'Categories', path: '/admin/categories', icon: Tag }
      ]
    },
    {
      title: 'CONTENT & CMS',
      items: [
        { name: 'Homepage CMS', path: '/admin/homepage', icon: Home },
        { name: 'Campaigns', path: '/admin/campaigns', icon: Sparkles }
      ]
    },
    {
      title: 'MEDIA',
      items: [
        { name: 'Media Library', path: '/admin/media', icon: Image }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'General', path: '/admin/settings/general', icon: Settings },
        { name: 'WhatsApp', path: '/admin/settings/whatsapp', icon: MessageCircle },
        { name: 'Social Links', path: '/admin/settings/social', icon: Share2 },
        { name: 'SEO Metadata', path: '/admin/settings/seo', icon: Search }
      ]
    }
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-white text-neutral-900 border-r border-neutral-200 w-64 p-4 font-sans select-none">
      <div className="space-y-6">
        {/* Header with Official Logo (logo2.png) */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
            <img
              src={BRAND_ASSETS.LOGO_NAV}
              alt="VENM Admin Console"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 text-neutral-600 hover:text-black"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 custom-scrollbar">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 uppercase px-2 font-bold block">
                {sec.title}
              </span>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen && setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-wider transition-all rounded-sm border-l-2 ${
                        isActive
                          ? 'bg-neutral-900 text-white font-extrabold border-lime-400'
                          : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-transparent font-semibold'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-lime-400' : 'text-neutral-600'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-neutral-200 space-y-2">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-mono text-neutral-800 transition-colors border border-neutral-200"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
            <span>VIEW LIVE CATALOG</span>
          </span>
          <span className="text-[9px] font-mono text-neutral-500">PUBLIC</span>
        </Link>

        <Link
          to="/admin/login"
          className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>LOGOUT ADMIN</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 z-40">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 animate-slideRight">{content}</div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
