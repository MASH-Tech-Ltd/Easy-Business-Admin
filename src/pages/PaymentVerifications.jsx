import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Copy,
  Check,
  Building2,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Sparkles,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useGetAllPaymentSubmissionsQuery } from '../store/apiSlice';
import { MFSLogo } from '../components/MFSLogo';

export default function PaymentVerifications() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State for Verification / Rejection
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    payment: null,
    action: 'approved', // 'approved' | 'rejected'
    adminFeedback: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const { data: paymentsRes, isLoading: loading, refetch: fetchPayments } = useGetAllPaymentSubmissionsQuery();
  const payments = paymentsRes?.data || [];

  const { socket } = useSocket();

  // Listen to socket notifications
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchPayments();
    socket.on('refresh_subscriptions', handleRefresh);
    socket.on('new_notification', handleRefresh);
    return () => {
      socket.off('refresh_subscriptions', handleRefresh);
      socket.off('new_notification', handleRefresh);
    };
  }, [socket, fetchPayments]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Transaction ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openActionModal = (payment, action) => {
    setActionModal({
      isOpen: true,
      payment,
      action,
      adminFeedback: payment.adminFeedback || '',
    });
  };

  const closeActionModal = () => {
    setActionModal({ isOpen: false, payment: null, action: 'approved', adminFeedback: '' });
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const { payment, action, adminFeedback } = actionModal;
    if (!payment) return;

    try {
      setActionLoading(true);
      const res = await api.put(`/billing/verify-payment/${payment._id}`, {
        status: action,
        adminFeedback: adminFeedback.trim() || undefined,
      });

      if (res.data?.success || res.data?.status === 'ok') {
        toast.success(`Payment submission successfully marked as ${action.toUpperCase()}!`);
        closeActionModal();
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update payment status`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Payments Calculation
  const filteredPayments = payments.filter((p) => {
    const storeName = p.tenantId?.name || p.tenantId?.domain || '';
    const matchesSearch =
      storeName.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      p.senderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.purposeTitle?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesProvider = filterProvider === 'all' || p.provider?.toLowerCase() === filterProvider.toLowerCase();

    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Summary Stats
  const totalCount = payments.length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const approvedRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8 w-full pb-10">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Payment Proof Verifications (TrxID)
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Verify merchant transaction IDs, sender numbers, and approve add-on & subscription activations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Total Submissions</h3>
            <CreditCard className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">{totalCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex justify-between mb-2 relative z-10">
            <h3 className="font-semibold text-slate-600">Pending Review</h3>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-2"></div>
          </div>
          <p className="text-4xl font-bold text-slate-800 relative z-10">{pendingCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Approved Proofs</h3>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">{approvedCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Revenue (Total)</h3>
            <span className="text-xl font-bold text-green-500">৳</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">৳{approvedRevenue.toLocaleString()}</p>
          <div className="text-[11px] font-medium text-slate-500 mt-2 flex justify-between items-center">
            <p>Verified Payment Proofs</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 gap-4">
          <h3 className="font-bold text-slate-800 text-lg whitespace-nowrap">
            Merchant Payment Proofs (TrxID)
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search store name, domain, or TrxID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Providers</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Upay">Upay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Store & Tenant</th>
                <th className="px-6 py-4">Product / Purpose</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Sender & TrxID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading payment verifications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No payment submissions match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{p.tenantId?.name || 'Unknown Store'}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.tenantId?.domain || 'N/A'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{p.purposeTitle || p.purpose}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.purpose}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <MFSLogo provider={p.provider} className="h-5 w-auto object-contain" />
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-700">Sender: {p.senderNumber}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.transactionId}
                        </span>
                        <button
                          onClick={() => handleCopy(p.transactionId, p._id)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Copy TrxID"
                        >
                          {copiedId === p._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-extrabold text-slate-900 text-base">
                      ৳ {p.amount?.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {p.status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
                        {p.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {p.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {p.status.toUpperCase()}
                      </span>
                      {p.adminFeedback && (
                        <div className="text-[11px] text-slate-400 mt-1 italic max-w-xs truncate" title={p.adminFeedback}>
                          {p.adminFeedback}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => openActionModal(p, 'approved')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => openActionModal(p, 'rejected')}
                              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openActionModal(p, p.status === 'approved' ? 'rejected' : 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-all"
                          >
                            Change Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Verification Modal */}
      {actionModal.isOpen && actionModal.payment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {actionModal.action === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                {actionModal.action === 'approved' ? 'Approve Payment Verification' : 'Reject Payment Verification'}
              </h3>
              <button onClick={closeActionModal} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Store Name:</span>
                <span className="font-bold text-slate-900">{actionModal.payment.tenantId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Product / Purpose:</span>
                <span className="font-bold text-slate-900">{actionModal.payment.purposeTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-bold text-blue-600">{actionModal.payment.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sender Number:</span>
                <span className="font-mono font-bold text-slate-800">{actionModal.payment.senderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Transaction ID:</span>
                <span className="font-mono font-extrabold text-slate-900">{actionModal.payment.transactionId}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="text-slate-500 font-bold">Amount:</span>
                <span className="font-extrabold text-emerald-700">৳ {actionModal.payment.amount}</span>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Feedback / Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionModal.action === 'approved'
                      ? 'e.g. Verified with bank statement.'
                      : 'e.g. Invalid Transaction ID. Please check and submit again.'
                  }
                  value={actionModal.adminFeedback}
                  onChange={(e) => setActionModal({ ...actionModal, adminFeedback: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 ${
                    actionModal.action === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  {actionModal.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
