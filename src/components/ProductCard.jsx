import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';

const ProductCard = ({ product, onQuickInquire }) => {
  if (!product) return null;

  const mainImage = product.images?.[0] || BRAND_ASSETS.FALLBACK_PRODUCT;
  const secondaryImage = product.images?.[1] || mainImage;

  return (
    <div className="group relative bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between h-full transition-all duration-300 hover:border-neutral-900">
      <div>
        {/* Simple Minimal Badge (Only if Navratri Edit or Status) */}
        {product.isNavratriEdit && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-neutral-900 text-lime-400 border border-lime-400/40 text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
              <span>NAVRATRI EDIT</span>
            </span>
          </div>
        )}

        {/* Photography Container */}
        <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-100">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 group-hover:opacity-0"
            loading="lazy"
            onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
          />
          <img
            src={secondaryImage}
            alt={`${product.name} preview`}
            className="w-full h-full object-cover object-center absolute inset-0 transition-transform duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.target.src = mainImage; }}
          />
        </Link>

        {/* Information */}
        <div className="p-4 space-y-1.5">
          <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase flex items-center justify-between">
            <span>{product.collectionName || 'COLLECTION'}</span>
            <span>{product.category}</span>
          </div>

          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-sm font-bold tracking-wider text-neutral-900 group-hover:text-black transition-colors uppercase line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Card Action */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-neutral-100 mt-auto">
        <Link
          to={`/product/${product.slug}`}
          className="text-xs font-semibold tracking-widest text-neutral-900 group-hover:text-black flex items-center gap-1 transition-colors uppercase"
        >
          <span>VIEW PIECE</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        {onQuickInquire && (
          <button
            onClick={() => onQuickInquire(product)}
            className="text-[10px] tracking-wider font-mono px-2.5 py-1 bg-neutral-100 hover:bg-black text-neutral-700 hover:text-white transition-colors uppercase"
          >
            QUICK INQUIRE
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
