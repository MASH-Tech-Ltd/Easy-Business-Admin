import { useState, useEffect } from 'react';
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
  ChevronRight,
  Zap,
  AlertTriangle,
  Trash2,
  PauseCircle,
  PlusCircle,
  TrendingUp,
  ShieldAlert
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

  // Custom Modal States
  const [extendModal, setExtendModal] = useState({
    isOpen: false,
    subscriptionId: '',
    addonId: '',
    storeName: '',
    addonName: '',
    currentLimit: 0,
    extraLimit: 50
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: '', // 'terminate' | 'delete' | 'deactivate'
    subscriptionId: '',
    addonId: '',
    storeName: '',
    addonName: '',
    title: '',
    description: '',
    confirmText: 'Confirm',
    theme: 'purple' // 'red' | 'orange' | 'purple'
  });

  const { data: requestsRes, isLoading: loading, refetch: fetchRequests } = useGetAddonRequestsQuery({
    search: debouncedSearch,
    status: filterStatus,
    sortBy: sortOrder,
    page,
    limit: 10
  });

  const requests = requestsRes?.data?.data || requestsRes?.data || [];
  const meta = requestsRes?.data?.meta || { total: 0, totalPages: 1, limit: 10 };
  const stats = requestsRes?.data?.stats || { totalActive: 0, totalPending: 0, totalInactive: 0, totalTerminated: 0, totalRejected: 0, totalRevenue: 0 };

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
      setPage(1);
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
        toast.success(`Add-on ${actionLabels[action] || action} successfully`);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to perform ${action} on add-on`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (subscriptionId, addonId) => {
    try {
      setActionLoading(`${subscriptionId}-${addonId}-delete`);
      const res = await api.delete(`/subscriptions/addons/${subscriptionId}/${addonId}`);
      if (res.data?.success || res.data?.status === 'ok') {
        toast.success(`Add-on record deleted permanently`);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to delete add-on`);
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger Extend Limit Modal
  const openExtendModal = (req) => {
    setExtendModal({
      isOpen: true,
      subscriptionId: req.subscriptionId,
      addonId: req.addonId,
      storeName: req.tenant?.name || 'Store',
      addonName: req.addonDetails?.name || 'Add-on',
      currentLimit: req.limit || 0,
      extraLimit: 50
    });
  };

  const submitExtendModal = () => {
    const amount = Number(extendModal.extraLimit);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    handleAction(extendModal.subscriptionId, extendModal.addonId, 'extend', { extraLimit: amount });
    setExtendModal(prev => ({ ...prev, isOpen: false }));
  };

  // Trigger Confirmation Modal
  const openConfirmModal = (actionType, req) => {
    const storeName = req.tenant?.name || 'Store';
    const addonName = req.addonDetails?.name || 'Add-on';

    if (actionType === 'terminate') {
      setConfirmModal({
        isOpen: true,
        actionType: 'terminate',
        subscriptionId: req.subscriptionId,
        addonId: req.addonId,
        storeName,
        addonName,
        title: 'Terminate Add-on Subscription',
        description: `Are you sure you want to terminate "${addonName}" for ${storeName}? The feature will be disabled for the merchant. All previously collected money remains in your dashboard revenue statistics.`,
        confirmText: 'Yes, Terminate Add-on',
        theme: 'red'
      });
    } else if (actionType === 'deactivate') {
      setConfirmModal({
        isOpen: true,
        actionType: 'deactivate',
        subscriptionId: req.subscriptionId,
        addonId: req.addonId,
        storeName,
        addonName,
        title: 'Place Add-on on Hold',
        description: `Are you sure you want to place "${addonName}" on hold for ${storeName}? Service will be temporarily paused until reactivated.`,
        confirmText: 'Yes, Put on Hold',
        theme: 'orange'
      });
    } else if (actionType === 'delete') {
      setConfirmModal({
        isOpen: true,
        actionType: 'delete',
        subscriptionId: req.subscriptionId,
        addonId: req.addonId,
        storeName,
        addonName,
        title: 'Delete Add-on Record',
        description: `Are you sure you want to permanently delete this add-on record for ${storeName}? This action cannot be undone.`,
        confirmText: 'Permanently Delete',
        theme: 'dark-red'
      });
    }
  };

  const submitConfirmModal = () => {
    const { actionType, subscriptionId, addonId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (actionType === 'delete') {
      handleDelete(subscriptionId, addonId);
    } else {
      handleAction(subscriptionId, addonId, actionType);
    }
  };

  return (
    <div className="space-y-8 w-full pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add-on Management</h2>
        <p className="text-slate-500 text-sm mt-1">Manage tenant add-ons, lifecycle statuses, limits, and non-refundable revenue.</p>
      </div>

      {/* Stats Cards - exact ratio matching Billing.jsx */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Active Add-ons</h3>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.totalActive || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex justify-between mb-2 relative z-10">
            <h3 className="font-semibold text-slate-600">Pending Requests</h3>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-2"></div>
          </div>
          <p className="text-4xl font-bold text-slate-800 relative z-10">{stats.totalPending || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">On Hold / Inactive</h3>
            <PauseCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.totalInactive || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Revenue (Total)</h3>
            <span className="text-xl font-bold text-green-500">৳</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            ৳{stats.totalRevenue?.toLocaleString() || '0'}
          </p>
          <div className="text-[11px] font-medium text-slate-500 mt-2 flex justify-between items-center">
            <p>Retained earnings</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
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
                        {req.status === 'inactive' && <PauseCircle className="w-3 h-3" />}
                        {req.status === 'terminated' && <X className="w-3 h-3" />}
                        {req.status === 'rejected' && <X className="w-3 h-3" />}
                        {req.status === 'inactive' ? 'On Hold' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                      {(() => {
                        const rawDate = req.requestedAt || req.createdAt || req.updatedAt;
                        if (!rawDate) return '-';
                        const d = new Date(rawDate);
                        if (isNaN(d.getTime())) return '-';
                        return (
                          <div>
                            <div className="font-semibold text-slate-700">
                              {d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        );
                      })()}
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
                              onClick={() => openConfirmModal('deactivate', req)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-deactivate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Put on Hold / Deactivate (Money is preserved)"
                            >
                              <PauseCircle className="w-3 h-3" /> Hold
                            </button>
                            <button
                              onClick={() => openExtendModal(req)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-extend`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Add Extra Usage Limit"
                            >
                              <PlusCircle className="w-3 h-3" /> Extend Limit
                            </button>
                            <button
                              onClick={() => openConfirmModal('terminate', req)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-terminate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Terminate Add-on"
                            >
                              <XCircle className="w-3 h-3" /> Terminate
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
                              onClick={() => openExtendModal(req)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-extend`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Add Extra Usage Limit"
                            >
                              <PlusCircle className="w-3 h-3" /> Extend Limit
                            </button>
                            <button
                              onClick={() => openConfirmModal('terminate', req)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-terminate`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Terminate Add-on"
                            >
                              <XCircle className="w-3 h-3" /> Terminate
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
                              <Check className="w-3 h-3" /> Re-approve
                            </button>
                            <button
                              onClick={() => openConfirmModal('delete', req)}
                              disabled={actionLoading === `${req.subscriptionId}-${req.addonId}-delete`}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 text-xs font-semibold gap-1"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
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

      {/* Modern Extend Limit Modal */}
      {extendModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-5 transform transition-all scale-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#5022C3]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Extend Add-on Limit</h3>
                  <p className="text-xs text-slate-500">{extendModal.storeName} — {extendModal.addonName}</p>
                </div>
              </div>
              <button 
                onClick={() => setExtendModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Additional Usage Limit
                </label>
                <input 
                  type="number"
                  min="1"
                  value={extendModal.extraLimit}
                  onChange={(e) => setExtendModal(prev => ({ ...prev, extraLimit: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-[#5022C3] focus:bg-white transition-all"
                  placeholder="Enter extra limit..."
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-xs text-slate-500 font-medium mb-1.5 block">Quick Increments:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setExtendModal(prev => ({ ...prev, extraLimit: val }))}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${Number(extendModal.extraLimit) === val ? 'bg-[#5022C3] text-white border-[#5022C3]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-100 text-xs text-purple-900 flex justify-between items-center">
                <span>New Total Limit:</span>
                <span className="font-bold text-sm text-[#5022C3]">
                  {extendModal.currentLimit} + {Number(extendModal.extraLimit) || 0} = {extendModal.currentLimit + (Number(extendModal.extraLimit) || 0)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExtendModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitExtendModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#5022C3] hover:bg-[#401a9b] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirmation Dialog Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-5 transform transition-all scale-100">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                confirmModal.theme === 'red' ? 'bg-red-100 text-red-600' :
                confirmModal.theme === 'dark-red' ? 'bg-rose-100 text-rose-700' :
                'bg-orange-100 text-orange-600'
              }`}>
                {confirmModal.theme === 'red' ? <ShieldAlert className="w-6 h-6" /> :
                 confirmModal.theme === 'dark-red' ? <Trash2 className="w-6 h-6" /> :
                 <PauseCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-lg leading-snug">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{confirmModal.storeName} — {confirmModal.addonName}</p>
              </div>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 leading-relaxed">
              {confirmModal.description}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitConfirmModal}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ${
                  confirmModal.theme === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  confirmModal.theme === 'dark-red' ? 'bg-rose-700 hover:bg-rose-800' :
                  'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
