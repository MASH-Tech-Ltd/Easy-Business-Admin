import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const pageWindow = (page, total, size = 5) => {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), total - size + 1));
  return Array.from({ length: Math.min(size, total) }, (_, i) => start + i);
};

const btn =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold";

/** Always-visible pagination bar: entries info · rows per page · page buttons. */
export default function Pagination({ meta, page, limit, onPage, onLimit, loading }) {
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
      <span>
        Showing <b className="text-slate-700">{from}</b> to <b className="text-slate-700">{to}</b> of{" "}
        <b className="text-slate-700">{total}</b> entries
      </span>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button className={btn} disabled={page <= 1 || loading} onClick={() => onPage(1)} aria-label="First page">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className={btn} disabled={page <= 1 || loading} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pageWindow(page, totalPages).map((n) => (
            <button
              key={n}
              disabled={loading}
              onClick={() => onPage(n)}
              className={`${btn} ${n === page ? "!bg-blue-600 !text-white !border-blue-600" : ""}`}
            >
              {n}
            </button>
          ))}
          <button className={btn} disabled={page >= totalPages || loading} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className={btn} disabled={page >= totalPages || loading} onClick={() => onPage(totalPages)} aria-label="Last page">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
