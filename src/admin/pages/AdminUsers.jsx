import React, { useState, useEffect } from 'react';
import {
  apiGetUniqueVisitors,
  apiGetLiveUserAnalytics,
  apiGetRegisteredUsers,
  apiDeleteUser
} from '../../services/api';
import {
  Users,
  UserCheck,
  Shield,
  Search,
  RefreshCw,
  Trash2,
  Download,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Filter,
  Eye,
  Radio,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  ArrowUpRight,
  Clock
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

const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState('visitors'); // 'visitors' | 'registered'
  const [visitors, setVisitors] = useState([]);
  const [liveAnalytics, setLiveAnalytics] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('ALL'); // ALL | Desktop | Mobile
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | CUSTOMER | ADMIN

  // Delete modal state for registered users
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAllVisitorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [visRes, liveRes, usersRes] = await Promise.all([
        apiGetUniqueVisitors().catch(() => ({ visitors: [] })),
        apiGetLiveUserAnalytics().catch(() => null),
        apiGetRegisteredUsers().catch(() => ({ users: [] }))
      ]);

      if (visRes?.visitors) {
        setVisitors(visRes.visitors);
      }
      if (liveRes) {
        setLiveAnalytics(liveRes);
      }
      if (usersRes?.users) {
        setRegisteredUsers(usersRes.users);
      }
    } catch (err) {
      setError(err.message || 'FAILED TO LOAD VISITOR DATA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVisitorData();
    const interval = setInterval(() => {
      apiGetLiveUserAnalytics().then(d => d && setLiveAnalytics(d)).catch(() => {});
      apiGetUniqueVisitors().then(d => d?.visitors && setVisitors(d.visitors)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await apiDeleteUser(userToDelete.id);
      setSuccessMsg(`User "${userToDelete.name}" deleted successfully.`);
      setUserToDelete(null);
      fetchAllVisitorData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'FAILED TO DELETE USER');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportVisitorCSV = () => {
    if (!visitors.length) return;
    const headers = ['Visitor ID', 'Short Name', 'Device', 'First Seen', 'Last Active', 'Current Page', 'Total Pages Explored', 'Explored Paths'];
    const rows = filteredVisitors.map((v) => [
      `"${v.id}"`,
      `"${v.name || ''}"`,
      `"${v.device || 'Desktop'}"`,
      `"${new Date(v.firstSeen).toLocaleString()}"`,
      `"${new Date(v.lastSeen).toLocaleString()}"`,
      `"${v.currentPath || '/'}"`,
      v.totalExplorations || (v.pathsExplored?.length || 1),
      `"${(v.pathsExplored || []).join(' -> ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VENM_Unique_Visitors_Traffic_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUsersCSV = () => {
    if (!registeredUsers.length) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Inquiries Count', 'Created At'];
    const rows = registeredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role || ''}"`,
      u.inquiriesCount || 0,
      `"${new Date(u.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VENM_Registered_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered visitors
  const liveActiveIds = new Set((liveAnalytics?.liveOnline?.activeList || []).map(v => v.visitorId || v.id));

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.currentPath || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.pathsExplored || []).some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDevice = deviceFilter === 'ALL' || (v.device || '').toLowerCase() === deviceFilter.toLowerCase();
    return matchesSearch && matchesDevice;
  });

  // Filtered registered users
  const filteredUsers = registeredUsers.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUniqueVisitors = Math.max(visitors.length, liveAnalytics?.visitorMetrics?.uniqueVisitorsTotal || 0, 1);
  const visitorsTodayCount = liveAnalytics?.visitorMetrics?.uniqueVisitorsToday || Math.min(totalUniqueVisitors, 1);
  const liveOnlineNowCount = liveAnalytics?.liveOnline?.total || 1;
  const totalExplorationsToday = liveAnalytics?.visitorMetrics?.viewsToday || 0;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              AUDIENCE & TRAFFIC EXPLORATION ENGINE
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono bg-lime-400 text-neutral-900 font-extrabold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse"></span>
              <span>LIVE TRACKING</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-wider uppercase text-neutral-900">
            VISITOR ACTIVITY & AUDIENCE TRAFFIC
          </h1>
          <p className="text-xs text-neutral-600 font-medium pt-1">
            Track how many unique users came, their devices, and what looks & pages they explored on VENM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllVisitorData}
            disabled={loading}
            className="btn-venm-secondary text-xs px-3.5 py-2 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC DATA</span>
          </button>

          <button
            onClick={activeTab === 'visitors' ? handleExportVisitorCSV : handleExportUsersCSV}
            className="btn-venm-primary bg-neutral-900 text-white hover:bg-neutral-800 text-xs px-4 py-2 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'visitors'
              ? 'border-neutral-900 text-neutral-900 bg-neutral-100/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-lime-600 animate-pulse" />
          <span>UNIQUE VISITORS & EXPLORATIONS ({totalUniqueVisitors})</span>
        </button>

        <button
          onClick={() => setActiveTab('registered')}
          className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'registered'
              ? 'border-neutral-900 text-neutral-900 bg-neutral-100/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-neutral-700" />
          <span>ADMIN & REGISTERED ACCOUNTS ({registeredUsers.length})</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 font-bold hover:underline">
            DISMISS
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-lime-50 border border-lime-400 text-neutral-900 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: UNIQUE VISITORS & EXPLORATIONS */}
      {/* ==================================================== */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-900 text-white border border-neutral-800 shadow-md space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-lime-400">
                  ONLINE RIGHT NOW
                </span>
                <Radio className="w-4 h-4 text-lime-400 animate-pulse" />
              </div>
              <div className="text-3xl font-black font-mono text-white">{liveOnlineNowCount}</div>
              <p className="text-[10px] font-mono text-neutral-400">Active browsing tabs</p>
            </div>

            <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold">UNIQUE USERS TODAY</span>
                <TrendingUp className="w-4 h-4 text-lime-600" />
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900">{visitorsTodayCount}</div>
              <p className="text-[10px] font-mono text-neutral-500">Distinct people today</p>
            </div>

            <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold">TOTAL UNIQUE USERS</span>
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900">{totalUniqueVisitors}</div>
              <p className="text-[10px] font-mono text-neutral-500">All-time unique visitors</p>
            </div>

            <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold">LOOKS & PAGES EXPLORED</span>
                <Eye className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900">{totalExplorationsToday}</div>
              <p className="text-[10px] font-mono text-neutral-500">Page views recorded today</p>
            </div>
          </div>

          {/* Search & Device Filter */}
          <div className="p-4 bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Visitor Tag, Path, or Look..."
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 pl-9 pr-3.5 py-2 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">DEVICE:</span>
              <div className="flex border border-neutral-300 p-0.5 bg-neutral-100 text-xs font-mono">
                {['ALL', 'Desktop', 'Mobile'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeviceFilter(d)}
                    className={`px-3 py-1 font-bold transition-colors uppercase ${
                      deviceFilter === d ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Unique Visitors Table */}
          <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xs font-mono font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-800" />
                <span>ALL UNIQUE VISITORS & EXPLORATION PATHS ({filteredVisitors.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">
                PERSISTENT ACROSS SESSIONS
              </span>
            </div>

            {filteredVisitors.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-neutral-500 space-y-2">
                <Globe className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="font-bold uppercase text-neutral-700">NO UNIQUE VISITORS MATCH SEARCH CRITERIA</p>
                <p className="text-[10px] text-neutral-400">Visitors will automatically be recorded as they explore your catalog.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-900 font-mono text-[10px] tracking-widest uppercase font-bold">
                      <th className="py-2.5 px-3">VISITOR IDENTITY</th>
                      <th className="py-2.5 px-3">DEVICE TYPE</th>
                      <th className="py-2.5 px-3">FIRST SEEN</th>
                      <th className="py-2.5 px-3">LAST ACTIVE</th>
                      <th className="py-2.5 px-3">CURRENT / LATEST LOOK</th>
                      <th className="py-2.5 px-3">PAGES & LOOKS EXPLORED</th>
                      <th className="py-2.5 px-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredVisitors.map((v) => {
                      const isLive = liveActiveIds.has(v.id);
                      return (
                        <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-3 font-mono">
                            <span className="font-extrabold text-neutral-900 uppercase block">
                              {v.name || `Visitor #${v.shortId}`}
                            </span>
                            <span className="text-[9px] text-neutral-500 block truncate max-w-[140px]" title={v.id}>
                              ID: {v.id}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] uppercase font-bold">
                              {v.device === 'Mobile' ? <Smartphone className="w-3 h-3 text-neutral-600" /> : <Monitor className="w-3 h-3 text-neutral-600" />}
                              <span>{v.device || 'Desktop'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-neutral-600 whitespace-nowrap">
                            {formatTimeAgo(v.firstSeen)}
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-neutral-600 whitespace-nowrap">
                            {formatTimeAgo(v.lastSeen)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                            <span className="text-xs text-lime-700 bg-lime-50 px-2 py-0.5 border border-lime-200 inline-block">
                              {v.currentPath || '/'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px]">
                            <div className="flex flex-wrap items-center gap-1 max-w-xs">
                              {(v.pathsExplored || [v.currentPath || '/']).map((p, pIdx) => (
                                <span key={pIdx} className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700">
                                  {p}
                                </span>
                              ))}
                              <span className="text-[9px] text-neutral-400 font-bold ml-1">
                                ({v.totalExplorations || (v.pathsExplored?.length || 1)} looks)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold bg-lime-400 text-neutral-900 uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse"></span>
                                <span>ONLINE NOW</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase">
                                <span>EXPLORED</span>
                              </span>
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
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: REGISTERED ACCOUNTS & ADMINS */}
      {/* ==================================================== */}
      {activeTab === 'registered' && (
        <div className="space-y-6">
          <div className="p-4 bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search registered accounts..."
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 pl-9 pr-3.5 py-2 text-xs text-neutral-900 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">ROLE:</span>
              <div className="flex border border-neutral-300 p-0.5 bg-neutral-100 text-xs font-mono">
                {['ALL', 'CUSTOMER', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 font-bold transition-colors uppercase ${
                      roleFilter === r ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-900 font-mono text-[10px] tracking-widest uppercase font-bold">
                  <th className="py-2.5 px-3">USER NAME</th>
                  <th className="py-2.5 px-3">EMAIL ADDRESS</th>
                  <th className="py-2.5 px-3">ROLE</th>
                  <th className="py-2.5 px-3">CREATED AT</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-neutral-900 uppercase">
                      {u.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-700">
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                        u.role === 'ADMIN' ? 'bg-neutral-900 text-lime-400' : 'bg-neutral-200 text-neutral-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white p-6 max-w-sm w-full border border-neutral-300 shadow-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
              DELETE USER ACCOUNT?
            </h3>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete user "{userToDelete.name}" ({userToDelete.email})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="btn-venm-secondary text-xs px-4 py-2"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="btn-venm-primary bg-red-600 text-white hover:bg-red-700 text-xs px-4 py-2"
              >
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
