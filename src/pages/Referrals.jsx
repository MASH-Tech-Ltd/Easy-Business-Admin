import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  Gift,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Users,
  Sparkles,
  Calendar,
  Trash2,
  Edit2,
  RefreshCw,
  Tag,
  Check,
  AlertTriangle,
  Coins,
  Banknote,
  ArrowRight,
} from "lucide-react";

export default function Referrals() {
  const [activeTab, setActiveTab] = useState("codes"); // "codes" | "usages" | "withdrawals"

  // Data states
  const [referrals, setReferrals] = useState([]);
  const [usages, setUsages] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    totalUses: 0,
    totalDaysGranted: 0,
  });

  // Loading & pagination states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawalFilter, setWithdrawalFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPage: 1 });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    offerType: "trial_extension",
    extraDays: 10,
    discountType: "percentage",
    discountValue: 10,
    pointsPerReferral: 20,
    maxUses: "",
    referrerName: "",
    description: "",
    expiresAt: "",
    isActive: true,
  });

  // Fetch Referral Codes
  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.get(`/referrals?${params.toString()}`);
      if (res.data?.status === "ok" || res.data?.success) {
        const payload = res.data.data;
        setReferrals(payload?.data || []);
        setMeta(payload?.meta || { page: 1, limit: 15, total: 0, totalPage: 1 });
        if (payload?.stats) {
          setStats(payload.stats);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load referral codes");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // Fetch Referral Usages / Redemptions
  const fetchUsages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/referrals/usages?${params.toString()}`);
      if (res.data?.status === "ok" || res.data?.success) {
        const payload = res.data.data;
        setUsages(payload?.data || []);
        setMeta(payload?.meta || { page: 1, limit: 15, total: 0, totalPage: 1 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load referral usages");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Fetch Merchant Withdrawals
  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (withdrawalFilter !== "all") params.append("status", withdrawalFilter);

      const res = await api.get(`/referrals/withdrawals?${params.toString()}`);
      if (res.data?.status === "ok" || res.data?.success) {
        const payload = res.data.data;
        setWithdrawals(payload?.data || []);
        setMeta(payload?.meta || { page: 1, limit: 15, total: 0, totalPage: 1 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [page, withdrawalFilter]);

  useEffect(() => {
    if (activeTab === "codes") {
      fetchReferrals();
    } else if (activeTab === "usages") {
      fetchUsages();
    } else if (activeTab === "withdrawals") {
      fetchWithdrawals();
    }
  }, [activeTab, fetchReferrals, fetchUsages, fetchWithdrawals]);

  // Copy code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Generate random referral code
  const handleGenerateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code: `MASH-${randomPart}` }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      code: "",
      offerType: "trial_extension",
      extraDays: 10,
      discountType: "percentage",
      discountValue: 10,
      pointsPerReferral: 0,
      maxUses: "",
      referrerName: "",
      description: "",
      expiresAt: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      code: item.code || "",
      offerType: item.offerType || "trial_extension",
      extraDays: item.extraDays ?? 10,
      discountType: item.discountType || "percentage",
      discountValue: item.discountValue ?? 10,
      pointsPerReferral: item.pointsPerReferral ?? 20,
      maxUses: item.maxUses ? String(item.maxUses) : "",
      referrerName: item.referrerName || "",
      description: item.description || "",
      expiresAt: item.expiresAt ? item.expiresAt.substring(0, 10) : "",
      isActive: item.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      offerType: formData.offerType,
      extraDays: formData.offerType === "subscription_discount" ? 0 : (Number(formData.extraDays) || 0),
      discountType: formData.discountType,
      discountValue: formData.offerType === "trial_extension" ? 0 : (Number(formData.discountValue) || 0),
      pointsPerReferral: formData.pointsPerReferral !== "" && !isNaN(Number(formData.pointsPerReferral))
        ? Number(formData.pointsPerReferral)
        : 0,
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      referrerName: formData.referrerName.trim(),
      description: formData.description.trim(),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      isActive: formData.isActive,
    };

    setActionLoading("saving");
    try {
      if (editItem) {
        await api.patch(`/referrals/${editItem._id}`, payload);
        toast.success("Referral code updated successfully");
      } else {
        await api.post("/referrals", payload);
        toast.success("Referral code created successfully");
      }
      setIsModalOpen(false);
      fetchReferrals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save referral code");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/referrals/${id}/toggle-status`);
      toast.success("Status updated");
      fetchReferrals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete referral code
  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await api.delete(`/referrals/${id}`);
      toast.success("Referral code deleted");
      setDeleteConfirmId(null);
      fetchReferrals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete referral code");
    } finally {
      setActionLoading(null);
    }
  };

  // Process Merchant Withdrawal (Approve / Reject)
  const handleProcessWithdrawal = async (id, status) => {
    const feedback = prompt(
      status === "approved"
        ? "Enter payout reference / note (optional):"
        : "Enter reason for rejecting withdrawal:"
    );
    if (status === "rejected" && feedback === null) return;

    setActionLoading(id);
    try {
      await api.patch(`/referrals/withdrawals/${id}/process`, {
        status,
        adminFeedback: feedback || "",
      });
      toast.success(`Withdrawal ${status} successfully`);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} withdrawal`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-4 xs:p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 xs:p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Gift className="w-5 h-5 xs:w-6 xs:h-6" />
            </div>
            <div>
              <h1 className="text-xl xs:text-2xl font-bold text-slate-900 tracking-tight">
                Referral System & Rewards
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                Manage promo codes, merchant point rewards (100 pts = ৳100 for 1-yr plan, 20 pts = ৳20 monthly), and withdrawal payouts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              if (activeTab === "codes") fetchReferrals();
              else if (activeTab === "usages") fetchUsages();
              else fetchWithdrawals();
            }}
            className="p-2 xs:p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs xs:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Referral Code</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-4">
        {/* Total Codes */}
        <div className="bg-white p-3.5 xs:p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] xs:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Codes
            </p>
            <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 xs:mt-1">
              {stats.totalCodes || 0}
            </h3>
            <span className="text-[10px] xs:text-xs text-slate-400 mt-0.5 inline-block truncate">Active & merchant</span>
          </div>
          <div className="p-2 xs:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 ml-1.5">
            <Tag className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Active Codes */}
        <div className="bg-white p-3.5 xs:p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] xs:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Active Codes
            </p>
            <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5 xs:mt-1">
              {stats.activeCodes || 0}
            </h3>
            <span className="text-[10px] xs:text-xs text-emerald-600/80 mt-0.5 inline-block truncate">Available to redeem</span>
          </div>
          <div className="p-2 xs:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 ml-1.5">
            <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Redemptions */}
        <div className="bg-white p-3.5 xs:p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] xs:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Redemptions
            </p>
            <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 xs:mt-1">
              {stats.totalUses || 0}
            </h3>
            <span className="text-[10px] xs:text-xs text-slate-400 mt-0.5 inline-block truncate">Registered merchants</span>
          </div>
          <div className="p-2 xs:p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 ml-1.5">
            <Users className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Reward Value */}
        <div className="bg-white p-3.5 xs:p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] xs:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Per Subscription
            </p>
            <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-amber-600 mt-0.5 xs:mt-1 truncate">
              20 - 100 Pts
            </h3>
            <span className="text-[10px] xs:text-xs text-amber-600/80 mt-0.5 inline-block truncate">100 pts 1-yr / 20 pts mo</span>
          </div>
          <div className="p-2 xs:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0 ml-1.5">
            <Coins className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 xs:p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Tabs - Scrollable on mobile */}
          <div className="flex items-center gap-1.5 xs:gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => {
                setActiveTab("codes");
                setPage(1);
              }}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === "codes"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Referral Codes
            </button>
            <button
              onClick={() => {
                setActiveTab("usages");
                setPage(1);
              }}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === "usages"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Redemption Logs
            </button>
            <button
              onClick={() => {
                setActiveTab("withdrawals");
                setPage(1);
              }}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "withdrawals"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Banknote className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              <span>Withdrawals (৳)</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xs:gap-3 w-full md:w-auto">
            {activeTab !== "withdrawals" && (
              <div className="relative w-full sm:min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "codes"
                      ? "Search code, campaign, referrer..."
                      : "Search merchant email, store, code..."
                  }
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs xs:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            {activeTab === "codes" && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 text-xs xs:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="expired">Expired Only</option>
              </select>
            )}

            {activeTab === "withdrawals" && (
              <select
                value={withdrawalFilter}
                onChange={(e) => {
                  setWithdrawalFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 text-xs xs:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="all">All Withdrawals</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved / Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: Referral Codes Table */}
        {activeTab === "codes" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Referral Code</th>
                  <th className="py-3.5 px-5">Offer Benefit</th>
                  <th className="py-3.5 px-5">Referrer Reward</th>
                  <th className="py-3.5 px-5">Redemptions</th>
                  <th className="py-3.5 px-5">Campaign / Referrer</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading referral codes...</span>
                      </div>
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No referral codes found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click &ldquo;Create Referral Code&rdquo; above to set up a promo code.
                      </p>
                    </td>
                  </tr>
                ) : (
                  referrals.map((item) => {
                    const isExpired =
                      item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();
                    const isLimitReached =
                      item.maxUses && item.usedCount >= item.maxUses;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs tracking-wider">
                              {item.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(item.code)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === item.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          {item.offerType === "subscription_discount" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              {item.discountValue || 10}{item.discountType === "fixed" ? "৳" : "%"} Off 1st Sub
                            </span>
                          ) : item.offerType === "both" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              +{item.extraDays}d & {item.discountValue || 10}{item.discountType === "fixed" ? "৳" : "%"} Off
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              +{item.extraDays ?? 10} Days Trial
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          {item.isMerchantCode && item.pointsPerReferral > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <Coins className="w-3 h-3 text-amber-600" />
                              +{item.pointsPerReferral} pts (৳{item.pointsPerReferral})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              None (Admin Promo)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-900">
                              {item.usedCount || 0}
                            </span>
                            <span className="text-slate-400 text-xs">
                              / {item.maxUses ? `${item.maxUses} max` : "unlimited"}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="max-w-[220px]">
                            <p className="font-medium text-slate-800 truncate">
                              {item.referrerName || "Platform Wide"}
                              {item.isMerchantCode && (
                                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Merchant
                                </span>
                              )}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5" title={item.description}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              <Clock className="w-3 h-3" /> Expired
                            </span>
                          ) : isLimitReached ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3" /> Limit Reached
                            </span>
                          ) : item.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(item._id)}
                              disabled={actionLoading === item._id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.isActive
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-slate-400 hover:bg-slate-100"
                              }`}
                              title={item.isActive ? "Deactivate" : "Activate"}
                            >
                              {item.isActive ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit code"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {deleteConfirmId === item._id ? (
                              <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                                <button
                                  onClick={() => handleDelete(item._id)}
                                  disabled={actionLoading === item._id}
                                  className="px-2 py-0.5 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-200 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(item._id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Redemption History Table */}
        {activeTab === "usages" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Referred Merchant</th>
                  <th className="py-3.5 px-5">Referrer</th>
                  <th className="py-3.5 px-5">Code Used</th>
                  <th className="py-3.5 px-5">Trial Bonus</th>
                  <th className="py-3.5 px-5">Points Status</th>
                  <th className="py-3.5 px-5">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading redemption logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : usages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No referral registrations yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When merchants sign up using a referral code, their details will be logged here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  usages.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {u.referredUserId?.name || "Merchant"}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {u.referredEmail || u.referredUserId?.email}
                          </p>
                          <p className="text-xs text-slate-400">
                            Store: {u.referredStoreName || u.referredTenantId?.name}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div>
                          <p className="font-medium text-slate-800">
                            {u.referrerTenantId?.name || u.referrerUserId?.name || "Platform"}
                          </p>
                          {u.referrerUserId?.email && (
                            <p className="text-xs text-slate-400 font-mono">
                              {u.referrerUserId.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                          {u.referralCode}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          +{u.extraDaysAwarded || 10} Days Trial
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {u.pointsStatus === "usable" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>+{u.pointsAwarded || 20} pts (Unlocked)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>+{u.pointsAwarded || 20} pts (Pending Sub)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Points Withdrawals Table */}
        {activeTab === "withdrawals" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Merchant Store</th>
                  <th className="py-3.5 px-5">Amount Requested</th>
                  <th className="py-3.5 px-5">Payment Method</th>
                  <th className="py-3.5 px-5">Account Number</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Requested Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading withdrawal requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      <Banknote className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No withdrawal requests found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When merchants convert their usable referral points to Taka, requests will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900">
                          {w.tenantId?.name || "Store"}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {w.userId?.email}
                        </p>
                      </td>

                      <td className="py-4 px-5 font-bold text-slate-900">
                        {w.points} pts (= ৳{w.takaAmount} BDT)
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs">
                          {w.paymentMethod}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-mono text-xs font-bold text-slate-900">
                          {w.accountNumber}
                        </p>
                        {w.accountDetails && (
                          <p className="text-xs text-slate-400 mt-0.5">{w.accountDetails}</p>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {w.status === "approved" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Approved / Paid
                          </span>
                        ) : w.status === "rejected" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                        )}
                        {w.adminFeedback && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            &quot;{w.adminFeedback}&quot;
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs text-slate-500">
                        {w.createdAt ? new Date(w.createdAt).toLocaleString() : "N/A"}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {w.status === "pending" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleProcessWithdrawal(w._id, "approved")}
                              disabled={actionLoading === w._id}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(w._id, "rejected")}
                              disabled={actionLoading === w._id}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium capitalize">
                            {w.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {meta.totalPage > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500 text-xs">
              Showing page {meta.page} of {meta.totalPage} ({meta.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                disabled={page >= meta.totalPage}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-4 xs:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 xs:p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Gift className="w-4 h-4 xs:w-5 xs:h-5" />
                </div>
                <div>
                  <h3 className="text-base xs:text-lg font-bold text-slate-900">
                    {editItem ? "Edit Referral Code" : "Create Referral Code"}
                  </h3>
                  <p className="text-[11px] xs:text-xs text-slate-500">
                    Configure trial days and referrer points rewards
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 xs:p-5 space-y-3.5 xs:space-y-4 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Referral Code <span className="text-rose-500">*</span>
                  </label>
                  {!editItem && (
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Generate Code
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10, PARTNER2026"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Offer Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Offer Type (Reward Facility) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.offerType}
                  onChange={(e) =>
                    setFormData({ ...formData, offerType: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="trial_extension">🕒 Extra Free Trial Days</option>
                  <option value="subscription_discount">💳 1st Subscription Discount</option>
                  <option value="both">🎁 Both (Trial Days + Subscription Discount)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {formData.offerType === "trial_extension" && "Merchants receive bonus trial days upon registration."}
                  {formData.offerType === "subscription_discount" && "Merchants get a discount on their 1st paid subscription package."}
                  {formData.offerType === "both" && "Merchants get both extra trial days and a discount on their 1st subscription."}
                </span>
              </div>

              {/* Conditional Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formData.offerType === "trial_extension" || formData.offerType === "both") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Extra Trial Days <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      placeholder="10"
                      value={formData.extraDays}
                      onChange={(e) =>
                        setFormData({ ...formData, extraDays: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Default: 10 days extra trial
                    </span>
                  </div>
                )}

                {(formData.offerType === "subscription_discount" || formData.offerType === "both") && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Discount Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({ ...formData, discountType: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="percentage">% Percentage Discount</option>
                        <option value="fixed">৳ Fixed Amount (BDT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Discount Value <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder={formData.discountType === "percentage" ? "10" : "500"}
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValue: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-emerald-600"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {formData.discountType === "percentage" ? "e.g. 10% off 1st subscription" : "e.g. ৳500 off 1st subscription"}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Merchant Referrer Points (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 (Platform Promo)"
                    value={formData.pointsPerReferral}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsPerReferral: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-amber-600"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    0 for Admin / Platform codes (admin earns no points). 20+ for merchant partner codes.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Max Redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Referrer / Partner Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / Summer Campaign / Facebook Ads"
                  value={formData.referrerName}
                  onChange={(e) =>
                    setFormData({ ...formData, referrerName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes about this referral campaign..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Active Status</p>
                  <p className="text-xs text-slate-500">
                    Allow new merchants to redeem this code during registration
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "saving"}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading === "saving" && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editItem ? "Save Changes" : "Create Code"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
