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
  Radio,
  Smartphone,
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
  const [logFilter, setLogFilter] = useState('all');

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
      const res = await api.get('/notifications/sms/logs', { params: { limit: 30 } });
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

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return recentLogs;
    return recentLogs.filter((l) => l.status === logFilter);
  }, [recentLogs, logFilter]);

  const charCount = message.length;
  const smsParts = charCount === 0 ? 0 : Math.ceil(charCount / 160);
  const totalRecipients = selectedTenantIds.length + (directPhone.trim() ? 1 : 0);

  return (
    <div className="space-y-5 mb-6">
      {/* Gateway Status & Balance Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">SMS Gateway &amp; Alerts</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                {balanceInfo?.enabled ? 'Auto-Alert Active' : 'BulkSMSBD'}
              </span>
              {balanceInfo?.senderId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  ID: {balanceInfo.senderId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Offline merchant new-order alerts (add-on) &amp; instant manual broadcasts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
            <Wallet className="w-4 h-4 text-emerald-300" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold leading-none">
                Credit Balance
              </p>
              <p className="text-sm font-black text-white mt-0.5 leading-none">
                {balanceInfo?.configured
                  ? balanceInfo.balance !== null
                    ? `${balanceInfo.balance} BDT`
                    : balanceInfo.message || 'Unavailable'
                  : 'Not Set'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchBalance();
              fetchLogs();
            }}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer"
            title="Refresh SMS balance & counts"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total SMS Sent</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalSent}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All successful deliveries</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600">New Order (Offline)</p>
            <p className="text-2xl font-black text-indigo-950 mt-1">{summary.orderOfflineSent}</p>
            <p className="text-[11px] text-indigo-400 mt-0.5">Add-on order alerts</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600">Admin Manual SMS</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{summary.adminManualSent}</p>
            <p className="text-[11px] text-emerald-500 mt-0.5">Direct broadcasts</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600">Failed</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{summary.totalFailed}</p>
            <p className="text-[11px] text-rose-400 mt-0.5">Retryable from log</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two-Column Composer Workspace */}
      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Recipients */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">Select Recipients</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {totalRecipients}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={selectAllWithPhone}
                  className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedTenantIds([])}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
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
                placeholder="Search store name or phone..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-1 space-y-1 bg-slate-50/40">
              {filteredTenants.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No matching merchants</p>
              ) : (
                filteredTenants.map((t) => {
                  const hasPhone = Boolean(t.contactPhone);
                  const checked = selectedTenantIds.includes(t._id);
                  const initial = (t.name || 'S').charAt(0).toUpperCase();
                  return (
                    <label
                      key={t._id}
                      className={`flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-xl border transition-all ${
                        hasPhone
                          ? checked
                            ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 cursor-pointer shadow-2xs'
                            : 'bg-white border-transparent hover:border-slate-200 text-slate-700 cursor-pointer'
                          : 'bg-transparent border-transparent text-slate-400 cursor-not-allowed opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!hasPhone}
                        checked={checked}
                        onChange={() => toggleTenant(t._id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span
                        className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {initial}
                      </span>
                      <span className="font-semibold truncate">{t.name}</span>
                      <span
                        className={`text-[10px] ml-auto font-mono px-2 py-0.5 rounded-full ${
                          hasPhone
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-100/60 text-slate-400 italic'
                        }`}
                      >
                        {t.contactPhone || 'No phone'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Direct Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="e.g. 017XXXXXXXX or 88017XXXXXXXX"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Composer & Live Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">Compose SMS</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setMessage(tpl.text)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a clear notification message for the selected merchant(s) or direct number..."
              className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none leading-relaxed"
            />

            {/* Live SMS Bubble Preview */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Live SMS Preview
              </p>
              <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-indigo-600 text-white text-xs px-3.5 py-2 shadow-xs">
                {message.trim() || 'Your SMS message preview will appear here...'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">{charCount} chars</span>
              <span className="text-slate-300">&bull;</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                {smsParts} SMS {smsParts === 1 ? 'part' : 'parts'}
              </span>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {sending
                  ? 'Sending SMS...'
                  : totalRecipients > 0
                    ? `Send to ${totalRecipients} Recipient${totalRecipients > 1 ? 's' : ''}`
                    : 'Send SMS Notification'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Tabbed Delivery History & Merchant Counts */}
      {(merchantStats.length > 0 || recentLogs.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3.5 pb-2 bg-slate-50/70 border-b border-slate-200/80">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Delivery Log ({recentLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('merchants')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'merchants'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Merchant Counts ({merchantStats.length})
              </button>
            </div>

            {activeTab === 'logs' && (
              <div className="flex items-center gap-1 text-[11px] font-semibold">
                {['all', 'sent', 'failed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLogFilter(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-colors ${
                      logFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:bg-slate-200/60'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'merchants' && (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-5 font-bold">Store</th>
                    <th className="py-2.5 px-3 font-bold">Phone</th>
                    <th className="py-2.5 px-3 font-bold">Total Sent</th>
                    <th className="py-2.5 px-3 font-bold">Order (Offline)</th>
                    <th className="py-2.5 px-3 font-bold">Admin Manual</th>
                    <th className="py-2.5 px-5 font-bold">Last Notified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {merchantStats.map((m) => (
                    <tr key={m.tenantId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-5 font-semibold text-slate-800">{m.storeName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{m.contactPhone || '—'}</td>
                      <td className="py-2.5 px-3 font-black text-slate-900">{m.totalSent}</td>
                      <td className="py-2.5 px-3 text-indigo-700 font-semibold">{m.orderOfflineSent}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">{m.adminManualSent}</td>
                      <td className="py-2.5 px-5 text-slate-500">
                        {m.lastNotifiedAt ? new Date(m.lastNotifiedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-5 font-bold">Status</th>
                    <th className="py-2.5 px-3 font-bold">Type</th>
                    <th className="py-2.5 px-3 font-bold">Recipient</th>
                    <th className="py-2.5 px-3 font-bold">Message</th>
                    <th className="py-2.5 px-3 font-bold">Time</th>
                    <th className="py-2.5 px-5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No SMS logs for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-5">
                          {log.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/70">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <div>
                              <span
                                title={log.providerMessage || 'Failed'}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200/70"
                              >
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                              {log.providerMessage && (
                                <p
                                  className="text-[10px] text-rose-500 mt-0.5 max-w-[180px] truncate"
                                  title={log.providerMessage}
                                >
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
                        <td className="py-2.5 px-5 text-right">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
