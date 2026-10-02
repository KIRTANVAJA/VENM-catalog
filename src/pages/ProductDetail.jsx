import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, getProductsByCollection, formatReferencePrice, getReferenceStatusCTA } from '../data/catalog';
import { apiGetProductBySlug, apiGetProducts } from '../services/api';
import { formatWhatsAppUrl } from '../data/settings';
import { BRAND_ASSETS } from '../config/assets';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { ChevronRight, MessageCircle, Tag, Info, Check, Shirt, Sparkles, HelpCircle, Layers } from 'lucide-react';

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
  const [selectedSize, setSelectedSize] = useState('Custom');
  const [requestOption, setRequestOption] = useState('I already have the garment');
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
        console.warn(`[REFERENCE DETAIL] API fetch failed for slug ${slug}:`, err.message);
      }
    }

    loadProductData();

    return () => { isMounted = false; };
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 text-center space-y-4 font-sans">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-widest text-neutral-900 uppercase">REFERENCE NOT FOUND</h1>
          <p className="text-xs text-neutral-500 font-mono">The requested style reference is unavailable in our catalog.</p>
          <Link to="/collections" className="inline-block btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest uppercase">
            RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [BRAND_ASSETS.FALLBACK_PRODUCT];
  const priceFormatted = formatReferencePrice(product);
  const statusCTA = getReferenceStatusCTA(product);
  const referenceIdText = product.id ? `Reference ID: ${product.id}` : `Reference ID: ${product.slug}`;

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

      {/* Main Reference Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Reference Gallery */}
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
                <span className="bg-white/90 text-neutral-900 border border-neutral-300 text-[10px] font-mono tracking-widest px-3 py-1 uppercase font-bold">
                  STYLE REFERENCE
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

          {/* Right: Reference Details & Custom Request Panel */}
          <div className="lg:col-span-5 space-y-8 bg-neutral-50 p-8 border border-neutral-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500 tracking-widest uppercase">
                <span>{product.collectionName}</span>
                <span className="font-semibold">{product.category}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase leading-tight">
                {product.name}
              </h1>

              {/* Reference ID and Estimated Price */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-mono font-extrabold text-neutral-900 tracking-tight">
                    {priceFormatted}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 bg-white border border-neutral-300 px-2.5 py-1 font-bold">
                    {referenceIdText}
                  </span>
                </div>

                <p className="text-[11px] font-mono text-neutral-600 leading-normal flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <span>Estimated reference price. Final price depends on fabric, garment selection, embroidery, and custom requirements.</span>
                </p>
              </div>
            </div>

            {/* Design & Story Overview */}
            <div className="space-y-2 border-t border-neutral-200 pt-6">
              <h4 className="text-xs font-mono text-neutral-500 tracking-widest uppercase font-bold">DESIGN & LOOK OVERVIEW</h4>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans font-light">
                {product.description}
              </p>
            </div>

            {/* Specifications & Craftsmanship */}
            {product.details?.length > 0 && (
              <div className="space-y-3 border-t border-neutral-200 pt-6">
                <h4 className="text-xs font-mono text-neutral-500 tracking-widest uppercase font-bold">
                  REFERENCE SPECIFICATIONS
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

            {/* Sizing Approach Model */}
            <div className="space-y-3 border-t border-neutral-200 pt-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-neutral-800 tracking-widest uppercase font-bold">
                  SIZING APPROACH
                </label>
                <span className="text-[10px] font-mono text-lime-700 font-bold bg-lime-100 px-2 py-0.5">CUSTOM SIZING AVAILABLE</span>
              </div>
              <p className="text-xs text-neutral-600 font-sans">
                {product.sizingInfo || "Sizes are requirements for your piece, not fixed stock inventory. Final fitting will be discussed."}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(product.sizes?.length ? product.sizes : ['S', 'M', 'L', 'XL', 'Custom']).map((sz) => (
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

            {/* Customer Requirement Options: Option 1 vs Option 2 */}
            <div className="space-y-3 border-t border-neutral-200 pt-6">
              <h4 className="text-xs font-mono text-neutral-800 tracking-widest uppercase font-bold">
                HOW WOULD YOU LIKE TO WORK WITH US?
              </h4>
              <div className="space-y-2">
                <label
                  onClick={() => setRequestOption('I already have the garment')}
                  className={`p-3 border flex items-start gap-3 cursor-pointer transition-all ${
                    requestOption === 'I already have the garment'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <Shirt className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs font-sans">
                    <span className="font-bold block uppercase tracking-wider">OPTION 1 — YOU PROVIDE THE GARMENT</span>
                    <span className="text-[11px] opacity-80 block font-normal leading-relaxed">
                      Already have a jacket, kurta, shirt, or saree? Send it to VENM, and we will work on it according to your requested look.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setRequestOption('I need VENM to source the garment')}
                  className={`p-3 border flex items-start gap-3 cursor-pointer transition-all ${
                    requestOption === 'I need VENM to source the garment'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs font-sans">
                    <span className="font-bold block uppercase tracking-wider">OPTION 2 — VENM SOURCES THE GARMENT</span>
                    <span className="text-[11px] opacity-80 block font-normal leading-relaxed">
                      Don't have the piece? We'll discuss your requirements and source the right base garment or fabric for your look.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3 border-t border-neutral-200 pt-6">
              {statusCTA.isRequestable ? (
                <a
                  href={formatWhatsAppUrl(product, selectedSize, requestOption)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-venm-primary py-4 px-6 text-xs sm:text-sm font-bold tracking-[0.18em] flex items-center justify-center gap-3 uppercase group"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                  <span>REQUEST THIS LOOK</span>
                </a>
              ) : (
                <div className="w-full bg-neutral-200 text-neutral-700 py-4 px-6 text-xs font-mono font-bold tracking-widest text-center uppercase">
                  {statusCTA.text}
                </div>
              )}

              <button
                onClick={() => setIsInquiryModalOpen(true)}
                className="w-full btn-venm-secondary py-3 px-6 text-xs font-semibold tracking-widest flex items-center justify-center gap-2 uppercase"
              >
                <span>OPEN DETAILED REQUEST MODAL</span>
              </button>

              <p className="text-[10px] font-mono text-center text-neutral-500 tracking-wider uppercase">
                REFERENCE CATALOG // NO IMMEDIATE CHECKOUT // REQUIREMENTS & ESTIMATES CONFIRMED DIRECTLY
              </p>
            </div>

            {/* Tags & Source Attribution */}
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              {product.sourceAttribution && (
                <div className="text-[10px] font-mono text-neutral-500 uppercase">
                  SOURCE: <strong className="text-neutral-800">{product.sourceAttribution}</strong>
                </div>
              )}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
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
            </div>

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

      {/* "HOW IT WORKS" PROCESS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200 pt-16">
        <div className="bg-neutral-50 p-8 sm:p-12 border border-neutral-200 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              THE VENM CUSTOM PROCESS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
              HOW CUSTOM REQUESTS WORK
            </h2>
            <p className="text-xs text-neutral-600 font-sans">
              Your Garment or Ours. Your Idea, Your Requirements, Your VENM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-4">
            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-xs font-mono font-bold text-lime-600 uppercase block">01 — FIND REFERENCE</span>
              <h4 className="text-sm font-bold text-neutral-900 uppercase">BROWSE LOOKS</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Explore the catalog and find a style reference that speaks to you.
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-xs font-mono font-bold text-lime-600 uppercase block">02 — TELL US REQUIREMENTS</span>
              <h4 className="text-sm font-bold text-neutral-900 uppercase">REQUEST LOOK</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Click Request This Look to open WhatsApp and share your requirements.
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-xs font-mono font-bold text-lime-600 uppercase block">03 — GARMENT SOURCE</span>
              <h4 className="text-sm font-bold text-neutral-900 uppercase">YOUR PIECE OR OURS</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Send your own garment to us or let VENM source the right base.
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-xs font-mono font-bold text-lime-600 uppercase block">04 — CUSTOM WORK</span>
              <h4 className="text-sm font-bold text-neutral-900 uppercase">WE CRAFT IT</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                VENM works on the piece according to agreed design and embroidery.
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-xs font-mono font-bold text-lime-600 uppercase block">05 — FINAL DETAILS</span>
              <h4 className="text-sm font-bold text-neutral-900 uppercase">DELIVERY</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                We confirm final details, fitting, and delivery before proceeding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related References */}
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
