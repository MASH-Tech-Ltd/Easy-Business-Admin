import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Wallet,
  CheckCircle2,
  XCircle,
  Search,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  Phone,
  Users,
  RotateCcw,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const QUICK_TEMPLATES = [
  {
    label: 'Subscription Reminder',
    text: 'Dear Merchant, your MASH ECO subscription is expiring soon. Please renew to keep your store live.',
  },
  {
    label: 'Pending Orders',
    text: 'Dear Merchant, you have pending customer orders waiting in your MASH ECO dashboard. Please process them.',
  },
  {
    label: 'System Notice',
    text: 'MASH ECO Notice: New features and performance updates are now live in your merchant dashboard.',
  },
];

export default function SmsNotificationPanel() {
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [logsData, setLogsData] = useState(null);
  const [tenants, setTenants] = useState([]);

  const [merchantSearch, setMerchantSearch] = useState('');
  const [selectedTenantIds, setSelectedTenantIds] = useState([]);
  const [directPhone, setDirectPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [activeTab, setActiveTab] = useState('logs');

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
      const res = await api.get('/notifications/sms/logs', { params: { limit: 20 } });
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

  const filteredTenants = useMemo(() => {
    if (!merchantSearch.trim()) return tenants;
    const q = merchantSearch.toLowerCase();
    return tenants.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.contactPhone || '').toLowerCase().includes(q),
    );
  }, [tenants, merchantSearch]);

  const toggleTenant = (id) => {
    setSelectedTenantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllWithPhone = () => {
    const ids = filteredTenants.filter((t) => Boolean(t.contactPhone)).map((t) => t._id);
    setSelectedTenantIds(ids);
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

  const handleResend = async (logId) => {
    setResendingId(logId);
    try {
      const res = await api.post(`/notifications/sms/resend/${logId}`);
      const updated = res.data?.data;
      if (updated?.status === 'sent') {
        toast.success('SMS resent successfully!');
      } else {
        toast.error(updated?.providerMessage || 'SMS resend failed');
      }
      fetchLogs();
      fetchBalance();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend SMS');
    } finally {
      setResendingId(null);
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

  const charCount = message.length;
  const smsParts = charCount === 0 ? 0 : Math.ceil(charCount / 160);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-6 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                SMS Gateway &amp; Alerts
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                BulkSMSBD
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automatic offline order alerts (add-on) &amp; instant manual merchant broadcasts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-xs font-bold text-emerald-800 shadow-xs">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Balance:</span>
            <span className="text-emerald-950 font-black">
              {balanceInfo?.configured
                ? balanceInfo.balance !== null
                  ? `${balanceInfo.balance} BDT`
                  : balanceInfo.message || 'Unavailable'
                : 'Not Set'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchBalance();
              fetchLogs();
            }}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs transition-colors"
            title="Refresh SMS balance & counts"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total SMS Sent</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalSent}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 flex items-center justify-between hover:border-indigo-200 transition-colors">
            <div>
              <p className="text-xs font-semibold text-indigo-700">New Order (Offline)</p>
              <p className="text-2xl font-black text-indigo-900 mt-1">{summary.orderOfflineSent}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 flex items-center justify-between hover:border-emerald-200 transition-colors">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Admin Manual SMS</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{summary.adminManualSent}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4 flex items-center justify-between hover:border-rose-200 transition-colors">
            <div>
              <p className="text-xs font-semibold text-rose-700">Failed</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{summary.totalFailed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Manual SMS Composer */}
        <form
          onSubmit={handleSend}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80"
        >
          {/* Left: Recipients */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recipients</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {selectedTenantIds.length} selected
                </span>
              </label>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={selectAllWithPhone}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedTenantIds([])}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                placeholder="Search merchant or phone..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>

            <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-xl p-1.5 space-y-0.5">
              {filteredTenants.length === 0 ? (
                <p className="text-xs text-slate-400 p-2 text-center">No matching merchants</p>
              ) : (
                filteredTenants.map((t) => {
                  const hasPhone = Boolean(t.contactPhone);
                  const checked = selectedTenantIds.includes(t._id);
                  return (
                    <label
                      key={t._id}
                      className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        hasPhone
                          ? checked
                            ? 'bg-indigo-50/80 text-indigo-950 cursor-pointer'
                            : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                          : 'text-slate-400 bg-slate-50/40 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!hasPhone}
                        checked={checked}
                        onChange={() => toggleTenant(t._id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold truncate">{t.name}</span>
                      <span
                        className={`text-[11px] ml-auto font-mono ${
                          hasPhone ? 'text-slate-500' : 'text-slate-300 italic'
                        }`}
                      >
                        {t.contactPhone || 'No phone'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="Or direct BD number (e.g. 017XXXXXXXX)"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Right: Message Composer */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800">SMS Message</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setMessage(tpl.text)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a clear notification message for the selected merchant(s) or direct number..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">
                {charCount} characters &bull; {smsParts} SMS {smsParts === 1 ? 'part' : 'parts'}
              </span>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending SMS...' : 'Send SMS Notification'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Tabbed Merchant Counts & Delivery Logs */}
        {(merchantStats.length > 0 || recentLogs.length > 0) && (
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-1 px-4 pt-3 bg-slate-50/70 border-b border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === 'logs'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Delivery Log ({recentLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('merchants')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === 'merchants'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Merchant Counts ({merchantStats.length})
              </button>
            </div>

            {activeTab === 'merchants' && (
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Store</th>
                      <th className="py-2.5 px-3 font-bold">Phone</th>
                      <th className="py-2.5 px-3 font-bold">Total Sent</th>
                      <th className="py-2.5 px-3 font-bold">Order (Offline)</th>
                      <th className="py-2.5 px-3 font-bold">Admin Manual</th>
                      <th className="py-2.5 px-4 font-bold">Last Notified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {merchantStats.map((m) => (
                      <tr key={m.tenantId} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{m.storeName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{m.contactPhone || '—'}</td>
                        <td className="py-2.5 px-3 font-black text-slate-900">{m.totalSent}</td>
                        <td className="py-2.5 px-3 text-indigo-700 font-semibold">{m.orderOfflineSent}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">{m.adminManualSent}</td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {m.lastNotifiedAt ? new Date(m.lastNotifiedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Status</th>
                      <th className="py-2.5 px-3 font-bold">Type</th>
                      <th className="py-2.5 px-3 font-bold">Recipient</th>
                      <th className="py-2.5 px-3 font-bold">Message</th>
                      <th className="py-2.5 px-3 font-bold">Time</th>
                      <th className="py-2.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          {log.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/70">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <div>
                              <span
                                title={log.providerMessage || 'Failed'}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200/70"
                              >
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                              {log.providerMessage && (
                                <p className="text-[10px] text-rose-500 mt-0.5 max-w-[160px] truncate" title={log.providerMessage}>
                                  {log.providerMessage}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${
                              log.triggerType === 'new_order_offline'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.triggerType === 'new_order_offline' ? 'Order (Offline)' : 'Admin Manual'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div className="font-semibold">{log.tenantId?.name || 'Direct Number'}</div>
                          <div className="text-[11px] font-mono text-slate-400">{log.phone}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{log.message}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {log.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => handleResend(log._id)}
                              disabled={resendingId === log._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                            >
                              <RotateCcw className={`w-3 h-3 ${resendingId === log._id ? 'animate-spin' : ''}`} />
                              <span>{resendingId === log._id ? 'Sending...' : 'Resend'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
