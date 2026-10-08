import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';

const CollectionCard = ({ collection }) => {
  if (!collection) return null;

  const isLocked = collection.status === 'COMING_SOON' || collection.isActive === false;

  return (
    <div className="group relative bg-white border border-neutral-200 overflow-hidden h-96 flex flex-col justify-end transition-all duration-300 hover:border-neutral-900">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden bg-neutral-100">
        <img
          src={collection.coverImage}
          alt={collection.name}
          className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 ${
            isLocked ? 'filter grayscale opacity-50' : 'opacity-85 group-hover:opacity-95'
          }`}
          loading="lazy"
          onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_CAMPAIGN; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Top Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center justify-between w-[calc(100%-2rem)]">
        <span className="font-mono text-[10px] tracking-widest text-white px-2.5 py-1 bg-black/70 uppercase font-semibold">
          {collection.season || 'COLLECTION'}
        </span>
        {isLocked ? (
          <span className="bg-neutral-800 text-neutral-300 text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase">
            COMING SOON
          </span>
        ) : (
          <span className="bg-neutral-900 text-lime-400 border border-lime-400/50 font-bold text-[9px] tracking-widest px-2.5 py-1 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
            <span>ACTIVE EDIT</span>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] font-mono text-neutral-300 uppercase">
            {collection.tagline}
          </p>
          <h3 className="text-2xl font-extrabold tracking-wider text-white uppercase">
            {collection.name}
          </h3>
        </div>

        <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed font-sans font-light">
          {collection.description}
        </p>

        <div className="pt-2 flex items-center justify-between border-t border-white/20">
          <span className="text-[10px] font-mono text-neutral-300 tracking-widest">
            {collection.productCount} PIECES
          </span>

          {isLocked ? (
            <span className="text-xs font-mono text-neutral-400 tracking-wider">PREVIEW ONLY</span>
          ) : (
            <Link
              to={`/collection/${collection.slug}`}
              className="text-xs font-semibold tracking-widest text-white hover:text-neutral-200 flex items-center gap-1 transition-colors uppercase"
            >
              <span>VIEW COLLECTION</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;
