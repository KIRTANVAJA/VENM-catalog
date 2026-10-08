import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollectionBySlug, getProductsByCollection } from '../data/catalog';
import { apiGetCollectionBySlug, apiGetProducts, apiGetSettings } from '../services/api';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Filter, Sparkles, Image as ImageIcon } from 'lucide-react';

const CollectionDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated, openLoginModal } = useAuth();
  const isFestiveSlug = slug === 'active-fest' || slug === 'navratri';

  const [collection, setCollection] = useState(() => getCollectionBySlug(slug) || getCollectionBySlug('navratri') || {
    id: 'active-fest',
    name: 'ACTIVE FEST',
    slug: 'active-fest',
    coverImage: '/assets/campaign/HOMEPAGE_2.webp',
    tagline: 'FESTIVAL ARCHIVE & CUSTOM SILHOUETTES',
    description: 'Bespoke festival streetwear reference collection.'
  });
  const [allProducts, setAllProducts] = useState(() => getProductsByCollection(slug || 'navratri'));
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCollectionDetail() {
      try {
        let activeFestConfig = null;
        // Sync active fest settings from database if on active festival page
        if (isFestiveSlug) {
          try {
            const settings = await apiGetSettings();
            if (settings?.active_fest && isMounted) {
              const af = settings.active_fest;
              activeFestConfig = af;
              setCollection((prev) => ({
                ...prev,
                name: af.name || prev?.name || 'ACTIVE FEST',
                coverImage: af.coverImage || prev?.coverImage,
                tagline: af.tagline || prev?.tagline,
                description: af.description || prev?.description,
                season: af.season || prev?.season
              }));
              if (Array.isArray(af.galleryImages) && af.galleryImages.length > 0) {
                setGalleryPhotos(af.galleryImages);
              }
            }
          } catch (e) {}
        }

        const targetSlug = isFestiveSlug ? 'active-fest' : slug;
        let liveCol = await apiGetCollectionBySlug(targetSlug).catch(() => null);
        if (!liveCol && isFestiveSlug) {
          liveCol = await apiGetCollectionBySlug('navratri').catch(() => null);
        }

        if (isMounted && liveCol) {
          setCollection((prev) => ({
            ...prev,
            ...liveCol,
            name: (isFestiveSlug && prev?.name) ? prev.name : liveCol.name,
            coverImage: (isFestiveSlug && prev?.coverImage) ? prev.coverImage : liveCol.coverImage
          }));
          if (Array.isArray(liveCol.products) && liveCol.products.length > 0) {
            setAllProducts(liveCol.products);
          }
        }

        let liveProds = [];
        if (isFestiveSlug) {
          const allP = await apiGetProducts().catch(() => []);
          const assignedIds = Array.isArray(activeFestConfig?.assignedProductIds)
            ? activeFestConfig.assignedProductIds
            : [];

          if (Array.isArray(allP) && allP.length > 0) {
            liveProds = allP.filter(
              (p) =>
                assignedIds.includes(p.id) ||
                assignedIds.includes(p.slug) ||
                p.collectionSlug === 'active-fest' ||
                p.collectionSlug === 'navratri' ||
                p.isNavratriEdit === true
            );
          }
          if (liveProds.length === 0) {
            liveProds = await apiGetProducts({ collection: 'navratri' }).catch(() => []);
          }
        } else {
          liveProds = await apiGetProducts({ collection: slug }).catch(() => []);
        }

        if (isMounted && Array.isArray(liveProds) && liveProds.length > 0) {
          setAllProducts(liveProds);
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
    <div className="min-h-screen bg-white text-neutral-900 space-y-12 pb-24 font-sans">
      {/* Hero Collection Header with Spotlight Cover Photo */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
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

              <div className="space-y-1.5">
                <p className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">
                  {collection.tagline || 'SEASONAL BESPOKE EDIT'}
                </p>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-wider text-neutral-900 uppercase">
                  {collection.name}
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-2xl leading-relaxed">
                {collection.description || 'Exclusive curated silhouettes and reference craftsmanship.'}
              </p>

              <div className="pt-2 text-xs font-mono text-neutral-500 flex items-center gap-4">
                <span>TOTAL LOOKS: <strong className="text-neutral-900">{allProducts.length}</strong></span>
                {galleryPhotos.length > 0 && (
                  <span>LOOKBOOK PHOTOS: <strong className="text-neutral-900">{galleryPhotos.length}</strong></span>
                )}
              </div>
            </div>

            {/* Cover Photo Preview Card */}
            <div className="lg:col-span-5 relative aspect-[4/3] rounded-sm overflow-hidden border border-neutral-200 bg-neutral-900 shadow-md group">
              <img
                src={collection.coverImage || '/assets/campaign/HOMEPAGE_2.webp'}
                alt={collection.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = '/assets/campaign/HOMEPAGE_2.webp'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-4">
                <div className="text-white">
                  <span className="text-[9px] font-mono tracking-widest bg-lime-400 text-neutral-900 font-bold px-2 py-0.5 inline-block uppercase">
                    FEATURED EDIT
                  </span>
                  <p className="text-sm font-extrabold tracking-wider uppercase mt-1">
                    {collection.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Festival Lookbook / Photos Gallery (Rendered when photos are added) */}
      {galleryPhotos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-neutral-900" />
              <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                FESTIVAL LOOKBOOK & EDITORIAL PHOTOS ({galleryPhotos.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              CURATED VISUAL ASSETS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {galleryPhotos.map((photoUrl, pIdx) => (
              <div
                key={pIdx}
                className="group relative aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden shadow-xs hover:border-neutral-900 transition-all"
              >
                <img
                  src={photoUrl}
                  alt={`${collection.name} Look ${pIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = '/assets/campaign/HOMEPAGE_2.webp'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                    {collection.name} #{pIdx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
