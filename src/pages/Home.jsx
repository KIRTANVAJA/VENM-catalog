import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedProducts, getAllCollections, getCollectionBySlug } from '../data/catalog';
import { apiGetProducts, apiGetCollections, apiGetCollectionBySlug, apiGetHomepageSections, apiGetSettings } from '../services/api';
import { fetchLiveSettings } from '../data/settings';
import ProductCard from '../components/ProductCard';
import CollectionCard from '../components/CollectionCard';
import EditorialGrid from '../components/EditorialGrid';
import InquiryModal from '../components/InquiryModal';
import { CoverflowCarousel } from '@/components/ui/coverflow-carousel';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ChevronRight, Flame, Layers, LayoutGrid } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState(() => getFeaturedProducts().slice(0, 6));
  const [collections, setCollections] = useState(() => getAllCollections());
  const [navratriEdit, setNavratriEdit] = useState(() => getCollectionBySlug('navratri'));
  const [activeFest, setActiveFest] = useState(null);
  const [cmsSections, setCmsSections] = useState({});
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);
  const [referenceViewMode, setReferenceViewMode] = useState('coverflow');

  const handleInquire = (product) => {
    if (!isAuthenticated) {
      openLoginModal('login', 'inquiry_required');
      return;
    }
    setActiveInquiryProduct(product);
  };

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
              const key = sec.sectionKey || sec.id;
              if (key) map[key] = sec;
            });
            setCmsSections(map);
          }
        } catch (e) {}

        // 2. Fetch products for homepage showcase
        const [liveFeatured, allLive] = await Promise.all([
          apiGetProducts({ featured: true }).catch(() => []),
          apiGetProducts().catch(() => [])
        ]);

        if (isMounted) {
          const combined = Array.isArray(liveFeatured) ? [...liveFeatured] : [];
          if (Array.isArray(allLive)) {
            allLive.forEach((p) => {
              if (!combined.some((item) => item.id === p.id || item.slug === p.slug)) {
                combined.push(p);
              }
            });
          }
          if (combined.length > 0) {
            setFeaturedProducts(combined.slice(0, 12));
          }
        }

        // 3. Fetch collections
        const liveCols = await apiGetCollections();
        if (isMounted && liveCols && liveCols.length > 0) {
          setCollections(liveCols);
        }

        // 4. Fetch navratri / active campaign collection
        try {
          const [liveNavratri, liveSettings] = await Promise.all([
            apiGetCollectionBySlug('navratri').catch(() => null),
            apiGetSettings().catch(() => ({}))
          ]);
          if (isMounted && liveNavratri) {
            setNavratriEdit(liveNavratri);
          }
          if (isMounted && liveSettings?.active_fest) {
            setActiveFest(liveSettings.active_fest);
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
            <div className="inline-block px-3.5 py-1.5 bg-white border border-neutral-300 text-neutral-800 text-xs font-mono tracking-widest uppercase font-bold">
              {heroSec?.content?.campaignBadge || "VENM REFERENCE CATALOG // FASHION & CUSTOM REQUESTS"}
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-[0.12em] text-neutral-900 uppercase leading-none">
                {heroSec?.content?.title || "VENM REFERENCE CATALOG"}
              </h1>
              <p className="text-base sm:text-xl text-neutral-800 tracking-[0.18em] font-bold max-w-3xl mx-auto uppercase font-mono">
                {heroSec?.content?.subtitle || "FIND A LOOK. TELL US WHAT YOU NEED. WE'LL WORK FROM THERE."}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-2xl mx-auto leading-relaxed uppercase">
              {heroSec?.content?.description || "A FASHION REFERENCE CATALOG & BESPOKE CUSTOM REQUEST PLATFORM SHOWCASING WHAT VENM CAN CREATE, CUSTOMIZE, STYLE, SOURCE AND WORK ON."}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to={heroSec?.content?.primaryCtaLink || "/collections"}
                className="w-full sm:w-auto btn-venm-primary px-8 py-4 text-xs font-bold tracking-[0.18em] flex items-center justify-center gap-2.5 uppercase group"
              >
                <span>{heroSec?.content?.primaryCtaText || "BROWSE REFERENCES"}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                to={heroSec?.content?.secondaryCtaLink || "/collection/navratri"}
                className="w-full sm:w-auto btn-venm-secondary px-8 py-4 text-xs font-semibold tracking-[0.18em] flex items-center justify-center gap-2 uppercase"
              >
                <span>{heroSec?.content?.secondaryCtaText || "NAVRATRI EDIT"}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. YOU BRING THE IDEA // MADE AROUND YOUR NEED */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-900 text-white p-8 sm:p-12 border border-neutral-800 space-y-8">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.3em] text-lime-400 uppercase font-bold">
              THE VENM CUSTOM MODEL
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-wider uppercase">
              YOU BRING THE IDEA. WE BUILD THE LOOK.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
              Whether you already have a piece or need us to source one, VENM works around your requirements.
              Bring us a style reference, a Pinterest board, a garment you already own, or a rough concept.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Option 1 */}
            <div className="bg-neutral-800/80 p-6 sm:p-8 border border-neutral-700 space-y-4">
              <div className="inline-block px-3 py-1 bg-lime-400 text-neutral-900 font-mono text-[10px] font-bold uppercase tracking-widest">
                OPTION 01 — YOU PROVIDE THE GARMENT
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider">ALREADY HAVE THE PIECE?</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                Send your existing denim jacket, kurta, shirt, pants, saree, or traditional garment to VENM.
                We customize, distress, embroider, and tailor it according to your requested reference.
              </p>
              <div className="text-[11px] font-mono text-lime-400 font-semibold">
                ✓ Send piece → Discuss design → Custom execution
              </div>
            </div>

            {/* Option 2 */}
            <div className="bg-neutral-800/80 p-6 sm:p-8 border border-neutral-700 space-y-4">
              <div className="inline-block px-3 py-1 bg-white text-neutral-900 font-mono text-[10px] font-bold uppercase tracking-widest">
                OPTION 02 — VENM SOURCES THE GARMENT
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider">NEED US TO SOURCE IT?</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                Don't have the piece? Share the look you want, and VENM will discuss sourcing the right base garment, fabric, or silhouette for your custom piece.
              </p>
              <div className="text-[11px] font-mono text-white font-semibold">
                ✓ Pick reference → We source base → Craft custom look
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. FEATURED REFERENCES SECTION (3D COVERFLOW & CATALOG) */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              CATALOG SELECTION // STYLE REFERENCES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
              HIGHLIGHTED STYLE REFERENCES
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex items-center rounded-none border border-neutral-300 bg-neutral-100 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setReferenceViewMode('coverflow')}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase transition-colors ${
                  referenceViewMode === 'coverflow'
                    ? 'bg-neutral-900 text-white font-bold shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Carousel</span>
              </button>
              <button
                type="button"
                onClick={() => setReferenceViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase transition-colors ${
                  referenceViewMode === 'grid'
                    ? 'bg-neutral-900 text-white font-bold shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
            </div>

            <Link
              to="/collections"
              className="text-xs font-semibold tracking-widest text-neutral-900 hover:text-black flex items-center gap-1 transition-colors uppercase ml-1"
            >
              <span>VIEW ALL</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3D Coverflow or Grid display */}
        {referenceViewMode === 'coverflow' ? (
          <div className="w-full bg-neutral-50/80 border border-neutral-200 py-8 px-2 sm:px-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between max-w-xl mx-auto px-4 mb-2 text-center">
              <p className="w-full text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
                ✦ DRAG HORIZONTALLY OR USE ARROW KEYS TO BROWSE SILHOUETTES ✦
              </p>
            </div>
            <CoverflowCarousel
              slides={
                featuredProducts && featuredProducts.length > 0
                  ? featuredProducts.map((product) => ({
                      src: product.images?.[0] || product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=640&h=640&fit=crop&q=80",
                      alt: product.name || "Style Reference",
                      title: product.name,
                      subtitle: product.collectionName || product.category || "VENM REFERENCE",
                      meta: [
                        { label: "Category", value: product.category || "Outerwear" },
                        { label: "Pricing", value: product.estimatedPrice || (product.minPrice ? `From ₹${product.minPrice}` : "On Request") },
                        { label: "Availability", value: product.availability || "Requestable" },
                      ],
                      product,
                      slug: product.slug || product.id,
                      onViewDetails: () => navigate(`/product/${product.slug || product.id}`),
                      onInquire: () => handleInquire(product),
                    }))
                  : [
                      {
                        src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=640&h=640&fit=crop&q=80",
                        alt: "Avant-garde streetwear silhouette",
                        title: "GARBA CYBER VEST",
                        subtitle: "NAVRATRI EDIT",
                        meta: [
                          { label: "Category", value: "Outerwear" },
                          { label: "Pricing", value: "From ₹2,200" },
                          { label: "Availability", value: "Requestable" },
                        ],
                        slug: "garba-cyber-vest-jac1",
                        onViewDetails: () => navigate(`/collection/navratri`),
                        onInquire: () => handleInquire({ name: "GARBA CYBER VEST", collectionName: "NAVRATRI EDIT", estimatedPrice: "From ₹2,200" }),
                      },
                      {
                        src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=640&h=640&fit=crop&q=80",
                        alt: "Wide-leg raw distressed denim",
                        title: "DANDIYA WIDE-LEG RAW DENIM",
                        subtitle: "RAW DENIM",
                        meta: [
                          { label: "Category", value: "Denim" },
                          { label: "Pricing", value: "From ₹2,800" },
                          { label: "Availability", value: "Requestable" },
                        ],
                        slug: "dandiya-wide-leg-raw-denim",
                        onViewDetails: () => navigate(`/collections`),
                        onInquire: () => handleInquire({ name: "DANDIYA WIDE-LEG RAW DENIM", collectionName: "RAW DENIM", estimatedPrice: "From ₹2,800" }),
                      },
                      {
                        src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=640&h=640&fit=crop&q=80",
                        alt: "Editorial mirrorwork overdyed piece",
                        title: "MIRRORWORK OVERDYED KURTA",
                        subtitle: "CONTEMPORARY ETHNIC",
                        meta: [
                          { label: "Category", value: "Ethnic" },
                          { label: "Pricing", value: "From ₹3,100" },
                          { label: "Availability", value: "Requestable" },
                        ],
                        slug: "mirrorwork-overdyed-kurta",
                        onViewDetails: () => navigate(`/collections`),
                        onInquire: () => handleInquire({ name: "MIRRORWORK OVERDYED KURTA", collectionName: "CONTEMPORARY ETHNIC", estimatedPrice: "From ₹3,100" }),
                      },
                      {
                        src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=640&h=640&fit=crop&q=80",
                        alt: "Indo-Western bespoke tailoring",
                        title: "OBSIDIAN INDO-WESTERN BLAZER",
                        subtitle: "INDO-WESTERN",
                        meta: [
                          { label: "Category", value: "Tailoring" },
                          { label: "Pricing", value: "From ₹4,500" },
                          { label: "Availability", value: "Requestable" },
                        ],
                        slug: "obsidian-indo-western-blazer",
                        onViewDetails: () => navigate(`/collections`),
                        onInquire: () => handleInquire({ name: "OBSIDIAN INDO-WESTERN BLAZER", collectionName: "INDO-WESTERN", estimatedPrice: "From ₹4,500" }),
                      },
                      {
                        src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=640&h=640&fit=crop&q=80",
                        alt: "Modular handloom drape",
                        title: "HANDLOOM MODULAR KIMONO",
                        subtitle: "EXPERIMENTAL",
                        meta: [
                          { label: "Category", value: "Hybrid" },
                          { label: "Pricing", value: "From ₹3,600" },
                          { label: "Availability", value: "Requestable" },
                        ],
                        slug: "handloom-modular-kimono",
                        onViewDetails: () => navigate(`/collections`),
                        onInquire: () => handleInquire({ name: "HANDLOOM MODULAR KIMONO", collectionName: "EXPERIMENTAL", estimatedPrice: "From ₹3,600" }),
                      },
                    ]
              }
              cardWidth="clamp(200px, 26vw, 320px)"
              showCaption={true}
              showNavigation={true}
              showPagination={true}
            />
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickInquire={(p) => handleInquire(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. FEATURED COLLECTION SPOTLIGHT (CMS CONTROLLED) */}
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
                    {activeFest?.name || featuredColSec?.content?.title || navratriEdit.name}
                  </h2>
                  <p className="text-xs font-mono text-neutral-500 tracking-[0.18em] uppercase">
                    {activeFest?.tagline || featuredColSec?.content?.tagline || navratriEdit.tagline}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                  {activeFest?.description || featuredColSec?.content?.description || navratriEdit.description}
                </p>

                <div className="pt-2">
                  <Link
                    to={featuredColSec?.content?.ctaLink || "/collection/navratri"}
                    className="inline-flex btn-venm-primary px-6 py-3.5 text-xs font-bold tracking-widest items-center gap-2 uppercase"
                  >
                    <span>{featuredColSec?.content?.ctaText || `EXPLORE EDIT REFERENCES (${navratriEdit.productCount || 8} LOOKS)`}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden border border-neutral-200 bg-neutral-100 group shadow-sm">
                <img
                  src={activeFest?.coverImage || featuredColSec?.content?.coverImage || navratriEdit.coverImage}
                  alt="Featured Collection Cover"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = "/assets/campaign/HOMEPAGE_2.webp"; }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. BRAND STATEMENT (CMS CONTROLLED) */}
      {/* ---------------------------------------------------- */}
      {brandSec?.enabled !== false && (
        <section className="py-20 bg-neutral-50 border-y border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <span className="text-[10px] font-mono tracking-[0.3em] text-neutral-500 uppercase font-bold">
              {brandSec?.content?.badge || "VENM BRAND PHILOSOPHY"}
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-widest text-neutral-900 uppercase">
                {brandSec?.content?.line1 || "NOT TRADITIONAL STORE."}
              </h2>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-widest text-neutral-500 uppercase">
                {brandSec?.content?.line2 || "NOT FIXED INVENTORY."}
              </h2>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-widest text-neutral-900 uppercase">
                {brandSec?.content?.line3 || "YOUR IDEA, YOUR VENM."}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-xl mx-auto leading-relaxed">
              {brandSec?.content?.description || "VENM CATALOG IS A CURATED REFERENCE BOARD OF WHAT WE CAN CRAFT, CUSTOMIZE, AND SOURCE. WE WORK WITH YOUR GARMENTS OR SOURCE BASE PIECES TO BUILD YOUR UNIQUE STYLE."}
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
