import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  Receipt,
  CreditCard,
  BarChart3,
  Tags,
  Sliders
} from 'lucide-react';

const CostingLayout = () => {
  const location = useLocation();

  const tabs = [
    { name: 'Overview', path: '/admin/costing', end: true, icon: LayoutDashboard },
    { name: 'Product Costing', path: '/admin/costing/products', icon: Shirt },
    { name: 'Order Costing', path: '/admin/costing/orders', icon: Receipt },
    { name: 'Expenses', path: '/admin/costing/expenses', icon: CreditCard },
    { name: 'Profit Reports', path: '/admin/costing/reports', icon: BarChart3 },
    { name: 'Cost Categories', path: '/admin/costing/categories', icon: Tags },
    { name: 'Costing Settings', path: '/admin/costing/settings', icon: Sliders }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fadeIn font-sans">
      {/* Top Breadcrumb & Heading */}
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-800 font-bold uppercase block mb-1">
          BILLING & SALES // FINANCIAL INTELLIGENCE & P&L
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 uppercase">
              COSTING & PROFIT MANAGEMENT
            </h1>
            <p className="text-xs text-neutral-600 font-sans mt-0.5">
              Production costing, BOM itemization, margin simulators, order expense allocation & net operating profit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[9px] font-mono font-black tracking-wider uppercase bg-lime-400 text-neutral-950 border border-lime-500 shadow-xs">
              ACCOUNTING ENGINE ACTIVE
            </span>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 overflow-x-auto pb-1 custom-scrollbar border-t border-neutral-100 pt-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.end 
              ? location.pathname === tab.path 
              : location.pathname.startsWith(tab.path);

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-neutral-900 text-neutral-950 font-black bg-neutral-100'
                    : 'border-transparent text-neutral-600 hover:text-black hover:bg-neutral-50 font-semibold'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-lime-600 font-bold' : 'text-neutral-500'}`} />
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Dynamic Content */}
      <Outlet />
    </div>
  );
};

export default CostingLayout;

