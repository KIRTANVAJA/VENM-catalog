import React from 'react';

export const GarbaSpinMotif = ({ className = "w-12 h-12 text-neutral-400" }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" />
    <polygon points="50,15 54,23 50,31 46,23" fill="currentColor" opacity="0.6" />
    <polygon points="50,69 54,77 50,85 46,77" fill="currentColor" opacity="0.6" />
    <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.5" />
  </svg>
);

export const DandiyaSlash = ({ className = "h-6 text-neutral-400" }) => (
  <div className={`flex items-center space-x-1 ${className}`}>
    <span className="w-8 h-[1.5px] bg-neutral-800 transform -rotate-45" />
    <span className="w-8 h-[1.5px] bg-neutral-400 transform -rotate-45" />
  </div>
);

export const MirrorworkDot = () => (
  <span className="inline-block w-2 h-2 bg-neutral-900 transform rotate-45 border border-neutral-400" />
);

export default GarbaSpinMotif;
