import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Package, X, Eye } from "lucide-react";
import { money } from "./shared";

const Thumb = ({ item, size = "w-10 h-10" }) =>
  item.image ? (
    <img src={item.image} alt={item.title} className={`${size} rounded-lg object-cover border border-gray-200 shrink-0`} />
  ) : (
    <div className={`${size} rounded-lg bg-purple-100 text-[#5022C3] flex items-center justify-center shrink-0`}>
      <Package className="w-4 h-4" />
    </div>
  );

/** Compact cart chip; click opens a small popup listing every cart item. */
export default function CartItemsDropdown({ items = [], subTotal }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!items.length) return <span className="text-xs text-slate-400">-</span>;

  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="View cart items"
        aria-label="View cart items"
        className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-[#5022C3]/40 transition-colors cursor-pointer"
      >
        <span className="text-xs font-bold text-gray-800">{totalQty}</span>
        <Eye className="w-3.5 h-3.5 text-[#5022C3]" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Cart Items</h4>
                  <p className="text-[11px] text-gray-500">
                    {items.length} {items.length === 1 ? "item" : "items"}
                    {subTotal > 0 && ` · ${money(subTotal)}`}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <ul className="overflow-y-auto divide-y divide-gray-100">
                {items.map((it, i) => (
                  <li key={i} className="flex items-start gap-3 p-3">
                    <Thumb item={it} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-900 break-words">{it.title}</div>
                      {(it.color || it.size) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {it.color && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              {it.color}
                            </span>
                          )}
                          {it.size && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {it.size}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500 mt-1">
                        {it.quantity} × {money(it.price)}
                        <span className="font-semibold text-gray-800"> = {money((it.price || 0) * it.quantity)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
