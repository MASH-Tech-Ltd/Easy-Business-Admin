import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Copy,
  Check,
  Building2,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Sparkles,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Download,
  Info,
  TrendingUp,
  BarChart3,
  X,
  Mail,
  MailCheck,
  Send,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useGetAllPaymentSubmissionsQuery } from "../store/apiSlice";
import { MFSLogo } from "../components/MFSLogo";

export default function PaymentVerifications() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modal State for Verification / Rejection
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    payment: null,
    action: "approved", // 'approved' | 'rejected'
    adminFeedback: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: paymentsRes,
    isLoading: loading,
    refetch: fetchPayments,
  } = useGetAllPaymentSubmissionsQuery({
    search: debouncedSearch,
    status: filterStatus,
    provider: filterProvider,
    page,
    limit: 10,
    year: filterYear,
    month: filterMonth,
  });

  const { socket } = useSocket();

  // Listen to socket notifications
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchPayments();
    socket.on("refresh_subscriptions", handleRefresh);
    socket.on("new_notification", handleRefresh);
    return () => {
      socket.off("refresh_subscriptions", handleRefresh);
      socket.off("new_notification", handleRefresh);
    };
  }, [socket, fetchPayments]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Transaction ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openActionModal = (payment, action) => {
    setActionModal({
      isOpen: true,
      payment,
      action,
      adminFeedback: payment.adminFeedback || "",
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      payment: null,
      action: "approved",
      adminFeedback: "",
    });
  };

  // Email sending state & handler
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const handleSendEmail = async (payment) => {
    if (!payment || !payment._id) return;
    try {
      setSendingEmailId(payment._id);
      const res = await api.post(
        `/billing/payments/${payment._id}/send-confirmation-email`
      );
      const sentTo = res.data?.data?.sentTo ? ` to ${res.data.data.sentTo}` : "";
      toast.success(res.data?.message || `Confirmation email sent${sentTo}!`);
      fetchPayments();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send confirmation email"
      );
    } finally {
      setSendingEmailId(null);
    }
  };

  // Delete modal state & 3-second hold handler
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    payment: null,
  });
  const [deleteHoldProgress, setDeleteHoldProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);

  const openDeleteModal = (payment) => {
    setDeleteModal({
      isOpen: true,
      payment,
    });
    setDeleteHoldProgress(0);
    setIsHolding(false);
    setIsDeleting(false);
  };

  const closeDeleteModal = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setDeleteModal({
      isOpen: false,
      payment: null,
    });
    setDeleteHoldProgress(0);
    setIsHolding(false);
    setIsDeleting(false);
  };

  const executeDelete = async (paymentId) => {
    try {
      setIsDeleting(true);
      const res = await api.delete(`/billing/payments/${paymentId}`);
      toast.success(
        res.data?.message || "Payment history deleted successfully"
      );
      closeDeleteModal();
      fetchPayments();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete payment history"
      );
      setIsDeleting(false);
      setDeleteHoldProgress(0);
    }
  };

  const handleHoldStart = (e) => {
    if (e && e.type === "touchstart") {
      // touch event
    }
    if (isDeleting || !deleteModal.payment) return;

    setIsHolding(true);
    holdStartRef.current = Date.now();
    const duration = 3000; // 3 seconds

    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setDeleteHoldProgress(progress);

      if (elapsed >= duration) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setIsHolding(false);
        setDeleteHoldProgress(100);
        executeDelete(deleteModal.payment._id);
      }
    }, 20);
  };

  const handleHoldEnd = () => {
    if (isDeleting) return;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    setDeleteHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const { payment, action, adminFeedback } = actionModal;
    if (!payment) return;

    try {
      setActionLoading(true);
      const res = await api.put(`/billing/verify-payment/${payment._id}`, {
        status: action,
        adminFeedback: adminFeedback.trim() || undefined,
      });

      if (res.data?.success || res.data?.status === "ok") {
        toast.success(
          `Payment submission successfully marked as ${action.toUpperCase()}!`,
        );
        closeActionModal();
        fetchPayments();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || `Failed to update payment status`,
      );
    } finally {
      setActionLoading(false);
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

      const res = await api.get("/billing/payment-proofs-report", { params });
      const report = res.data?.data || res.data;
      const { summary, items } = report || {};

      if (!items || items.length === 0) {
        toast.info("No payment submissions found for the selected period.");
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
      doc.text("Merchant Payment Proofs (TrxID) Verification Report", 14, 18);

      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 18, { align: "right" });

      // Report Period Title
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`Report Period: ${summary?.periodLabel || "All Time"}`, 14, 34);

      // Metric Summary Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, 182, 22, 3, 3, "FD");

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("TOTAL VERIFIED REVENUE", 20, 45);
      doc.text("PENDING REVIEW", 75, 45);
      doc.text("APPROVED PROOFS", 125, 45);
      doc.text("VALID SUBMISSIONS", 162, 45);

      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.text(`BDT ${(summary?.totalRevenue || 0).toLocaleString()}`, 20, 54);

      doc.setTextColor(217, 119, 6);
      doc.text(`BDT ${(summary?.totalPending || 0).toLocaleString()}`, 75, 54);

      doc.setTextColor(79, 70, 229);
      doc.text(`${summary?.approvedCount || 0}`, 125, 54);

      const validCount = summary?.validSubmissions ?? ((summary?.approvedCount || 0) + (summary?.pendingCount || 0));
      doc.setTextColor(15, 23, 42);
      doc.text(`${validCount}`, 162, 53);

      if ((summary?.rejectedCount || 0) > 0) {
        doc.setFontSize(6.5);
        doc.setTextColor(220, 38, 38);
        doc.setFont("helvetica", "bold");
        doc.text(`(${summary.rejectedCount} Rejected Excluded)`, 162, 58);
      }

      // Table columns & rows
      const tableColumns = [
        "#",
        "Date",
        "Store Name",
        "Purpose",
        "Method",
        "Sender Number",
        "TrxID",
        "Amount",
        "Status",
      ];

      const tableRows = items.map((item, index) => {
        const isRejected = item.status === "rejected";
        const isApproved = item.status === "approved";
        return [
          {
            content: `${index + 1}`,
            styles: isRejected
              ? { textColor: [220, 38, 38], fontStyle: "bold", fillColor: [254, 242, 242] }
              : {},
          },
          {
            content: item.date ? new Date(item.date).toLocaleDateString() : "-",
            styles: isRejected ? { fillColor: [254, 242, 242] } : {},
          },
          {
            content: item.tenantName || "Store",
            styles: isRejected ? { fillColor: [254, 242, 242], textColor: [100, 116, 139] } : {},
          },
          {
            content: item.purpose || "Subscription",
            styles: isRejected ? { fillColor: [254, 242, 242] } : {},
          },
          {
            content: item.provider || "MFS",
            styles: isRejected ? { fillColor: [254, 242, 242] } : {},
          },
          {
            content: item.senderNumber || "-",
            styles: isRejected ? { fillColor: [254, 242, 242] } : {},
          },
          {
            content: item.transactionId || "-",
            styles: isRejected ? { fillColor: [254, 242, 242] } : {},
          },
          {
            content: isRejected
              ? `BDT 0\n(BDT ${item.amount || 0} REJECTED - NOT COUNTED)`
              : `BDT ${(item.amount || 0).toLocaleString()}`,
            styles: isRejected
              ? {
                  textColor: [220, 38, 38],
                  fontStyle: "bold",
                  fillColor: [254, 242, 242],
                }
              : { fontStyle: "bold", textColor: [15, 23, 42] },
          },
          {
            content: isRejected
              ? "REJECTED (NOT COUNTED)"
              : isApproved
              ? "APPROVED"
              : "PENDING",
            styles: isRejected
              ? {
                  textColor: [220, 38, 38],
                  fontStyle: "bold",
                  fillColor: [254, 226, 226],
                }
              : isApproved
              ? { textColor: [16, 185, 129], fontStyle: "bold" }
              : { textColor: [217, 119, 6], fontStyle: "bold" },
          },
        ];
      });

      // Grand Total Row (strictly excludes rejected)
      tableRows.push([
        {
          content: "GRAND TOTAL VERIFIED REVENUE (EXCL. REJECTED)",
          colSpan: 7,
          styles: { halign: "right", fontStyle: "bold" },
        },
        {
          content: `BDT ${(summary?.totalRevenue || 0).toLocaleString()}`,
          styles: { fontStyle: "bold", textColor: [16, 185, 129] },
        },
        "",
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 65,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: {
          fillColor: [80, 34, 195],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: "grid",
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index < items.length) {
            const rowItem = items[data.row.index];
            if (rowItem && rowItem.status === "rejected") {
              // Highlight entire rejected row with light red background
              data.cell.styles.fillColor = [254, 242, 242];
              if (data.column.index === 0 || data.column.index === 7 || data.column.index === 8) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = "bold";
              }
              if (data.column.index === 8) {
                data.cell.styles.fillColor = [254, 226, 226];
              }
            }
          }
        },
      });

      // Page numbers footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount} | MASH ECO Payment Proofs Verification Report`,
          105,
          290,
          { align: "center" }
        );
      }

      const safePeriodName = (summary?.periodLabel || "report").replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`MashEco_Payment_Proofs_${safePeriodName}.pdf`);
      toast.success("Payment proofs PDF report downloaded successfully!");
      setShowPdfModal(false);
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      toast.error(err.response?.data?.message || "Failed to generate PDF report");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Handle both server-paginated { data: { data: [...], meta, stats } } and legacy unpaginated array
  const isServerPaginated = Boolean(paymentsRes?.data?.meta);
  const rawList = paymentsRes?.data?.data || paymentsRes?.data || [];
  const paymentsList = Array.isArray(rawList) ? rawList : [];

  const filteredPayments = isServerPaginated
    ? paymentsList
    : paymentsList.filter((p) => {
        const storeName = p.tenantId?.name || p.tenantId?.domain || "";
        const matchesSearch =
          storeName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.transactionId
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          p.senderNumber
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          p.purposeTitle?.toLowerCase().includes(debouncedSearch.toLowerCase());

        const matchesStatus =
          filterStatus === "all" || p.status === filterStatus;
        const matchesProvider =
          filterProvider === "all" ||
          p.provider?.toLowerCase() === filterProvider.toLowerCase();

        return matchesSearch && matchesStatus && matchesProvider;
      });

  const meta = isServerPaginated
    ? paymentsRes?.data?.meta || {
        page,
        limit: 10,
        total: paymentsList.length,
        totalPages: Math.ceil(paymentsList.length / 10) || 1,
      }
    : {
        page,
        limit: 10,
        total: filteredPayments.length,
        totalPages: Math.ceil(filteredPayments.length / 10) || 1,
      };

  const displayPayments = isServerPaginated
    ? paymentsList
    : filteredPayments.slice((page - 1) * 10, page * 10);

  // Summary Stats
  const serverStats = paymentsRes?.data?.stats;
  const pendingCount =
    serverStats?.pendingCount ??
    paymentsList.filter((p) => p.status === "pending").length;
  const approvedCount =
    serverStats?.approvedCount ??
    paymentsList.filter((p) => p.status === "approved").length;
  const rejectedCount =
    serverStats?.rejectedCount ??
    paymentsList.filter((p) => p.status === "rejected").length;
  // Exclude rejected proofs from the total count
  const totalCount =
    serverStats?.validCount ??
    (approvedCount + pendingCount);
  const approvedRevenue =
    serverStats?.approvedRevenue ??
    paymentsList
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8 w-full pb-10">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Payment Proof Verifications (TrxID)
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Verify merchant transaction IDs, sender numbers, and approve add-on &
          subscription activations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold text-slate-600">Total Submissions</h3>
              <CreditCard className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-slate-800">{totalCount}</p>
              {rejectedCount > 0 && (
                <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {rejectedCount} Rejected (Not Counted)
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Valid active proofs (Approved + Pending)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex justify-between mb-2 relative z-10">
            <h3 className="font-semibold text-slate-600">Pending Review</h3>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-2"></div>
          </div>
          <p className="text-4xl font-bold text-slate-800 relative z-10">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-600">Approved Proofs</h3>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-slate-800">{approvedCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-slate-700 text-sm">
                    {serverStats?.hasFilter ? "Filtered Revenue" : "Revenue (Verified)"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRevenueDetailsModal(true)}
                    className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View Full Payment Proofs Revenue Details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                {serverStats?.hasFilter && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <Calendar className="w-2.5 h-2.5" />
                    {serverStats.filteredPeriodLabel}
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
                {(serverStats?.hasFilter
                  ? serverStats?.filteredApprovedRevenue
                  : serverStats?.approvedRevenue ?? approvedRevenue
                )?.toLocaleString() || "0"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {serverStats?.hasFilter
                  ? `Verified from ${serverStats.filteredApprovedCount || 0} proofs in ${serverStats.filteredPeriodLabel}`
                  : `Total verified from ${serverStats?.approvedCount ?? approvedCount} approved proofs`}
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium">This Month</span>
                <span className="text-emerald-700 font-bold">
                  ৳{(serverStats?.thisMonthRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium">Pending Review</span>
                <span className="text-amber-600 font-bold">
                  ৳{(serverStats?.pendingRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
              <span>{serverStats?.hasFilter ? "All-Time Verified:" : "This Year Verified:"}</span>
              <span className="font-bold text-slate-700">
                ৳{(serverStats?.hasFilter ? serverStats?.approvedRevenue : serverStats?.thisYearRevenue ?? approvedRevenue)?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between bg-slate-50 gap-4">
          <h3 className="font-bold text-slate-800 text-lg whitespace-nowrap">
            Merchant Payment Proofs (TrxID)
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
              title="Download Payment Proofs PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-grow min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search store name, domain, or TrxID..."
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
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterProvider}
                onChange={(e) => {
                  setFilterProvider(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Providers</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Upay">Upay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Store & Tenant</th>
                <th className="px-6 py-4">Product / Purpose</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Sender & TrxID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading payment verifications...</span>
                    </div>
                  </td>
                </tr>
              ) : displayPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                  >
                    No payment submissions match your filter criteria.
                  </td>
                </tr>
              ) : (
                displayPayments.map((p) => {
                  const isRejected = p.status === "rejected";
                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors ${
                        isRejected
                          ? "bg-red-50/60 hover:bg-red-100/50 border-l-4 border-l-red-500"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className={`font-bold ${isRejected ? "text-slate-700" : "text-slate-900"}`}>
                          {p.tenantId?.name || "Unknown Store"}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {p.tenantId?.customDomain &&
                          p.tenantId?.domainStatus === "active"
                            ? p.tenantId.customDomain
                            : p.tenantId?.domain ||
                              (p.tenantId?.slug
                                ? `${p.tenantId.slug}.masheco.com`
                                : p.tenantId?.customDomain || "N/A")}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          {p.purposeTitle || p.purpose}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.purpose}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <MFSLogo
                          provider={p.provider}
                          className="h-5 w-auto object-contain"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-700">
                          Sender: {p.senderNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {p.transactionId}
                          </span>
                          <button
                            onClick={() => handleCopy(p.transactionId, p._id)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copy TrxID"
                          >
                            {copiedId === p._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isRejected ? (
                          <div>
                            <span className="font-extrabold text-red-600 line-through text-base">
                              ৳ {p.amount?.toLocaleString()}
                            </span>
                            <span className="block text-[10px] font-bold text-red-600 bg-red-100/80 border border-red-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              Rejected (Not Counted)
                            </span>
                          </div>
                        ) : (
                          <div className="font-extrabold text-slate-900 text-base">
                            ৳ {p.amount?.toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          p.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.status === "approved" && (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {p.status === "rejected" && (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {p.status === "pending" && (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {p.status.toUpperCase()}
                      </span>
                      {p.adminFeedback && (
                        <div
                          className="text-[11px] text-slate-400 mt-1 italic max-w-xs truncate"
                          title={p.adminFeedback}
                        >
                          {p.adminFeedback}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}{" "}
                      {new Date(p.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Send Confirmation Email Button (When Approved) */}
                        {p.status === "approved" && (
                          <button
                            onClick={() => handleSendEmail(p)}
                            disabled={sendingEmailId === p._id}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 ${
                              (p.confirmationEmailSentCount || 0) > 0
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                            } disabled:opacity-50`}
                            title={
                              (p.confirmationEmailSentCount || 0) > 0
                                ? `Confirmation email sent ${p.confirmationEmailSentCount} time(s). Click to send again.`
                                : "Send payment confirmation email to merchant"
                            }
                          >
                            {sendingEmailId === p._id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                <span>Sending...</span>
                              </>
                            ) : (p.confirmationEmailSentCount || 0) > 0 ? (
                              <>
                                <MailCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Sent Again</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                                  {p.confirmationEmailSentCount}
                                </span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Send Email</span>
                              </>
                            )}
                          </button>
                        )}

                        {p.status === "pending" ? (
                          <>
                            <button
                              onClick={() => openActionModal(p, "approved")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => openActionModal(p, "rejected")}
                              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              openActionModal(
                                p,
                                p.status === "approved"
                                  ? "rejected"
                                  : "approved",
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-all"
                          >
                            Change Status
                          </button>
                        )}

                        {/* Delete Payment History Button */}
                        <button
                          onClick={() => openDeleteModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                          title="Delete payment history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {meta.total > 0 && (
          <div className="px-6 py-4 bg-white/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {Math.min((page - 1) * meta.limit + 1, meta.total)}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(page * meta.limit, meta.total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">{meta.total}</span>{" "}
              results
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {[...Array(meta.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1
                      ? "bg-[#5022C3] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Verification Modal */}
      {actionModal.isOpen && actionModal.payment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {actionModal.action === "approved" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                {actionModal.action === "approved"
                  ? "Approve Payment Verification"
                  : "Reject Payment Verification"}
              </h3>
              <button
                onClick={closeActionModal}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Store Name:</span>
                <span className="font-bold text-slate-900">
                  {actionModal.payment.tenantId?.name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  Product / Purpose:
                </span>
                <span className="font-bold text-slate-900">
                  {actionModal.payment.purposeTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  Payment Method:
                </span>
                <span className="font-bold text-blue-600">
                  {actionModal.payment.provider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  Sender Number:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {actionModal.payment.senderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  Transaction ID:
                </span>
                <span className="font-mono font-extrabold text-slate-900">
                  {actionModal.payment.transactionId}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="text-slate-500 font-bold">Amount:</span>
                <span className="font-extrabold text-emerald-700">
                  ৳ {actionModal.payment.amount}
                </span>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Feedback / Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionModal.action === "approved"
                      ? "e.g. Verified with bank statement."
                      : "e.g. Invalid Transaction ID. Please check and submit again."
                  }
                  value={actionModal.adminFeedback}
                  onChange={(e) =>
                    setActionModal({
                      ...actionModal,
                      adminFeedback: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 ${
                    actionModal.action === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  {actionModal.action === "approved"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with 3-Second Press & Hold */}
      {deleteModal.isOpen && deleteModal.payment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Payment History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Irreversible administrative deletion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Store:</span>
                <span className="font-bold text-slate-900">
                  {deleteModal.payment.tenantId?.name || "Unknown Store"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Purpose:</span>
                <span className="font-bold text-slate-800">
                  {deleteModal.payment.purposeTitle || deleteModal.payment.purpose}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {deleteModal.payment.transactionId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sender:</span>
                <span className="font-mono text-slate-700">
                  {deleteModal.payment.senderNumber} ({deleteModal.payment.provider})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Amount:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  ৳ {Number(deleteModal.payment.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                    deleteModal.payment.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : deleteModal.payment.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {deleteModal.payment.status}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>
                <strong>Warning:</strong> To prevent accidental deletion, you must <strong>press and hold the button below for 3 seconds</strong>. Releasing before 3s will cancel the action.
              </span>
            </div>

            {/* 3-Second Press & Hold Button */}
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative w-full rounded-xl overflow-hidden cursor-pointer select-none transition-all flex items-center justify-center border-2 ${
                  isHolding
                    ? "border-red-600 shadow-lg shadow-red-500/25 scale-[0.99]"
                    : "border-red-300 hover:border-red-500 bg-red-50/50"
                }`}
                style={{ height: "54px" }}
              >
                {/* Background Progress Fill */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 transition-all ease-linear"
                  style={{
                    width: `${deleteHoldProgress}%`,
                    transitionDuration: isHolding ? "20ms" : "200ms",
                  }}
                />

                {/* Content Overlay */}
                <div className="relative z-10 flex items-center justify-center gap-2 font-bold text-sm tracking-wide">
                  {isDeleting ? (
                    <div className="flex items-center gap-2 text-white">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting Record...</span>
                    </div>
                  ) : isHolding ? (
                    <div className="flex items-center gap-2 text-white drop-shadow-md">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>
                        Holding... {Math.max(0, (3 - (deleteHoldProgress / 100) * 3)).toFixed(1)}s (
                        {Math.round(deleteHoldProgress)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Press &amp; Hold to Delete (3s)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>Hold down mouse or touch for 3 seconds</span>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="text-slate-500 hover:text-slate-800 font-semibold underline"
                >
                  Cancel
                </button>
              </div>
            </div>
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
                    Payment Proofs (TrxID) Revenue Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed earnings metrics, approved collections, and in-review amounts
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
              {serverStats?.hasFilter && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Filtered Period: {serverStats.filteredPeriodLabel}
                    </span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {serverStats.filteredApprovedCount || 0} Approved Proofs
                    </span>
                  </div>
                  <div className="text-2xl font-black text-blue-900 mt-1">
                    ৳{(serverStats.filteredApprovedRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 flex justify-between pt-1 border-t border-blue-200/60 mt-1">
                    <span>Total Submissions in Period: {serverStats.filteredCount || 0}</span>
                    <span>Pending in Period: ৳{(serverStats.filteredPendingRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* 4 Primary Financial Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">
                    Total Verified Revenue (All-Time)
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-1">
                    ৳{(serverStats?.approvedRevenue ?? approvedRevenue).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Real confirmed cash from approved proofs
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">
                    Pending Review Revenue
                  </span>
                  <span className="text-xl font-black text-amber-600 mt-1">
                    ৳{(serverStats?.pendingRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Awaiting admin manual check
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">
                    Approved Proofs
                  </span>
                  <span className="text-xl font-black text-emerald-600 mt-1">
                    {serverStats?.approvedCount ?? approvedCount}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Successfully verified submissions
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col">
                  <span className="text-xs font-semibold text-slate-500">
                    Total Submissions
                  </span>
                  <span className="text-xl font-black text-indigo-600 mt-1">
                    {serverStats?.totalCount ?? totalCount}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Total merchant proof uploads
                  </span>
                </div>
              </div>

              {/* Periodic Breakdowns */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                  Periodic Collections Breakdown
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-600">This Month's Verified Collections</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      ৳{(serverStats?.thisMonthRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-600">
                      This Year's Verified Collections ({new Date().getFullYear()})
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      ৳{(serverStats?.thisYearRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-600">Pending Review Proofs</span>
                    <span className="font-bold text-amber-600 text-sm">
                      {serverStats?.pendingCount ?? pendingCount} Submissions
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-950">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  How is Payment Proofs Revenue calculated?
                </div>
                <p className="text-[11px] text-amber-800">
                  • <strong>Verified Revenue</strong> is the sum of payments from submissions marked <strong>APPROVED</strong> by the platform admin.
                </p>
                <p className="text-[11px] text-amber-800">
                  • <strong>Pending Review</strong> represents submitted payments that are pending administrative verification. Once approved, the amount is automatically added to Verified Revenue.
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

      {/* Download Revenue / Payment Proofs PDF Modal */}
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
                    Download Payment Proofs PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export verified payment proofs and revenue report
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
}
