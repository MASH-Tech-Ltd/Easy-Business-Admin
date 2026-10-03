import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
  details,
  icon,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600 ring-8 ring-red-50/70',
          confirmBtn: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/20 focus:ring-red-500',
          defaultIcon: <Trash2 className="w-6 h-6" />,
          badgeColor: 'border-red-200 bg-red-50/70 text-red-700',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50/70',
          confirmBtn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/20 focus:ring-amber-500',
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
          badgeColor: 'border-amber-200 bg-amber-50/70 text-amber-700',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 text-blue-600 ring-8 ring-blue-50/70',
          confirmBtn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 focus:ring-blue-500',
          defaultIcon: <Info className="w-6 h-6" />,
          badgeColor: 'border-blue-200 bg-blue-50/70 text-blue-700',
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Top Decorative Banner */}
        <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

        {/* Close Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header & Icon */}
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${currentVariant.iconBg}`}>
              {icon || currentVariant.defaultIcon}
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {message}
              </div>
            </div>
          </div>

          {/* Optional Details or Warning Alert Box */}
          {details && (
            <div className={`mt-5 p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${currentVariant.badgeColor}`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{details}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-7 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${currentVariant.confirmBtn}`}
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
