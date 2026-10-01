import React from 'react';
import { BRAND_ASSETS } from '../config/assets';

const BrandLoader = ({ message = 'LOADING VENM CATALOG...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white text-neutral-900 font-sans space-y-6 animate-fadeIn">
      {/* Centered Brand Logo (venm-logo.png) */}
      <div className="relative w-44 sm:w-56">
        <img
          src={BRAND_ASSETS.LOGO_PRIMARY}
          alt="VENM Brand Logo"
          className="w-full h-auto object-contain transition-opacity duration-500"
        />
      </div>

      {/* Subtle Minimal Indicator */}
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-ping"></span>
        <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-700 uppercase font-bold">
          {message}
        </span>
      </div>
    </div>
  );
};

export default BrandLoader;
