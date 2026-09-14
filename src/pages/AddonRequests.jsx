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

export default function AddonRequests() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleAction = async (subscriptionId, addonId, action) => {
    try {
      setActionLoading(`${subscriptionId}-${addonId}`);
      const res = await api.put(`/subscriptions/addons/${subscriptionId}/${addonId}/${action}`);
      if (res.data?.success || res.data?.status === 'ok') {
        toast.success(`Add-on request ${action}d successfully`);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (subscriptionId, addonId) => {
    try {
      setActionLoading(`${subscriptionId}-${addonId}`);
      const res = await api.delete(`/subscriptions/addons/${subscriptionId}/${addonId}`);
      if (res.data?.success || res.data?.status === 'ok') {
        toast.success(`Add-on deleted successfully`);
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
          <p className="text-sm text-slate-500 mt-1">Manage tenant add-ons, approve requests, and monitor premium features.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Active Add-ons</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalActive}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Pending Requests</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalPending}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Rejected</h3>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalRejected}</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Add-on Revenue</h3>
            <span className="w-5 h-5 text-[#5022C3] font-bold text-xl leading-none">৳</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">৳ {stats.totalRevenue?.toLocaleString() || '0'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 gap-4">
          <h3 className="font-bold text-slate-800 text-lg whitespace-nowrap">Store Add-ons</h3>
          
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Requested</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#5022C3] rounded-full animate-spin mx-auto mb-3"></div>
                    Loading add-ons...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
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
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center gap-1.5 w-24 py-1 rounded-full text-xs font-bold border
                        ${req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          req.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 
                          'bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                        {req.status === 'active' && <Check className="w-3 h-3" />}
                        {req.status === 'rejected' && <X className="w-3 h-3" />}
                        {req.status === 'rejected' ? 'Inactive' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(req.status === 'pending' || req.status === 'rejected') && (
                          <button
                            onClick={() => handleAction(req.subscriptionId, req.addonId, 'approve')}
                            disabled={actionLoading === `${req.subscriptionId}-${req.addonId}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1.5"
                            title="Approve Request"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {(req.status === 'pending' || req.status === 'active') && (
                          <button
                            onClick={() => handleAction(req.subscriptionId, req.addonId, 'reject')}
                            disabled={actionLoading === `${req.subscriptionId}-${req.addonId}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1.5"
                            title={req.status === 'active' ? 'Deactivate Add-on' : 'Reject Request'}
                          >
                            <X className="w-3.5 h-3.5" /> {req.status === 'active' ? 'Deactivate' : 'Reject'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to permanently delete this add-on from the merchant? They will lose all remaining limit.')) {
                              handleDelete(req.subscriptionId, req.addonId);
                            }
                          }}
                          disabled={actionLoading === `${req.subscriptionId}-${req.addonId}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 text-xs font-semibold"
                          title="Delete Add-on"
                        >
                          Delete
                        </button>
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
