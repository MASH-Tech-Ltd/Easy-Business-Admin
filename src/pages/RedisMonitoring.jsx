import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  Server,
  Activity,
  Database,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  HardDrive,
  BarChart3,
  Layers,
  Gauge,
  Info,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const REFRESH_OPTIONS = [
  { label: "15s", value: 15000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
  { label: "Off", value: 0 },
];

const CACHE_GROUPS = [
  { id: "product", label: "Product Cache", desc: "Listings, details, bestsellers, search" },
  { id: "category", label: "Category Cache", desc: "Store categories, active IDs, counts" },
  { id: "storefront", label: "Storefront Cache", desc: "Store info, themes, status, all store keys" },
  { id: "merchant_dashboard", label: "Merchant Dashboard", desc: "Merchant summary & analytics" },
  { id: "admin_dashboard", label: "Admin Dashboard", desc: "Platform overview, MRR & merchant stats" },
  { id: "affiliate_dashboard", label: "Affiliate Dashboard", desc: "Affiliate overview & public config" },
  { id: "auth_tenant", label: "Tenant & Auth Lookup", desc: "Subdomain/custom domain & auth context" },
];

const formatUptime = (seconds) => {
  if (!seconds) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
};

const formatGroupLabel = (group) =>
  group
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const METRIC_INFO = {
  version: {
    title: "Redis Version & Uptime",
    what: "Displays the running Redis server version, how long it has been continuously running (uptime), and the local host/port it is bound to (127.0.0.2:6379).",
    why: "Confirms Redis is alive on localhost and hasn't unexpectedly crashed or restarted. If Redis ever goes down, the backend automatically enters Fail-Open Mode and serves requests from MongoDB.",
  },
  datasetMemory: {
    title: "Dataset Memory / Max Limit",
    what: "Shows the exact RAM used by cached keys and values inside Redis (used_memory), compared against the configured 128 MB maxmemory limit.",
    why: "Redis is configured as cache-only with allkeys-lru. When dataset memory approaches 128 MB, Redis automatically evicts the least-recently-used keys so it never runs out of memory.",
  },
  processRss: {
    title: "Process RSS Memory",
    what: "Shows the actual OS-level RAM allocated to the redis-server process (Resident Set Size), its fragmentation ratio, and peak memory used.",
    why: "128 MB limits the dataset, not OS allocator overhead. Monitoring RSS ensures Redis leaves plenty of headroom on your 8 GB VPS. A fragmentation ratio between 1.0 and 1.5 is healthy (or slightly higher when dataset is tiny, e.g. 1 MB).",
  },
  keysClients: {
    title: "Keys & Connected Clients",
    what: "Shows the live count of cached keys currently stored in Redis (DBSIZE), active client connections from the backend, and real-time commands/sec (Ops/s).",
    why: "After clicking 'Clear All Cache', this key count drops immediately and then repopulates as live storefront and dashboard requests arrive.",
  },
  memoryBudget: {
    title: "Memory Budget Utilization",
    what: "Visualizes what percentage of the 128 MB Redis dataset budget is currently occupied, along with the active eviction policy (allkeys-lru) and total commands processed.",
    why: "Helps you spot if the cache is near capacity (>85%) before considering tuning TTLs or increasing maxmemory.",
  },
  liveHitRate: {
    title: "Live App Cache Hit Rate",
    what: "Percentage of application cache lookups served directly from Redis (Hits) vs falling back to MongoDB (Misses) since the Node.js server started.",
    why: "Formula: Hits / (Hits + Misses) × 100. Higher hit rate means fewer MongoDB queries and faster API responses. Note: these counters track traffic since server start and do not reset when you clear keys.",
  },
  keyspaceHitRate: {
    title: "Redis Keyspace Hit Rate",
    what: "Redis-native keyspace hit rate plus total evicted keys (removed due to 128 MB cap) and expired keys (removed automatically when TTL finishes).",
    why: "Includes all Redis lookups (cache keys + rate limiter keys). If Evicted Keys grows rapidly, your 128 MB budget is filling up faster than TTLs expire.",
  },
  monitoredEndpoints: {
    title: "Monitored API Endpoints",
    what: "Total distinct API routes tracked by the backend performance middleware and how many have P95 latency at or above the slow threshold (300ms).",
    why: "Lets you identify which endpoints are slow and verify how much faster cache-hit requests are compared to cache-miss requests.",
  },
  hitsMisses: {
    title: "Hits / Misses & GETs / SETs",
    what: "Total application-level cache Hits, Misses, GET lookups, and SET writes recorded since the backend started.",
    why: "Shows total cache activity. Clearing the cache removes stored keys in Redis, while these lifetime counters continue tracking hit/miss volume.",
  },
  evictedExpired: {
    title: "Evicted / Expired Keys",
    what: "Evicted = keys dropped early by allkeys-lru because 128 MB was full. Expired = keys that naturally reached their TTL (e.g. 60s–900s).",
    why: "Healthy cache has many Expired keys and 0 (or very few) Evicted keys.",
  },
  invalidationsErrors: {
    title: "Invalidations / Errors",
    what: "Invalidations = total cache clears/version bumps triggered by product, category, order, theme, or admin Clear actions. Errors = failed/corrupt Redis reads.",
    why: "Confirms stale data is being actively invalidated on updates, and Errors = 0 confirms healthy Redis communication.",
  },
  groupChart: {
    title: "Hits vs Misses by Cache Group",
    what: "Compares cache hits and misses across each functional module (Storefront, Category, Product, Admin/Merchant/Affiliate Dashboards, Auth/Tenant).",
    why: "Helps you see which modules benefit most from Redis caching and where miss rates are high.",
  },
  apiPerf: {
    title: "Endpoint Latency & Cache-Hit Comparison",
    what: "Tracks request count, Average latency, P95 latency (95% of requests are faster than this), and side-by-side Hit vs Miss response times.",
    why: "Proves real-world speedup from Redis (e.g. Hit ~2ms vs Miss ~120ms) without creating extra Redis keys per request.",
  },
};

const VALID_REDIS_TABS = new Set(["overview", "performance", "analytics", "api", "management"]);

let redisMonitorCache = null;

export default function RedisMonitoring() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab = VALID_REDIS_TABS.has(rawTab) ? rawTab : "overview";
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(15000);
  const [loading, setLoading] = useState(!redisMonitorCache);
  const [refreshing, setRefreshing] = useState(false);

  const [overview, setOverview] = useState(redisMonitorCache?.overview || null);
  const [analytics, setAnalytics] = useState(redisMonitorCache?.analytics || null);
  const [apiPerf, setApiPerf] = useState(redisMonitorCache?.apiPerf || null);
  const [tenants, setTenants] = useState(redisMonitorCache?.tenants || []);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const InfoButton = ({ infoKey }) => {
    const item = METRIC_INFO[infoKey];
    if (!item) return null;
    return (
      <button
        type="button"
        onClick={() => setInfoModal(item)}
        title={`About ${item.title}`}
        aria-label={`Info about ${item.title}`}
        className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    );
  };

  const isVisibleRef = useRef(true);

  const fetchAllData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [ovRes, anRes, perfRes] = await Promise.all([
        api.get("/system/redis/overview"),
        api.get("/system/redis/cache-analytics"),
        api.get("/system/redis/api-performance"),
      ]);
      const nextOverview = ovRes.data?.data || null;
      const nextAnalytics = anRes.data?.data || null;
      const nextApiPerf = perfRes.data?.data || null;
      setOverview(nextOverview);
      setAnalytics(nextAnalytics);
      setApiPerf(nextApiPerf);
      redisMonitorCache = {
        ...(redisMonitorCache || {}),
        overview: nextOverview,
        analytics: nextAnalytics,
        apiPerf: nextApiPerf,
      };
    } catch (err) {
      if (isManual) {
        toast.error(err?.response?.data?.message || "Failed to fetch Redis monitoring data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(false);
    api
      .get("/tenants/get-all-tenants?limit=100")
      .then((res) => {
        const list = res.data?.data?.tenants || res.data?.data || [];
        if (Array.isArray(list)) {
          setTenants(list);
          redisMonitorCache = { ...(redisMonitorCache || {}), tenants: list };
        }
      })
      .catch(() => {});
  }, [fetchAllData]);

  useEffect(() => {
    const onVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
      if (isVisibleRef.current && refreshIntervalMs > 0) {
        fetchAllData(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [fetchAllData, refreshIntervalMs]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return;
    const timer = setInterval(() => {
      if (isVisibleRef.current) {
        fetchAllData(false);
      }
    }, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs, fetchAllData]);

  const executeCacheAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      if (confirmModal.type === "all") {
        const res = await api.post("/system/redis/cache/clear");
        toast.success(res.data?.message || "All cache cleared");
      } else if (confirmModal.type === "group") {
        const res = await api.post("/system/redis/cache/clear-group", {
          group: confirmModal.group,
        });
        toast.success(res.data?.message || "Cache group cleared");
      } else if (confirmModal.type === "store") {
        const res = await api.post("/system/redis/cache/clear-store", {
          storeId: confirmModal.storeId,
        });
        toast.success(res.data?.message || "Store cache cleared");
      }
      setConfirmModal(null);
      await fetchAllData(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cache operation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const redis = overview?.redis;
  const ping = overview?.ping;
  const totals = analytics?.totals || {};
  const groups = analytics?.groups || [];
  const endpoints = apiPerf?.endpoints || [];
  const slowEndpoints = apiPerf?.slowEndpoints || [];

  const memPercent = redis?.memory?.memoryUsagePercent ?? 0;
  const memBarColor =
    memPercent >= 85 ? "bg-red-500" : memPercent >= 65 ? "bg-amber-500" : "bg-emerald-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-600 shrink-0" />
            <span className="truncate">Redis &amp; Cache Monitoring</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centralized caching, memory budget (128 MB), API latency &amp; cache invalidation controls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Status Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              redis?.connected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {redis?.connected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected {ping?.latencyMs != null ? `(${ping.latencyMs}ms)` : ""}
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Fail-Open Mode (MongoDB)
              </>
            )}
          </span>

          {/* Auto-refresh selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <span className="text-[11px] text-slate-400 px-2">Auto:</span>
            {REFRESH_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setRefreshIntervalMs(opt.value)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  refreshIntervalMs === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Fail-open banner if Redis is offline */}
      {!redis?.connected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Redis is currently disconnected — Fail-Open Mode Active</p>
            <p className="text-amber-700 mt-0.5">
              All storefront, merchant, and admin requests are being served directly from Database without interruption.
              {redis?.lastError ? ` Last error: ${redis.lastError}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {[
          { id: "overview", label: "Overview & Memory", icon: Gauge },
          { id: "performance", label: "Cache Performance", icon: Zap },
          { id: "analytics", label: "Cache Analytics", icon: BarChart3 },
          { id: "api", label: "API Performance", icon: Activity },
          { id: "management", label: "Cache Management", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & MEMORY */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>REDIS VERSION &amp; UPTIME</span>
                <div className="flex items-center gap-1">
                  <Server className="w-4 h-4 text-blue-500" />
                  <InfoButton infoKey="version" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {redis?.version ? `v${redis.version}` : "Offline"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Uptime: {formatUptime(redis?.uptimeSeconds)} &bull; {redis?.host}:{redis?.port}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>DATASET MEMORY / MAX</span>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <InfoButton infoKey="datasetMemory" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {redis?.memory?.usedMemoryHuman || "0 B"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Limit: {redis?.memory?.maxMemoryHuman || "128 MB"} ({memPercent}%)
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>PROCESS RSS MEMORY</span>
                <div className="flex items-center gap-1">
                  <Database className="w-4 h-4 text-purple-500" />
                  <InfoButton infoKey="processRss" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {redis?.memory?.usedMemoryRssHuman || "0 B"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Frag ratio: {redis?.memory?.fragmentationRatio || 0} &bull; Peak:{" "}
                {redis?.memory?.usedMemoryPeakHuman || "0 B"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>KEYS &amp; CLIENTS</span>
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <InfoButton infoKey="keysClients" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {(redis?.totalKeys ?? 0).toLocaleString()} keys
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Clients: {redis?.connectedClients ?? 0} &bull; Ops/s: {redis?.opsPerSec ?? 0}
              </p>
            </div>
          </div>

          {/* Memory Bar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                  Memory Budget Utilization
                  <InfoButton infoKey="memoryBudget" />
                </h3>
                <p className="text-xs text-slate-500">
                  Eviction Policy: <span className="font-mono font-medium">{redis?.memory?.evictionPolicy || "allkeys-lru"}</span> &bull; Total Commands:{" "}
                  {(redis?.totalCommandsProcessed ?? 0).toLocaleString()}
                </p>
              </div>
              <span className="text-lg font-bold text-slate-900 shrink-0">{memPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${memBarColor} transition-all duration-300`}
                style={{ width: `${Math.min(100, memPercent)}%` }}
              />
            </div>
          </div>

          {/* Quick Live Cache Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">LIVE CACHE HIT RATE</p>
                <InfoButton infoKey="liveHitRate" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1.5">
                {totals.hitRatePercent ?? 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(totals.hits ?? 0).toLocaleString()} hits / {(totals.misses ?? 0).toLocaleString()} misses
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">REDIS KEYSPACE HIT RATE</p>
                <InfoButton infoKey="keyspaceHitRate" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1.5">
                {redis?.stats?.hitRatePercent ?? 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Evicted: {(redis?.stats?.evictedKeys ?? 0).toLocaleString()} &bull; Expired: {(redis?.stats?.expiredKeys ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">MONITORED API ENDPOINTS</p>
                <InfoButton infoKey="monitoredEndpoints" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1.5">
                {endpoints.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Slow endpoints (&ge;{apiPerf?.slowThresholdMs || 300}ms): {slowEndpoints.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CACHE PERFORMANCE */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">APP CACHE HIT RATE</p>
                <InfoButton infoKey="liveHitRate" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {totals.hitRatePercent ?? 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Miss Rate: {totals.missRatePercent ?? 0}%
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">HITS / MISSES</p>
                <InfoButton infoKey="hitsMisses" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(totals.hits ?? 0).toLocaleString()} / {(totals.misses ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                GETs: {(totals.gets ?? 0).toLocaleString()} &bull; SETs: {(totals.sets ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">EVICTED / EXPIRED KEYS</p>
                <InfoButton infoKey="evictedExpired" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(redis?.stats?.evictedKeys ?? 0).toLocaleString()} /{" "}
                {(redis?.stats?.expiredKeys ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Redis Keyspace Hit Rate: {redis?.stats?.hitRatePercent ?? 0}%
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">INVALIDATIONS / ERRORS</p>
                <InfoButton infoKey="invalidationsErrors" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(totals.invalidations ?? 0).toLocaleString()} /{" "}
                <span className={totals.errors > 0 ? "text-red-600" : ""}>{totals.errors ?? 0}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Since server start</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                  Hits vs Misses by Cache Group
                  <InfoButton infoKey="groupChart" />
                </h3>
                <p className="text-xs text-slate-500">
                  Both high-volume and low-volume cache groups remain visible with subtle hover highlight
                </p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groups.map((g) => ({ ...g, name: formatGroupLabel(g.group) }))}
                  margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{ fontSize: 11, fill: "#475569" }}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      borderColor: "#e2e8f0",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar
                    dataKey="hits"
                    name="Cache Hits"
                    fill="#10b981"
                    fillOpacity={0.9}
                    minPointSize={3}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="misses"
                    name="Cache Misses"
                    fill="#f59e0b"
                    fillOpacity={0.88}
                    minPointSize={3}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CACHE ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Cache Group Breakdown</h3>
            <p className="text-xs text-slate-500">
              Application-instrumented hit/miss/invalidation metrics per functional group
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Cache Group</th>
                  <th className="px-5 py-3">Hits</th>
                  <th className="px-5 py-3">Misses</th>
                  <th className="px-5 py-3">Hit Rate</th>
                  <th className="px-5 py-3">SETs</th>
                  <th className="px-5 py-3">Invalidations</th>
                  <th className="px-5 py-3">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((g) => (
                  <tr key={g.group} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {formatGroupLabel(g.group)}
                    </td>
                    <td className="px-5 py-3 text-emerald-600 font-medium">{g.hits.toLocaleString()}</td>
                    <td className="px-5 py-3 text-amber-600 font-medium">{g.misses.toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold">{g.hitRatePercent}%</td>
                    <td className="px-5 py-3 text-slate-600">{g.sets.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">{g.invalidations.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">{g.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: API PERFORMANCE */}
      {activeTab === "api" && (
        <div className="space-y-6">
          {slowEndpoints.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Slow Endpoints Detected (P95 &ge; {apiPerf?.slowThresholdMs || 300}ms)
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {slowEndpoints.slice(0, 6).map((ep) => (
                  <span
                    key={`${ep.method}-${ep.endpoint}`}
                    className="text-xs bg-white border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900 font-mono"
                  >
                    {ep.method} {ep.endpoint} (P95: {ep.p95ResponseTimeMs}ms)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Endpoint Latency &amp; Cache-Hit Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Endpoint</th>
                    <th className="px-5 py-3">Requests</th>
                    <th className="px-5 py-3">Avg (ms)</th>
                    <th className="px-5 py-3">P95 (ms)</th>
                    <th className="px-5 py-3">Cache Hits (Avg ms)</th>
                    <th className="px-5 py-3">Cache Misses (Avg ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {endpoints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No API traffic recorded yet since server startup.
                      </td>
                    </tr>
                  ) : (
                    endpoints.slice(0, 40).map((ep) => (
                      <tr key={`${ep.method}-${ep.endpoint}`} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-800">
                          <span className="font-bold text-blue-600 mr-2">{ep.method}</span>
                          {ep.endpoint}
                        </td>
                        <td className="px-5 py-3">{ep.requestCount.toLocaleString()}</td>
                        <td className="px-5 py-3">{ep.avgResponseTimeMs} ms</td>
                        <td className="px-5 py-3 font-medium">{ep.p95ResponseTimeMs} ms</td>
                        <td className="px-5 py-3 text-emerald-600">
                          {ep.cacheHitCount} {ep.avgHitLatencyMs !== null ? `(${ep.avgHitLatencyMs}ms)` : ""}
                        </td>
                        <td className="px-5 py-3 text-amber-600">
                          {ep.cacheMissCount} {ep.avgMissLatencyMs !== null ? `(${ep.avgMissLatencyMs}ms)` : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CACHE MANAGEMENT */}
      {activeTab === "management" && (
        <div className="space-y-6">
          {/* Clear Specific Store */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Clear Specific Store Cache</h3>
            <p className="text-xs text-slate-500">
              Invalidates all storefront, product, category, theme, and dashboard cache keys for a single merchant store.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">Select a merchant store...</option>
                {tenants.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedStoreId}
                onClick={() =>
                  setConfirmModal({
                    type: "store",
                    storeId: selectedStoreId,
                    title: "Clear Store Cache?",
                    message: "This will remove all cached data for the selected store.",
                  })
                }
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                Clear Store Cache
              </button>
            </div>
          </div>

          {/* Clear by Group */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Clear Cache by Group</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CACHE_GROUPS.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{g.label}</p>
                    <p className="text-xs text-slate-500">{g.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        type: "group",
                        group: g.id,
                        title: `Clear ${g.label}?`,
                        message: `Are you sure you want to clear all keys in the ${g.label} group?`,
                      })
                    }
                    className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg text-xs font-medium shrink-0 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Clear All */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-red-900">Clear Entire Redis Cache</h3>
              <p className="text-xs text-red-700 mt-1">
                Flushes the active Redis cache DB. MongoDB remains unaffected, but subsequent requests will temporarily hit the database until warmed.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfirmModal({
                  type: "all",
                  title: "Flush All Redis Cache?",
                  message: "This will clear ALL cached keys across all stores and dashboards. This action is logged.",
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Cache
            </button>
          </div>
        </div>
      )}

      {/* Metric Info Modal */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="text-base font-bold text-slate-900">{infoModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  What it shows
                </p>
                <p>{infoModal.what}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Why it matters &amp; how it works
                </p>
                <p>{infoModal.why}</p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="px-4 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-600">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={executeCacheAction}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Clearing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
