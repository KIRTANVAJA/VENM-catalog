import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, getProductsByCollection } from '../data/catalog';
import { apiGetProductBySlug, apiGetProducts } from '../services/api';
import { formatWhatsAppUrl } from '../data/settings';
import { BRAND_ASSETS } from '../config/assets';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { ChevronRight, MessageCircle, Tag, Info, Check } from 'lucide-react';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(() => getProductBySlug(slug) || getProductBySlug('garba-cyber-vest-jac1'));
  const [relatedProducts, setRelatedProducts] = useState(() => {
    const initProd = getProductBySlug(slug) || getProductBySlug('garba-cyber-vest-jac1');
    return getProductsByCollection(initProd?.collectionSlug)
      .filter((p) => p.id !== initProd?.id)
      .slice(0, 3);
  });

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [quickInquireProduct, setQuickInquireProduct] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImageIndex(0);

    let isMounted = true;
    async function loadProductData() {
      try {
        const liveProduct = await apiGetProductBySlug(slug);
        if (isMounted && liveProduct) {
          setProduct(liveProduct);
          if (liveProduct.sizes?.length) {
            setSelectedSize(liveProduct.sizes[0]);
          }

          // Fetch related products
          const rels = await apiGetProducts({ collection: liveProduct.collectionSlug });
          if (isMounted && rels && rels.length > 0) {
            setRelatedProducts(rels.filter((p) => p.id !== liveProduct.id).slice(0, 3));
          }
        }
      } catch (err) {
        console.warn(`[PRODUCT DETAIL] API fetch failed for slug ${slug}:`, err.message);
      }
    }

    loadProductData();

    return () => { isMounted = false; };
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 text-center space-y-4 font-sans">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-widest text-neutral-900 uppercase">PIECE NOT FOUND</h1>
          <p className="text-xs text-neutral-500 font-mono">The requested piece is unavailable in our catalog.</p>
          <Link to="/collections" className="inline-block btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest">
            RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [BRAND_ASSETS.FALLBACK_PRODUCT];

  return (
    <div className="min-h-screen bg-white text-neutral-900 space-y-16 pb-24 font-sans">
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex flex-wrap items-center gap-2 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
          <Link to="/" className="hover:text-black transition-colors">HOME</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <Link to="/collections" className="hover:text-black transition-colors">COLLECTIONS</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <Link to={`/collection/${product.collectionSlug}`} className="hover:text-black transition-colors">
            {product.collectionName}
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-black font-bold">{product.name}</span>
        </nav>
      </div>

      {/* Main Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[3/4] bg-neutral-100 border border-neutral-200 overflow-hidden group">
              <img
                src={images[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {product.isNavratriEdit && (
                  <span className="bg-black text-white text-[10px] font-mono tracking-widest px-3 py-1 uppercase">
                    NAVRATRI EDIT
                  </span>
                )}
                <span className="bg-white/90 text-neutral-800 border border-neutral-300 text-[10px] font-mono tracking-widest px-3 py-1 uppercase">
                  {product.availability}
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-24 flex-shrink-0 bg-neutral-100 border transition-all overflow-hidden ${
                      activeImageIndex === idx
                        ? 'border-black opacity-100'
                        : 'border-neutral-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Meta & Inquiry */}
          <div className="lg:col-span-5 space-y-8 bg-neutral-50 p-8 border border-neutral-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500 tracking-widest uppercase">
                <span>{product.collectionName}</span>
                <span>• {product.category}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-neutral-600 tracking-widest uppercase">
                  STATUS: <strong className="text-black">{product.availability}</strong>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 border-t border-neutral-200 pt-6">
              <h4 className="text-xs font-mono text-neutral-500 tracking-widest uppercase">DESIGN OVERVIEW</h4>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans font-light">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            {product.details?.length > 0 && (
              <div className="space-y-3 border-t border-neutral-200 pt-6">
                <h4 className="text-xs font-mono text-neutral-500 tracking-widest uppercase">
                  SPECIFICATIONS & CRAFTSMANSHIP
                </h4>
                <ul className="space-y-2">
                  {product.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700 font-sans">
                      <Check className="w-3.5 h-3.5 text-black flex-shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes?.length > 0 && (
              <div className="space-y-3 border-t border-neutral-200 pt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-700 tracking-widest uppercase">
                    SELECT SIZE
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">BESPOKE SIZING AVAILABLE</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[48px] py-2 px-3 text-xs font-mono tracking-wider transition-all border ${
                        selectedSize === sz
                          ? 'bg-black text-white border-black font-bold'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action */}
            <div className="space-y-3 border-t border-neutral-200 pt-6">
              <a
                href={formatWhatsAppUrl(product, selectedSize)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-venm-primary py-4 px-6 text-xs sm:text-sm font-bold tracking-[0.18em] flex items-center justify-center gap-3 uppercase group"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>ENQUIRE ON WHATSAPP</span>
              </a>

              <button
                onClick={() => setIsInquiryModalOpen(true)}
                className="w-full btn-venm-secondary py-3 px-6 text-xs font-semibold tracking-widest flex items-center justify-center gap-2 uppercase"
              >
                <span>MORE INQUIRY OPTIONS</span>
              </button>

              <p className="text-[10px] font-mono text-center text-neutral-500 tracking-wider">
                INQUIRY-BASED CATALOG // BESPOKE FITTING & DELIVERY TIMELINES PROVIDED UPON REQUEST
              </p>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                {product.tags.map((tg) => (
                  <span
                    key={tg}
                    className="text-[10px] font-mono text-neutral-600 bg-white border border-neutral-200 px-2 py-0.5"
                  >
                    #{tg}
                  </span>
                ))}
              </div>
            )}

            {/* Care Note */}
            {product.garmentCare && (
              <div className="p-3 bg-white border border-neutral-200 text-[10px] font-mono text-neutral-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5" />
                <span>CARE: {product.garmentCare}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200 pt-16 space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
              RECOMMENDED IN THIS EDIT
            </span>
            <h3 className="text-2xl font-extrabold tracking-wider text-neutral-900 uppercase">
              MORE FROM {product.collectionName}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onQuickInquire={(p) => setQuickInquireProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Modal */}
      <InquiryModal
        product={product}
        selectedSize={selectedSize}
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />

      {/* Quick Modal */}
      <InquiryModal
        product={quickInquireProduct}
        isOpen={!!quickInquireProduct}
        onClose={() => setQuickInquireProduct(null)}
      />
    </div>
  );
};

export default ProductDetail;
