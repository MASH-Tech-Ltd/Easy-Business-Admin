import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  HardDrive, Image as ImageIcon, Globe, Activity, AlertTriangle, DollarSign, RefreshCw, Eye, X
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../utils/api';

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

const currentMonth = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export default function ResourceAnalytics() {
  const [period, setPeriod] = useState(currentMonth());
  const [packageId, setPackageId] = useState('');
  const [addonCategory, setAddonCategory] = useState('');
  const [packages, setPackages] = useState([]);
  const [data, setData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (packageId) params.set('packageId', packageId);
      if (addonCategory) params.set('addonCategory', addonCategory);
      const [aRes, pRes, pkgRes] = await Promise.all([
        api.get(`/resources/admin/analytics?${params.toString()}`),
        api.get('/resources/admin/purchases?limit=20'),
        api.get('/resources/admin/packages'),
      ]);
      setData(aRes.data?.data || null);
      setPurchases(pRes.data?.data || []);
      setPackages(pkgRes.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load resource analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period, packageId, addonCategory]);

  const inspectTenant = async (tenantId) => {
    try {
      const res = await api.get(`/resources/admin/tenants/${tenantId}/overview?period=${period}`);
      setSelectedTenant({ tenantId, ...res.data?.data });
    } catch {
      toast.error('Failed to load merchant resource details');
    }
  };

  const reconcileTenant = async (tenantId) => {
    try {
      const res = await api.post(`/resources/admin/tenants/${tenantId}/reconcile-storage`);
      const d = res.data?.data;
      toast.success(`Reconciled: ${fmt(d.after)} across ${d.files} files (drift ${fmt(d.driftBytes)})`);
      inspectTenant(tenantId);
    } catch {
      toast.error('Reconciliation failed');
    }
  };

  const totals = data?.totals || {};
  const chartData = (data?.dailyTrend || []).map((d) => ({
    day: d.day,
    imageMB: Math.round((d.imageBytes / MB) * 100) / 100,
    generalMB: Math.round((d.generalBytes / MB) * 100) / 100,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resource &amp; Bandwidth Analytics</h1>
          <p className="text-xs text-slate-500">
            Platform storage, Cloudflare image &amp; general traffic, quota risks, and add-on revenue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
          />
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="">All Packages</option>
            {packages.map((p) => (
              <option key={p._id} value={p._id}>{p.name} ({p.billingCycle})</option>
            ))}
          </select>
          <select
            value={addonCategory}
            onChange={(e) => setAddonCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="">All Add-on Types</option>
            <option value="storage">Image Storage</option>
            <option value="image_bandwidth">Image Bandwidth</option>
            <option value="general_bandwidth">General Traffic</option>
          </select>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <HardDrive className="w-4 h-4 text-indigo-600" /> Platform Image Storage
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totals.storageBytes)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{totals.storageFiles || 0} tracked files</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <ImageIcon className="w-4 h-4 text-emerald-600" /> Image Delivery Bandwidth
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totals.imageBytes)}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {totals.imageRequests || 0} req • HIT {totals.cacheHit || 0} / MISS {totals.cacheMiss || 0}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Globe className="w-4 h-4 text-blue-600" /> General Traffic Bandwidth
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totals.generalBytes)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{totals.generalRequests || 0} requests</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Activity className="w-4 h-4 text-purple-600" /> Combined Bandwidth
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totals.combinedBytes)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{totals.merchantsWithUsage || 0} active stores</div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Daily Bandwidth Trend (MB) — {period}</h2>
        {chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs text-slate-400">No bandwidth data recorded for this period yet.</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="imageMB" name="Image (MB)" stroke="#10b981" fill="#d1fae5" />
                <Area type="monotone" dataKey="generalMB" name="General (MB)" stroke="#3b82f6" fill="#dbeafe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Consumers + Limit Risks + Add-on Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Top Resource-Consuming Merchants</h3>
          {(data?.topMerchants || []).length === 0 ? (
            <p className="text-xs text-slate-400">No usage yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topMerchants.map((m) => (
                <div key={m.tenantId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800">{m.name}</div>
                    <div className="text-slate-400">Img {fmt(m.imageBytes)} • Gen {fmt(m.generalBytes)}</div>
                  </div>
                  <button onClick={() => inspectTenant(m.tenantId)} className="text-blue-600 font-semibold inline-flex items-center gap-1 cursor-pointer">
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Approaching / Exceeding Limits
          </h3>
          {[...(data?.exceedingLimit || []).map((x) => ({ ...x, over: true })), ...(data?.approachingLimit || [])].slice(0, 12).map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
              <div>
                <div className="font-semibold text-slate-800">{r.name}</div>
                <div className="text-slate-400 capitalize">{r.resource.replace('_', ' ')}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-bold ${r.over ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {r.percent}%
              </span>
            </div>
          ))}
          {!(data?.exceedingLimit?.length || data?.approachingLimit?.length) && (
            <p className="text-xs text-slate-400">No merchants near or over limit.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Add-on Revenue by Category
          </h3>
          {(data?.addonSales || []).length === 0 ? (
            <p className="text-xs text-slate-400">No activated add-on sales yet.</p>
          ) : (
            data.addonSales.map((s) => (
              <div key={s.category} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50">
                <div>
                  <div className="font-semibold text-slate-800 capitalize">{String(s.category).replace('_', ' ')}</div>
                  <div className="text-slate-400">{s.purchases} purchase(s)</div>
                </div>
                <div className="font-bold text-emerald-700 text-sm">৳{s.revenue}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Resource Add-on Purchases</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2 pr-3">Store</th>
                <th className="py-2 pr-3">Add-on</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => (
                <tr key={p._id}>
                  <td className="py-2 pr-3 font-semibold">{p.tenantId?.name || String(p.tenantId)}</td>
                  <td className="py-2 pr-3">{p.snapshot?.name} x{p.quantity}</td>
                  <td className="py-2 pr-3 capitalize">{String(p.category).replace('_', ' ')}</td>
                  <td className="py-2 pr-3 font-bold">৳{p.totalPrice}</td>
                  <td className="py-2 pr-3 capitalize">{p.status}</td>
                  <td className="py-2">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Permanent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Merchant Resource Breakdown</h3>
              <button onClick={() => setSelectedTenant(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-400">Storage Used / Limit</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {fmt(selectedTenant.storage?.usedBytes)} / {selectedTenant.storage?.limitBytes ? fmt(selectedTenant.storage.limitBytes) : 'Unlimited'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-400">Image Bandwidth</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {fmt(selectedTenant.imageBandwidth?.usedBytes)} / {selectedTenant.imageBandwidth?.limitBytes ? fmt(selectedTenant.imageBandwidth.limitBytes) : 'Unlimited'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-400">General Traffic</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {fmt(selectedTenant.generalBandwidth?.usedBytes)} / {selectedTenant.generalBandwidth?.limitBytes ? fmt(selectedTenant.generalBandwidth.limitBytes) : 'Unlimited'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-400">Cache HIT Rate</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedTenant.imageBandwidth?.cacheHitRate || 0}%</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => reconcileTenant(selectedTenant.tenantId)}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Reconcile Storage from Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
