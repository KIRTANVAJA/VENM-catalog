import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetCollectionBySlug, apiGetProducts, apiGetSettings } from '../services/api';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { useAuth } from '../context/AuthContext';
import { normalizeImagePath } from '../utils/imageUtils';
import { BRAND_ASSETS } from '../config/assets';
import { ChevronRight, Filter, Sparkles, Image as ImageIcon } from 'lucide-react';

const CollectionDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated, openLoginModal } = useAuth();

  const isFestiveSlug = slug === 'active-fest';

  const [collection, setCollection] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadCollectionDetail() {
      try {
        if (isFestiveSlug) {
          // ACTIVE FESTIVAL CAMPAIGN VIEW
          const settings = await apiGetSettings().catch(() => null);
          const af = settings?.active_fest;

          const festColData = {
            id: 'active-fest',
            name: af?.name || 'ACTIVE FESTIVAL EDIT',
            slug: 'active-fest',
            coverImage: af?.coverImage || '/assets/campaign/HOMEPAGE_2.webp',
            tagline: af?.announcement || 'CURRENT ACTIVE FESTIVAL CAPSULE',
            description: af?.description || 'Exclusive festival reference collection and bespoke silhouettes.',
            season: af?.season || 'FESTIVE 2026',
            status: 'ACTIVE'
          };

          if (isMounted) {
            setCollection(festColData);
          }

          const assignedIds = Array.isArray(af?.assignedProductIds) ? af.assignedProductIds : [];
          const allP = await apiGetProducts().catch(() => []);

          let liveProds = [];
          if (Array.isArray(allP)) {
            if (assignedIds.length > 0) {
              liveProds = allP.filter((p) => assignedIds.includes(p.id) || assignedIds.includes(p.slug));
            } else {
              liveProds = allP.filter((p) => p.isNavratriEdit === true || p.collectionSlug === 'active-fest');
            }
          }

          if (isMounted) {
            setAllProducts(liveProds);
          }
        } else {
          // STANDARD PERMANENT DATABASE COLLECTION (Diwali, Indo-Western, Accessories, etc.)
          const liveCol = await apiGetCollectionBySlug(slug).catch(() => null);

          if (isMounted) {
            if (liveCol) {
              setCollection(liveCol);
              if (Array.isArray(liveCol.products)) {
                setAllProducts(liveCol.products);
              } else {
                const prods = await apiGetProducts({ collection: slug }).catch(() => []);
                if (isMounted) setAllProducts(Array.isArray(prods) ? prods : []);
              }
            } else {
              setCollection(null);
              setAllProducts([]);
            }
          }
        }
      } catch (err) {
        console.warn(`[COLLECTION DETAIL] API fetch failed for slug ${slug}:`, err.message);
        if (isMounted) {
          setCollection(null);
          setAllProducts([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCollectionDetail();
    return () => { isMounted = false; };
  }, [slug, isFestiveSlug]);

  if (!collection) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-widest text-neutral-900 uppercase">COLLECTION NOT FOUND</h1>
          <p className="text-xs text-neutral-500 font-mono">The requested collection does not exist in our archive.</p>
          <Link to="/collections" className="inline-block btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest">
            RETURN TO COLLECTIONS
          </Link>
        </div>
      </div>
    );
  }

  const categories = ['All', ...new Set(allProducts.map((p) => p.category).filter(Boolean))];

  const filteredProducts = allProducts.filter(
    (p) => activeCategory === 'All' || p.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 space-y-10 pb-24 font-sans">
      {/* Hero Header with Collection Cover Visual */}
      <section className="relative py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className={`${collection.coverImage ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              <Link to="/" className="hover:text-black transition-colors">HOME</Link>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <Link to="/collections" className="hover:text-black transition-colors">COLLECTIONS</Link>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <span className="text-black font-bold">{collection.name}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-neutral-900 text-white font-bold text-[10px] tracking-widest uppercase">
                {collection.season || 'CURRENT EDIT'}
              </span>
              <span className="px-2.5 py-1 bg-lime-400 text-neutral-900 font-mono font-bold text-[9px] tracking-widest uppercase">
                ACTIVE ARCHIVE
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">
                {collection.tagline || 'SEASONAL BESPOKE EDIT'}
              </p>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-wider text-neutral-900 uppercase">
                {collection.name}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-3xl leading-relaxed">
              {collection.description || 'Exclusive curated silhouettes and reference craftsmanship.'}
            </p>

            <div className="pt-2 text-xs font-mono text-neutral-500 flex items-center gap-4">
              <span>TOTAL PRODUCTS: <strong className="text-neutral-900">{filteredProducts.length}</strong></span>
            </div>
          </div>

          {collection.coverImage && (
            <div className="lg:col-span-5 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] overflow-hidden border border-neutral-200 bg-neutral-100 shadow-sm group">
              <img
                src={normalizeImagePath(collection.coverImage)}
                alt={`${collection.name} Cover Visual`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  if (e.currentTarget.src !== BRAND_ASSETS.FALLBACK_CAMPAIGN) {
                    e.currentTarget.src = BRAND_ASSETS.FALLBACK_CAMPAIGN;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 font-bold">
                {collection.name}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Category Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <Filter className="w-4 h-4 text-neutral-800" />
            <span>FILTER CATEGORY:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all ${
                  activeCategory === cat
                    ? 'bg-neutral-900 text-white font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickInquire={(p) => {
                  setActiveInquiryProduct(p);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-neutral-50 border border-neutral-200">
            <p className="text-sm font-mono text-neutral-500">NO LOOKS MATCH THE SELECTED CATEGORY FILTER.</p>
            <button
              onClick={() => setActiveCategory('All')}
              className="btn-venm-secondary px-4 py-2 text-xs font-mono"
            >
              RESET FILTER
            </button>
          </div>
        )}
      </section>

      {/* Inquiry Modal */}
      <InquiryModal
        product={activeInquiryProduct}
        isOpen={!!activeInquiryProduct}
        onClose={() => setActiveInquiryProduct(null)}
      />
    </div>
  );
};

export default CollectionDetail;
