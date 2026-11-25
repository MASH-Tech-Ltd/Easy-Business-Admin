import { X, FileText, Printer } from "lucide-react";
import { StatusBadge, money, orderShortId } from "./shared";

export default function OrderSlip({ order, storeName, onClose }) {
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
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
              #{orderShortId(order)}
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

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 print:overflow-visible">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 border-b border-gray-200 pb-4 print:flex-row print:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight break-words">
                {storeName}
              </h1>
              <p className="text-gray-500 mt-1 font-medium tracking-widest text-sm uppercase">Packing Slip</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-bold text-gray-900">Order #{orderShortId(order)}</p>
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
                          <div className="w-10 h-10 bg-gray-50 rounded overflow-hidden border border-gray-100 shrink-0">
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
