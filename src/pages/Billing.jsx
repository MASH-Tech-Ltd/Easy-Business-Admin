import {
  CreditCard,
  DollarSign,
  Clock,
  Check,
  X,
  ExternalLink,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  Wallet,
  RefreshCw,
  Eye,
  Zap,
  FileText,
  Download,
  Info,
  TrendingUp,
  BarChart3,
  Layers,
} from "lucide-react";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  useGetBillingOverviewQuery,
  useGetAllSubscriptionsQuery,
} from "../store/apiSlice";
import React from "react";

const Billing = () => {
  const [activeTab, setActiveTab] = useState("subscriptions"); // 'subscriptions' | 'paymentSubmissions'
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Modals for Revenue & PDF
  const [showRevenueDetailsModal, setShowRevenueDetailsModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfReportType, setPdfReportType] = useState("monthly"); // 'monthly' | 'yearly' | 'custom'
  const [pdfYear, setPdfYear] = useState(new Date().getFullYear().toString());
  const [pdfMonth, setPdfMonth] = useState((new Date().getMonth() + 1).toString());
  const [pdfStartDate, setPdfStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [pdfEndDate, setPdfEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Modal state
  const [editingSub, setEditingSub] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editForm, setEditForm] = useState({
    startDate: "",
    endDate: "",
    status: "",
  });

  // Manual payment submissions state
  const [paymentSubmissions, setPaymentSubmissions] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [verifyModalItem, setVerifyModalItem] = useState(null);
  const [verifyStatusAction, setVerifyStatusAction] = useState("approved");
  const [adminFeedback, setAdminFeedback] = useState("");

  const fetchPaymentSubmissions = async () => {
    try {
      setLoadingPayments(true);
      const res = await api.get("/billing/all-payments");
      const rawData = res.data?.data || res.data;
      const dataArr = Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData)
          ? rawData
          : [];
      setPaymentSubmissions(dataArr);
    } catch (err) {
      console.error("Failed to load payment submissions", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPaymentSubmissions();
  }, []);

  const handleVerifySubmission = async (e) => {
    e.preventDefault();
    if (!verifyModalItem) return;
    setActionLoading(verifyModalItem._id);
    try {
      await api.put(`/billing/verify-payment/${verifyModalItem._id}`, {
        status: verifyStatusAction,
        adminFeedback,
      });
      toast.success(`Payment submission mark as ${verifyStatusAction}!`);
      setVerifyModalItem(null);
      setAdminFeedback("");
      fetchPaymentSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify submission");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingPaymentsCount = Array.isArray(paymentSubmissions)
    ? paymentSubmissions.filter((p) => p?.status === "pending").length
    : 0;

  // RTK Query Hooks
  const {
    data: billingOverviewRes,
    isLoading: billingLoading,
    refetch: refetchOverview,
  } = useGetBillingOverviewQuery({
    year: filterYear,
    month: filterMonth,
  });
  const {
    data: subscriptionsRes,
    isLoading: subsLoading,
    refetch: refetchSubs,
  } = useGetAllSubscriptionsQuery({
    page,
    limit: 10,
    search,
    status: filterStatus,
    sortBy: sortOrder,
    year: filterYear,
    month: filterMonth,
  });

  const billingData = billingOverviewRes?.data || null;
  const rawSubsData = subscriptionsRes?.data || subscriptionsRes;
  const subscriptions = Array.isArray(rawSubsData?.data)
    ? rawSubsData.data
    : Array.isArray(rawSubsData)
      ? rawSubsData
      : [];
  const meta = rawSubsData?.meta || subscriptionsRes?.meta || {
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  };
  const loading = billingLoading || subsLoading;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const fetchData = () => {
    refetchOverview();
    refetchSubs();
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("refresh_subscriptions", fetchData);

    return () => {
      socket.off("refresh_subscriptions", fetchData);
    };
  }, [socket]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/subscriptions/approve/${id}`);
      toast.success("Subscription approved successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/subscriptions/reject/${id}`);
      toast.success("Subscription rejected");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
      setActionLoading(null);
    }
  };

  const handleActivateNow = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/subscriptions/activate-early/${id}`);
      toast.success("Subscription activated immediately with zero time gap!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to activate subscription early");
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const params = {
        type: pdfReportType,
      };
      if (pdfReportType === "monthly") {
        params.year = pdfYear;
        params.month = pdfMonth;
      } else if (pdfReportType === "yearly") {
        params.year = pdfYear;
      } else if (pdfReportType === "custom") {
        params.startDate = pdfStartDate;
        params.endDate = pdfEndDate;
      }

      const res = await api.get("/billing/revenue-report", { params });
      const report = res.data?.data || res.data;
      const { summary, items } = report || {};

      if (!items || items.length === 0) {
        toast.info("No subscription earnings found for the selected period.");
        setGeneratingPdf(false);
        return;
      }

      const doc = new jsPDF();

      // Platform Brand Header
      doc.setFillColor(80, 34, 195);
      doc.rect(0, 0, 210, 24, "F");

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("MASH ECO - MULTI-TENANT PLATFORM", 14, 11);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Super Admin Revenue & Financial Report", 14, 18);

      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 18, { align: "right" });

      // Report Period & Overview Title
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`Revenue Report Period: ${summary?.periodLabel || "All Time"}`, 14, 34);

      // Metric Summary Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, 182, 22, 3, 3, "FD");

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("TOTAL NET REVENUE", 20, 45);
      doc.text("GROSS CATALOG VALUE", 70, 45);
      doc.text("TOTAL DISCOUNTS", 125, 45);
      doc.text("SUBSCRIPTIONS", 168, 45);

      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.text(`BDT ${(summary?.totalRevenue || 0).toLocaleString()}`, 20, 54);

      doc.setTextColor(15, 23, 42);
      doc.text(`BDT ${(summary?.totalGross || 0).toLocaleString()}`, 70, 54);

      doc.setTextColor(239, 68, 68);
      doc.text(`BDT ${(summary?.totalDiscounts || 0).toLocaleString()}`, 125, 54);

      doc.setTextColor(79, 70, 229);
      doc.text(`${summary?.totalTransactions || 0}`, 168, 54);

      // Table columns & rows
      const tableColumns = [
        "#",
        "Date",
        "Store Name",
        "Domain / Email",
        "Package",
        "Cycle",
        "Original",
        "Discount",
        "Net Paid",
        "Status",
      ];

      const tableRows = items.map((item, index) => [
        index + 1,
        item.date ? new Date(item.date).toLocaleDateString() : "-",
        item.tenantName || "Store",
        item.tenantDomain || item.tenantEmail || "-",
        item.packageName || "Package",
        item.billingCycle || "monthly",
        `BDT ${item.originalPrice || 0}`,
        item.discountAmount > 0 ? `BDT ${item.discountAmount}` : "-",
        `BDT ${item.paidAmount || 0}`,
        item.status ? item.status.toUpperCase() : "ACTIVE",
      ]);

      // Grand Total Row
      tableRows.push([
        { content: "GRAND TOTAL NET REVENUE", colSpan: 8, styles: { halign: "right", fontStyle: "bold" } },
        { content: `BDT ${(summary?.totalRevenue || 0).toLocaleString()}`, styles: { fontStyle: "bold", textColor: [16, 185, 129] } },
        "",
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 65,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [80, 34, 195], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: "grid",
        margin: { left: 14, right: 14 },
      });

      // Page numbering footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount} | MASH ECO Revenue Financial Report`,
          105,
          290,
          { align: "center" }
        );
      }

      const safePeriodName = (summary?.periodLabel || "report").replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`MashEco_Revenue_Report_${safePeriodName}.pdf`);
      toast.success("Revenue PDF report downloaded successfully!");
      setShowPdfModal(false);
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      toast.error(err.response?.data?.message || "Failed to generate PDF report");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id) => {
    setActionLoading(id);
    try {
      await api.delete(`/subscriptions/delete/${id}`);
      toast.success("Subscription deleted");
      setEditingSub(null);
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
      setActionLoading(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(editingSub._id);
    try {
      await api.put(`/subscriptions/update/${editingSub._id}`, editForm);
      toast.success("Subscription updated successfully");
      setEditingSub(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const openManageModal = (sub) => {
    setEditingSub(sub);
    setEditForm({
      startDate: sub.startDate
        ? new Date(sub.startDate).toISOString().slice(0, 10)
        : "",
      endDate: sub.endDate
        ? new Date(sub.endDate).toISOString().slice(0, 10)
        : "",
      status: sub.status || "active",
      activateNextImmediately: false,
    });
  };

  const pendingCount = subscriptions.filter(
    (s) => s.status === "pending",
  ).length;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-8 w-full pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Billing & Subscriptions
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Manage tenant subscriptions, approve requests, and monitor revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Total Merchants</h3>
            <CreditCard className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">
            {billingData?.totalMerchants || "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">
              Active Subscriptions
            </h3>
            <Check className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">
            {billingData?.activeSubscriptions || "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex justify-between mb-2 relative z-10">
            <h3 className="font-semibold text-slate-600">Pending Requests</h3>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-2"></div>
          </div>
          <p className="text-4xl font-bold text-slate-800 relative z-10">
            {billingData?.pendingInvoices || "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-slate-700 text-sm">
                    {billingData?.hasFilter ? "Filtered Revenue" : "Revenue (Total)"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRevenueDetailsModal(true)}
                    className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View Full Financial & Revenue Details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                {billingData?.hasFilter && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <Calendar className="w-2.5 h-2.5" />
                    {billingData.filteredPeriodLabel}
                  </span>
                )}
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base border border-emerald-100 shadow-2xs">
                ৳
              </div>
            </div>

            <div className="mt-1">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ৳
                {(billingData?.hasFilter
                  ? billingData?.filteredRevenue
                  : billingData?.totalRevenue
                )?.toLocaleString() || "0"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {billingData?.hasFilter
                  ? `Net collected in ${billingData.filteredPeriodLabel} (${billingData.filteredCount || 0} subscriptions)`
                  : "Net collected all-time across all subscriptions"}
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium">This Month</span>
                <span className="text-emerald-700 font-bold">
                  ৳{billingData?.thisMonthRevenue?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium">Monthly MRR</span>
                <span className="text-indigo-600 font-bold">
                  ৳{billingData?.mrr?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
              <span>{billingData?.hasFilter ? "All-Time Total:" : "This Year Total:"}</span>
              <span className="font-bold text-slate-700">
                ৳{(billingData?.hasFilter ? billingData?.totalRevenue : billingData?.thisYearRevenue)?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between bg-slate-50 gap-4">
          <h3 className="font-bold text-slate-800 text-lg whitespace-nowrap">
            Subscription Management
          </h3>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
            {/* Year & Month Filter (Red Box 1) */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                title="Filter by Year"
              >
                <option value="">All Years</option>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

              <span className="text-slate-300">|</span>

              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                title="Filter by Month"
              >
                <option value="">All Months</option>
                <option value="1">Jan (01)</option>
                <option value="2">Feb (02)</option>
                <option value="3">Mar (03)</option>
                <option value="4">Apr (04)</option>
                <option value="5">May (05)</option>
                <option value="6">Jun (06)</option>
                <option value="7">Jul (07)</option>
                <option value="8">Aug (08)</option>
                <option value="9">Sep (09)</option>
                <option value="10">Oct (10)</option>
                <option value="11">Nov (11)</option>
                <option value="12">Dec (12)</option>
              </select>

              {(filterYear || filterMonth) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterYear("");
                    setFilterMonth("");
                    setPage(1);
                  }}
                  className="ml-1 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                  title="Clear Date Filters"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Download PDF Button (Red Box 2) */}
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all shrink-0 active:scale-98"
              title="Download Revenue PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-grow min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search store name or domain..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default Sort</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tenant / Store</th>
                <th className="px-6 py-4">Package Requested</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Expire Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub._id}
                    className={`hover:bg-slate-50 transition-colors ${sub.status === "pending" ? "bg-amber-50/20" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {sub.tenantId?.name || "Unknown Store"}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {sub.tenantId?.contactEmail ||
                          sub.tenantId?.ownerId?.email ||
                          sub.tenantId?.contactPhone ||
                          "No contact info"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600 flex items-center gap-1.5 flex-wrap">
                        <span>
                          {sub.isTrial
                            ? "Free Trial"
                            : sub.packageId?.name || "Unknown Package"}
                        </span>
                        {!sub.isTrial && sub.discountApplied && Number(sub.paidAmount) < Number(sub.originalPrice || sub.packageId?.price || 0) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {sub.discountApplied.discountType === "fixed"
                              ? `৳${sub.discountApplied.discountValue || sub.discountApplied.discountAmount} Off`
                              : `${sub.discountApplied.discountValue}% Off`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {sub.isTrial ? (
                          "Free / Trial period"
                        ) : sub.discountApplied && Number(sub.paidAmount) < Number(sub.originalPrice || sub.packageId?.price || 0) ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="line-through text-slate-400">
                                ৳{sub.originalPrice || sub.packageId?.price || 0}
                              </span>
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Paid: ৳{sub.paidAmount}
                              </span>
                              <span className="text-slate-400">
                                / {sub.packageId?.billingCycle || "monthly"}
                              </span>
                            </div>
                            {sub.discountApplied?.reason && (
                              <span className="text-[10px] text-emerald-600 font-medium">
                                ({sub.discountApplied.reason})
                              </span>
                            )}
                          </div>
                        ) : (
                          `৳${sub.paidAmount ?? sub.packageId?.price ?? 0} / ${sub.packageId?.billingCycle || "monthly"}`
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const now = new Date();
                        const isQueued = sub.status === "active" && sub.startDate && new Date(sub.startDate) > now;
                        const tenantIdStr = sub.tenantId?._id?.toString() || sub.tenantId?.toString();
                        const hasRunningActive = sub.hasRunningActivePlan !== undefined
                          ? sub.hasRunningActivePlan
                          : subscriptions.some((s) => {
                              const sTenantIdStr = s.tenantId?._id?.toString() || s.tenantId?.toString();
                              if (sTenantIdStr !== tenantIdStr || s._id === sub._id) return false;
                              return (
                                s.status === "active" &&
                                s.startDate &&
                                new Date(s.startDate) <= now &&
                                s.endDate &&
                                new Date(s.endDate) >= now
                              );
                            });

                        return (
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                              ${
                                sub.status === "pending"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : isQueued
                                    ? "bg-purple-50 text-[#5022C3] border-purple-200"
                                    : sub.status === "active"
                                      ? "bg-green-50 text-green-600 border-green-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {sub.status === "pending" && (
                                <Clock className="w-3 h-3" />
                              )}
                              {isQueued && (
                                <RefreshCw className="w-3 h-3 text-[#5022C3]" />
                              )}
                              {sub.status === "active" && !isQueued && (
                                <Check className="w-3 h-3" />
                              )}
                              {sub.status === "cancelled" && (
                                <X className="w-3 h-3" />
                              )}
                              {sub.status === "expired" && (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {isQueued ? "Renewed (Queued)" : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                            </span>
                            {isQueued && (
                              <span className={`text-[10px] font-semibold pl-1 ${hasRunningActive ? "text-purple-600" : "text-amber-600"}`}>
                                {hasRunningActive ? "Starts after current plan" : "Current plan inactive / gap"}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {sub.startDate
                        ? new Date(sub.startDate).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short", day: "numeric" },
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {sub.endDate
                        ? new Date(sub.endDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(sub._id)}
                            disabled={actionLoading === sub._id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Approve Request"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(sub._id)}
                            disabled={actionLoading === sub._id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-1.5">
                          {(() => {
                            const now = new Date();
                            const isQueued = sub.status === "active" && sub.startDate && new Date(sub.startDate) > now;
                            const tenantIdStr = sub.tenantId?._id?.toString() || sub.tenantId?.toString();
                            const hasRunningActive = sub.hasRunningActivePlan !== undefined
                              ? sub.hasRunningActivePlan
                              : subscriptions.some((s) => {
                                  const sTenantIdStr = s.tenantId?._id?.toString() || s.tenantId?.toString();
                                  if (sTenantIdStr !== tenantIdStr || s._id === sub._id) return false;
                                  return (
                                    s.status === "active" &&
                                    s.startDate &&
                                    new Date(s.startDate) <= now &&
                                    s.endDate &&
                                    new Date(s.endDate) >= now
                                  );
                                });
                            const canActivateNow = sub.canActivateEarly !== undefined
                              ? sub.canActivateEarly
                              : (isQueued && !hasRunningActive);

                            return (
                              <>
                                {canActivateNow && (
                                  <button
                                    onClick={() => handleActivateNow(sub._id)}
                                    disabled={actionLoading === sub._id}
                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    title="Current plan is inactive. Activate this plan immediately today with zero gap"
                                  >
                                    <Zap className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                    Activate Now
                                  </button>
                                )}
                              </>
                            );
                          })()}
                          <button
                            onClick={() => openManageModal(sub)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Manage{" "}
                            <ExternalLink className="w-3 h-3 ml-1.5 text-slate-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta.total > 0 && (
          <div className="px-6 py-4 bg-white/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium">
                {subscriptions.length > 0
                  ? (meta.page - 1) * meta.limit + 1
                  : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              of <span className="font-medium">{meta.total}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium text-slate-700 px-4">
                Page {meta.page} of {meta.totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden p-6 text-center transform transition-all">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Subscription?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to delete this subscription? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex-1"
                disabled={actionLoading === deleteConfirmId}
              >
                Cancel
              </button>
              <button
                onClick={() => executeDelete(deleteConfirmId)}
                className="px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors flex-1 flex items-center justify-center gap-2"
                disabled={actionLoading === deleteConfirmId}
              >
                {actionLoading === deleteConfirmId ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Manage Subscription</h3>
              <button
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Store:</span>
                  <span className="font-bold text-slate-800">{editingSub.tenantId?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Package:</span>
                  <span className="font-bold text-blue-600">{editingSub.isTrial ? "Free Trial" : editingSub.packageId?.name || "N/A"}</span>
                </div>
                {!editingSub.isTrial && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Package Price:</span>
                      <span className="font-semibold text-slate-700">৳{editingSub.originalPrice || editingSub.packageId?.price || 0}</span>
                    </div>
                    {editingSub.discountApplied && Number(editingSub.paidAmount) < Number(editingSub.originalPrice || editingSub.packageId?.price || 0) && (
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-700 font-medium">Discount Applied:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px]">
                          {editingSub.discountApplied.discountType === "fixed"
                            ? `৳${editingSub.discountApplied.discountValue || editingSub.discountApplied.discountAmount} Off`
                            : `${editingSub.discountApplied.discountValue}% Off`}
                          {editingSub.discountApplied.reason ? ` (${editingSub.discountApplied.reason})` : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-800 font-bold">User Paid Amount:</span>
                      <span className="font-black text-sm text-emerald-600">৳{editingSub.paidAmount ?? editingSub.packageId?.price ?? 0}</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>

                {editForm.status === 'cancelled' && (
                  <label className="flex items-center gap-2 mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.activateNextImmediately)}
                      onChange={(e) =>
                        setEditForm({ ...editForm, activateNextImmediately: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Immediately activate next queued plan (No time gap)</span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, startDate: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endDate: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDelete(editingSub._id)}
                  disabled={actionLoading === editingSub._id}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSub(null)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === editingSub._id}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading === editingSub._id
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue & Financial Breakdown Details Modal */}
      {showRevenueDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  ৳
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Platform Revenue & Financial Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed earnings metrics, discounts, and recurring revenue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRevenueDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Highlight Banner if Filter is Active */}
              {billingData?.hasFilter && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Filtered Period: {billingData.filteredPeriodLabel}
                    </span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {billingData.filteredCount || 0} Subscriptions
                    </span>
                  </div>
                  <div className="text-2xl font-black text-blue-900 mt-1">
                    ৳{(billingData.filteredRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 flex justify-between pt-1 border-t border-blue-200/60 mt-1">
                    <span>Catalog Gross: ৳{(billingData.filteredGrossRevenue || 0).toLocaleString()}</span>
                    <span>Discounts: ৳{(billingData.filteredDiscounts || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* 4 Primary Financial Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">Total Net Revenue (All-Time)</span>
                  <span className="text-xl font-black text-slate-900 mt-1">
                    ৳{(billingData?.totalRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Real collected cash across platform</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">Gross Catalog Value</span>
                  <span className="text-xl font-black text-slate-700 mt-1">
                    ৳{(billingData?.grossRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Original retail package value</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">Discounts Granted</span>
                  <span className="text-xl font-black text-rose-600 mt-1">
                    ৳{(billingData?.totalDiscounts || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Savings provided via referral/promo</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">Monthly MRR</span>
                  <span className="text-xl font-black text-indigo-600 mt-1">
                    ৳{(billingData?.mrr || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Recurring income from active subscribers</span>
                </div>
              </div>

              {/* Periodic Breakdowns */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                  Periodic Breakdown
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-600">This Month's Collections</span>
                    <span className="font-bold text-emerald-600 text-sm">৳{(billingData?.thisMonthRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-600">This Year's Collections ({new Date().getFullYear()})</span>
                    <span className="font-bold text-slate-800 text-sm">৳{(billingData?.thisYearRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-600">Active Paid Subscriptions</span>
                    <span className="font-bold text-slate-800 text-sm">{billingData?.activeSubscriptions || 0} Stores</span>
                  </div>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-950">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  How is Revenue calculated?
                </div>
                <p className="text-[11px] text-amber-800">
                  • <strong>Net Revenue</strong> is the actual cash received for subscription packages after subtracting any claimed referral or promotional discounts.
                </p>
                <p className="text-[11px] text-amber-800">
                  • <strong>MRR (Monthly Recurring Revenue)</strong> calculates regular monthly income from active subscribers (Yearly subscriptions are divided by 12).
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowRevenueDetailsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Revenue PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-red-50 to-rose-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Download Revenue PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export full revenue & earnings financial report
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Report Type Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Report Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPdfReportType("monthly")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      pdfReportType === "monthly"
                        ? "bg-white text-red-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfReportType("yearly")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      pdfReportType === "yearly"
                        ? "bg-white text-red-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfReportType("custom")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      pdfReportType === "custom"
                        ? "bg-white text-red-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Monthly Inputs */}
              {pdfReportType === "monthly" && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Select Year
                    </label>
                    <select
                      value={pdfYear}
                      onChange={(e) => setPdfYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="2027">2027</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Select Month
                    </label>
                    <select
                      value={pdfMonth}
                      onChange={(e) => setPdfMonth(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="1">January (01)</option>
                      <option value="2">February (02)</option>
                      <option value="3">March (03)</option>
                      <option value="4">April (04)</option>
                      <option value="5">May (05)</option>
                      <option value="6">June (06)</option>
                      <option value="7">July (07)</option>
                      <option value="8">August (08)</option>
                      <option value="9">September (09)</option>
                      <option value="10">October (10)</option>
                      <option value="11">November (11)</option>
                      <option value="12">December (12)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Yearly Input */}
              {pdfReportType === "yearly" && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Select Year
                  </label>
                  <select
                    value={pdfYear}
                    onChange={(e) => setPdfYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              )}

              {/* Custom Date Range Inputs */}
              {pdfReportType === "custom" && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={pdfStartDate}
                      onChange={(e) => setPdfStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={pdfEndDate}
                      onChange={(e) => setPdfEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Preview info badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                <span className="text-slate-500 font-medium">Report Scope:</span>
                <span className="font-bold text-slate-800">
                  {pdfReportType === "monthly"
                    ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(pdfMonth)-1]} ${pdfYear}`
                    : pdfReportType === "yearly"
                    ? `Full Year ${pdfYear}`
                    : `${pdfStartDate} to ${pdfEndDate}`}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                disabled={generatingPdf}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {generatingPdf ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate & Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Billing);
