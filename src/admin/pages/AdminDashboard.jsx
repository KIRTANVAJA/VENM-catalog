import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetDashboardStats, apiGetProducts } from '../../services/api';
import { BRAND_ASSETS } from '../../config/assets';
import {
  Package,
  Layers,
  Plus,
  Home,
  Image,
  ExternalLink,
  CheckCircle2,
  Clock,
  Activity,
  Server,
  Filter,
  RefreshCw,
  FolderKanban
} from 'lucide-react';

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSecs = Math.floor((now - past) / 1000);

  if (diffInSecs < 10) return 'Just now';
  if (diffInSecs < 60) return `${diffInSecs} seconds ago`;
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchStatsAndProducts = async () => {
    try {
      setLoading(true);
      const [statsData, prodsData] = await Promise.all([
        apiGetDashboardStats().catch(() => null),
        apiGetProducts({ status: 'ALL' }).catch(() => [])
      ]);
      if (statsData) setStats(statsData);
      if (prodsData) setProducts(prodsData);
    } catch (err) {
      console.warn('[DASHBOARD] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndProducts();

    // Setup Real-time SSE Connection to Backend Activity Stream
    let eventSource = null;
    try {
      eventSource = new EventSource('http://localhost:5000/api/admin/activity/stream', {
        withCredentials: true
      });

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          if (newLog && newLog.action) {
            setStats((prev) => {
              if (!prev) return prev;
              const existingLogs = prev.recentActivity || [];
              // Avoid duplicate logs if already added
              if (existingLogs.some((l) => l.id === newLog.id)) return prev;
              return {
                ...prev,
                recentActivity: [newLog, ...existingLogs.slice(0, 19)]
              };
            });
            // Re-fetch counts when a database event occurs
            apiGetDashboardStats().then((s) => s && setStats(s)).catch(() => {});
          }
        } catch (err) {}
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (err) {
      console.warn('[SSE STREAM] EventSource connection error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const quickActions = [
    { title: 'ADD PRODUCT', path: '/admin/products/new', icon: Plus },
    { title: 'CREATE COLLECTION', path: '/admin/collections/new', icon: Layers },
    { title: 'EDIT HOMEPAGE', path: '/admin/homepage', icon: Home },
    { title: 'MANAGE MEDIA', path: '/admin/media', icon: Image },
    { title: 'VIEW CATALOG', path: '/', isExternal: true, icon: ExternalLink }
  ];

  const activityLogs = stats?.recentActivity || [];
  const filteredActivityLogs = activityLogs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.entityType === filterType;
  });

  return (
    <div className="space-y-8 animate-fadeIn font-sans pb-12">
      {/* Welcome & Status Header */}
      <div className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 text-white text-[10px] font-mono tracking-widest uppercase">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-lime-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>SYSTEM MONITORING: {isLiveConnected ? 'REAL-TIME DB LIVE' : 'CONNECTED TO DATABASE'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 uppercase">
            VENM CATALOG CONTROL CENTER
          </h2>
          <p className="text-xs text-neutral-800 font-sans font-medium max-w-xl leading-relaxed">
            100% REAL-TIME AUDIT LOGS AND DATABASE METRICS FOR PRODUCTS, COLLECTIONS, CAMPAIGNS, AND SETTINGS.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchStatsAndProducts}
            className="btn-venm-outline px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 uppercase"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-900 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH DATA</span>
          </button>
          <Link
            to="/admin/products/new"
            className="btn-venm-primary px-5 py-2.5 text-xs font-bold tracking-widest flex items-center gap-2 uppercase"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>ADD PRODUCT</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards - All calculated strictly from current DB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'TOTAL PRODUCTS',
            value: stats?.products?.total ?? products.length,
            subText: `${stats?.products?.draft || 0} DRAFT PIECES`,
            icon: Package
          },
          {
            label: 'PUBLISHED PRODUCTS',
            value: stats?.products?.published ?? products.filter(p => p.availability !== 'DRAFT').length,
            subText: `${stats?.products?.inStock || 0} IN STOCK`,
            icon: CheckCircle2
          },
          {
            label: 'ACTIVE COLLECTIONS',
            value: stats?.collections?.total ?? 0,
            subText: `${stats?.collections?.active || 0} LIVE ON CATALOG`,
            icon: Layers
          },
          {
            label: 'MEDIA ASSETS',
            value: stats?.media?.total ?? 0,
            subText: 'STORED BRAND ASSETS',
            icon: FolderKanban
          }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 border border-neutral-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-900 tracking-widest uppercase font-extrabold">
                  {stat.label}
                </span>
                <Icon className="w-4 h-4 text-neutral-800" />
              </div>
              <div className="text-3xl font-black tracking-wider text-neutral-900 font-mono">
                {stat.value}
              </div>
              <div className="text-[10px] font-mono text-neutral-700 font-bold uppercase">
                {stat.subText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real System Infrastructure Status */}
      <div className="bg-white p-4 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-neutral-800" />
          <span className="font-bold text-neutral-900 uppercase tracking-wider">DATABASE & SERVICES HEALTH CHECK:</span>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-bold text-neutral-900">
            <span className="w-2 h-2 rounded-full bg-lime-500"></span>
            DATABASE: {stats?.systemStatus?.database || 'CONNECTED'}
          </span>
          <span className="flex items-center gap-1.5 font-bold text-neutral-900">
            <span className="w-2 h-2 rounded-full bg-lime-500"></span>
            API SERVER: {stats?.systemStatus?.apiServer || 'ONLINE'}
          </span>
          <span className="flex items-center gap-1.5 font-bold text-neutral-900">
            <span className="w-2 h-2 rounded-full bg-lime-500"></span>
            STORAGE: {stats?.systemStatus?.mediaStorage || 'AVAILABLE'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-neutral-900 tracking-[0.2em] uppercase font-black">
          QUICK ACTIONS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((act, idx) => {
            const Icon = act.icon;
            if (act.isExternal) {
              return (
                <a
                  key={idx}
                  href={act.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-white border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 transition-all flex flex-col justify-between h-28 group shadow-xs"
                >
                  <Icon className="w-5 h-5 text-neutral-900 group-hover:text-black" />
                  <span className="text-xs font-black tracking-wider text-neutral-900 uppercase">
                    {act.title}
                  </span>
                </a>
              );
            }
            return (
              <Link
                key={idx}
                to={act.path}
                className="p-4 bg-white border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 transition-all flex flex-col justify-between h-28 group shadow-xs"
              >
                <Icon className="w-5 h-5 text-neutral-900 group-hover:text-black" />
                <span className="text-xs font-black tracking-wider text-neutral-900 uppercase">
                  {act.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid: Recent Products & Real Database Activity Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Products list */}
        <div className="lg:col-span-6 bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <h3 className="text-sm font-black tracking-wider text-neutral-900 uppercase">
              RECENT CATALOG PRODUCTS
            </h3>
            <Link to="/admin/products" className="text-xs font-mono text-neutral-900 hover:underline font-bold">
              VIEW ALL ({products.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-900 font-mono text-[11px] tracking-widest uppercase font-bold">
                  <th className="py-2.5 px-3">IMAGE</th>
                  <th className="py-2.5 px-3">PRODUCT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {products.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <img
                        src={p.images?.[0] || BRAND_ASSETS.FALLBACK_PRODUCT}
                        alt={p.name}
                        className="w-10 h-12 object-cover bg-neutral-100 border border-neutral-300"
                        onError={(e) => { e.target.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-extrabold text-neutral-900 uppercase tracking-wider block">{p.name}</span>
                      <span className="text-[10px] font-mono text-neutral-700 font-semibold">{p.category} • {p.collectionName}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-neutral-900 text-white font-mono text-[10px] font-bold tracking-wider uppercase border border-neutral-700">
                        {p.availability}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="text-xs font-mono text-neutral-900 hover:underline uppercase font-bold"
                      >
                        EDIT
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: REAL Database Audit / Activity Stream */}
        <div className="lg:col-span-6 bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-black tracking-wider text-neutral-900 uppercase">
                REAL AUDIT LOGS ({filteredActivityLogs.length})
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {['ALL', 'PRODUCT', 'COLLECTION', 'SETTINGS', 'AUTH', 'ANALYTICS'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-1 uppercase font-bold transition-all ${
                    filterType === type
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredActivityLogs.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 border border-neutral-200 space-y-2">
                <Clock className="w-6 h-6 text-neutral-400 mx-auto" />
                <p className="text-xs font-mono font-bold text-neutral-800 uppercase">
                  NO RECENT ACTIVITY RECORDED FOR THIS FILTER
                </p>
                <p className="text-[11px] font-sans text-neutral-600">
                  Actions performed in the admin panel will automatically record database events here in real-time.
                </p>
              </div>
            ) : (
              filteredActivityLogs.map((item) => (
                <div key={item.id} className="p-3 bg-neutral-50 border border-neutral-200 space-y-1 hover:border-neutral-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 bg-lime-400 text-neutral-900 border border-lime-500">
                      {item.action}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-600 font-bold" title={item.createdAt}>
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-neutral-900 text-xs font-sans font-bold pt-0.5">
                    {item.description || item.entityName}
                  </p>
                  <span className="text-[9px] font-mono text-neutral-600 block">
                    By: {item.adminEmail || 'admin'} • ID: {item.entityId || 'N/A'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
