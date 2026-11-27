import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  HardDrive,
  Image as ImageIcon,
  Globe,
  Activity,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Eye,
  X,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import api from "../utils/api";

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

const fmt = (bytes) => {
  const b = Number(bytes || 0);
  if (b <= 0) return "0 B";
  if (b >= GB) return `${(b / GB).toFixed(2)} GB`;
  if (b >= MB) return `${(b / MB).toFixed(2)} MB`;
  if (b >= KB) return `${(b / KB).toFixed(2)} KB`;
  return `${b} B`;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const analyticsCache = new Map();
const merchantsListCache = new Map();
let cachedPurchases = null;
let cachedPackages = null;

export default function ResourceAnalytics() {
  const [period, setPeriod] = useState(currentMonth());
  const [packageId, setPackageId] = useState("");
  const [addonCategory, setAddonCategory] = useState("");
  const initKey = `${currentMonth()}||`;
  const [packages, setPackages] = useState(cachedPackages || []);
  const [data, setData] = useState(analyticsCache.get(initKey) || null);
  const [purchases, setPurchases] = useState(cachedPurchases || []);
  const [loading, setLoading] = useState(!analyticsCache.has(initKey));
  const [selectedTenant, setSelectedTenant] = useState(null);
  const initMerchKey = `${currentMonth()}|1|`;
  const initMerch = merchantsListCache.get(initMerchKey);
  const [merchants, setMerchants] = useState(initMerch?.data || []);
  const [merchantsMeta, setMerchantsMeta] = useState(
    initMerch?.meta || { page: 1, limit: 15, total: 0 },
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    const key = `${period}|${packageId}|${addonCategory}`;
    const cached = analyticsCache.get(key);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({ period });
      if (packageId) params.set("packageId", packageId);
      if (addonCategory) params.set("addonCategory", addonCategory);
      const [aRes, pRes, pkgRes] = await Promise.all([
        api.get(`/resources/admin/analytics?${params.toString()}`),
        api.get("/resources/admin/purchases?limit=20"),
        api.get("/resources/admin/packages"),
      ]);
      const nextData = aRes.data?.data || null;
      const nextPurchases = pRes.data?.data || [];
      const nextPackages = pkgRes.data?.data || [];
      if (nextData) analyticsCache.set(key, nextData);
      cachedPurchases = nextPurchases;
      cachedPackages = nextPackages;
      setData(nextData);
      setPurchases(nextPurchases);
      setPackages(nextPackages);
    } catch (err) {
      if (!cached) {
        toast.error(
          err?.response?.data?.message || "Failed to load resource analytics",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period, packageId, addonCategory]);

  const loadMerchants = async () => {
    const mKey = `${period}|${page}|${search.trim()}`;
    const cachedM = merchantsListCache.get(mKey);
    if (cachedM) {
      setMerchants(cachedM.data);
      setMerchantsMeta(cachedM.meta);
    }
    try {
      const params = new URLSearchParams({
        period,
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get(
        `/resources/admin/merchants?${params.toString()}`,
      );
      const nextM = {
        data: res.data?.data || [],
        meta: res.data?.meta || { page: 1, limit: 15, total: 0 },
      };
      merchantsListCache.set(mKey, nextM);
      setMerchants(nextM.data);
      setMerchantsMeta(nextM.meta);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadMerchants();
  }, [period, page, search]);

  const inspectTenant = async (tenantId, storeName) => {
    try {
      const res = await api.get(
        `/resources/admin/tenants/${tenantId}/overview?period=${period}`,
      );
      setSelectedTenant({ tenantId, storeName, ...(res.data?.data || {}) });
    } catch {
      toast.error("Failed to load merchant resource details");
    }
  };

  const reconcileTenant = async (tenantId) => {
    try {
      const res = await api.post(
        `/resources/admin/tenants/${tenantId}/reconcile-storage`,
      );
      const d = res.data?.data;
      toast.success(
        `Reconciled: ${fmt(d.after)} across ${d.files} files (drift ${fmt(d.driftBytes)})`,
      );
      inspectTenant(tenantId);
    } catch {
      toast.error("Reconciliation failed");
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
          <h1 className="text-xl font-bold text-slate-900">
            Resource &amp; Bandwidth Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Platform storage, Cloudflare image &amp; general traffic, quota
            risks, and add-on revenue.
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
              <option key={p._id} value={p._id}>
                {p.name} ({p.billingCycle})
              </option>
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
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <HardDrive className="w-4 h-4 text-indigo-600" /> Platform Image
            Storage
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {fmt(totals.storageBytes)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {totals.storageFiles || 0} tracked files
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <ImageIcon className="w-4 h-4 text-emerald-600" /> Image Delivery
            Bandwidth
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {fmt(totals.imageBytes)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {totals.imageRequests || 0} req • HIT {totals.cacheHit || 0} / MISS{" "}
            {totals.cacheMiss || 0}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Globe className="w-4 h-4 text-blue-600" /> General Traffic
            Bandwidth
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {fmt(totals.generalBytes)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {totals.generalRequests || 0} requests
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Activity className="w-4 h-4 text-purple-600" /> Combined Bandwidth
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {fmt(totals.combinedBytes)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {totals.merchantsWithUsage || 0} active stores
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">
          Daily Bandwidth Trend (MB) — {period}
        </h2>
        {chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs text-slate-400">
            No bandwidth data recorded for this period yet.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="imageMB"
                  name="Image (MB)"
                  stroke="#10b981"
                  fill="#d1fae5"
                />
                <Area
                  type="monotone"
                  dataKey="generalMB"
                  name="General (MB)"
                  stroke="#3b82f6"
                  fill="#dbeafe"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Consumers + Limit Risks + Add-on Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">
            Top Resource-Consuming Merchants
          </h3>
          {(data?.topMerchants || []).length === 0 ? (
            <p className="text-xs text-slate-400">No usage yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topMerchants.map((m) => (
                <div
                  key={m.tenantId}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{m.name}</div>
                    <div className="text-slate-400">
                      Img {fmt(m.imageBytes)} • Gen {fmt(m.generalBytes)}
                    </div>
                  </div>
                  <button
                    onClick={() => inspectTenant(m.tenantId, m.name)}
                    className="text-blue-600 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Approaching /
            Exceeding Limits
          </h3>
          {[
            ...(data?.exceedingLimit || []).map((x) => ({ ...x, over: true })),
            ...(data?.approachingLimit || []),
          ]
            .slice(0, 12)
            .map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50"
              >
                <div>
                  <div className="font-semibold text-slate-800">{r.name}</div>
                  <div className="text-slate-400 capitalize">
                    {r.resource.replace("_", " ")}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold ${r.over ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {r.percent}%
                </span>
              </div>
            ))}
          {!(
            data?.exceedingLimit?.length || data?.approachingLimit?.length
          ) && (
            <p className="text-xs text-slate-400">
              No merchants near or over limit.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Add-on Revenue
            by Category
          </h3>
          {(data?.addonSales || []).length === 0 ? (
            <p className="text-xs text-slate-400">
              No activated add-on sales yet.
            </p>
          ) : (
            data.addonSales.map((s) => (
              <div
                key={s.category}
                className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50"
              >
                <div>
                  <div className="font-semibold text-slate-800 capitalize">
                    {String(s.category).replace("_", " ")}
                  </div>
                  <div className="text-slate-400">
                    {s.purchases} purchase(s)
                  </div>
                </div>
                <div className="font-bold text-emerald-700 text-sm">
                  ৳{s.revenue}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Merchants Resource Usage Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              All Merchants Resource &amp; Bandwidth Usage
            </h3>
            <p className="text-xs text-slate-500">
              Total stores: {merchantsMeta.total || 0}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search store name, slug, domain..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2 pr-3">Store</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Storage (Files)</th>
                <th className="py-2 pr-3">Image Bandwidth</th>
                <th className="py-2 pr-3">General Traffic</th>
                <th className="py-2 pr-3">Combined</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No merchants found.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.tenantId}>
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-slate-800">
                        {m.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {m.customDomain || `${m.slug}.masheco.com`}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {m.packageName}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {fmt(m.storageBytes)}{" "}
                      <span className="text-slate-400">({m.fileCount})</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {fmt(m.imageBytes)}{" "}
                      <span className="text-slate-400">
                        ({m.imageRequests} req)
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {fmt(m.generalBytes)}{" "}
                      <span className="text-slate-400">
                        ({m.generalRequests} req)
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-slate-900">
                      {fmt(m.combinedBytes)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => inspectTenant(m.tenantId, m.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {merchantsMeta.total > merchantsMeta.limit && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Page {merchantsMeta.page} of{" "}
              {Math.ceil(merchantsMeta.total / merchantsMeta.limit)}
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
                disabled={
                  page >= Math.ceil(merchantsMeta.total / merchantsMeta.limit)
                }
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Recent Resource Add-on Purchases
        </h3>
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
                  <td className="py-2 pr-3 font-semibold">
                    {p.tenantId?.name || String(p.tenantId)}
                  </td>
                  <td className="py-2 pr-3">
                    {p.snapshot?.name} x{p.quantity}
                  </td>
                  <td className="py-2 pr-3 capitalize">
                    {String(p.category).replace("_", " ")}
                  </td>
                  <td className="py-2 pr-3 font-bold">৳{p.totalPrice}</td>
                  <td className="py-2 pr-3 capitalize">{p.status}</td>
                  <td className="py-2">
                    {p.expiresAt
                      ? new Date(p.expiresAt).toLocaleDateString()
                      : "Permanent"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Detail Modal */}
      {selectedTenant && (() => {
        const st = selectedTenant.storage || {};
        const ib = selectedTenant.imageBandwidth || {};
        const gb = selectedTenant.generalBandwidth || {};
        const cb = selectedTenant.combined || {};
        const tDaily = (selectedTenant.daily || []).map((d) => ({
          date: d.date?.slice(5) || d.date,
          imageMB: Math.round(((d.imageBytes || 0) / MB) * 100) / 100,
          generalMB: Math.round(((d.generalBytes || 0) / MB) * 100) / 100,
        }));
        const tHist = selectedTenant.history || [];
        const tAddons = selectedTenant.activeAddons || [];
        const barCol = (pct) => (pct >= 100 ? 'bg-red-500' : pct >= 95 ? 'bg-orange-500' : pct >= 85 ? 'bg-amber-500' : 'bg-indigo-600');
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Merchant Resource Usage
                    {(selectedTenant.tenantName || selectedTenant.storeName) && (
                      <span className="ml-2 text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {selectedTenant.tenantName || selectedTenant.storeName}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Period <strong>{selectedTenant.period}</strong> &bull; Plan:{' '}
                    <strong>{selectedTenant.package?.name || 'Default'}</strong>
                    {selectedTenant.dataThrough && ` • Synced through ${new Date(selectedTenant.dataThrough).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reconcileTenant(selectedTenant.tenantId)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Reconcile Storage from Inventory
                  </button>
                  <button onClick={() => setSelectedTenant(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <HardDrive className="w-4 h-4 text-indigo-600" /> Image Storage
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {st.limitBytes > 0 ? `${st.percent}%` : 'Unlimited'}
                    </span>
                  </div>
                  {st.limitBytes > 0 && (
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barCol(st.percent)}`} style={{ width: `${Math.min(100, Math.max(2, st.percent))}%` }} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Allocated</div><div className="font-bold">{st.limitBytes ? fmt(st.limitBytes) : 'Unlimited'}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Used</div><div className="font-bold">{fmt(st.usedBytes)}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Remaining</div><div className="font-bold text-emerald-700">{st.remainingBytes == null ? 'Unlimited' : fmt(st.remainingBytes)}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Files</div><div className="font-bold">{st.fileCount || 0}</div></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <ImageIcon className="w-4 h-4 text-emerald-600" /> Image Bandwidth
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {ib.limitBytes > 0 ? `${ib.percent}%` : 'Unlimited'}
                    </span>
                  </div>
                  {ib.limitBytes > 0 && (
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barCol(ib.percent)}`} style={{ width: `${Math.min(100, Math.max(2, ib.percent))}%` }} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Allocation</div><div className="font-bold">{ib.limitBytes ? fmt(ib.limitBytes) : 'Unlimited'}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Used / Rem</div><div className="font-bold">{fmt(ib.usedBytes)} / {ib.remainingBytes == null ? '∞' : fmt(ib.remainingBytes)}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Requests</div><div className="font-bold">{ib.requests || 0}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">HIT / MISS</div><div className="font-bold">{ib.cacheHit || 0} / {ib.cacheMiss || 0} ({ib.cacheHitRate || 0}%)</div></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Globe className="w-4 h-4 text-blue-600" /> General Traffic
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {gb.limitBytes > 0 ? `${gb.percent}%` : 'Unlimited'}
                    </span>
                  </div>
                  {gb.limitBytes > 0 && (
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barCol(gb.percent)}`} style={{ width: `${Math.min(100, Math.max(2, gb.percent))}%` }} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Allocation</div><div className="font-bold">{gb.limitBytes ? fmt(gb.limitBytes) : 'Unlimited'}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Used</div><div className="font-bold">{fmt(gb.usedBytes)}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Remaining</div><div className="font-bold text-emerald-700">{gb.remainingBytes == null ? 'Unlimited' : fmt(gb.remainingBytes)}</div></div>
                    <div className="p-2 rounded-lg bg-slate-50"><div className="text-slate-400">Requests</div><div className="font-bold">{gb.requests || 0}</div></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div><div className="text-slate-400">Image Bandwidth</div><div className="font-bold text-slate-900">{fmt(cb.imageBytes)}</div></div>
                <div><div className="text-slate-400">General Traffic</div><div className="font-bold text-slate-900">{fmt(cb.generalBytes)}</div></div>
                <div><div className="text-purple-600">Combined Usage</div><div className="font-bold text-purple-900">{fmt(cb.usedBytes)}</div></div>
                <div><div className="text-slate-400">Combined Remaining</div><div className="font-bold text-emerald-700">{cb.remainingBytes == null ? 'Unlimited' : fmt(cb.remainingBytes)}</div></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold text-slate-800 mb-2">Daily Bandwidth Usage (MB)</div>
                  {tDaily.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">No daily bandwidth data yet.</div>
                  ) : (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tDaily}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="imageMB" name="Image (MB)" stroke="#10b981" fill="#d1fae5" />
                          <Area type="monotone" dataKey="generalMB" name="General (MB)" stroke="#3b82f6" fill="#dbeafe" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-800">Active &amp; Pending Add-ons</div>
                  {tAddons.length === 0 ? (
                    <div className="text-xs text-slate-400">No resource add-ons purchased.</div>
                  ) : (
                    tAddons.map((a) => (
                      <div key={a.id} className="p-2 rounded-lg bg-slate-50 text-xs">
                        <div className="font-semibold text-slate-800">{a.name} x{a.quantity} ({a.status})</div>
                        <div className="text-slate-500">+{fmt(a.quantityBytes)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {tHist.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold text-slate-800 mb-2">Monthly Usage History</div>
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 border-b border-slate-100">
                      <tr><th className="py-1.5 pr-3">Period</th><th className="py-1.5 pr-3">Image</th><th className="py-1.5 pr-3">General</th><th className="py-1.5 pr-3">Combined</th><th className="py-1.5">Requests</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tHist.map((h) => (
                        <tr key={h.period}>
                          <td className="py-1.5 pr-3 font-semibold">{h.period}</td>
                          <td className="py-1.5 pr-3">{fmt(h.imageBytes)}</td>
                          <td className="py-1.5 pr-3">{fmt(h.generalBytes)}</td>
                          <td className="py-1.5 pr-3 font-bold">{fmt((h.imageBytes || 0) + (h.generalBytes || 0))}</td>
                          <td className="py-1.5">{(h.imageRequests || 0) + (h.generalRequests || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
