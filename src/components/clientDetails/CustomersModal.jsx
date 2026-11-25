import { useState, useEffect } from "react";
import ModalShell from "./ModalShell";
import Pagination from "./Pagination";
import usePagedFetch from "./usePagedFetch";
import { SearchBox, TableState, Th, theadCls, money, fmtDateTime } from "./shared";

export default function CustomersModal({ tenantId, storeName, onClose }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 500);
    return () => clearTimeout(t);
  }, [search]);

  const { rows, meta, loading, error, page, setPage, limit, setLimit } = usePagedFetch(`/customers/admin/${tenantId}`, {
    search: debounced,
  });

  return (
    <ModalShell
      title="Customer Details"
      subtitle={`${storeName} · read-only view`}
      onClose={onClose}
      toolbar={
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, phone, email"
        />
      }
      footer={<Pagination meta={meta} page={page} limit={limit} onPage={setPage} onLimit={setLimit} loading={loading} />}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={theadCls}>
            <Th>Name</Th>
            <Th>Phone</Th>
            <Th>Email</Th>
            <Th>Address</Th>
            <Th>Orders</Th>
            <Th>Spent</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <TableState loading={loading} error={error} empty={rows.length === 0} colSpan={7} emptyText="No customers found." />
          {!loading &&
            !error &&
            rows.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/80 align-top">
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3">{c.phone || "-"}</td>
                <td className="px-4 py-3">{c.email || "-"}</td>
                <td className="px-4 py-3 max-w-[200px] truncate" title={c.address}>
                  {c.address || "-"}
                </td>
                <td className="px-4 py-3">{c.totalOrders ?? 0}</td>
                <td className="px-4 py-3 whitespace-nowrap">{money(c.totalSpent)}</td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(c.createdAt)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </ModalShell>
  );
}
