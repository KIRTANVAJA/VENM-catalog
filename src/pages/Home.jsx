import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getAllCollections, getCollectionBySlug } from '../data/catalog';
import { apiGetProducts, apiGetCollections, apiGetCollectionBySlug, apiGetHomepageSections } from '../services/api';
import { fetchLiveSettings } from '../data/settings';
import ProductCard from '../components/ProductCard';
import CollectionCard from '../components/CollectionCard';
import EditorialGrid from '../components/EditorialGrid';
import InquiryModal from '../components/InquiryModal';
import { ArrowUpRight, ChevronRight, Flame } from 'lucide-react';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState(() => getFeaturedProducts().slice(0, 6));
  const [collections, setCollections] = useState(() => getAllCollections());
  const [navratriEdit, setNavratriEdit] = useState(() => getCollectionBySlug('navratri'));
  const [cmsSections, setCmsSections] = useState({});
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        await fetchLiveSettings();

        // 1. Fetch live CMS sections from database
        try {
          const liveCMS = await apiGetHomepageSections();
          if (isMounted && Array.isArray(liveCMS)) {
            const map = {};
            liveCMS.forEach((sec) => {
              map[sec.sectionKey] = sec;
            });
            setCmsSections(map);
          }
        } catch (e) {}

        // 2. Fetch featured products
        const liveProducts = await apiGetProducts({ featured: true });
        if (isMounted && liveProducts && liveProducts.length > 0) {
          setFeaturedProducts(liveProducts.slice(0, 6));
        }

        // 3. Fetch collections
        const liveCols = await apiGetCollections();
        if (isMounted && liveCols && liveCols.length > 0) {
          setCollections(liveCols);
        }

        // 4. Fetch navratri / active campaign collection
        try {
          const liveNavratri = await apiGetCollectionBySlug('navratri');
          if (isMounted && liveNavratri) {
            setNavratriEdit(liveNavratri);
          }
        } catch (e) {}
      } catch (err) {
        console.warn('[HOME] API sync failed:', err.message);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroSec = cmsSections['hero'];
  const featuredColSec = cmsSections['featured_collection'];
  const brandSec = cmsSections['brand_statement'];
  const lookbookSec = cmsSections['lookbook'];

  return (
    <div className="min-h-screen bg-white text-neutral-900 space-y-20 pb-20 font-sans">
      {/* ---------------------------------------------------- */}
      {/* 1. HERO SECTION (CMS CONTROLLED) */}
      {/* ---------------------------------------------------- */}
      {heroSec?.enabled !== false && (
        <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
          {/* Hero Background Image */}
          <div className="absolute inset-0 z-0 opacity-20">
            <img
              src={heroSec?.content?.heroImage || "/assets/campaign/HOMEPAGE_2.webp"}
              alt="VENM Hero Banner"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
            {/* Campaign Tag */}
            <div className="inline-block px-3.5 py-1.5 bg-white border border-neutral-300 text-neutral-800 text-xs font-mono tracking-widest uppercase">
              {heroSec?.content?.campaignBadge || "VENM × NAVRATRI // THE FESTIVE EDIT"}
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-[0.15em] text-neutral-900 uppercase leading-none">
                {heroSec?.content?.title || "VENM CATALOG"}
              </h1>
              <p className="text-base sm:text-xl text-neutral-700 tracking-[0.2em] font-medium max-w-2xl mx-auto uppercase">
                {heroSec?.content?.subtitle || "TRADITION, REINTERPRETED."}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-xl mx-auto leading-relaxed uppercase">
              {heroSec?.content?.description || "GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR & INDO-WESTERN EXPERIMENTATION."}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to={heroSec?.content?.primaryCtaLink || "/collection/navratri"}
                className="w-full sm:w-auto btn-venm-primary px-8 py-4 text-xs font-bold tracking-[0.18em] flex items-center justify-center gap-2.5 uppercase group"
              >
                <span>{heroSec?.content?.primaryCtaText || "EXPLORE THE EDIT"}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                to={heroSec?.content?.secondaryCtaLink || "/collections"}
                className="w-full sm:w-auto btn-venm-secondary px-8 py-4 text-xs font-semibold tracking-[0.18em] flex items-center justify-center gap-2 uppercase"
              >
                <span>{heroSec?.content?.secondaryCtaText || "ALL COLLECTIONS"}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. FEATURED COLLECTION SPOTLIGHT (CMS CONTROLLED) */}
      {/* ---------------------------------------------------- */}
      {featuredColSec?.enabled !== false && navratriEdit && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-50 p-8 sm:p-12 border border-neutral-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-600 uppercase">
                  <Flame className="w-4 h-4 text-neutral-800" />
                  <span>SEASONAL CAMPAIGN SPOTLIGHT</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-wider text-neutral-900 uppercase">
                    {featuredColSec?.content?.title || navratriEdit.name}
                  </h2>
                  <p className="text-xs font-mono text-neutral-500 tracking-[0.18em] uppercase">
                    {featuredColSec?.content?.tagline || navratriEdit.tagline}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                  {featuredColSec?.content?.description || navratriEdit.description}
                </p>

                <div className="pt-2">
                  <Link
                    to={featuredColSec?.content?.ctaLink || "/collection/navratri"}
                    className="inline-flex btn-venm-primary px-6 py-3.5 text-xs font-bold tracking-widest items-center gap-2 uppercase"
                  >
                    <span>{featuredColSec?.content?.ctaText || `VIEW COLLECTION (${navratriEdit.productCount || 8} PIECES)`}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden border border-neutral-200 bg-neutral-100 group">
                <img
                  src={featuredColSec?.content?.coverImage || navratriEdit.coverImage}
                  alt="Featured Collection Cover"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. FEATURED PRODUCTS SECTION */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
              SELECTION // FEATURED PIECES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
              HIGHLIGHTED CATALOG PIECES
            </h2>
          </div>
          <Link
            to="/collections"
            className="text-xs font-semibold tracking-widest text-neutral-900 hover:text-black flex items-center gap-1 transition-colors uppercase"
          >
            <span>VIEW ALL PIECES</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickInquire={(p) => setActiveInquiryProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. BRAND STATEMENT (CMS CONTROLLED) */}
      {/* ---------------------------------------------------- */}
      {brandSec?.enabled !== false && (
        <section className="py-20 bg-neutral-50 border-y border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <span className="text-[10px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
              {brandSec?.content?.badge || "VENM BRAND PHILOSOPHY"}
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-widest text-neutral-900 uppercase">
                {brandSec?.content?.line1 || "NOT TRADITIONAL."}
              </h2>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-widest text-neutral-500 uppercase">
                {brandSec?.content?.line2 || "NOT STREETWEAR."}
              </h2>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-widest text-neutral-900 uppercase">
                {brandSec?.content?.line3 || "SOMEWHERE IN BETWEEN."}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-xl mx-auto leading-relaxed">
              {brandSec?.content?.description || "VENM STANDS AT THE INTERSECTION OF GUJARATI HERITAGE CRAFTSMANSHIP AND Y2K KINETIC STREETWEAR. WE DESIGN SILHOUETTES THAT REBEL AGAINST ORDINARY UNIFORMS WHILE HONORING TRADITIONAL ETHOS."}
            </p>

            <div className="pt-2">
              <Link
                to={brandSec?.content?.ctaLink || "/about"}
                className="inline-flex btn-venm-secondary px-8 py-3.5 text-xs font-semibold tracking-widest uppercase"
              >
                {brandSec?.content?.ctaText || "READ OUR BRAND STORY"}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. EDITORIAL LOOKBOOK (CMS CONTROLLED) */}
      {/* ---------------------------------------------------- */}
      {lookbookSec?.enabled !== false && (
        <EditorialGrid
          title={lookbookSec?.content?.title}
          subtitle={lookbookSec?.content?.subtitle}
          description={lookbookSec?.content?.description}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. COLLECTIONS OVERVIEW GRID */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
              EXPLORE BY DIRECTION
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
              CURATED COLLECTIONS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </section>

      {/* Interactive Inquiry Modal */}
      <InquiryModal
        product={activeInquiryProduct}
        isOpen={!!activeInquiryProduct}
        onClose={() => setActiveInquiryProduct(null)}
      />
    </div>
  );
};

export default Home;
