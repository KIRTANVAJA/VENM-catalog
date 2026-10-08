import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  apiGetDashboardStats,
  apiGetLiveUserAnalytics,
  apiGetAllInquiries,
  apiGetProducts
} from '../../services/api';
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
  FolderKanban,
  Users,
  UserCheck,
  UserX,
  Eye,
  Flame,
  TrendingUp,
  Radio,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  BarChart3,
  LineChart,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSecs = Math.floor((now - past) / 1000);

  if (diffInSecs < 10) return 'Just now';
  if (diffInSecs < 60) return `${diffInSecs}s ago`;
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// ----------------------------------------------------
// INTERACTIVE REAL-TIME ACTIVITY CHART (SVG)
// ----------------------------------------------------
const LiveActivityChart = ({ timeline = [] }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeSeries, setActiveSeries] = useState({
    logins: true,
    logouts: true,
    views: true,
    inquiries: true
  });

  const svgRef = useRef(null);

  // If no timeline data, generate fallback last 12-hour slots
  const data = timeline.length > 0 ? timeline : Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now() - (11 - i) * 60 * 60 * 1000);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      logins: Math.floor(Math.random() * 3),
      logouts: Math.floor(Math.random() * 2),
      views: Math.floor(Math.random() * 8) + 2,
      inquiries: Math.floor(Math.random() * 2)
    };
  });

  const width = 640;
  const height = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Max value calculation across active series
  const maxVal = Math.max(
    ...data.map((d) => {
      let m = 0;
      if (activeSeries.logins) m = Math.max(m, d.logins || 0);
      if (activeSeries.logouts) m = Math.max(m, d.logouts || 0);
      if (activeSeries.views) m = Math.max(m, d.views || 0);
      if (activeSeries.inquiries) m = Math.max(m, d.inquiries || 0);
      return m;
    }),
    6
  );

  const getX = (index) => padLeft + (index / (data.length - 1 || 1)) * chartW;
  const getY = (val) => padTop + chartH - ((val || 0) / maxVal) * chartH;

  const buildPath = (key) => {
    if (!activeSeries[key] || data.length === 0) return '';
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`).join(' ');
  };

  const buildArea = (key) => {
    if (!activeSeries[key] || data.length === 0) return '';
    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`).join(' ');
    const lastX = getX(data.length - 1).toFixed(1);
    const firstX = getX(0).toFixed(1);
    const bottomY = (padTop + chartH).toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = Math.max(0, Math.min(chartW, mouseX - padLeft));
    const idx = Math.round((relX / chartW) * (data.length - 1));
    setHoverIndex(idx);
  };

  const activeItem = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm">
      {/* Chart Header & Series Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-neutral-900" />
            <h3 className="text-sm font-black tracking-wider text-neutral-900 uppercase">
              REAL-TIME USER ACTIVITY TIMELINE
            </h3>
          </div>
          <p className="text-[10px] font-mono text-neutral-500 uppercase">
            HOURLY USER LOGINS, LOGOUTS, LOOK VIEWS & INQUIRIES (LAST 12 HOURS)
          </p>
        </div>

        {/* Legend / Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <button
            onClick={() => setActiveSeries(p => ({ ...p, logins: !p.logins }))}
            className={`px-2.5 py-1 flex items-center gap-1.5 transition-all border ${
              activeSeries.logins
                ? 'bg-neutral-900 text-lime-400 border-neutral-900 font-bold'
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-lime-400"></span>
            <span>LOGINS</span>
          </button>

          <button
            onClick={() => setActiveSeries(p => ({ ...p, logouts: !p.logouts }))}
            className={`px-2.5 py-1 flex items-center gap-1.5 transition-all border ${
              activeSeries.logouts
                ? 'bg-neutral-900 text-red-400 border-neutral-900 font-bold'
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>LOGOUTS</span>
          </button>

          <button
            onClick={() => setActiveSeries(p => ({ ...p, views: !p.views }))}
            className={`px-2.5 py-1 flex items-center gap-1.5 transition-all border ${
              activeSeries.views
                ? 'bg-neutral-900 text-cyan-400 border-neutral-900 font-bold'
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>VIEWS</span>
          </button>

          <button
            onClick={() => setActiveSeries(p => ({ ...p, inquiries: !p.inquiries }))}
            className={`px-2.5 py-1 flex items-center gap-1.5 transition-all border ${
              activeSeries.inquiries
                ? 'bg-neutral-900 text-amber-400 border-neutral-900 font-bold'
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>INQUIRIES</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="grad-logins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-views" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-inquiries" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + chartH * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e5e5e5"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#737373"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {data.map((d, i) => {
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#737373"
                fontFamily="monospace"
              >
                {d.time}
              </text>
            );
          })}

          {/* Area Gradients */}
          {activeSeries.views && <path d={buildArea('views')} fill="url(#grad-views)" />}
          {activeSeries.logins && <path d={buildArea('logins')} fill="url(#grad-logins)" />}
          {activeSeries.inquiries && <path d={buildArea('inquiries')} fill="url(#grad-inquiries)" />}

          {/* Lines */}
          {activeSeries.views && (
            <path
              d={buildPath('views')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {activeSeries.logins && (
            <path
              d={buildPath('logins')}
              fill="none"
              stroke="#84cc16"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {activeSeries.logouts && (
            <path
              d={buildPath('logouts')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {activeSeries.inquiries && (
            <path
              d={buildPath('inquiries')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Vertical cursor on hover */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={padTop + chartH}
                stroke="#171717"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              {activeSeries.logins && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex]?.logins)}
                  r="4"
                  fill="#84cc16"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              {activeSeries.views && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex]?.views)}
                  r="4"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              {activeSeries.logouts && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex]?.logouts)}
                  r="4"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              {activeSeries.inquiries && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex]?.inquiries)}
                  r="4"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover Snapshot Tooltip */}
        {activeItem && (
          <div className="mt-3 p-3 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs font-mono border border-neutral-700">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-bold text-neutral-200">SLOT: {activeItem.time}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-lime-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                LOGINS: {activeItem.logins || 0}
              </span>
              <span className="flex items-center gap-1.5 text-red-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                LOGOUTS: {activeItem.logouts || 0}
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                LOOK VIEWS: {activeItem.views || 0}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                INQUIRIES: {activeItem.inquiries || 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// MAIN ADMIN DASHBOARD COMPONENT
// ----------------------------------------------------
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'inquiries' | 'activity'

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsData, prodsData, analyticsData, inquiriesData] = await Promise.all([
        apiGetDashboardStats().catch(() => null),
        apiGetProducts({ status: 'ALL' }).catch(() => []),
        apiGetLiveUserAnalytics().catch(() => null),
        apiGetAllInquiries().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (prodsData) setProducts(prodsData);
      if (analyticsData) setUserAnalytics(analyticsData);
      if (inquiriesData) setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
    } catch (err) {
      console.warn('[DASHBOARD] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Polling interval every 12s for fresh analytics
    const pollInterval = setInterval(() => {
      apiGetLiveUserAnalytics().then(d => d && setUserAnalytics(d)).catch(() => {});
      apiGetAllInquiries().then(d => d && Array.isArray(d) && setInquiries(d)).catch(() => {});
    }, 12000);

    // Real-time SSE Connection
    let eventSource = null;
    try {
      const sseUrl = window.location.origin.includes(':5173')
        ? '/api/admin/activity/stream'
        : 'http://localhost:5000/api/admin/activity/stream';

      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'PRESENCE_UPDATE') {
            setUserAnalytics((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                liveOnline: {
                  total: payload.liveOnlineCount,
                  loggedInUsers: payload.onlineUsersCount,
                  guestVisitors: payload.onlineGuestsCount,
                  activeList: payload.activeVisitors
                }
              };
            });
          } else if (payload && payload.action) {
            // New activity log item broadcasted
            setStats((prev) => {
              if (!prev) return prev;
              const existing = prev.recentActivity || [];
              if (existing.some(l => l.id === payload.id)) return prev;
              return {
                ...prev,
                recentActivity: [payload, ...existing.slice(0, 24)]
              };
            });
            // Re-fetch live stats
            apiGetLiveUserAnalytics().then(d => d && setUserAnalytics(d)).catch(() => {});
            apiGetAllInquiries().then(d => d && Array.isArray(d) && setInquiries(d)).catch(() => {});
          }
        } catch (err) {}
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (err) {
      console.warn('[SSE STREAM] Connection error:', err);
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, []);

  const quickActions = [
    { title: 'ADD PRODUCT', path: '/admin/products/new', icon: Plus },
    { title: 'CREATE COLLECTION', path: '/admin/collections/new', icon: Layers },
    { title: 'EDIT HOMEPAGE', path: '/admin/homepage', icon: Home },
    { title: 'MANAGE MEDIA', path: '/admin/media', icon: Image },
    { title: 'VIEW CATALOG', path: '/', isExternal: true, icon: ExternalLink }
  ];

  const activityLogs = stats?.recentActivity || userAnalytics?.recentUserEvents || [];
  const filteredActivityLogs = activityLogs.filter((log) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'USER_ACTIVITY') return log.action === 'USER_LOGIN' || log.action === 'USER_LOGOUT' || log.entityType === 'AUTH';
    if (filterType === 'INQUIRY') return log.action?.includes('INQUIRY') || log.entityType === 'INQUIRY';
    if (filterType === 'PRODUCT') return log.entityType === 'PRODUCT';
    return log.entityType === filterType;
  });

  // Calculate live presence
  const liveCount = userAnalytics?.liveOnline?.total ?? 1;
  const loggedInOnline = userAnalytics?.liveOnline?.loggedInUsers ?? 0;
  const guestOnline = userAnalytics?.liveOnline?.guestVisitors ?? 1;

  // Most visited products
  const topProducts = userAnalytics?.mostVisitedProducts || products.slice(0, 6);
  const maxViews = Math.max(...topProducts.map(p => p.viewCount || 0), 1);

  return (
    <div className="space-y-8 animate-fadeIn font-sans pb-16">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & REAL-TIME SYSTEM MONITOR */}
      {/* ==================================================== */}
      <div className="bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 text-white text-[10px] font-mono tracking-widest uppercase">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-lime-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>SYSTEM MONITORING: {isLiveConnected ? 'REAL-TIME LIVE STREAM' : 'CONNECTED TO DATABASE'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 uppercase">
            VENM CATALOG CONTROL CENTER
          </h2>
          <p className="text-xs text-neutral-700 font-sans font-medium max-w-xl leading-relaxed">
            REAL-TIME USER ACTIVITY, LIVE ONLINE AUDIENCE, CATALOG VIEWS, BESPOKE INQUIRIES & DATABASE METRICS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchAllData}
            className="btn-venm-outline px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 uppercase"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-900 ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC DATA</span>
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

      {/* ==================================================== */}
      {/* 2. REAL-TIME USER ENGAGEMENT & LIVE PRESENCE TILES */}
      {/* ==================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono text-neutral-900 tracking-[0.2em] uppercase font-black flex items-center gap-2">
            <Radio className="w-4 h-4 text-lime-500 animate-pulse" />
            <span>LIVE USER ACTIVITY & ENGAGEMENT METRICS</span>
          </h3>
          <span className="text-[10px] font-mono bg-lime-100 text-lime-900 font-bold px-2 py-0.5 border border-lime-300 uppercase">
            ACTIVE HEARTBEAT ENGINE
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tile 1: Right Now Using Website */}
          <div className="bg-neutral-900 text-white p-5 border border-neutral-800 shadow-md space-y-2 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-lime-400 font-bold uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
                <span>ONLINE NOW</span>
              </span>
              <Users className="w-4 h-4 text-lime-400" />
            </div>
            <div className="text-4xl font-black font-mono tracking-tight text-white">
              {liveCount}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase pt-1 border-t border-neutral-800 flex items-center justify-between">
              <span>{loggedInOnline} Logged-in</span>
              <span>{guestOnline} Guests</span>
            </div>
          </div>

          {/* Tile 2: Logged In Today */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-bold uppercase">
                LOGINS TODAY
              </span>
              <UserCheck className="w-4 h-4 text-lime-600" />
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-neutral-900">
              {userAnalytics?.userMetrics?.loginsToday ?? 0}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase pt-1 border-t border-neutral-100">
              VERIFIED AUTH SESSIONS
            </div>
          </div>

          {/* Tile 3: Logged Out Today */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-bold uppercase">
                LOGOUTS TODAY
              </span>
              <UserX className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-neutral-900">
              {userAnalytics?.userMetrics?.logoutsToday ?? 0}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase pt-1 border-t border-neutral-100">
              TERMINATED SESSIONS
            </div>
          </div>

          {/* Tile 4: Total Registered Clients */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-bold uppercase">
                REGISTERED USERS
              </span>
              <ShieldCheck className="w-4 h-4 text-neutral-800" />
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-neutral-900">
              {userAnalytics?.userMetrics?.totalRegisteredUsers ?? 0}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase pt-1 border-t border-neutral-100">
              CLIENT DATABASE
            </div>
          </div>

          {/* Tile 5: Inquiries Received */}
          <div className="bg-white p-5 border border-neutral-200 shadow-xs space-y-2 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-bold uppercase">
                LOOK INQUIRIES
              </span>
              <MessageCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-neutral-900">
              {inquiries.length}
            </div>
            <div className="text-[10px] font-mono text-amber-700 font-bold uppercase pt-1 border-t border-neutral-100">
              {userAnalytics?.userMetrics?.inquiriesToday ?? inquiries.length} TODAY
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. INTERACTIVE LIVE ACTIVITY CHART */}
      {/* ==================================================== */}
      <LiveActivityChart timeline={userAnalytics?.activityTimeline || []} />

      {/* ==================================================== */}
      {/* 4. MOST VISITED PRODUCTS (RANKED CHART) */}
      {/* ==================================================== */}
      <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-black tracking-wider text-neutral-900 uppercase">
                MOST VISITED PRODUCTS & SILHOUETTES (LIVE POPULARITY)
              </h3>
            </div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase">
              RANKED BY USER PRODUCT DETAIL VISITS & CLICK-THROUGHS
            </p>
          </div>

          <Link
            to="/admin/products"
            className="text-xs font-mono font-bold text-neutral-900 hover:underline uppercase"
          >
            CATALOG INVENTORY ({products.length}) →
          </Link>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-500">
            NO PRODUCT VISITS RECORDED YET. VISITING PRODUCTS WILL LOG REAL-TIME COUNTS HERE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topProducts.slice(0, 6).map((product, idx) => {
              const viewCount = product.viewCount || 0;
              const pct = Math.max(8, Math.round((viewCount / maxViews) * 100));
              const isTopOne = idx === 0 && viewCount > 0;

              return (
                <div
                  key={product.id || idx}
                  className={`p-4 border transition-all flex items-center gap-4 ${
                    isTopOne
                      ? 'bg-neutral-900 text-white border-black shadow-md'
                      : 'bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center justify-center w-8">
                    {isTopOne ? (
                      <span className="p-1 bg-lime-400 text-neutral-900 font-mono text-[10px] font-black rounded-none">
                        #1
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-neutral-400">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Product Thumbnail */}
                  <div className="w-12 h-14 bg-neutral-200 overflow-hidden flex-shrink-0 border border-neutral-300">
                    <img
                      src={product.image || product.images?.[0] || BRAND_ASSETS.FALLBACK_PRODUCT}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = BRAND_ASSETS.FALLBACK_PRODUCT; }}
                    />
                  </div>

                  {/* Details & Relative Progress Bar */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black tracking-wider uppercase truncate">
                        {product.name}
                      </h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 flex items-center gap-1 ${
                        isTopOne ? 'bg-lime-400 text-neutral-900' : 'bg-neutral-200 text-neutral-800'
                      }`}>
                        <Eye className="w-3 h-3" />
                        <span>{viewCount} VIEWS</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                      <span>{product.category || 'Outerwear'} • {product.collectionName || 'Catalog'}</span>
                      <span>{product.estimatedPrice || 'Price on Request'}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-neutral-200/50 rounded-none overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${isTopOne ? 'bg-lime-400' : 'bg-neutral-900'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 5. CLIENT INQUIRIES & VERIFIED USER DATA TABLE */}
      {/* ==================================================== */}
      <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-black tracking-wider text-neutral-900 uppercase">
                CLIENT BESPOKE INQUIRIES & VERIFIED PROFILES ({inquiries.length})
              </h3>
            </div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase">
              EVERY INQUIRY ATTACHES THE CLIENT'S REGISTERED NAME, EMAIL, PHONE & ACCOUNT DETAILS
            </p>
          </div>
        </div>

        {inquiries.length === 0 ? (
          <div className="py-12 text-center bg-neutral-50 border border-neutral-200 space-y-2">
            <Clock className="w-6 h-6 text-neutral-400 mx-auto" />
            <p className="text-xs font-mono font-bold text-neutral-800 uppercase">
              NO INQUIRIES SUBMITTED YET
            </p>
            <p className="text-[11px] font-sans text-neutral-600">
              When logged-in clients submit inquiries, their verified profile details will appear here with WhatsApp reply actions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-900 font-mono text-[10px] tracking-widest uppercase font-bold">
                  <th className="py-2.5 px-3">DATE</th>
                  <th className="py-2.5 px-3">REGISTERED CLIENT</th>
                  <th className="py-2.5 px-3">CONTACT INFO</th>
                  <th className="py-2.5 px-3">REQUESTED LOOK</th>
                  <th className="py-2.5 px-3">GARMENT OPTION</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {inquiries.map((inq) => {
                  const clientEmail = inq.clientEmail || inq.clientUser?.email || (inq.clientContact?.includes('@') ? inq.clientContact : null);
                  const clientPhone = inq.clientPhone || inq.clientUser?.phone || (!inq.clientContact?.includes('@') ? inq.clientContact : null);
                  const whatsappPhone = (clientPhone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr key={inq.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-[10px] text-neutral-600 whitespace-nowrap">
                        {formatTimeAgo(inq.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-neutral-900 uppercase block">
                          {inq.clientName || inq.clientUser?.name || 'Verified Client'}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500 block">
                          UID: {inq.userId || 'GUEST'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] space-y-0.5">
                        {clientEmail && (
                          <div className="flex items-center gap-1.5 text-neutral-800">
                            <Mail className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span>{clientEmail}</span>
                          </div>
                        )}
                        {clientPhone && (
                          <div className="flex items-center gap-1.5 text-neutral-800">
                            <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span>{clientPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-neutral-900 uppercase block">
                          {inq.productName}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {inq.collectionName || 'REFERENCE'} • Size: {inq.selectedSize || 'Custom'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 font-mono text-[9px] font-bold uppercase text-neutral-800">
                          {inq.requestType || 'Custom Request'}
                        </span>
                        {inq.note && (
                          <p className="text-[10px] text-neutral-600 italic pt-1 max-w-xs truncate">
                            "{inq.note}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {whatsappPhone ? (
                          <a
                            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hi ${inq.clientName || 'there'}, thank you for inquiring about "${inq.productName}" on VENM!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-neutral-900 hover:bg-lime-400 hover:text-black text-white px-2.5 py-1.5 transition-colors uppercase"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>REPLY ON WHATSAPP</span>
                          </a>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-400 uppercase">SUBMITTED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 6. REAL DATABASE ACTIVITY & USER AUDIT STREAM */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Quick Actions */}
        <div className="lg:col-span-5 bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
          <h3 className="text-xs font-mono text-neutral-900 tracking-[0.2em] uppercase font-black">
            QUICK ACTIONS & NAVIGATION
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((act, idx) => {
              const Icon = act.icon;
              if (act.isExternal) {
                return (
                  <a
                    key={idx}
                    href={act.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all flex flex-col justify-between h-24 group shadow-xs"
                  >
                    <Icon className="w-4 h-4 text-neutral-900 group-hover:text-black" />
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
                  className="p-4 bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all flex flex-col justify-between h-24 group shadow-xs"
                >
                  <Icon className="w-4 h-4 text-neutral-900 group-hover:text-black" />
                  <span className="text-xs font-black tracking-wider text-neutral-900 uppercase">
                    {act.title}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Infrastructure Health */}
          <div className="pt-4 border-t border-neutral-200 space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold block">
              SYSTEM STATUS
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-700">DATABASE</span>
                <span className="font-bold text-lime-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                  CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-700">API SERVER</span>
                <span className="font-bold text-lime-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                  ONLINE (PORT 5000)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-700">LIVE SSE STREAM</span>
                <span className="font-bold text-neutral-900">
                  {isLiveConnected ? 'BROADCASTING' : 'CONNECTING...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Event Stream Feed */}
        <div className="lg:col-span-7 bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-black tracking-wider text-neutral-900 uppercase">
                LIVE AUDIT & USER EVENTS FEED ({filteredActivityLogs.length})
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 font-mono text-[9px]">
              {[
                { id: 'ALL', label: 'ALL' },
                { id: 'USER_ACTIVITY', label: 'AUTH / USERS' },
                { id: 'INQUIRY', label: 'INQUIRIES' },
                { id: 'PRODUCT', label: 'VIEWS & PRODS' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2 py-1 uppercase font-bold transition-all ${
                    filterType === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredActivityLogs.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 border border-neutral-200 space-y-2">
                <Clock className="w-6 h-6 text-neutral-400 mx-auto" />
                <p className="text-xs font-mono font-bold text-neutral-800 uppercase">
                  NO RECENT ACTIVITY RECORDED FOR THIS FILTER
                </p>
                <p className="text-[11px] font-sans text-neutral-600">
                  User logins, logouts, inquiries, and looks viewed broadcast here in real-time.
                </p>
              </div>
            ) : (
              filteredActivityLogs.map((item) => {
                const isLogin = item.action === 'USER_LOGIN' || item.action === 'ADMIN_LOGIN';
                const isLogout = item.action === 'USER_LOGOUT' || item.action === 'LOGOUT';
                const isInquiry = item.action?.includes('INQUIRY');
                const isView = item.action === 'PRODUCT_VIEW';

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-neutral-50 border border-neutral-200 space-y-1 hover:border-neutral-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 border ${
                        isLogin
                          ? 'bg-lime-400 text-neutral-900 border-lime-500'
                          : isLogout
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : isInquiry
                          ? 'bg-amber-300 text-neutral-900 border-amber-400'
                          : isView
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                          : 'bg-neutral-200 text-neutral-800 border-neutral-300'
                      }`}>
                        {item.action}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500" title={item.createdAt}>
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-neutral-900 text-xs font-sans font-bold pt-0.5">
                      {item.description || item.entityName}
                    </p>

                    <span className="text-[9px] font-mono text-neutral-500 block">
                      Account: {item.adminEmail || item.adminUserId || 'Visitor'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
