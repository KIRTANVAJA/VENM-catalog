import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { apiGetProducts, apiGetCategories, apiGetCollections } from '../services/api';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { useAuth } from '../context/AuthContext';
import { BRAND_ASSETS } from '../config/assets';
import {
  Filter,
  Search,
  ChevronRight,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowUpDown,
  Check
} from 'lucide-react';

const CATEGORY_MAP = {
  outerwear: 'Outerwear',
  tops: 'Tops',
  bottoms: 'Bottoms',
  ethnic: 'Ethnic',
  accessories: 'Accessories',
  jackets: 'Outerwear',
  shirts: 'Tops',
  pants: 'Bottoms',
  kurtas: 'Ethnic'
};

const GenderCatalog = ({ defaultGender = 'MEN' }) => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect current target gender from prop or path
  const isWomenRoute = location.pathname.startsWith('/women') || defaultGender === 'WOMEN';
  const baseGender = isWomenRoute ? 'WOMEN' : 'MEN';

  // Read URL query params
  const urlGender = searchParams.get('gender');
  const urlCategory = searchParams.get('category');
  const urlSearch = searchParams.get('q') || '';
  const urlSort = searchParams.get('sort') || 'featured';
  const urlCollection = searchParams.get('collection') || 'ALL';

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState(urlGender || baseGender);
  const [selectedCategory, setSelectedCategory] = useState(
    categorySlug ? (CATEGORY_MAP[categorySlug.toLowerCase()] || categorySlug) : (urlCategory || 'ALL')
  );
  const [selectedCollection, setSelectedCollection] = useState(urlCollection);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortOption, setSortOption] = useState(urlSort);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);

  // Synchronize when route changes (e.g. clicking Men vs Women in Navbar)
  useEffect(() => {
    const routeGender = location.pathname.startsWith('/women') ? 'WOMEN' : 'MEN';
    const initialCategory = categorySlug ? (CATEGORY_MAP[categorySlug.toLowerCase()] || categorySlug) : (urlCategory || 'ALL');
    setSelectedGender(urlGender || routeGender);
    setSelectedCategory(initialCategory);
  }, [location.pathname, categorySlug]);

  // Load products, categories, collections from live API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      apiGetProducts().catch(() => []),
      apiGetCategories().catch(() => []),
      apiGetCollections().catch(() => [])
    ])
      .then(([prodsData, catsData, colsData]) => {
        if (!isMounted) return;
        if (Array.isArray(prodsData)) setProducts(prodsData);
        if (Array.isArray(catsData)) setCategories(catsData);
        if (Array.isArray(colsData)) setCollections(colsData);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Update URL search parameters when filters change
  const updateQueryParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'ALL' || (key === 'gender' && val === baseGender)) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });
    setSearchParams(nextParams, { replace: true });
  };

  const handleGenderChange = (newGender) => {
    setSelectedGender(newGender);
    updateQueryParams({ gender: newGender });
  };

  const handleCategoryChange = (newCat) => {
    setSelectedCategory(newCat);
    updateQueryParams({ category: newCat });
  };

  const handleCollectionChange = (newCol) => {
    setSelectedCollection(newCol);
    updateQueryParams({ collection: newCol });
  };

  const handleResetFilters = () => {
    setSelectedGender(baseGender);
    setSelectedCategory('ALL');
    setSelectedCollection('ALL');
    setSearchQuery('');
    setSortOption('featured');
    setSearchParams({}, { replace: true });
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Target Audience / Gender Distribution
      // Rules:
      // - MEN: matches p.gender === 'MEN' || p.gender === 'UNISEX'
      // - WOMEN: matches p.gender === 'WOMEN' || p.gender === 'UNISEX'
      // - UNISEX: matches p.gender === 'UNISEX'
      // - ALL: all products including legacy
      // UNCLASSIFIED products never show in MEN or WOMEN
      if (selectedGender === 'MEN') {
        const matchesMen = p.gender === 'MEN' || p.gender === 'UNISEX';
        if (!matchesMen) return false;
      } else if (selectedGender === 'WOMEN') {
        const matchesWomen = p.gender === 'WOMEN' || p.gender === 'UNISEX';
        if (!matchesWomen) return false;
      } else if (selectedGender === 'UNISEX') {
        if (p.gender !== 'UNISEX') return false;
      }

      // 2. Category Filter
      if (selectedCategory && selectedCategory !== 'ALL') {
        const pCat = (p.category || '').toLowerCase();
        const targetCat = selectedCategory.toLowerCase();
        if (pCat !== targetCat && !pCat.includes(targetCat) && !targetCat.includes(pCat)) {
          return false;
        }
      }

      // 3. Collection Filter
      if (selectedCollection && selectedCollection !== 'ALL') {
        if (p.collectionId !== selectedCollection && p.collectionSlug !== selectedCollection) {
          return false;
        }
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesSlug = (p.slug || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesSlug) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === 'price-low') {
        const pA = parseFloat(a.minPrice || (a.estimatedPrice || '').replace(/[^0-9]/g, '')) || 0;
        const pB = parseFloat(b.minPrice || (b.estimatedPrice || '').replace(/[^0-9]/g, '')) || 0;
        return pA - pB;
      }
      if (sortOption === 'price-high') {
        const pA = parseFloat(a.maxPrice || a.minPrice || (a.estimatedPrice || '').replace(/[^0-9]/g, '')) || 0;
        const pB = parseFloat(b.maxPrice || b.minPrice || (b.estimatedPrice || '').replace(/[^0-9]/g, '')) || 0;
        return pB - pA;
      }
      if (sortOption === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      // 'featured' (default)
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [products, selectedGender, selectedCategory, selectedCollection, searchQuery, sortOption]);

  const activeCategoryTitle = selectedCategory !== 'ALL' ? selectedCategory.toUpperCase() : null;
  const currentSectionName = baseGender === 'MEN' ? "MEN'S" : "WOMEN'S";

  // Dynamic available categories list
  const availableCategories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    // Default categories if list is short
    ['Outerwear', 'Tops', 'Bottoms', 'Ethnic', 'Accessories'].forEach((c) => set.add(c));
    return Array.from(set);
  }, [products]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-28 font-sans animate-fadeIn">
      {/* Hero Editorial Header */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
            <Link to="/" className="hover:text-white transition-colors">HOME</Link>
            <ChevronRight className="w-3 h-3 text-neutral-500" />
            <Link to={isWomenRoute ? '/women' : '/men'} className="hover:text-white transition-colors">
              {currentSectionName}
            </Link>
            {activeCategoryTitle && (
              <>
                <ChevronRight className="w-3 h-3 text-neutral-500" />
                <span className="text-lime-400 font-bold">{activeCategoryTitle}</span>
              </>
            )}
          </nav>

          {/* Section Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3 py-1 bg-lime-400 text-black font-mono font-bold text-[10px] tracking-widest uppercase">
              {baseGender === 'MEN' ? 'MEN & UNISEX COLLECTION' : 'WOMEN & UNISEX COLLECTION'}
            </span>
            <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 font-mono text-[9px] tracking-widest uppercase border border-neutral-700">
              AHMEDABAD STUDIO BESPOKE
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-wider uppercase text-white">
              {activeCategoryTitle ? `${currentSectionName} ${activeCategoryTitle}` : `${currentSectionName} REFERENCE CATALOG`}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans max-w-2xl leading-relaxed">
              Explore bespoke silhouettes, hand-embroidered denim, contemporary ethnic edits, and modular streetwear tailored specifically for {baseGender === 'MEN' ? 'Men and Unisex styling' : 'Women and Unisex styling'}.
            </p>
          </div>

          {/* Quick Subcategory Pills */}
          <div className="pt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('ALL')}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors border ${
                selectedCategory === 'ALL'
                  ? 'bg-white text-black font-extrabold border-white'
                  : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:text-white hover:border-neutral-500'
              }`}
            >
              ALL {currentSectionName}
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors border ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-lime-400 text-black font-extrabold border-lime-400'
                    : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:text-white hover:border-neutral-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Catalog Workspace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Controls & Filter Bar */}
        <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${currentSectionName.toLowerCase()} looks, fabrics, styles...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateQueryParams({ q: e.target.value });
                }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 focus:border-neutral-900 text-xs text-neutral-900 placeholder-neutral-500 outline-none font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    updateQueryParams({ q: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills / Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Target Audience / Gender Switcher */}
              <div className="flex items-center bg-white border border-neutral-300 p-0.5">
                <button
                  onClick={() => handleGenderChange('ALL')}
                  className={`px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors ${
                    selectedGender === 'ALL'
                      ? 'bg-black text-white font-bold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => handleGenderChange('MEN')}
                  className={`px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors ${
                    selectedGender === 'MEN'
                      ? 'bg-black text-white font-bold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  MEN
                </button>
                <button
                  onClick={() => handleGenderChange('WOMEN')}
                  className={`px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors ${
                    selectedGender === 'WOMEN'
                      ? 'bg-black text-white font-bold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  WOMEN
                </button>
                <button
                  onClick={() => handleGenderChange('UNISEX')}
                  className={`px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors ${
                    selectedGender === 'UNISEX'
                      ? 'bg-lime-400 text-black font-extrabold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  UNISEX
                </button>
              </div>

              {/* Collection Dropdown */}
              <select
                value={selectedCollection}
                onChange={(e) => handleCollectionChange(e.target.value)}
                className="bg-white border border-neutral-300 px-3 py-1.5 text-xs font-mono text-neutral-800 outline-none"
              >
                <option value="ALL">COLLECTION: ALL</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>

              {/* Sorting Dropdown */}
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  updateQueryParams({ sort: e.target.value });
                }}
                className="bg-white border border-neutral-300 px-3 py-1.5 text-xs font-mono text-neutral-800 outline-none"
              >
                <option value="featured">SORT: FEATURED</option>
                <option value="newest">SORT: NEWEST</option>
                <option value="price-low">PRICE: LOW TO HIGH</option>
                <option value="price-high">PRICE: HIGH TO LOW</option>
              </select>
            </div>
          </div>

          {/* Made-to-Measure Bespoke Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
              <span className="text-[10px] font-mono text-neutral-700 tracking-wider uppercase font-semibold">
                100% BESPOKE / MADE-TO-MEASURE — ALL GARMENTS ARE CUSTOM CRAFTED TO YOUR REQUIRED SIZING & MEASUREMENTS
              </span>
            </div>

            {(selectedCategory !== 'ALL' || selectedGender !== baseGender || selectedCollection !== 'ALL' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="ml-auto text-[10px] font-mono text-neutral-600 hover:text-black underline uppercase font-bold"
              >
                RESET FILTERS
              </button>
            )}
          </div>
        </div>

        {/* Product Count Indicator */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-600 px-1">
          <span>
            SHOWING <strong className="text-black">{filteredProducts.length}</strong> {currentSectionName} & UNISEX REFERENCES
          </span>
          {selectedGender === 'UNISEX' && (
            <span className="text-lime-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
              VIEWING UNISEX CATALOG SPECIFICALLY
            </span>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-lime-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono tracking-widest text-neutral-500 uppercase">LOADING STYLE REFERENCES...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickInquire={(p) => setActiveInquiryProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-neutral-50 border border-neutral-200 p-8 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 tracking-wider uppercase">
                NO MATCHING REFERENCES FOUND
              </h3>
              <p className="text-xs text-neutral-500 font-sans max-w-md mx-auto">
                No designs currently match the selected target audience, category, or search query.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="btn-venm-primary px-6 py-2.5 text-xs font-bold font-mono tracking-widest uppercase"
            >
              CLEAR FILTERS
            </button>
          </div>
        )}
      </section>

      {/* Quick Inquiry Modal */}
      <InquiryModal
        product={activeInquiryProduct}
        isOpen={!!activeInquiryProduct}
        onClose={() => setActiveInquiryProduct(null)}
      />
    </div>
  );
};

export default GenderCatalog;
