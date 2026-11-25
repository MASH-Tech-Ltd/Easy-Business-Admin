import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Centered, fixed-size modal used by every client detail view
 * (orders, customers, abandoned checkouts).
 * Sections: header · toolbar (optional) · scrollable body · footer (optional).
 */
export default function ModalShell({ title, subtitle, onClose, toolbar, footer, children, size = "max-w-5xl" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-white rounded-2xl w-full ${size} h-[80vh] max-h-[680px] flex flex-col shadow-2xl overflow-hidden`}>
        <header className="px-5 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-2 -mr-2 hover:bg-slate-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </header>

        {toolbar && <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">{toolbar}</div>}

        <div className="flex-1 min-h-0 overflow-auto">{children}</div>

        {footer && <footer className="border-t border-slate-100 bg-white shrink-0">{footer}</footer>}
      </div>
    </div>
  );
}
