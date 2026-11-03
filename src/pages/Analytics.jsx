import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  Store,
  Package,
  Eye,
  MousePointer,
  ArrowUpRight,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  BarChart2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import api from '../utils/api';
import { toast } from 'react-toastify';

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Custom Range', value: 'custom' },
];

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-slate-200/90 text-xs min-w-[170px]">
        <div className="font-extrabold text-slate-900 mb-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
          <span>{label}</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`entry-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: entry.color }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-black text-slate-900 text-sm">
                {Number(entry.value || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [selectedRange, setSelectedRange] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Global Overview Stats
  const [overview, setOverview] = useState({
    totalStoreVisits: 0,
    totalProductImpressions: 0,
    totalProductClicks: 0,
    totalActiveMerchants: 0,
    totalProducts: 0,
    overallCtr: 0,
    timeline: [],
  });

  // Merchant-wise Table State
  const [merchants, setMerchants] = useState([]);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const [merchantPage, setMerchantPage] = useState(1);
  const [merchantLimit, setMerchantLimit] = useState(10);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantSortBy, setMerchantSortBy] = useState('impressions');
  const [merchantSortOrder, setMerchantSortOrder] = useState('desc');
  const [merchantPagination, setMerchantPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Merchant Drill-down Modal State
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantDetailsLoading, setMerchantDetailsLoading] = useState(false);
  const [merchantDetails, setMerchantDetails] = useState(null);
  const [merchantTimeline, setMerchantTimeline] = useState([]);
  const [merchantProducts, setMerchantProducts] = useState([]);
  const [merchantProductPage, setMerchantProductPage] = useState(1);
  const [merchantProductSearch, setMerchantProductSearch] = useState('');
  const [merchantProductSortBy, setMerchantProductSortBy] = useState('impressions');
  const [merchantProductSortOrder, setMerchantProductSortOrder] = useState('desc');
  const [merchantProductPagination, setMerchantProductPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Global Overview
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const params = { period: selectedRange };
      if (selectedRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.get('/analytics/admin/overview', { params });
      if (res.data?.data) {
        const d = res.data.data;
        const metrics = d.overview || d;
        setOverview({
          totalStoreVisits: metrics.totalStoreVisits ?? 0,
          totalProductImpressions: metrics.totalProductImpressions ?? 0,
          totalProductClicks: metrics.totalProductClicks ?? 0,
          totalActiveMerchants: metrics.totalActiveMerchants ?? 0,
          totalProducts: metrics.totalProducts ?? 0,
          overallCtr: metrics.overallCtr ?? 0,
          timeline: Array.isArray(d.timeline) ? d.timeline : Array.isArray(d) ? d : [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin analytics overview:', err);
      toast.error('Failed to load platform analytics overview');
    } finally {
      setLoadingOverview(false);
    }
  }, [selectedRange, startDate, endDate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Merchant-wise Analytics Table
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchMerchants = useCallback(async () => {
    setMerchantsLoading(true);
    try {
      const params = {
        period: selectedRange,
        page: merchantPage,
        limit: merchantLimit,
        sortBy: merchantSortBy,
        sortOrder: merchantSortOrder,
      };
      if (merchantSearch) params.search = merchantSearch;
      if (selectedRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.get('/analytics/admin/merchants', { params });
      if (res.data) {
        const rawList = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data.data?.merchants)
            ? res.data.data.merchants
            : Array.isArray(res.data.data?.data)
              ? res.data.data.data
              : [];
        setMerchants(rawList);
        const metaObj = res.data.meta || res.data.data?.pagination || res.data.data?.meta;
        if (metaObj) {
          setMerchantPagination({
            page: metaObj.page || 1,
            limit: metaObj.limit || 10,
            total: metaObj.total ?? rawList.length,
            totalPages: metaObj.totalPages || 1,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch merchants analytics:', err);
      toast.error('Failed to load merchant analytics table');
    } finally {
      setMerchantsLoading(false);
    }
  }, [selectedRange, startDate, endDate, merchantPage, merchantLimit, merchantSearch, merchantSortBy, merchantSortOrder]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Merchant Drill-down Details
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchMerchantDetails = useCallback(async (tenantId) => {
    if (!tenantId) return;
    setMerchantDetailsLoading(true);
    try {
      const params = { period: selectedRange };
      if (selectedRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const [detailRes, timelineRes] = await Promise.allSettled([
        api.get(`/analytics/admin/merchant/${tenantId}`, { params }),
        api.get(`/analytics/admin/merchant/${tenantId}/timeline`, { params }),
      ]);

      if (detailRes.status === 'fulfilled' && detailRes.value.data?.data) {
        setMerchantDetails(detailRes.value.data.data);
      }
      if (timelineRes.status === 'fulfilled' && timelineRes.value.data?.data) {
        const tData = timelineRes.value.data.data;
        const arrayData = Array.isArray(tData)
          ? tData
          : Array.isArray(tData.timeline)
            ? tData.timeline
            : [];
        setMerchantTimeline(arrayData);
      }
    } catch (err) {
      console.error('Failed to load merchant details:', err);
      toast.error('Failed to load merchant details');
    } finally {
      setMerchantDetailsLoading(false);
    }
  }, [selectedRange, startDate, endDate]);

  const fetchMerchantProducts = useCallback(async (tenantId) => {
    if (!tenantId) return;
    try {
      const params = {
        period: selectedRange,
        page: merchantProductPage,
        limit: 10,
        sortBy: merchantProductSortBy,
        sortOrder: merchantProductSortOrder,
      };
      if (merchantProductSearch) params.search = merchantProductSearch;
      if (selectedRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const res = await api.get(`/analytics/admin/merchant/${tenantId}/products`, { params });
      if (res.data) {
        const rawList = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data.data?.products)
            ? res.data.data.products
            : [];
        setMerchantProducts(rawList);
        const metaObj = res.data.meta || res.data.data?.pagination || res.data.data?.meta;
        if (metaObj) {
          setMerchantProductPagination({
            page: metaObj.page || 1,
            limit: metaObj.limit || 10,
            total: metaObj.total ?? rawList.length,
            totalPages: metaObj.totalPages || 1,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load merchant products:', err);
    }
  }, [selectedRange, startDate, endDate, merchantProductPage, merchantProductSearch, merchantProductSortBy, merchantProductSortOrder]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  useEffect(() => {
    if (selectedMerchant) {
      fetchMerchantDetails(selectedMerchant.tenantId);
      fetchMerchantProducts(selectedMerchant.tenantId);
    }
  }, [selectedMerchant, fetchMerchantDetails, fetchMerchantProducts]);

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchOverview();
      fetchMerchants();
      if (selectedMerchant) {
        fetchMerchantDetails(selectedMerchant.tenantId);
        fetchMerchantProducts(selectedMerchant.tenantId);
      }
    }
  };

  const openMerchantDrilldown = (merchant) => {
    setSelectedMerchant(merchant);
    setMerchantProductPage(1);
    setMerchantProductSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Global Analytics & Store Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry across all merchants: product impressions, customer clicks, CTR, and storefront visits.
          </p>
        </div>
        <button
          onClick={() => {
            fetchOverview();
            fetchMerchants();
          }}
          disabled={loadingOverview || merchantsLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-2xs transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingOverview || merchantsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Range:
          </span>
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setSelectedRange(r.value);
                setMerchantPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRange === r.value
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {selectedRange === 'custom' && (
          <form onSubmit={handleCustomDateSubmit} className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
              required
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply Range
            </button>
          </form>
        )}
      </div>

      {/* Global Overview Cards (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Store Visits */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              Visits
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {(overview?.totalStoreVisits || 0).toLocaleString()}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">Total Store Visits</div>
        </div>

        {/* Total Product Impressions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Views
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {(overview?.totalProductImpressions || 0).toLocaleString()}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">Product Impressions</div>
        </div>

        {/* Total Product Clicks */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MousePointer className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Clicks
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {(overview?.totalProductClicks || 0).toLocaleString()}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">Product Clicks</div>
        </div>

        {/* Overall Platform CTR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Conversion
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {overview?.overallCtr || 0}%
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">Overall CTR</div>
        </div>

        {/* Total Active Merchants */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              Merchants
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {(overview?.totalActiveMerchants || 0).toLocaleString()}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">Active Merchants</div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">
              Catalog
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {(overview?.totalProducts || 0).toLocaleString()}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">Total Products</div>
        </div>
      </div>

      {/* Platform Timeline Chart */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Platform Activity Timeline
            </h2>
            <p className="text-xs text-slate-500">
              Global trajectory of product impressions, clicks, and store visits
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-3 rounded-full bg-blue-600" /> Impressions
            </span>
            <span className="flex items-center gap-1.5 text-purple-600">
              <span className="w-3 h-3 rounded-full bg-purple-600" /> Clicks
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-3 rounded-full bg-emerald-600" /> Store Visits
            </span>
          </div>
        </div>

        {loadingOverview ? (
          <div className="h-72 flex items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3" />
            Loading timeline...
          </div>
        ) : !Array.isArray(overview.timeline) || overview.timeline.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Eye className="w-8 h-8 text-slate-300 mb-2" />
            No telemetry recorded for this period yet.
          </div>
        ) : (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.isArray(overview.timeline) ? overview.timeline : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminImps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="adminClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="adminVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#adminImps)" />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#adminClicks)" />
                <Area type="monotone" dataKey="visits" name="Store Visits" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#adminVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Merchant-wise Analytics Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-800">Merchant-wise Analytics</h2>
            <p className="text-xs text-slate-500">
              Breakdown of store visits, product impressions, clicks, and CTR per merchant
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search merchant or store..."
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMerchants()}
                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm w-full bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={`${merchantSortBy}-${merchantSortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setMerchantSortBy(by);
                setMerchantSortOrder(order);
                setMerchantPage(1);
              }}
              className="border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="impressions-desc">Sort: Impressions (High to Low)</option>
              <option value="impressions-asc">Sort: Impressions (Low to High)</option>
              <option value="visits-desc">Sort: Store Visits (High to Low)</option>
              <option value="visits-asc">Sort: Store Visits (Low to High)</option>
              <option value="clicks-desc">Sort: Clicks (High to Low)</option>
              <option value="clicks-asc">Sort: Clicks (Low to High)</option>
              <option value="ctr-desc">Sort: CTR (High to Low)</option>
              <option value="products-desc">Sort: Products (High to Low)</option>
              <option value="name-asc">Sort: Merchant Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3.5 font-bold">Merchant / Store</th>
                <th className="px-6 py-3.5 font-bold">Store Visits</th>
                <th className="px-6 py-3.5 font-bold">Impressions</th>
                <th className="px-6 py-3.5 font-bold">Clicks</th>
                <th className="px-6 py-3.5 font-bold">CTR</th>
                <th className="px-6 py-3.5 font-bold">Products</th>
                <th className="px-6 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {merchantsLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                    Loading merchant analytics...
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Store className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    No merchants found matching query.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.tenantId || m._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 uppercase overflow-hidden">
                          {m.logo ? (
                            <img src={m.logo} alt={m.storeName || m.name} className="w-full h-full object-cover" />
                          ) : (
                            (m.storeName || m.name || 'M')[0]
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {m.storeName || m.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {m.domain || (m.slug ? `${m.slug}.masheco.com` : m.tenantId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {(m.storeVisits ?? m.visits ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-blue-600">
                      {(m.impressions || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-indigo-600">
                      {(m.clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (m.ctr || 0) >= 5 ? 'bg-emerald-100 text-emerald-800' : (m.ctr || 0) >= 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {m.ctr || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-semibold">
                      {(m.totalProducts ?? m.productsCount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => openMerchantDrilldown(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Analyze Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {!merchantsLoading && merchantPagination.total > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing{' '}
                <span className="font-bold text-slate-900">
                  {(merchantPage - 1) * merchantLimit + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(merchantPage * merchantLimit, merchantPagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-slate-900">
                  {merchantPagination.total}
                </span>{' '}
                merchants
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400">Rows:</span>
                <select
                  value={merchantLimit}
                  onChange={(e) => {
                    setMerchantLimit(Number(e.target.value));
                    setMerchantPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={merchantPage <= 1}
                onClick={() => setMerchantPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-800 px-2">
                Page {merchantPage} of {merchantPagination.totalPages || 1}
              </span>
              <button
                disabled={merchantPage >= (merchantPagination.totalPages || 1)}
                onClick={() => setMerchantPage((p) => Math.min(merchantPagination.totalPages || 1, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* Merchant Details Modal (Drilldown)                                           */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {(selectedMerchant.storeName || selectedMerchant.name || 'M')[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedMerchant.storeName || selectedMerchant.name} — Store Analytics
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Tenant ID: <code className="text-slate-700">{selectedMerchant.tenantId}</code></span>
                    {selectedMerchant.subdomain && (
                      <span className="text-blue-600 font-medium">({selectedMerchant.subdomain}.masheco.com)</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6">
              {merchantDetailsLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  Loading merchant analytics...
                </div>
              ) : (
                <>
                  {/* Merchant Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <div className="text-xs text-slate-500">Store Visits</div>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        {(merchantDetails?.overview?.totalVisits || selectedMerchant.visits || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
                      <div className="text-xs text-blue-600 font-semibold">Impressions</div>
                      <div className="text-lg font-black text-blue-900 mt-1">
                        {(merchantDetails?.overview?.totalImpressions || selectedMerchant.impressions || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
                      <div className="text-xs text-indigo-600 font-semibold">Clicks</div>
                      <div className="text-lg font-black text-indigo-900 mt-1">
                        {(merchantDetails?.overview?.totalClicks || selectedMerchant.clicks || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                      <div className="text-xs text-emerald-600 font-semibold">CTR</div>
                      <div className="text-lg font-black text-emerald-900 mt-1">
                        {merchantDetails?.overview?.ctr || selectedMerchant.ctr || 0}%
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <div className="text-xs text-slate-500">Unique Visitors</div>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        {(merchantDetails?.overview?.uniqueVisitors || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <div className="text-xs text-slate-500">Total Products</div>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        {(merchantDetails?.overview?.totalProducts || selectedMerchant.productsCount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Merchant Timeline Chart */}
                  {Array.isArray(merchantTimeline) && merchantTimeline.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Merchant Traffic & Activity Timeline</h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={merchantTimeline} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomChartTooltip />} />
                            <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
                            <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} />
                            <Area type="monotone" dataKey="visits" name="Visits" stroke="#059669" fill="#059669" fillOpacity={0.15} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Product-wise Analytics Table for this Merchant */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-slate-50/60">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Merchant Product Performance</h4>
                        <p className="text-xs text-slate-500">Impressions, clicks, and CTR for individual products</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter product..."
                            value={merchantProductSearch}
                            onChange={(e) => setMerchantProductSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchMerchantProducts(selectedMerchant.tenantId)}
                            className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs w-48 bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <select
                          value={`${merchantProductSortBy}-${merchantProductSortOrder}`}
                          onChange={(e) => {
                            const [by, order] = e.target.value.split('-');
                            setMerchantProductSortBy(by);
                            setMerchantProductSortOrder(order);
                            setMerchantProductPage(1);
                          }}
                          className="border border-slate-300 rounded-lg text-xs px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="impressions-desc">Sort: Impressions</option>
                          <option value="clicks-desc">Sort: Clicks</option>
                          <option value="ctr-desc">Sort: CTR</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-100">
                            <th className="px-4 py-2.5 font-bold">Product</th>
                            <th className="px-4 py-2.5 font-bold">Impressions</th>
                            <th className="px-4 py-2.5 font-bold">Clicks</th>
                            <th className="px-4 py-2.5 font-bold">CTR</th>
                            <th className="px-4 py-2.5 font-bold">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {merchantProducts.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                No products found for this merchant.
                              </td>
                            </tr>
                          ) : (
                            merchantProducts.map((p) => (
                              <tr key={p._id || p.productId} className="hover:bg-slate-50/70">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                      <img src={p.image || '/placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-semibold text-slate-900 truncate max-w-xs">{p.title}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 font-bold text-slate-800">
                                  {(p.impressions || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 font-bold text-blue-600">
                                  {(p.clicks || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                    {p.ctr || 0}%
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-700">
                                  ৳{(p.price || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Modal Pagination */}
                    {merchantProductPagination.total > 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Total: {merchantProductPagination.total} products</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={merchantProductPage <= 1}
                            onClick={() => setMerchantProductPage((p) => Math.max(1, p - 1))}
                            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span>
                            Page {merchantProductPage} of {merchantProductPagination.totalPages || 1}
                          </span>
                          <button
                            disabled={merchantProductPage >= (merchantProductPagination.totalPages || 1)}
                            onClick={() => setMerchantProductPage((p) => Math.min(merchantProductPagination.totalPages || 1, p + 1))}
                            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

