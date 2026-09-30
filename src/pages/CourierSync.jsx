import { useState, useEffect, useCallback } from 'react';
import {
  Truck, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  SkipForward, Clock, Store, ShieldAlert, Zap,
  ChevronDown, ChevronUp, Info, Activity, Package,
  TrendingUp, Download, Eye, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    delivered:  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    shipped:    { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
    confirmed:  { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
    cancelled:  { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
    pending:    { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  };
  const c = map[status?.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
};

// ─── Error Type Badge ────────────────────────────────────────────────────────
const ErrorTypeBadge = ({ type }) => {
  const map = {
    AUTH_ERROR:       { bg: 'bg-red-100',    text: 'text-red-700',    Icon: ShieldAlert,   label: 'Auth Error' },
    NO_CONFIG:        { bg: 'bg-orange-100', text: 'text-orange-700', Icon: AlertTriangle,  label: 'No Config' },
    NO_PROVIDER:      { bg: 'bg-amber-100',  text: 'text-amber-700',  Icon: AlertTriangle,  label: 'No Provider' },
    UNKNOWN_PROVIDER: { bg: 'bg-purple-100', text: 'text-purple-700', Icon: Info,           label: 'Unknown Provider' },
    TRACKING_ERROR:   { bg: 'bg-rose-100',   text: 'text-rose-700',   Icon: XCircle,        label: 'Track Error' },
    NO_STATUS_CHANGE: { bg: 'bg-slate-100',  text: 'text-slate-600',  Icon: SkipForward,    label: 'No Change' },
  };
  const c = map[type] || { bg: 'bg-slate-100', text: 'text-slate-500', Icon: Info, label: type };
  const IconComp = c.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      <IconComp className="w-3 h-3" />{c.label}
    </span>
  );
};

// ─── Provider Badge ──────────────────────────────────────────────────────────
const ProviderBadge = ({ provider }) => {
  const map = {
    steadfast: { bg: 'bg-green-100',  text: 'text-green-800'  },
    pathao:    { bg: 'bg-violet-100', text: 'text-violet-800' },
    redx:      { bg: 'bg-red-100',    text: 'text-red-800'    },
  };
  const c = map[provider?.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${c.bg} ${c.text}`}>
      <Truck className="w-3 h-3" /> {provider || '—'}
    </span>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => {
  const colors = {
    blue:    { card: 'border-blue-200 bg-blue-50',       icon: 'bg-blue-600',    val: 'text-blue-700'    },
    green:   { card: 'border-emerald-200 bg-emerald-50', icon: 'bg-emerald-600', val: 'text-emerald-700' },
    orange:  { card: 'border-orange-200 bg-orange-50',   icon: 'bg-orange-500',  val: 'text-orange-700'  },
    red:     { card: 'border-red-200 bg-red-50',         icon: 'bg-red-500',     val: 'text-red-700'     },
    slate:   { card: 'border-slate-200 bg-slate-50',     icon: 'bg-slate-600',   val: 'text-slate-700'   },
  };
  const c = colors[color] || colors.slate;
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${c.card}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className={`text-2xl font-bold ${c.val}`}>{value}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
};

// ─── Collapsible Skipped Row ─────────────────────────────────────────────────
const SkippedRow = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-5 py-3 text-sm font-medium text-slate-800">{item.merchantName}</td>
        <td className="px-5 py-3">
          {item.orderId
            ? <span className="font-mono text-xs text-blue-600">#{item.orderId}</span>
            : <span className="text-slate-400 text-xs">—</span>}
        </td>
        <td className="px-5 py-3">
          {item.provider ? <ProviderBadge provider={item.provider} /> : <span className="text-slate-400 text-xs">—</span>}
        </td>
        <td className="px-5 py-3">
          <ErrorTypeBadge type={item.errorType} />
        </td>
        <td className="px-5 py-3 text-xs text-slate-500 max-w-[280px] truncate">{item.reason}</td>
        <td className="px-5 py-3 text-center">
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-400 mx-auto" />
            : <ChevronDown className="w-4 h-4 text-slate-400 mx-auto" />}
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/80">
          <td colSpan={6} className="px-5 pb-4 pt-1">
            <div className={`rounded-lg border p-3 text-xs font-mono break-all ${
              item.errorType === 'AUTH_ERROR'       ? 'border-red-200 bg-red-50 text-red-700' :
              item.errorType === 'NO_STATUS_CHANGE' ? 'border-slate-200 bg-white text-slate-600' :
              'border-orange-200 bg-orange-50 text-orange-700'
            }`}>
              <span className="font-semibold">Full Reason: </span>{item.reason}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const normalise = (raw) => raw ? ({
  _id:            raw._id,
  synced:         raw.synced         ?? 0,
  updated:        raw.updated        ?? 0,
  skipped:        raw.skipped        ?? 0,
  details:        raw.details        || [],
  skippedDetails: raw.skippedDetails || [],
  startedAt:      raw.startedAt      || new Date().toISOString(),
  completedAt:    raw.completedAt    || new Date().toISOString(),
  durationMs:     raw.durationMs     ?? 0,
  expiresAt:      raw.expiresAt,
}) : null;

export default function CourierSync() {
  const [syncing, setSyncing]       = useState(false);
  const [loading, setLoading]       = useState(true);   // initial DB fetch
  const [activeTab, setActiveTab]   = useState('updated');
  const [filterType, setFilterType] = useState('ALL');
  const [report, setReport]         = useState(null);
  
  // History State
  const [history, setHistory]       = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/courier-sync/history?page=${page}&limit=10`);
      if (res.data?.status === 'ok') {
        setHistory(res.data.data || []);
        if (res.data.meta) {
          setHistoryMeta(res.data.meta);
        }
      }
    } catch (e) {
      console.warn('Failed to load sync history:', e.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const viewReportDetails = async (id) => {
    try {
      toast.loading('Loading report details...', { toastId: 'load-report' });
      const res = await api.get(`/courier-sync/report/${id}`);
      if (res.data?.status === 'ok' && res.data?.data) {
        const data = normalise(res.data.data);
        setReport(data);
        setActiveTab(data.updated > 0 ? 'updated' : 'skipped');
        toast.update('load-report', { render: 'Report loaded!', type: 'success', isLoading: false, autoClose: 3000 });
        
        // Scroll back to the top so the user can see the loaded report
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      toast.update('load-report', { render: 'Failed to load report', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/courier-sync/report/${deleteModalId}`);
      if (res.data?.status === 'ok') {
        toast.success('History record deleted');
        if (report?._id === deleteModalId) setReport(null);
        fetchHistory(historyMeta.page);
      }
    } catch (e) {
      toast.error('Failed to delete history record');
    } finally {
      setIsDeleting(false);
      setDeleteModalId(null);
    }
  };



  // ── On mount: load latest report from DB and history ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/courier-sync/latest');
        if (res.data?.status === 'ok' && res.data?.data) {
          const data = normalise(res.data.data);
          setReport(data);
          setActiveTab(data.updated > 0 ? 'updated' : 'skipped');
        }
      } catch (e) {
        console.warn('[CourierSync] Could not load latest report from DB:', e.message);
      } finally {
        setLoading(false);
      }
    })();
    fetchHistory(1);
  }, [fetchHistory]); // run once on mount



  // ── Sync handler — hits the new /courier-sync/run endpoint ────────────────
  const handleSync = useCallback(async () => {
    toast.dismiss();
    setSyncing(true);
    const toastId = 'courier-sync';
    toast.loading('🚚 Syncing courier statuses globally...', { toastId });
    try {
      // POST /courier-sync/run → runs sync + saves to DB → returns saved doc
      const res = await api.post('/courier-sync/run');
      if (res.data?.status === 'ok' && res.data?.data) {
        const data = normalise(res.data.data);
        setReport(data);
        setFilterType('ALL');
        setActiveTab(data.updated > 0 ? 'updated' : 'skipped');
        toast.update(toastId, {
          render: `✅ Sync complete! ${data.updated} updated, ${data.skipped} skipped in ${data.durationMs}ms`,
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        });
        fetchHistory(1); // Refresh history after sync
      } else {
        const errMsg = res.data?.message || 'Sync failed — server error';
        toast.update(toastId, { render: `❌ ${errMsg}`, type: 'error', isLoading: false, autoClose: 5000 });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Sync failed';
      toast.update(toastId, { render: `❌ ${msg}`, type: 'error', isLoading: false, autoClose: 5000 });
    } finally {
      setSyncing(false);
    }
  }, [fetchHistory]);

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Type', 'Merchant', 'Order ID', 'Provider', 'Old Status', 'New Status / Reason'],
      ...(report.details || []).map(d => ['Updated', d.merchantName, d.orderId, d.provider, d.oldStatus, d.newStatus]),
      ...(report.skippedDetails || []).map(s => [s.errorType, s.merchantName, s.orderId || '', s.provider || '', '', s.reason])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `courier-sync-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  const authErrors     = (report?.skippedDetails || []).filter(s => s.errorType === 'AUTH_ERROR').length;
  const noConfigErrors  = (report?.skippedDetails || []).filter(s => ['NO_CONFIG', 'NO_PROVIDER'].includes(s.errorType)).length;

  const handleClearHistory = () => {
    setReport(null);
    toast.info('Sync history view cleared');
  };

  const filteredSkipped = (report?.skippedDetails || []).filter(
    s => filterType === 'ALL' || s.errorType === filterType
  );

  const filterOptions = ['ALL', 'AUTH_ERROR', 'NO_CONFIG', 'NO_PROVIDER', 'UNKNOWN_PROVIDER', 'TRACKING_ERROR', 'NO_STATUS_CHANGE'];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Courier Sync Center</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Trigger global courier status sync and review per-merchant results
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <button
              id="btn-clear-sync-history"
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm font-medium hover:bg-slate-50 hover:text-red-500 transition-colors"
              title="Clear saved report"
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>
          )}
          {report && (
            <button
              id="btn-export-sync-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
          <button
            id="btn-trigger-courier-sync"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Courier Now'}
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {!report && !syncing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Truck className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Sync Report Yet</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Click <strong>"Sync Courier Now"</strong> to trigger a global status sync across all merchants and courier providers.
            </p>
            <button
              onClick={handleSync}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
          </div>
        </div>
      )}

      {/* ── Syncing State ── */}
      {syncing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <Truck className="w-7 h-7 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-600 font-medium animate-pulse">Syncing courier statuses globally…</p>
            <p className="text-slate-400 text-sm mt-1">This may take a moment depending on order volume</p>
          </div>
        </div>
      )}

      {/* ── Report ── */}
      {report && !syncing && (
        <>
          {/* Cached report notice — shown after a page reload */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
            <Clock className="w-3.5 h-3.5 shrink-0 text-blue-500" />
            <span>
              Showing latest sync report from{' '}
              <strong>{new Date(report.startedAt).toLocaleString()}</strong>
              {' '}— results are saved in the database. Click <strong>Sync Courier Now</strong> for a fresh run.
            </span>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Package}     label="Orders Checked" value={report.synced}           color="slate" />
            <StatCard icon={TrendingUp}  label="Status Updated" value={report.updated}           color="green"  sub="Saved to DB" />
            <StatCard icon={SkipForward} label="Skipped"        value={report.skipped}           color="orange" />
            <StatCard icon={ShieldAlert} label="Auth Errors"    value={authErrors}               color="red"    sub="Credential mismatch" />
            <StatCard icon={Activity}    label="Duration"        value={`${report.durationMs}ms`} color="blue"  sub={`at ${new Date(report.startedAt).toLocaleTimeString()}`} />
          </div>

          {/* Timing Bar */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Started:{' '}
              <strong className="text-slate-700">{new Date(report.startedAt).toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Completed:{' '}
              <strong className="text-slate-700">{new Date(report.completedAt).toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-400" /> Duration:{' '}
              <strong className="text-slate-700">{report.durationMs}ms</strong>
            </span>
            {authErrors > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 font-semibold ml-auto">
                <ShieldAlert className="w-3.5 h-3.5" /> {authErrors} credential mismatch(es) detected!
              </span>
            )}
          </div>

          {/* Tabbed Report */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                id="tab-courier-updated"
                onClick={() => setActiveTab('updated')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'updated'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Updated Orders
                {report.updated > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    {report.updated}
                  </span>
                )}
              </button>
              <button
                id="tab-courier-skipped"
                onClick={() => setActiveTab('skipped')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'skipped'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <SkipForward className="w-4 h-4" />
                Skipped / Errors
                {report.skipped > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    authErrors > 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {report.skipped}
                  </span>
                )}
              </button>
            </div>

            {/* ── Updated Tab ── */}
            {activeTab === 'updated' && (
              <>
                {report.details.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="font-medium">No orders were updated</p>
                    <p className="text-sm mt-1">All active orders are already at their latest status</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Merchant</th>
                          <th className="px-5 py-3.5">Order ID</th>
                          <th className="px-5 py-3.5">Provider</th>
                          <th className="px-5 py-3.5">Old Status</th>
                          <th className="px-5 py-3.5">New Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.details.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                                  <Store className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-slate-800">{d.merchantName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{d.orderId}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <ProviderBadge provider={d.provider} />
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={d.oldStatus} />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-300 font-bold">→</span>
                                <StatusBadge status={d.newStatus} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── Skipped Tab ── */}
            {activeTab === 'skipped' && (
              <>
                {/* Filter Bar */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Filter by:</span>
                  {filterOptions.map(type => {
                    const count = type === 'ALL'
                      ? report.skippedDetails.length
                      : report.skippedDetails.filter(s => s.errorType === type).length;
                    if (count === 0 && type !== 'ALL') return null;
                    return (
                      <button
                        key={type}
                        id={`filter-${type.toLowerCase()}`}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          filterType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {type === 'ALL' ? 'All' : type.replace(/_/g, ' ')} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Alerts */}
                {filterType === 'ALL' && authErrors > 0 && (
                  <div className="mx-5 my-3 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
                    <div>
                      <p className="font-semibold">{authErrors} merchant(s) have credential / authentication errors</p>
                      <p className="text-red-600 text-xs mt-0.5">
                        These merchants' courier API keys or credentials are invalid, expired, or unauthorized.
                        Please ask them to update their credentials in their merchant dashboard under Courier Settings.
                      </p>
                    </div>
                  </div>
                )}
                {filterType === 'ALL' && noConfigErrors > 0 && (
                  <div className="mx-5 mb-3 flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-orange-500" />
                    <div>
                      <p className="font-semibold">{noConfigErrors} merchant(s) have no courier provider configured</p>
                      <p className="text-orange-600 text-xs mt-0.5">
                        These merchants haven't set up their courier provider yet. Direct them to Courier Settings in their dashboard.
                      </p>
                    </div>
                  </div>
                )}

                {filteredSkipped.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <SkipForward className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="font-medium">No items for this filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Merchant</th>
                          <th className="px-5 py-3.5">Order ID</th>
                          <th className="px-5 py-3.5">Provider</th>
                          <th className="px-5 py-3.5">Error Type</th>
                          <th className="px-5 py-3.5">Reason</th>
                          <th className="px-5 py-3.5 text-center">Expand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSkipped.map((item, i) => (
                          <SkippedRow key={i} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ── History Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sync History</h2>
            <p className="text-sm text-slate-500">View previous courier synchronization runs (last 7 days)</p>
          </div>
          {loadingHistory && <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />}
        </div>
        
        {history.length === 0 && !loadingHistory ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No sync history found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Started At</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((run) => (
                    <tr key={run._id} className={`hover:bg-slate-50 transition-colors ${report?._id === run._id ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {new Date(run.startedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            {run.updated} Updated
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                            {run.skipped} Skipped
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {run.durationMs}ms
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewReportDetails(run._id)}
                            disabled={report?._id === run._id}
                            className="inline-flex items-center justify-center gap-1.5 w-[110px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            {report?._id === run._id ? 'Viewing' : 'View Details'}
                          </button>
                          <button
                            onClick={() => setDeleteModalId(run._id)}
                            className="inline-flex items-center p-1.5 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete this history record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {historyMeta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Showing page <span className="font-semibold text-slate-700">{historyMeta.page}</span> of <span className="font-semibold text-slate-700">{historyMeta.totalPages}</span>
                  {' '}({historyMeta.total} total runs)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchHistory(historyMeta.page - 1)}
                    disabled={historyMeta.page === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchHistory(historyMeta.page + 1)}
                    disabled={historyMeta.page === historyMeta.totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Custom Delete Modal ── */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Sync History?</h3>
              <p className="text-sm text-slate-500 text-center">
                Are you sure you want to delete this courier sync record? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
