import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetSuperAdminStatsQuery } from "../store/apiSlice";
import {
  Users,
  PackageOpen,
  CreditCard,
  TrendingUp,
  Activity,
  PlusCircle,
  Settings,
  ShieldAlert,
  LifeBuoy,
  Database,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`p-3 rounded-xl ${trendUp ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}
      >
        {trendUp ? "↑" : "↓"} {trend}
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
        {value}
      </h3>
      <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon: Icon, colorClass, to }) => (
  <Link
    to={to}
    className="flex items-center text-left p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-300 transition-all group w-full"
  >
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${colorClass}`}
    >
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  </Link>
);

const Overview = () => {
  const { data: statsResponse, isLoading: loading } =
    useGetSuperAdminStatsQuery();
  const stats = statsResponse?.data || {
    totalTenants: 0,
    activePackages: 0,
    monthlyMRR: 0,
    systemLoad: "0%",
    chartData: [],
  };

  // Pagination state for Transaction History table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Customize Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("all"); // 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportTier, setReportTier] = useState("all"); // 'all' | 'paid_only' | 'free_only'
  const [reportStatus, setReportStatus] = useState("all"); // 'all' | 'active' | 'expired' | 'cancelled'
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filtered transactions for custom report download
  const filteredReportTransactions = useMemo(() => {
    const list = stats.transactions || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return list.filter((trx) => {
      const d = new Date(trx.date);

      // Period filter
      if (reportPeriod === "this_month") {
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
      } else if (reportPeriod === "last_month") {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (d.getMonth() !== lastMonth || d.getFullYear() !== yearOfLastMonth) return false;
      } else if (reportPeriod === "this_year") {
        if (d.getFullYear() !== currentYear) return false;
      } else if (reportPeriod === "custom") {
        if (reportStartDate && d < new Date(reportStartDate + "T00:00:00")) return false;
        if (reportEndDate) {
          const endD = new Date(reportEndDate + "T23:59:59.999");
          if (d > endD) return false;
        }
      }

      // Tier filter (include or exclude free tier)
      const isFree =
        (trx.packageName || "").toLowerCase().includes("free") ||
        Number(trx.amount || 0) === 0;

      if (reportTier === "paid_only" && isFree) return false;
      if (reportTier === "free_only" && !isFree) return false;

      // Status filter
      if (reportStatus !== "all" && trx.status !== reportStatus) return false;

      return true;
    });
  }, [stats.transactions, reportPeriod, reportStartDate, reportEndDate, reportTier, reportStatus]);

  const filteredReportRevenue = useMemo(() => {
    return filteredReportTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [filteredReportTransactions]);

  const handleGeneratePdf = () => {
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("MASH ECO Platform Report", 14, 22);

      // Subtitle with filter criteria
      const periodLabel =
        reportPeriod === "this_month"
          ? "This Month"
          : reportPeriod === "last_month"
          ? "Last Month"
          : reportPeriod === "this_year"
          ? "This Year"
          : reportPeriod === "custom"
          ? `${reportStartDate || "Start"} to ${reportEndDate || "End"}`
          : "All Time";

      const tierLabel =
        reportTier === "paid_only"
          ? "Paid Only (Without Free Tier)"
          : reportTier === "free_only"
          ? "Free Tier Only"
          : "All Plans (Include Free Tier)";

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated on: ${new Date().toLocaleString()} | Period: ${periodLabel} | Scope: ${tierLabel}`,
        14,
        30
      );

      // Summary Metrics
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Summary Metrics", 14, 42);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Filtered Transactions: ${filteredReportTransactions.length}`, 14, 50);
      doc.text(`Total Revenue: BDT ${filteredReportRevenue}`, 80, 50);
      doc.text(`Active Subscriptions: ${stats.activePackages || 0}`, 140, 50);

      // Transactions Table
      if (filteredReportTransactions.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text("Transaction Details", 14, 62);

        const tableColumn = ["Date", "Tenant", "Package", "Addons", "Status", "Amount"];
        const tableRows = [];

        filteredReportTransactions.forEach((trx) => {
          const statusText = trx.status ? trx.status.charAt(0).toUpperCase() + trx.status.slice(1) : "Unknown";
          tableRows.push([
            new Date(trx.date).toLocaleDateString(),
            trx.tenantName || "Unknown",
            trx.packageName || "Free tier",
            trx.addons || "None",
            statusText,
            `BDT ${trx.amount || 0}`,
          ]);
        });

        // Add total summary row
        tableRows.push([
          { content: "Total Revenue", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
          `BDT ${filteredReportRevenue}`,
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 68,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 10 },
          theme: "grid",
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(148, 163, 184);
        doc.text("No transactions match the selected filter criteria.", 14, 65);
      }

      const fileName = `masheco_Report_${reportPeriod}_${reportTier}.pdf`;
      doc.save(fileName);
      setIsReportModalOpen(false);
      toast.success("Custom report downloaded successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF report: " + error.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Table pagination calculations
  const allTransactions = stats.transactions || [];
  const totalTransactions = allTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedTransactions = allTransactions.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            System status and key metrics across all tenants.
          </p>
        </div>
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={Users}
          trend="12%"
          trendUp={true}
        />
        <StatCard
          title="Active Packages"
          value={stats.activePackages}
          icon={PackageOpen}
          trend="4%"
          trendUp={true}
        />
        <StatCard
          title="Monthly MRR"
          value={`৳${stats.monthlyMRR}`}
          icon={CreditCard}
          trend="8%"
          trendUp={true}
        />
        <StatCard
          title="System Load"
          value={stats.systemLoad}
          icon={Activity}
          trend="2%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96 flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-6">
            Revenue Growth
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dx={-10}
                  tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip
                  formatter={(value) => [`৳${value}`, "Revenue"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow:
                      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            Quick Actions
          </h3>
          <QuickAction
            title="Manage Packages"
            desc="Add or edit subscription tiers"
            icon={PlusCircle}
            colorClass="bg-blue-50 text-blue-600"
            to="/packages"
          />
          <QuickAction
            title="System Health"
            desc="Monitor system performance"
            icon={Activity}
            colorClass="bg-emerald-50 text-emerald-600"
            to="/health"
          />
          <QuickAction
            title="Support Tickets"
            desc="View and resolve client issues"
            icon={LifeBuoy}
            colorClass="bg-amber-50 text-amber-600"
            to="/support"
          />
          <QuickAction
            title="View Clients"
            desc="Manage all tenant accounts"
            icon={Users}
            colorClass="bg-indigo-50 text-indigo-600"
            to="/clients"
          />
          {/* <QuickAction 
                title="Database Overview" 
                desc="Check database status and metrics" 
                icon={Database} 
                colorClass="bg-purple-50 text-purple-600" 
                to="/database"
              /> */}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4">
          Transaction History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Addons</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((trx) => (
                <tr key={trx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(trx.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {trx.tenantName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {trx.packageName}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {trx.addons || '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 text-right">
                    ৳{trx.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trx.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      trx.status === 'expired' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {trx.status.charAt(0).toUpperCase() + trx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.transactions || stats.transactions.length === 0) && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
            {stats.transactions && stats.transactions.length > 0 && (
              <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                <tr>
                  <td colSpan="4" className="px-4 py-4 text-right">
                    Total Revenue:
                  </td>
                  <td className="px-4 py-4 text-right text-lg">
                    ৳{stats.transactions.reduce((acc, trx) => acc + (trx.amount || 0), 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Footer */}
        {totalTransactions > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(safeCurrentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(safeCurrentPage * pageSize, totalTransactions)}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{totalTransactions}</span> transactions
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 border-l border-slate-200 pl-3">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && (
                          <span className="px-1 text-slate-400 text-xs">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            safeCurrentPage === p
                              ? "bg-blue-600 text-white shadow-sm"
                              : "border border-slate-200 text-slate-600 hover:bg-white"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customize & Download Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Customize Report</h3>
                  <p className="text-xs text-slate-500">Filter parameters for your PDF export</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 1. Time Period */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Time Period
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "this_month", label: "This Month" },
                    { id: "last_month", label: "Last Month" },
                    { id: "this_year", label: "This Year" },
                    { id: "custom", label: "Custom Range" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportPeriod(item.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        reportPeriod === item.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/30"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Pickers */}
                {reportPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">From Date</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">To Date</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Free Tier / Paid Plans */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  2. Plan Scope
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "All (Include Free Tier)" },
                    { id: "paid_only", label: "Paid Only (Without Free)" },
                    { id: "free_only", label: "Free Tier Only" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportTier(item.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        reportTier === item.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/30"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Status Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  3. Subscription Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "all", label: "All Statuses" },
                    { id: "active", label: "Active" },
                    { id: "expired", label: "Expired" },
                    { id: "cancelled", label: "Cancelled" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportStatus(item.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        reportStatus === item.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/30"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Matching Records</span>
                  <span className="text-lg font-bold text-slate-800">
                    {filteredReportTransactions.length}{" "}
                    <span className="text-xs font-normal text-slate-500">transactions</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">
                    ৳{filteredReportRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Overview);
