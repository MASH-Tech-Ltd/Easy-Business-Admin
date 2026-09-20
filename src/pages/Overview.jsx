import React from "react";
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

  const handleDownloadReport = () => {
    try {
      console.log("Starting PDF generation...");
      
      // jspdf sometimes needs to be instantiated this way depending on module system
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text("MashEasy Report", 14, 22);
      
      // Subtitle
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Summary Stats
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Summary Metrics", 14, 45);
      
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total Tenants: ${stats.totalTenants || 0}`, 14, 55);
      doc.text(`Active Packages: ${stats.activePackages || 0}`, 14, 62);
      doc.text(`Monthly MRR: BDT ${stats.monthlyMRR || 0}`, 14, 69); // removed unicode taka symbol which might break jspdf
      doc.text(`System Load: ${stats.systemLoad || '0%'}`, 14, 76);
      
      doc.text(`Monthly Sales: BDT ${stats.monthlySales || 0}`, 100, 55);
      doc.text(`Yearly Sales: BDT ${stats.yearlySales || 0}`, 100, 62);
      doc.text(`Lifetime Sales: BDT ${stats.totalSales || 0}`, 100, 69);
      
      // Transactions Table
      if (stats.transactions && stats.transactions.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Transaction History", 14, 95);
        
        const tableColumn = ["Date", "Tenant", "Package", "Addons", "Status", "Amount"];
        const tableRows = [];
        
        let totalRevenue = 0;
        stats.transactions.forEach(trx => {
          const statusText = trx.status ? (trx.status.charAt(0).toUpperCase() + trx.status.slice(1)) : 'Unknown';
          const trxData = [
            new Date(trx.date).toLocaleDateString(),
            trx.tenantName || 'Unknown',
            trx.packageName || 'Free tier',
            trx.addons || "N/A",
            statusText,
            `BDT ${trx.amount || 0}`
          ];
          tableRows.push(trxData);
          totalRevenue += (trx.amount || 0);
        });
        
        // Add total row
        tableRows.push([{ content: 'Total Revenue', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, `BDT ${totalRevenue}`]);
        
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 100,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 10 },
          theme: 'grid'
        });
      }
      
      doc.save("MashEasy_Platform_Report.pdf");
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF report: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            System status and key metrics across all tenants.
          </p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
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
              {stats.transactions?.map((trx) => (
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
      </div>
    </div>
  );
};

export default React.memo(Overview);
