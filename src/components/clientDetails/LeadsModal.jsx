import { useState, useEffect } from "react";
import ModalShell from "./ModalShell";
import Pagination from "./Pagination";
import usePagedFetch from "./usePagedFetch";
import CartItemsDropdown from "./CartItemsDropdown";
import { SearchBox, FilterSelect, StatusBadge, TableState, Th, theadCls, money, fmtDateTime } from "./shared";

export default function LeadsModal({ tenantId, storeName, onClose }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 500);
    return () => clearTimeout(t);
  }, [search]);

  const { rows, meta, loading, error, page, setPage, limit, setLimit } = usePagedFetch(
    `/checkout-leads/admin/${tenantId}`,
    { search: debounced, status },
  );

  const withReset = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  return (
    <ModalShell
      title="Abandoned Checkouts"
      subtitle={
        meta
          ? `${storeName} · ${meta.abandoned ?? 0} abandoned · ${meta.completed ?? 0} completed`
          : `${storeName} · read-only view`
      }
      onClose={onClose}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={withReset(setSearch)} placeholder="Search name, phone, email" />
          <FilterSelect
            value={status}
            onChange={withReset(setStatus)}
            options={[["all", "All"], ["abandoned", "Abandoned"], ["completed", "Completed"]]}
          />
        </div>
      }
      footer={<Pagination meta={meta} page={page} limit={limit} onPage={setPage} onLimit={setLimit} loading={loading} />}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={theadCls}>
            <Th>Customer</Th>
            <Th>Contact</Th>
            <Th>Address</Th>
            <Th>Cart Items</Th>
            <Th>Subtotal</Th>
            <Th>Status</Th>
            <Th>Last Activity</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <TableState loading={loading} error={error} empty={rows.length === 0} colSpan={7} emptyText="No checkouts found." />
          {!loading &&
            !error &&
            rows.map((l) => {
              const address = [l.address, l.upazila, l.district, l.division].filter(Boolean).join(", ");
              return (
                <tr key={l._id} className="hover:bg-slate-50/80 align-top">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {[l.firstName, l.lastName].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div>{l.phone || "-"}</div>
                    <div className="text-xs text-slate-500">{l.email || ""}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px] text-xs">
                    <div className="truncate" title={address}>
                      {address || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3"><CartItemsDropdown items={l.items} subTotal={l.subTotal} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">{money(l.subTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(l.updatedAt)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </ModalShell>
  );
}
