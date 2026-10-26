import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../config/assets';
import { formatReferencePrice, getReferenceStatusCTA } from '../data/catalog';
import { getSettings } from '../data/settings';

const ProductCard = ({ product, onQuickInquire, activeFestName }) => {
  if (!product) return null;

  const [settings, setSettings] = useState(() => getSettings());

  useEffect(() => {
    const handleSettingsUpdated = (e) => {
      if (e.detail) {
        setSettings({ ...e.detail });
      }
    };
    window.addEventListener('venm_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('venm_settings_updated', handleSettingsUpdated);
  }, []);

  const activeFest = settings?.active_fest;
  const festName = (
    activeFestName ||
    activeFest?.name ||
    activeFest?.navLabel ||
    (product.collectionSlug === 'navratri' ? 'NAVRATRI EDIT' : (product.collectionName || 'ACTIVE FEST'))
  ).toUpperCase();

  // Determine whether this product is featured in the active festival edit
  const isFestiveProduct = (() => {
    if (activeFest?.assignedProductIds && Array.isArray(activeFest.assignedProductIds) && activeFest.assignedProductIds.length > 0) {
      if (activeFest.assignedProductIds.includes(product.id) || activeFest.assignedProductIds.includes(product._id)) {
        return true;
      }
      if (activeFest.slug && (product.collectionSlug === activeFest.slug || product.collectionId === activeFest.slug)) {
        return true;
      }
      return false;
    }
    return Boolean(
      product.isNavratriEdit ||
      product.isFestive ||
      (activeFest?.slug && (product.collectionSlug === activeFest.slug || product.collectionId === activeFest.slug))
    );
  })();

  const imagesList = Array.isArray(product.images)
    ? product.images
    : (typeof product.images === 'string' && product.images.trim().startsWith('[')
        ? (() => { try { return JSON.parse(product.images); } catch(e) { return []; } })()
        : (product.image ? [product.image] : (typeof product.images === 'string' && product.images.trim() ? [product.images.trim()] : [])));

  const mainImage = imagesList[0] || BRAND_ASSETS.FALLBACK_PRODUCT;
  const secondaryImage = imagesList[1] || mainImage;
  const priceDisplay = formatReferencePrice(product);
  const statusCTA = getReferenceStatusCTA(product);
  const referenceIdStr = `REF ID: ${product.id || product.slug}`;

  return (
    <div className="group relative bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between h-full transition-all duration-300 hover:border-neutral-900">
      <div>
        {/* Dynamic Active Fest Badge or Status CTA */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {isFestiveProduct && (
            <span className="bg-neutral-900 text-lime-400 border border-lime-400/40 text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 uppercase flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
              <span>{festName}</span>
            </span>
          )}
          {!statusCTA.isRequestable && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 uppercase">
              {statusCTA.text}
            </span>
          )}
        </div>

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
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{product.category}</span>
              {product.gender && product.gender !== 'UNCLASSIFIED' && (
                <span className="text-[9px] px-1 bg-neutral-100 text-neutral-800 font-bold border border-neutral-200">
                  {product.gender === 'MEN' ? 'MEN' : product.gender === 'WOMEN' ? 'WOMEN' : 'UNISEX'}
                </span>
              )}
            </div>
          </div>

          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-sm font-bold tracking-wider text-neutral-900 group-hover:text-black transition-colors uppercase line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center justify-between pt-1 font-mono text-xs">
            <span className="text-neutral-900 font-bold tracking-wider">{priceDisplay}</span>
            <span className="text-[9px] text-neutral-500 font-semibold">{referenceIdStr}</span>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-neutral-100 mt-auto">
        <Link
          to={`/product/${product.slug}`}
          className="text-xs font-semibold tracking-widest text-neutral-900 group-hover:text-black flex items-center gap-1 transition-colors uppercase"
        >
          <span>VIEW REFERENCE</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        {onQuickInquire && statusCTA.isRequestable && (
          <button
            onClick={() => onQuickInquire(product)}
            className="text-[10px] tracking-wider font-mono font-bold px-2.5 py-1 bg-neutral-900 hover:bg-lime-400 hover:text-neutral-900 text-white transition-colors uppercase"
          >
            REQUEST LOOK
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
