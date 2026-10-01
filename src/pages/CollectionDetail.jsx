import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollectionBySlug, getProductsByCollection } from '../data/catalog';
import { apiGetCollectionBySlug, apiGetProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { ChevronRight, Filter } from 'lucide-react';

const CollectionDetail = () => {
  const { slug } = useParams();
  const [collection, setCollection] = useState(() => getCollectionBySlug(slug) || getCollectionBySlug('navratri'));
  const [allProducts, setAllProducts] = useState(() => getProductsByCollection(slug || 'navratri'));
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeInquiryProduct, setActiveInquiryProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCollectionDetail() {
      try {
        const liveCol = await apiGetCollectionBySlug(slug);
        if (isMounted && liveCol) {
          setCollection(liveCol);
        }
        const liveProds = await apiGetProducts({ collection: slug });
        if (isMounted && liveProds && liveProds.length > 0) {
          setAllProducts(liveProds);
        }
      } catch (err) {
        console.warn(`[COLLECTION DETAIL] API fetch failed for slug ${slug}:`, err.message);
      }
    }
    loadCollectionDetail();
    return () => { isMounted = false; };
  }, [slug]);

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

  const categories = ['All', ...new Set(allProducts.map((p) => p.category))];

  const filteredProducts = allProducts.filter(
    (p) => activeCategory === 'All' || p.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 space-y-12 pb-24 font-sans">
      {/* Hero Collection Header */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto space-y-6">
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
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">
              {collection.tagline}
            </p>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-widest text-neutral-900 uppercase">
              {collection.name}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-3xl leading-relaxed font-light">
            {collection.description}
          </p>

          <div className="pt-1 text-xs font-mono text-neutral-500">
            TOTAL PIECES IN EDIT: <strong className="text-neutral-900">{allProducts.length}</strong>
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
                onQuickInquire={(p) => setActiveInquiryProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-neutral-50 border border-neutral-200">
            <p className="text-sm font-mono text-neutral-500">NO PIECES MATCH THE SELECTED CATEGORY FILTER.</p>
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
