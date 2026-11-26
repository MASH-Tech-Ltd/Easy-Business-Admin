import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, RefreshCw, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function SmsNotificationPanel() {
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [logsData, setLogsData] = useState(null);
  const [tenants, setTenants] = useState([]);

  const [selectedTenantIds, setSelectedTenantIds] = useState([]);
  const [directPhone, setDirectPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await api.get('/notifications/sms/balance');
      setBalanceInfo(res.data?.data || null);
    } catch {
      setBalanceInfo(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/notifications/sms/logs', { params: { limit: 15 } });
      setLogsData(res.data?.data || null);
    } catch {
      /* ignore */
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants/get-all-tenants', { params: { limit: 200 } });
      const list = res.data?.data || [];
      setTenants(Array.isArray(list) ? list : []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchLogs();
    fetchTenants();
  }, []);

  const toggleTenant = (id) => {
    setSelectedTenantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter an SMS message');
      return;
    }
    if (selectedTenantIds.length === 0 && !directPhone.trim()) {
      toast.error('Select at least one merchant or enter a phone number');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/notifications/sms/send', {
        tenantIds: selectedTenantIds,
        phone: directPhone.trim() || undefined,
        message: message.trim(),
      });
      const result = res.data?.data;
      toast.success(
        `SMS processed: ${result?.sentCount || 0} sent, ${result?.failedCount || 0} failed`,
      );
      setMessage('');
      setDirectPhone('');
      setSelectedTenantIds([]);
      fetchLogs();
      fetchBalance();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const summary = logsData?.summary || {
    totalSent: 0,
    totalFailed: 0,
    orderOfflineSent: 0,
    adminManualSent: 0,
  };
  const merchantStats = logsData?.merchantStats || [];
  const recentLogs = logsData?.logs || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 mb-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              SMS Notifications (BulkSMSBD)
            </h2>
            <p className="text-xs text-slate-500">
              Offline merchant order alerts, manual admin SMS, credit balance &amp; delivery counts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>
              Credit Balance:{' '}
              {balanceInfo?.configured
                ? balanceInfo.balance !== null
                  ? `${balanceInfo.balance} BDT`
                  : balanceInfo.message || 'Unavailable'
                : 'API Key Not Set'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchBalance();
              fetchLogs();
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh SMS balance & counts"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-500">Total SMS Sent</p>
          <p className="text-xl font-black text-slate-900">{summary.totalSent}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-500">New Order (Offline)</p>
          <p className="text-xl font-black text-indigo-700">{summary.orderOfflineSent}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-500">Admin Manual SMS</p>
          <p className="text-xl font-black text-emerald-700">{summary.adminManualSent}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-500">Failed</p>
          <p className="text-xl font-black text-red-600">{summary.totalFailed}</p>
        </div>
      </div>

      {/* Send Manual SMS Form */}
      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
        <div className="lg:col-span-5 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Select Merchants ({selectedTenantIds.length} selected)
          </label>
          <div className="max-h-32 overflow-y-auto bg-white border border-slate-200 rounded-lg p-2 space-y-1">
            {tenants.length === 0 ? (
              <p className="text-xs text-slate-400">No merchants loaded</p>
            ) : (
              tenants.map((t) => (
                <label
                  key={t._id}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 px-1.5 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedTenantIds.includes(t._id)}
                    onChange={() => toggleTenant(t._id)}
                    className="rounded border-slate-300"
                  />
                  <span className="font-semibold truncate">{t.name}</span>
                  <span className="text-[11px] text-slate-400 ml-auto">
                    {t.contactPhone || 'No phone'}
                  </span>
                </label>
              ))
            )}
          </div>
          <input
            type="text"
            value={directPhone}
            onChange={(e) => setDirectPhone(e.target.value)}
            placeholder="Or direct phone (e.g. 017XXXXXXXX)"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              SMS Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write notification message for merchant(s)..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send SMS Notification'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Per-Merchant Notification Counts */}
      {merchantStats.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Merchant Notification Counts
          </h3>
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-bold">Store</th>
                  <th className="py-2 px-3 font-bold">Phone</th>
                  <th className="py-2 px-3 font-bold">Total Sent</th>
                  <th className="py-2 px-3 font-bold">Order (Offline)</th>
                  <th className="py-2 px-3 font-bold">Admin Manual</th>
                  <th className="py-2 pl-3 font-bold">Last Notified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchantStats.map((m) => (
                  <tr key={m.tenantId} className="hover:bg-slate-50/70">
                    <td className="py-2 pr-3 font-semibold text-slate-800">{m.storeName}</td>
                    <td className="py-2 px-3 text-slate-600">{m.contactPhone || '—'}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{m.totalSent}</td>
                    <td className="py-2 px-3 text-indigo-700 font-semibold">{m.orderOfflineSent}</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">{m.adminManualSent}</td>
                    <td className="py-2 pl-3 text-slate-500">
                      {m.lastNotifiedAt ? new Date(m.lastNotifiedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent SMS Logs */}
      {recentLogs.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Recent SMS Delivery Log
          </h3>
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-bold">Status</th>
                  <th className="py-2 px-3 font-bold">Type</th>
                  <th className="py-2 px-3 font-bold">Store / Phone</th>
                  <th className="py-2 px-3 font-bold">Message</th>
                  <th className="py-2 pl-3 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="py-2 pr-3">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {log.triggerType === 'new_order_offline' ? 'Order (Offline)' : 'Admin Manual'}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <div className="font-semibold">{log.tenantId?.name || 'Direct'}</div>
                      <div className="text-[11px] text-slate-400">{log.phone}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{log.message}</td>
                    <td className="py-2 pl-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
