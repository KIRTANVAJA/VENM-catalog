import React, { useState, useEffect } from 'react';
import { apiGetRegisteredUsers, apiDeleteUser } from '../../services/api';
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
  UserPlus
} from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | CUSTOMER | ADMIN

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetRegisteredUsers();
      if (res?.users) {
        setUsers(res.users);
      }
    } catch (err) {
      setError(err.message || 'FAILED TO LOAD REGISTERED USERS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await apiDeleteUser(userToDelete.id);
      setSuccessMsg(`User "${userToDelete.name}" deleted successfully.`);
      setUserToDelete(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'FAILED TO DELETE USER');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!users.length) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Inquiries Count', 'Created At'];
    const rows = filteredUsers.map((u) => [
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
    link.setAttribute('download', `VENM_Registered_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const totalCustomers = users.filter((u) => u.role === 'CUSTOMER').length;
  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;
  const totalInquiries = users.reduce((acc, u) => acc + (u.inquiriesCount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
              CLIENT DATABASE & USER MANAGEMENT
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono bg-lime-400 text-neutral-900 font-extrabold uppercase">
              PERSISTED DATA
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-wider uppercase text-neutral-900">
            REGISTERED USERS ({totalUsers})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="btn-venm-secondary text-xs px-3.5 py-2 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!users.length}
            className="btn-venm-primary bg-neutral-900 text-white hover:bg-neutral-800 text-xs px-4 py-2 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">TOTAL REGISTERED</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900">{totalUsers}</div>
          <p className="text-[10px] font-mono text-neutral-500">All registered client profiles</p>
        </div>

        <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">CLIENT CUSTOMERS</span>
            <UserCheck className="w-4 h-4 text-lime-600" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900">{totalCustomers}</div>
          <p className="text-[10px] font-mono text-neutral-500">Public registered shoppers</p>
        </div>

        <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">STUDIO ADMINS</span>
            <Shield className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900">{totalAdmins}</div>
          <p className="text-[10px] font-mono text-neutral-500">Full system control roles</p>
        </div>

        <div className="p-4 bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">CLIENT INQUIRIES</span>
            <MessageSquare className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900">{totalInquiries}</div>
          <p className="text-[10px] font-mono text-neutral-500">Total look requests submitted</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
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
                className={`px-3 py-1 font-bold transition-colors ${
                  roleFilter === r ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider border-b border-neutral-800">
                <th className="py-3 px-4">USER CLIENT</th>
                <th className="py-3 px-4">CONTACT INFO</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">REGISTERED DATE</th>
                <th className="py-3 px-4 text-center">INQUIRIES</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
                      <span>LOADING REGISTERED USER DATABASE...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-neutral-500">
                    NO REGISTERED USERS FOUND MATCHING YOUR CRITERIA
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                    {/* User Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-none bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-extrabold uppercase text-neutral-900">{u.name || 'UNNAMED USER'}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">ID: {u.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4 space-y-1">
                      {u.email && !u.email.endsWith('@venm.local') && (
                        <div className="flex items-center gap-1.5 text-neutral-800">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      )}
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-neutral-800">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                      {(!u.email || u.email.endsWith('@venm.local')) && !u.phone && (
                        <span className="text-neutral-400 text-[10px]">No direct contact</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-neutral-900 text-white border border-neutral-900'
                            : 'bg-lime-400 text-neutral-900'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'STUDIO ADMIN' : 'CUSTOMER'}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-neutral-600 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[9px] text-neutral-400 pl-5">
                        {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Inquiries */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs font-bold bg-neutral-100 border border-neutral-200 text-neutral-900">
                        {u.inquiriesCount || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {u.role === 'ADMIN' && u.email === 'venm1310@gmail.com' ? (
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">PRIMARY ADMIN</span>
                      ) : (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-neutral-200 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-neutral-200 pb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-black uppercase tracking-wider text-neutral-900">DELETE REGISTERED USER</h3>
            </div>

            <p className="text-xs text-neutral-700 font-mono">
              Are you sure you want to delete the user account for{' '}
              <strong className="text-black font-extrabold">{userToDelete.name}</strong> ({userToDelete.email || userToDelete.phone})?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="btn-venm-secondary text-xs px-4 py-2.5"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="btn-venm-primary bg-red-600 text-white hover:bg-red-700 text-xs px-4 py-2.5 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'DELETING...' : 'CONFIRM DELETE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
