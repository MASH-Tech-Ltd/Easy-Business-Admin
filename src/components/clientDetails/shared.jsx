import { Search } from "lucide-react";

export const money = (n) => `${Number(n || 0).toLocaleString()} BDT`;
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");
export const orderShortId = (o) => o.orderId || o._id?.substring(o._id.length - 6).toUpperCase();

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-orange-100 text-orange-800 border-orange-200",
  abandoned: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

export const StatusBadge = ({ status = "" }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${
      STATUS_STYLES[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    }`}
  >
    {status}
  </span>
);

export const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 min-w-[200px] max-w-sm">
    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
    />
  </div>
);

export const FilterSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
  >
    {options.map(([v, label]) => (
      <option key={v} value={v}>
        {label}
      </option>
    ))}
  </select>
);

export const TableState = ({ loading, error, empty, colSpan, emptyText = "No records found." }) => {
  if (!loading && !error && !empty) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-16 text-sm">
        {loading ? (
          <span className="text-slate-500">
            <span className="inline-block w-6 h-6 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin align-middle mr-2" />
            Loading...
          </span>
        ) : error ? (
          <span className="text-red-500">{error}</span>
        ) : (
          <span className="text-slate-400 italic">{emptyText}</span>
        )}
      </td>
    </tr>
  );
};

export const Th = ({ children, className = "" }) => (
  <th className={`px-4 py-3 font-bold sticky top-0 bg-slate-50 z-10 ${className}`}>{children}</th>
);

export const theadCls = "text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 text-left";
