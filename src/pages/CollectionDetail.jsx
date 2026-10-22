import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollectionBySlug, getProductsByCollection } from '../data/catalog';
import { apiGetCollectionBySlug, apiGetProducts, apiGetSettings } from '../services/api';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Filter, Sparkles, Image as ImageIcon } from 'lucide-react';

function loadStoredCollection(slug) {
  if (typeof window === 'undefined') return getCollectionBySlug(slug) || getCollectionBySlug('navratri');
  try {
    const raw = localStorage.getItem('venm_cached_collection_' + slug);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return getCollectionBySlug(slug) || getCollectionBySlug('navratri');
}

const CollectionDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated, openLoginModal } = useAuth();
  let cachedFestSlug = 'active-fest';
  try {
    const raw = localStorage.getItem('venm_active_fest');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.slug) cachedFestSlug = parsed.slug;
    }
  } catch (e) {}

  const isFestiveSlug = slug === 'active-fest' || slug === 'navratri' || slug === 'diwali' || slug === cachedFestSlug;

  const [collection, setCollection] = useState(() => loadStoredCollection(slug) || {
    id: 'active-fest',
    name: 'ACTIVE FEST',
    slug: 'active-fest',
    coverImage: '/assets/campaign/HOMEPAGE_2.webp',
    tagline: 'FESTIVAL ARCHIVE & CUSTOM SILHOUETTES',
    description: 'Bespoke festival streetwear reference collection.'
  });
  const [allProducts, setAllProducts] = useState(() => {
    if (isFestiveSlug) return [];
    return getProductsByCollection(slug);
  });
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCollectionDetail() {
      try {
        let activeFestConfig = null;
        try {
          const cachedFest = localStorage.getItem('venm_active_fest');
          if (cachedFest) {
            activeFestConfig = JSON.parse(cachedFest);
          }
        } catch (e) {}

        try {
          const settings = await apiGetSettings();
          if (settings?.active_fest) {
            activeFestConfig = settings.active_fest;
            try {
              localStorage.setItem('venm_active_fest', JSON.stringify(settings.active_fest));
            } catch (e) {}
          }
        } catch (e) {}

        const isFestive = isFestiveSlug || slug === activeFestConfig?.slug || slug === 'active-fest' || slug === 'navratri' || slug === 'diwali';

        if (isFestive && activeFestConfig && isMounted) {
          const af = activeFestConfig;
          setCollection((prev) => ({
            ...prev,
            name: af.name || prev?.name || 'ACTIVE FEST',
            coverImage: af.coverImage || prev?.coverImage,
            tagline: af.tagline || prev?.tagline,
            description: af.description || prev?.description,
            season: af.season || prev?.season
          }));
        }

        const targetSlug = isFestive ? (activeFestConfig?.slug || 'active-fest') : slug;
        let liveCol = await apiGetCollectionBySlug(targetSlug).catch(() => null);
        if (!liveCol && isFestive) {
          liveCol = await apiGetCollectionBySlug('navratri').catch(() => null);
        }

        if (isMounted && liveCol) {
          setCollection((prev) => ({
            ...prev,
            ...liveCol,
            name: (isFestive && activeFestConfig?.name) ? activeFestConfig.name : (prev?.name || liveCol.name),
            coverImage: (isFestive && activeFestConfig?.coverImage) ? activeFestConfig.coverImage : (prev?.coverImage || liveCol.coverImage)
          }));
          if (!isFestive && Array.isArray(liveCol.products) && liveCol.products.length > 0) {
            setAllProducts(liveCol.products);
          }
        }

        let liveProds = [];
        if (isFestive) {
          const allP = await apiGetProducts({ status: 'ALL' }).catch(() => []);
          const assignedIds = Array.isArray(activeFestConfig?.assignedProductIds)
            ? activeFestConfig.assignedProductIds
            : [];

          if (Array.isArray(allP) && allP.length > 0) {
            if (assignedIds.length > 0) {
              // STRICT SYNC: Only show products that are assigned in admin panel!
              liveProds = allP.filter(
                (p) => assignedIds.includes(p.id) || assignedIds.includes(p.slug)
              );
            } else {
              // Only products explicitly marked festive in DB
              liveProds = allP.filter((p) => p.isNavratriEdit === true);
            }
          }
        } else {
          liveProds = await apiGetProducts({ collection: slug }).catch(() => []);
          if ((!liveProds || liveProds.length === 0) && slug) {
            liveProds = getProductsByCollection(slug);
          }
        }

        if (isMounted) {
          setAllProducts(liveProds || []);
        }
      } catch (err) {
        console.warn(`[COLLECTION DETAIL] API fetch failed for slug ${slug}:`, err.message);
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
      {/* Clean Hero Header without Banner Image */}
      <section className="relative py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto space-y-4">
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
                  if (!isAuthenticated) {
                    openLoginModal('login', 'inquiry_required');
                    return;
                  }
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
