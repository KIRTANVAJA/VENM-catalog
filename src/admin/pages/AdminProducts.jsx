import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BRAND_ASSETS } from '../../config/assets';
import {
  apiGetProducts,
  apiDeleteProduct,
  apiUpdateProduct,
  apiCreateProduct
} from '../../services/api';
import { getAdminProducts } from '../../data/adminMock';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Eye,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState(getAdminProducts());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [collectionFilter, setCollectionFilter] = useState('ALL');
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiGetProducts();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      // Fallback to local admin mock
      setProducts(getAdminProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDeleteConfirm = async () => {
    if (deleteModalProduct) {
      try {
        await apiDeleteProduct(deleteModalProduct.id);
      } catch (err) {
        // Fallback
      }
      setProducts(products.filter((p) => p.id !== deleteModalProduct.id));
      setDeleteModalProduct(null);
    }
  };

  const handleToggleFeatured = async (product) => {
    const updatedStatus = !product.isFeatured;
    setProducts(
      products.map((p) => (p.id === product.id ? { ...p, isFeatured: updatedStatus } : p))
    );
    try {
      await apiUpdateProduct(product.id, { isFeatured: updatedStatus });
    } catch (err) {}
  };

  const handleDuplicate = async (product) => {
    const duplicated = {
      ...product,
      name: `${product.name} (COPY)`,
      slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`
    };
    delete duplicated.id;

    try {
      const created = await apiCreateProduct(duplicated);
      setProducts([created, ...products]);
    } catch (err) {
      setProducts([{ ...duplicated, id: `vnm-${Date.now()}` }, ...products]);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.slug || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.availability === statusFilter;
    const matchesCollection = collectionFilter === 'ALL' || p.collectionSlug === collectionFilter;
    return matchesSearch && matchesStatus && matchesCollection;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
            REFERENCE CATALOG MANAGEMENT // STYLE REFERENCES
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-neutral-900 uppercase">
            STYLE REFERENCES ({filteredProducts.length})
          </h2>
        </div>
        <Link
          to="/admin/products/new"
          className="btn-venm-primary px-6 py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 uppercase self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>ADD NEW REFERENCE</span>
        </Link>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 border border-neutral-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference name, ID, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 focus:border-neutral-900 text-xs text-neutral-900 placeholder-neutral-500 outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-600 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 text-xs text-neutral-900 px-3 py-2 outline-none font-mono"
            >
              <option value="ALL">REQUEST STATUS: ALL</option>
              <option value="REQUESTABLE">REQUESTABLE / PUBLISHED</option>
              <option value="PAUSED">REQUESTS PAUSED</option>
              <option value="COMING_SOON">COMING SOON</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          <div>
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 text-xs text-neutral-900 px-3 py-2 outline-none font-mono"
            >
              <option value="ALL">COLLECTION: ALL</option>
              <option value="navratri">NAVRATRI EDIT</option>
              <option value="diwali">DIWALI EDIT</option>
              <option value="ethnic">CONTEMPORARY ETHNIC</option>
              <option value="indo-western">INDO-WESTERN</option>
              <option value="denim">RAW DENIM</option>
              <option value="street">STREETWEAR</option>
              <option value="y2k">Y2K KINETIC</option>
              <option value="accessories">ACCESSORIES</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white overflow-hidden border border-neutral-200">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-900 font-mono text-[11px] tracking-widest uppercase font-extrabold">
              <th className="py-3 px-4">IMAGE</th>
              <th className="py-3 px-4">REFERENCE</th>
              <th className="py-3 px-4">ESTIMATED PRICE</th>
              <th className="py-3 px-4">COLLECTION</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-center">FEATURED</th>
              <th className="py-3 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredProducts.map((p) => {
              const imgUrl = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images)[0] : p.images) || BRAND_ASSETS.FALLBACK_PRODUCT;
              const estPrice = p.estimatedPrice || (p.minPrice ? `₹${p.minPrice} – ₹${p.maxPrice}` : 'Price on Request');
              return (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <img
                      src={imgUrl}
                      alt={p.name}
                      className="w-12 h-14 object-cover bg-neutral-100 border border-neutral-200"
                      onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
                    />
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-extrabold text-neutral-900 text-sm uppercase tracking-wider block">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-700 font-semibold">REFERENCE ID: {p.id}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-900 font-bold text-xs">
                    {estPrice}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-900 font-semibold text-xs uppercase">
                    {p.collectionName || p.collectionSlug}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge-status ${p.availability === 'PAUSED' ? 'badge-status-inactive' : 'badge-status-active'}`}>
                      {p.availability || 'REQUESTABLE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      className={`p-1.5 border transition-all ${
                        p.isFeatured
                          ? 'bg-black text-white border-black'
                          : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:text-black'
                      }`}
                      title="Toggle featured status"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/product/${p.slug}`}
                        target="_blank"
                        className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                        title="Preview Live Reference Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="p-1.5 text-neutral-900 hover:bg-neutral-200 transition-colors"
                        title="Edit Reference"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(p)}
                        className="p-1.5 text-neutral-700 hover:bg-neutral-200 transition-colors"
                        title="Duplicate Reference"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModalProduct(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Reference"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((p) => {
          const imgUrl = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images)[0] : p.images) || '/assets/products/jac3.jpg';
          return (
            <div key={p.id} className="bg-white p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={imgUrl}
                  alt={p.name}
                  className="w-16 h-20 object-cover bg-neutral-100 border border-neutral-200"
                />
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block font-semibold">{p.collectionName}</span>
                  <h4 className="text-base font-extrabold text-neutral-900 tracking-wider uppercase">{p.name}</h4>
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>{p.category}</span>
                    <span className="badge-status badge-status-active">
                      {p.availability}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <button
                  onClick={() => handleToggleFeatured(p)}
                  className={`text-xs font-mono px-2 py-1 flex items-center gap-1 border ${
                    p.isFeatured ? 'bg-black text-white border-black' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{p.isFeatured ? 'FEATURED' : 'NORMAL'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <Link to={`/admin/products/${p.id}/edit`} className="btn-venm-primary px-3 py-1 text-xs">
                    EDIT
                  </Link>
                  <button
                    onClick={() => setDeleteModalProduct(p)}
                    className="p-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 max-w-md w-full border border-neutral-300 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-extrabold tracking-wider text-neutral-900 uppercase">DELETE PRODUCT?</h3>
                <p className="text-xs text-neutral-500 font-mono">CONFIRM DESTRUCTIVE ACTION</p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 font-sans leading-relaxed">
              Are you sure you want to delete <strong className="text-black uppercase">{deleteModalProduct.name}</strong>? This will remove the record from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <button
                onClick={() => setDeleteModalProduct(null)}
                className="btn-venm-secondary px-4 py-2 text-xs font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2 text-xs tracking-wider uppercase transition-colors"
              >
                DELETE PRODUCT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
