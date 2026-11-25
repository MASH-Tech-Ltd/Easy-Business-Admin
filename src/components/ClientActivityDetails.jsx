import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";

const CONFIG = {
  customers: {
    title: "Customer Details",
    endpoint: (id) => `/customers/admin/${id}`,
  },
  leads: {
    title: "Abandoned Checkouts",
    endpoint: (id) => `/checkout-leads/admin/${id}`,
  },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "-");

export default function ClientActivityDetails({ type, tenantId, storeName, onClose }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    if (!type || !tenantId) return;
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (type === "leads") params.status = status;
      const res = await api.get(CONFIG[type].endpoint(tenantId), { params });
      setRows(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load details");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [type, tenantId, page, search, status]);

  // API is called only after a "View Details" click (type is set) or filters change
  useEffect(() => {
    load();
  }, [load]);

  const close = () => onClose && onClose();

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <>
      {type && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{CONFIG[type].title}</h3>
                <p className="text-xs text-slate-500">{storeName}</p>
                {type === "leads" && meta && (
                  <p className="text-xs mt-1 text-slate-600">
                    <span className="font-semibold text-orange-600">{meta.abandoned ?? 0}</span> abandoned ·{" "}
                    <span className="font-semibold text-green-600">{meta.completed ?? 0}</span> completed
                  </p>
                )}
              </div>
              <button type="button" onClick={close} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
              <form onSubmit={submitSearch} className="flex items-center gap-2 flex-1 min-w-[220px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search name, phone, email"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button type="submit" className="px-3 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg">
                  Search
                </button>
              </form>
              {type === "leads" && (
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1);
                    setStatus(e.target.value);
                  }}
                  className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="all">All</option>
                  <option value="abandoned">Abandoned</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-slate-100 rounded-lg" />
                  <div className="h-10 bg-slate-100 rounded-lg" />
                  <div className="h-10 bg-slate-100 rounded-lg" />
                </div>
              ) : error ? (
                <p className="text-center text-sm text-red-500 py-10">{error}</p>
              ) : rows.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10 italic">No records found.</p>
              ) : type === "customers" ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] uppercase text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Phone</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Address</th>
                      <th className="py-2 pr-3">Orders</th>
                      <th className="py-2 pr-3">Spent</th>
                      <th className="py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c._id} className="border-b border-slate-50 align-top">
                        <td className="py-2 pr-3 font-medium text-slate-800">{c.name}</td>
                        <td className="py-2 pr-3">{c.phone || "-"}</td>
                        <td className="py-2 pr-3">{c.email || "-"}</td>
                        <td className="py-2 pr-3 max-w-[200px]">{c.address || "-"}</td>
                        <td className="py-2 pr-3">{c.totalOrders ?? 0}</td>
                        <td className="py-2 pr-3">৳ {Number(c.totalSpent || 0).toFixed(2)}</td>
                        <td className="py-2 text-xs text-slate-500">{fmtDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] uppercase text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Contact</th>
                      <th className="py-2 pr-3">Address</th>
                      <th className="py-2 pr-3">Cart Items</th>
                      <th className="py-2 pr-3">Subtotal</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((l) => (
                      <tr key={l._id} className="border-b border-slate-50 align-top">
                        <td className="py-2 pr-3 font-medium text-slate-800">
                          {[l.firstName, l.lastName].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="py-2 pr-3">
                          <div>{l.phone || "-"}</div>
                          <div className="text-xs text-slate-500">{l.email || ""}</div>
                        </td>
                        <td className="py-2 pr-3 max-w-[200px] text-xs">
                          {[l.address, l.upazila, l.district, l.division].filter(Boolean).join(", ") || "-"}
                        </td>
                        <td className="py-2 pr-3 text-xs">
                          {(l.items || []).length === 0
                            ? "-"
                            : l.items.map((it, i) => (
                                <div key={i}>
                                  {it.title} × {it.quantity}
                                </div>
                              ))}
                        </td>
                        <td className="py-2 pr-3">৳ {Number(l.subTotal || 0).toFixed(2)}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              l.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-slate-500">{fmtDate(l.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Page {meta.page} of {meta.totalPages} · {meta.total} total
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
