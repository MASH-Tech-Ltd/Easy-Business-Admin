import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Cloud, ArrowRight, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, Search, Image as ImageIcon
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

const KINDS = [
  { key: 'product', label: 'Product Images' },
  { key: 'category', label: 'Category Images' },
  { key: 'banner', label: 'Store Banners' },
  { key: 'logo', label: 'Store Logo' },
  { key: 'avatar', label: 'User Avatars' },
];

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
const fmt = (bytes) => {
  const b = Number(bytes || 0);
  if (b <= 0) return '0 B';
  if (b >= GB) return `${(b / GB).toFixed(2)} GB`;
  if (b >= MB) return `${(b / MB).toFixed(2)} MB`;
  if (b >= KB) return `${(b / KB).toFixed(2)} KB`;
  return `${b} B`;
};

const storeListCache = new Map();

export default function MediaMigration() {
  const initKey = '1|';
  const initCached = storeListCache.get(initKey);
  const [merchants, setMerchants] = useState(initCached?.data || []);
  const [meta, setMeta] = useState(initCached?.meta || { page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [listLoading, setListLoading] = useState(!initCached);

  const [selectedId, setSelectedId] = useState('');
  const [scan, setScan] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedKinds, setSelectedKinds] = useState(['product', 'category', 'banner', 'logo', 'avatar']);
  const [scanning, setScanning] = useState(false);
  const { socket } = useSocket();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [liveStats, setLiveStats] = useState({ migrated: 0, failed: 0, lastEvent: '' });
  const [cleaning, setCleaning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    const key = `${page}|${search.trim()}`;
    const cached = storeListCache.get(key);
    if (cached) {
      setMerchants(cached.data);
      setMeta(cached.meta);
      setListLoading(false);
    } else {
      setListLoading(true);
    }
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' });
        if (search.trim()) params.set('search', search.trim());
        const res = await api.get(`/resources/admin/merchants?${params.toString()}`);
        const next = {
          data: res.data?.data || [],
          meta: res.data?.meta || { page: 1, limit: 10, total: 0 },
        };
        storeListCache.set(key, next);
        setMerchants(next.data);
        setMeta(next.meta);
      } catch {
        // silent
      } finally {
        setListLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [page, search]);

  const loadScanAndHistory = async (tid) => {
    if (!tid) return;
    setScanning(true);
    setLastResult(null);
    try {
      const [sRes, hRes] = await Promise.all([
        api.get(`/media/migration/scan/${tid}`),
        api.get(`/media/migration/history/${tid}`),
      ]);
      setScan(sRes.data?.data || null);
      setHistory(hRes.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to scan merchant media');
    } finally {
      setScanning(false);
    }
  };

  const handleSelectMerchant = (tid) => {
    setSelectedId(tid);
    if (tid) loadScanAndHistory(tid);
    else {
      setScan(null);
      setHistory([]);
    }
  };

  const toggleKind = (k) => {
    setSelectedKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  useEffect(() => {
    if (!socket || !selectedId) return;
    const onProgress = (ev) => {
      if (!ev || ev.tenantId !== selectedId) return;
      setLiveStats((prev) => ({
        migrated: prev.migrated + (ev.status === 'migrated' ? 1 : 0),
        failed: prev.failed + (ev.status === 'failed' ? 1 : 0),
        lastEvent: ev.status === 'migrated' ? `Migrated ${ev.kind} image` : `Failed (${ev.kind}): ${ev.error || 'error'}`,
      }));
    };
    socket.on('media_migration_progress', onProgress);
    return () => {
      socket.off('media_migration_progress', onProgress);
    };
  }, [socket, selectedId]);

  const handleMigrate = async () => {
    if (!selectedId) return toast.warning('Select a store first');
    if (!selectedKinds.length) return toast.warning('Select at least one image category');
    const targetTotal = selectedKinds.reduce((s, k) => s + (scan?.counts?.[k] || 0), 0);
    if (!targetTotal) return toast.info('No Cloudinary images left in selected categories');
    if (!window.confirm(`Migrate ${targetTotal} Cloudinary image(s) for "${scan?.tenant?.name}" in chunks of 10? (Cloudinary files will NOT be deleted — kept for 3 days.)`)) {
      return;
    }
    setMigrating(true);
    setLiveStats({ migrated: 0, failed: 0, lastEvent: 'Starting migration...' });
    setProgress({ done: 0, total: targetTotal, chunk: 0 });
    const agg = { migrated: 0, failed: 0, byKind: { product: 0, category: 0, banner: 0, logo: 0, avatar: 0 }, errors: [] };
    try {
      let remaining = targetTotal;
      let chunk = 0;
      while (remaining > 0) {
        chunk++;
        const res = await api.post(`/media/migration/run/${selectedId}`, { kinds: selectedKinds, limit: 10 });
        const d = res.data?.data;
        if (!d) break;
        agg.migrated += d.migrated || 0;
        agg.failed += d.failed || 0;
        for (const k of Object.keys(agg.byKind)) agg.byKind[k] += d.byKind?.[k] || 0;
        if (Array.isArray(d.errors) && d.errors.length) agg.errors.push(...d.errors);
        remaining = d.remaining ?? 0;
        setProgress({ done: Math.min(targetTotal, agg.migrated + agg.failed), total: targetTotal, chunk });
        setLastResult({ ...agg });
        if ((d.processed || 0) === 0 || (d.migrated === 0 && d.failed > 0 && remaining === targetTotal)) break;
      }
      toast.success(`Migrated ${agg.migrated} image(s) to R2${agg.failed ? ` (${agg.failed} failed)` : ''}`);
      await loadScanAndHistory(selectedId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Migration failed mid-batch (already migrated images are saved!)');
      await loadScanAndHistory(selectedId);
    } finally {
      setMigrating(false);
      setProgress(null);
    }
  };

  const handleCleanup = async (force = false) => {
    if (!selectedId) return;
    const msg = force
      ? 'FORCE delete ALL migrated Cloudinary images for this store immediately (ignoring the 3-day safety window)?'
      : 'Delete migrated Cloudinary images that have passed the 3-day safety window?';
    if (!window.confirm(msg)) return;
    setCleaning(true);
    try {
      const res = await api.post(`/media/migration/cleanup/${selectedId}`, { force });
      const d = res.data?.data;
      toast.success(`Cloudinary cleanup: ${d?.deleted || 0} deleted, ${d?.failed || 0} failed`);
      await loadScanAndHistory(selectedId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 10)));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          Cloudinary &rarr; Cloudflare R2 Migration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pick a store below to scan its Cloudinary images (Product, Category, Banner, Logo, Avatar), copy selected ones to R2, and clean up Cloudinary after 3 days.
        </p>
      </div>

      {/* Paginated Store List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Stores ({meta.total || 0})</h2>
            <p className="text-xs text-slate-500">Click &ldquo;Scan &amp; Migrate&rdquo; on any store to inspect and migrate its images.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search store name (e.g. Mashiat Fashion)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2 pr-3">Store</th>
                <th className="py-2 pr-3">Domain</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Tracked R2 Storage</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading && merchants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Loading stores...</td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No stores found.</td>
                </tr>
              ) : (
                merchants.map((m) => {
                  const isSel = selectedId === m.tenantId;
                  return (
                    <tr key={m.tenantId} className={isSel ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'}>
                      <td className="py-2.5 pr-3 font-semibold text-slate-800">{m.name}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{m.customDomain || `${m.slug}.masheco.com`}</td>
                      <td className="py-2.5 pr-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">{m.packageName}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700">
                        {fmt(m.storageBytes)} <span className="text-slate-400">({m.fileCount} files)</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectMerchant(m.tenantId)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            isSel ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {scanning && isSel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                          {isSel ? 'Selected' : 'Scan & Migrate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages} ({meta.total} stores)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {scan && (
        <>
          {!scan.r2Configured && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Cloudflare R2 is not configured in backend environment variables. Migration is disabled.
            </div>
          )}

          {/* Category Selection & Migrate */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Step 1: Select Cloudinary Images to Migrate ({scan.counts.total} found)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Store: <strong>{scan.tenant.name}</strong> &bull; Converts to WebP + variants on R2 and updates DB URLs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadScanAndHistory(selectedId)}
                  disabled={scanning}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} /> Rescan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {KINDS.map((k) => {
                  const count = scan.counts[k.key] || 0;
                  const checked = selectedKinds.includes(k.key);
                  return (
                    <label
                      key={k.key}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        checked ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleKind(k.key)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-xs font-semibold text-slate-800">{k.label}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>

              {migrating && progress && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-blue-900">
                    <span>Live Progress (Batch {progress.chunk})</span>
                    <span>
                      Migrated: <strong className="text-emerald-700">{liveStats.migrated}</strong> &bull; Failed:{' '}
                      <strong className="text-red-600">{liveStats.failed}</strong> / {progress.total}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(100, Math.round(((liveStats.migrated + liveStats.failed) / Math.max(1, progress.total)) * 100))}%` }}
                    />
                  </div>
                  {liveStats.lastEvent && <div className="text-[11px] text-blue-800 truncate">{liveStats.lastEvent}</div>}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Cloudinary originals are preserved for 3 days for safe rollback.
                </span>
                <button
                  type="button"
                  disabled={migrating || !scan.r2Configured || scan.counts.total === 0}
                  onClick={handleMigrate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  {migrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {migrating && progress ? `Migrating ${progress.done}/${progress.total} (Batch ${progress.chunk})...` : 'Migrate Selected to R2 (10/batch)'}
                </button>
              </div>
            </div>

            {/* Step 2: 3-Day Cleanup */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Step 2: 3-Day Cloudinary Cleanup</h2>
                <p className="text-xs text-slate-500">Remove old Cloudinary copies after verifying everything works.</p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-slate-600">Total Pending Cleanup</span>
                  <span className="font-bold text-slate-900">{scan.backups.pendingCleanup}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 flex justify-between">
                  <span className="text-amber-700">Waiting (&lt; 3 days)</span>
                  <span className="font-bold text-amber-800">{scan.backups.waitingThreeDays}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 flex justify-between">
                  <span className="text-emerald-700">Eligible Now (3+ days)</span>
                  <span className="font-bold text-emerald-800">{scan.backups.eligibleNow}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={cleaning || scan.backups.eligibleNow === 0}
                  onClick={() => handleCleanup(false)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cleanup Eligible (3+ Days)
                </button>
                {scan.backups.pendingCleanup > 0 && (
                  <button
                    type="button"
                    disabled={cleaning}
                    onClick={() => handleCleanup(true)}
                    className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                  >
                    Force Cleanup All Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {lastResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-1">
              <div className="font-bold">
                Migration finished: {lastResult.migrated} migrated, {lastResult.failed} failed
              </div>
              <div>
                Product: {lastResult.byKind?.product || 0} &bull; Category: {lastResult.byKind?.category || 0} &bull; Banner: {lastResult.byKind?.banner || 0} &bull; Logo: {lastResult.byKind?.logo || 0} &bull; Avatar: {lastResult.byKind?.avatar || 0}
              </div>
              {lastResult.errors?.length > 0 && (
                <div className="text-red-700 pt-1">Errors: {lastResult.errors.join(' | ')}</div>
              )}
            </div>
          )}

          {/* Migration Backup History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Migration Backup Log (Last 100)</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No migration records for this store yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">New R2 URL</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Migrated</th>
                      <th className="py-2">Cleanup Eligible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h) => (
                      <tr key={h._id}>
                        <td className="py-2 pr-3 capitalize font-semibold">{h.kind}</td>
                        <td className="py-2 pr-3 max-w-xs truncate">
                          <a href={h.newSecureUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 shrink-0" /> {h.newKey}
                          </a>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                            h.status === 'cleaned' ? 'bg-emerald-50 text-emerald-700' : h.status === 'migrated' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {h.status === 'cleaned' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {h.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{new Date(h.migratedAt).toLocaleDateString()}</td>
                        <td className="py-2">{new Date(h.cleanupEligibleAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
