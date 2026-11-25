import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import ModalShell from "./ModalShell";
import Pagination from "./Pagination";
import usePagedFetch from "./usePagedFetch";
import OrderSlip from "./OrderSlip";
import { SearchBox, FilterSelect, StatusBadge, TableState, Th, theadCls, money, orderShortId } from "./shared";

const SourceBadge = ({ order }) =>
  order.orderSourceType === "manual" ? (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#5022C3] border border-purple-200">Manual</span>
      {order.orderSource && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {order.orderSource}
        </span>
      )}
    </div>
  ) : (
    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
      Storefront
    </span>
  );

export default function OrdersModal({ tenantId, storeName, onClose }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 500);
    return () => clearTimeout(t);
  }, [search]);

  const { rows, meta, loading, error, page, setPage, limit, setLimit } = usePagedFetch(`/orders/admin/${tenantId}`, {
    search: debounced,
    status,
    orderSourceType: source,
  });

  const withReset = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  return (
    <>
      <ModalShell
        title="Orders"
        subtitle={`${storeName} · read-only view`}
        onClose={onClose}
        toolbar={
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox value={search} onChange={withReset(setSearch)} placeholder="Search by ID, customer name or phone..." />
            <FilterSelect
              value={source}
              onChange={withReset(setSource)}
              options={[["all", "All Order Types"], ["storefront", "Storefront"], ["manual", "Manual"]]}
            />
            <FilterSelect
              value={status}
              onChange={withReset(setStatus)}
              options={[
                ["all", "All Statuses"],
                ["pending", "Pending"],
                ["confirmed", "Confirmed"],
                ["shipped", "Shipped"],
                ["delivered", "Delivered"],
                ["cancelled", "Cancelled"],
              ]}
            />
          </div>
        }
        footer={<Pagination meta={meta} page={page} limit={limit} onPage={setPage} onLimit={setLimit} loading={loading} />}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className={theadCls}>
              <Th>Order ID</Th>
              <Th>Customer</Th>
              <Th>Location</Th>
              <Th>Date</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th className="text-center">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <TableState loading={loading} error={error} empty={rows.length === 0} colSpan={7} emptyText="No orders found." />
            {!loading &&
              !error &&
              rows.map((o) => (
                <tr key={o._id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-[#5022C3] bg-purple-50 px-2 py-1 rounded">#{orderShortId(o)}</span>
                    <div>
                      <SourceBadge order={o} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{o.customerName}</div>
                    <div className="text-xs text-slate-500">{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="truncate text-slate-700" title={o.shippingAddress}>
                      {o.shippingAddress}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{new Date(o.createdAt).toLocaleDateString("en-GB")}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{money(o.totalPrice)}</div>
                    <div className="text-xs text-slate-500">{o.items?.length || 0} item(s)</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setViewOrder(o)}
                      className="w-8 h-8 inline-flex items-center justify-center bg-[#f0f4ff] text-[#3b82f6] hover:bg-blue-100 rounded-xl transition-colors"
                      title="View order"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </ModalShell>

      {viewOrder && <OrderSlip order={viewOrder} storeName={storeName} onClose={() => setViewOrder(null)} />}
    </>
  );
}
