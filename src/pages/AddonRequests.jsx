import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  PackagePlus, 
  Search, 
  Filter, 
  Check, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGetAddonRequestsQuery } from '../store/apiSlice';
import { useSocket } from '../context/SocketContext';

export default function AddonRequests() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const { socket } = useSocket();

  const { data: requestsRes, isLoading: loading, refetch: fetchRequests } = useGetAddonRequestsQuery({
    search: debouncedSearch,
    status: filterStatus,
    sortBy: sortOrder,
    page,
    limit: 10
  });

  const requests = requestsRes?.data?.data || requestsRes?.data || [];
  const meta = requestsRes?.data?.meta || { total: 0, totalPages: 1, limit: 10 };
  const stats = requestsRes?.data?.stats || { totalActive: 0, totalPending: 0, totalRejected: 0, totalRevenue: 0 };

  // Listen for real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchRequests();
    socket.on('refresh_subscriptions', handleRefresh);
    socket.on('new_subscription', handleRefresh);
    socket.on('new_notification', handleRefresh);
    return () => {
      socket.off('refresh_subscriptions', handleRefresh);
      socket.off('new_subscription', handleRefresh);
      socket.off('new_notification', handleRefresh);
    };
  }, [socket, fetchRequests]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleAction = async (subscriptionId, addonId, action, extraBody = null) => {
    try {
      setActionLoading(`${subscriptionId}-${addonId}-${action}`);
      const res = await api.put(`/subscriptions/addons/${subscriptionId}/${addonId}/${action}`, extraBody || {});
      if (res.data?.success || res.data?.status === 'ok') {
        const actionLabels = {
          approve: 'approved',
          deactivate: 'placed on hold / deactivated',
          reactivate: 'reactivated',
          extend: 'limit extended',
          terminate: 'terminated',
          reject: 'rejected'
        };
        toast.success(`Add-on request ${actionLabels[action] || action} successfully`);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to perform ${action} on add-on`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendLimit = (subscriptionId, addonId, currentLimit = 0) => {
    const amountStr = window.prompt(`Enter additional usage limit to add (Current limit: ${currentLimit}):`, '50');
    if (!amountStr) return;
    const extraLimit = parseInt(amountStr, 10);
    if (isNaN(extraLimit) || extraLimit <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    handleAction(subscriptionId, addonId, 'extend', { extraLimit });
  };

  const handleDelete = async (subscriptionId, addonId) => {
    try {
      setActionLoading(`${subscriptionId}-${addonId}-delete`);
      const res = await api.delete(`/subscriptions/addons/${subscriptionId}/${addonId}`);
      if (res.data?.success || res.data?.status === 'ok') {
        toast.success(`Add-on record deleted successfully`);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to delete add-on`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add-on Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage tenant add-ons, lifecycle statuses, limits, and non-refundable revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 text-sm">Active</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalActive || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 text-sm">Pending</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalPending || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 text-sm">On Hold / Inactive</h3>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalInactive || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 text-sm">Terminated / Rejected</h3>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{(stats.totalTerminated || 0) + (stats.totalRejected || 0)}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-purple-50/50 to-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-700 text-sm">Collected Revenue</h3>
            <span className="w-5 h-5 text-[#5022C3] font-bold text-xl leading-none">৳</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#5022C3]">৳ {stats.totalRevenue?.toLocaleString() || '0'}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Non-refundable retained earnings</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 gap-4">
          <h3 className="font-bold text-slate-800 text-lg whitespace-nowrap">Store Add-ons List</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search store name or domain..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5022C3] transition-shadow"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5022C3]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">On Hold (Inactive)</option>
                <option value="terminated">Terminated</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <select 
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5022C3]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tenant / Store</th>
                <th className="px-6 py-4">Add-on Details</th>
                <th className="px-6 py-4">Usage & Limit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Requested</th>
                <th className="px-6 py-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#5022C3] rounded-full animate-spin mx-auto mb-3"></div>
                    Loading add-ons...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <PackagePlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p>No add-ons found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50 transition-colors ${req.status === 'pending' ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.tenant?.name || 'Unknown Store'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{req.tenant?.domain}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#5022C3]">
                        {req.addonDetails?.name || 'Unknown Add-on'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ৳ {req.addonDetails?.price || 0} / {req.addonDetails?.billingCycle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-700">
                        Used: <span className="font-bold text-slate-900">{req.used || 0}</span> / {req.limit || 0}
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${req.used >= req.limit && req.limit > 0 ? 'bg-red-500' : 'bg-[#5022C3]'}`}
                          style={{ width: `${Math.min(((req.used || 0) / (req.limit || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                        ${req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          req.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 
                          req.status === 'inactive' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                          req.status === 'terminated' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                        {req.status === 'active' && <Check className="w-3 h-3" />}
                        {req.status === 'inactive' && <Clock className="w-3 h-3" />}
                        {req.status === 'terminated' && <X className="w-3 h-3" />}
                        {req.status === 'rejected' && <X className="w-3 h-3" />}
                        {req.status === 'inactive' ? 'On Hold' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                      {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(req.subscriptionId, req.addonId, 'approve')}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-approve`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Approve Add-on Request"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleAction(req.subscriptionId, req.addonId, 'reject')}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-reject`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Reject Request"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}

                        {req.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleAction(req.subscriptionId, req.addonId, 'deactivate')}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-deactivate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Put on Hold / Deactivate (Money is preserved)"
                            >
                              Hold
                            </button>
                            <button
                              onClick={() => handleExtendLimit(req.subscriptionId, req.addonId, req.limit)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-extend`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Add Extra Usage Limit"
                            >
                              + Extend Limit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to terminate this add-on? Money collected will remain in your dashboard stats.')) {
                                  handleAction(req.subscriptionId, req.addonId, 'terminate');
                                }
                              }}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-terminate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Terminate Add-on"
                            >
                              Terminate
                            </button>
                          </>
                        )}

                        {req.status === 'inactive' && (
                          <>
                            <button
                              onClick={() => handleAction(req.subscriptionId, req.addonId, 'reactivate')}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-reactivate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Re-activate Add-on"
                            >
                              <Check className="w-3 h-3" /> Re-activate
                            </button>
                            <button
                              onClick={() => handleExtendLimit(req.subscriptionId, req.addonId, req.limit)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-extend`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Add Extra Usage Limit"
                            >
                              + Extend Limit
                            </button>
                            <button
                              onClick={() => handleAction(req.subscriptionId, req.addonId, 'terminate')}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-terminate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Terminate Add-on"
                            >
                              Terminate
                            </button>
                          </>
                        )}

                        {(req.status === 'terminated' || req.status === 'rejected') && (
                          <>
                            <button
                              onClick={() => handleAction(req.subscriptionId, req.addonId, 'approve')}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-approve`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Re-approve Add-on"
                            >
                              Re-approve
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this add-on record permanently?')) {
                                  handleDelete(req.subscriptionId, req.addonId);
                                }
                              }}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-delete`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 text-xs font-semibold"
                              title="Delete Record"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {meta.total > 0 && (
          <div className="px-6 py-4 bg-white/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-700">{(page - 1) * meta.limit + 1}</span> to <span className="font-medium text-slate-700">{Math.min(page * meta.limit, meta.total)}</span> of <span className="font-medium text-slate-700">{meta.total}</span> results
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {[...Array(meta.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-[#5022C3] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
