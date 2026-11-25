import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import {
  Search,
  ShoppingBag,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
} from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-orange-100 text-orange-800 border-orange-200",
};

const StatusBadge = ({ status = "" }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
      STATUS_STYLES[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    }`}
  >
    {status}
  </span>
);

const SourceBadge = ({ order }) =>
  order.orderSourceType === "manual" ? (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#5022C3] border border-purple-200">
        Manual Order
      </span>
      {order.orderSource && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {order.orderSource}
        </span>
      )}
    </div>
  ) : (
    <div className="mt-1">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
        Storefront
      </span>
    </div>
  );

const shortId = (o) => o.orderId || o._id?.substring(o._id.length - 6).toUpperCase();
const money = (n) => `${Number(n || 0).toLocaleString()} BDT`;

function OrderSlip({ order, storeName, onClose }) {
  const itemsTotal = (order.items || []).reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping =
    order.shippingCharge ??
    Math.max(0, order.totalPrice - Math.max(0, itemsTotal - (order.discount || 0)));

  return (
    <div
      id="admin-printable-wrapper"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4 print:absolute print:inset-0 print:bg-white print:block print:p-0"
    >
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0mm; }
          body * { visibility: hidden !important; }
          #admin-printable-wrapper, #admin-printable-wrapper * { visibility: visible !important; }
          #admin-printable-wrapper { position: absolute !important; left: 0; top: 0; width: 100%; background: white !important; padding: 15mm !important; }
        `}
      </style>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center gap-2 print:hidden">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              {order.orderSourceType === "manual" ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#5022C3] border border-purple-200">
                  Manual Order{order.orderSource ? ` • ${order.orderSource}` : ""}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  Storefront Order
                </span>
              )}
            </div>
            <div className="text-sm font-mono text-[#5022C3] mt-1 bg-purple-50 inline-block px-2 py-0.5 rounded">
              #{shortId(order)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2.5 text-[#5022C3] bg-purple-50 hover:bg-purple-100 rounded-full flex items-center gap-2 sm:px-4 font-semibold text-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
            <button onClick={onClose} className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 print:overflow-visible">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 border-b border-gray-200 pb-4 print:flex-row print:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight break-words">
                {storeName}
              </h1>
              <p className="text-gray-500 mt-1 font-medium tracking-widest text-sm uppercase">Packing Slip</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-bold text-gray-900">Order #{shortId(order)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Source:{" "}
                <span className="font-semibold text-gray-700">
                  {order.orderSourceType === "manual"
                    ? `Manual Order (${order.orderSource || "Manual"})`
                    : "Storefront"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Info</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 print:border-none print:bg-transparent print:p-0">
                <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
                <p className="text-gray-600 mt-1">{order.customerPhone}</p>
                {order.customerEmail && <p className="text-xs text-gray-500 mt-0.5">{order.customerEmail}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Shipping Address</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 print:border-none print:bg-transparent print:p-0">
                <p className="text-gray-800 leading-relaxed">{order.shippingAddress}</p>
              </div>
            </div>
          </div>

          {order.note && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Order Note
              </h3>
              <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-xl border border-yellow-100 italic">
                {order.note}
              </p>
            </div>
          )}

          {order.consignmentId && (
            <div className="text-sm bg-green-50 border border-green-200 rounded-xl p-3">
              <span className="font-bold uppercase text-green-700">
                {order.courierProvider || "Courier"}
              </span>{" "}
              · Consignment ID: <span className="font-mono">{order.consignmentId}</span>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Items</h3>
            <div className="border border-gray-200 rounded-xl overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[420px] print:min-w-0 text-left border-collapse text-sm sm:text-base">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase border-b border-gray-200">Item</th>
                    <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase border-b border-gray-200 text-center">Qty</th>
                    <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase border-b border-gray-200 text-right">Price</th>
                    <th className="py-3 px-4 text-xs font-bold text-gray-600 uppercase border-b border-gray-200 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded overflow-hidden border border-gray-100 shrink-0">
                            {item.image && (
                              <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">{item.title}</span>
                            {(item.color || item.size) && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {item.color && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    Color: {item.color}
                                  </span>
                                )}
                                {item.size && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    Size: {item.size}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">{money(item.price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                        {money(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <div className="w-full sm:max-w-sm space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{money(itemsTotal)}</span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>- {money(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping > 0 ? money(shipping) : "Free"}</span>
              </div>
              <div className="flex justify-between gap-2 text-lg sm:text-xl font-black text-gray-900 border-t border-gray-200 pt-3">
                <span>Total Amount</span>
                <span className="text-[#5022C3] print:text-gray-900">{money(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-wrap items-center gap-6 print:hidden">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Status</div>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payment</div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border capitalize bg-gray-100 text-gray-700 border-gray-200">
              {order.paymentStatus || "unpaid"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientOrdersView({ tenantId, storeName, onClose }) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 600);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/orders/admin/${tenantId}`, {
        params: {
          page,
          limit: 10,
          status: statusFilter,
          orderSourceType: sourceFilter,
          search: debouncedSearch,
        },
      });
      setOrders(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
      setOrders([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, statusFilter, sourceFilter, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const selectCls =
    "border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#5022C3] focus:ring-1 focus:ring-[#5022C3] font-medium text-gray-700";

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col font-sans">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Orders</h2>
          <p className="text-xs text-gray-500">
            {storeName} · read-only view{meta ? ` · ${meta.total} total` : ""}
          </p>
        </div>
        <button onClick={onClose} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col lg:flex-row justify-between gap-3 bg-[#fcfcfc] shrink-0">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer name or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#5022C3] focus:ring-1 focus:ring-[#5022C3] w-full bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              <option value="all">All Order Types</option>
              <option value="storefront">Storefront Orders</option>
              <option value="manual">Manual Orders</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Location</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-500">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-[#5022C3] rounded-full animate-spin mx-auto mb-4" />
                    Loading orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-red-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-[#5022C3] mb-4 mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                    <p className="text-gray-500 text-sm">Adjust your filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-medium text-[#5022C3] bg-purple-50 px-2 py-1 rounded">
                        #{shortId(order)}
                      </span>
                      <SourceBadge order={order} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 max-w-[220px]">
                      <div className="text-sm text-gray-700 truncate" title={order.shippingAddress}>
                        {order.shippingAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{money(order.totalPrice)}</div>
                      <div className="text-xs text-gray-500 font-medium">{order.items?.length || 0} item(s)</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setViewOrder(order)}
                          className="w-8 h-8 flex items-center justify-center bg-[#f0f4ff] text-[#3b82f6] hover:bg-blue-100 rounded-xl transition-colors"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-3 border-t border-gray-200 flex items-center justify-between text-sm bg-white shrink-0">
            <span className="text-gray-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} orders
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {viewOrder && <OrderSlip order={viewOrder} storeName={storeName} onClose={() => setViewOrder(null)} />}
    </div>
  );
}
