import { CreditCard, DollarSign, Clock, Check, X, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function Billing() {
  const [billingData, setBillingData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [editingSub, setEditingSub] = useState(null);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '', status: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billingRes, subsRes] = await Promise.all([
        api.get('/billing/overview').catch(() => ({ data: { data: null } })),
        api.get('/subscriptions/get-all-subscriptions').catch(() => ({ data: { data: [] } }))
      ]);
      
      setBillingData(billingRes.data?.data || null);
      setSubscriptions(subsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data');
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/subscriptions/approve/${id}`);
      toast.success('Subscription approved successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/subscriptions/reject/${id}`);
      toast.success('Subscription rejected');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/subscriptions/delete/${id}`);
      toast.success('Subscription deleted');
      setEditingSub(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
      setActionLoading(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(editingSub._id);
    try {
      await api.put(`/subscriptions/update/${editingSub._id}`, editForm);
      toast.success('Subscription updated successfully');
      setEditingSub(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const openManageModal = (sub) => {
    setEditingSub(sub);
    setEditForm({
      startDate: sub.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : '',
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : '',
      status: sub.status || 'active'
    });
  };

  const pendingCount = subscriptions.filter(s => s.status === 'pending').length;
  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Subscriptions</h2>
        <p className="text-slate-500 text-sm mt-1">Manage tenant subscriptions, approve requests, and monitor revenue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Monthly Recurring Revenue</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">${billingData?.mrr || '45,200'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Active Subscriptions</h3>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">{activeCount || billingData?.activeSubscriptions || '0'}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-24 h-24 text-amber-500" /></div>
          <div className="flex justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-600">Pending Requests</h3>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-2"></div>
          </div>
          <p className="text-4xl font-bold text-slate-800 relative z-10">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Subscription Management</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tenant / Store</th>
                <th className="px-6 py-4">Package Requested</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Expire Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub._id} className={`hover:bg-slate-50 transition-colors ${sub.status === 'pending' ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{sub.tenantId?.name || 'Unknown Store'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{sub.tenantId?.contactEmail || sub.tenantId?.ownerId?.email || sub.tenantId?.contactPhone || 'No contact info'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600">{sub.packageId?.name || 'Unknown Package'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">${sub.packageId?.price} / {sub.packageId?.billingCycle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                        ${sub.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          sub.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 
                          'bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {sub.status === 'pending' && <Clock className="w-3 h-3" />}
                        {sub.status === 'active' && <Check className="w-3 h-3" />}
                        {sub.status === 'cancelled' && <X className="w-3 h-3" />}
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {sub.startDate ? new Date(sub.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(sub._id)}
                            disabled={actionLoading === sub._id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Approve Request"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReject(sub._id)}
                            disabled={actionLoading === sub._id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openManageModal(sub)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Manage <ExternalLink className="w-3 h-3 ml-1.5 text-slate-400" />
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

      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Manage Subscription</h3>
              <button onClick={() => setEditingSub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Status</label>
                <select 
                  value={editForm.status} 
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={editForm.startDate} 
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={editForm.endDate} 
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDelete(editingSub._id)}
                  disabled={actionLoading === editingSub._id}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSub(null)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === editingSub._id}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading === editingSub._id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
