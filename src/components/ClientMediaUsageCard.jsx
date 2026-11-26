import React, { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import api from '../utils/api';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 10 || idx === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[idx]}`;
}

export default function ClientMediaUsageCard({ tenantId }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    setLoading(true);
    api
      .get(`/media/usage/tenant/${tenantId}`)
      .then((res) => {
        if (mounted && res.data?.data) {
          setUsage(res.data.data);
        }
      })
      .catch(() => {
        if (mounted) setUsage(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  if (!tenantId) return null;

  const quota = usage?.quota;
  const pct = quota?.usedPercent || 0;
  const barColor = quota?.isLimitReached
    ? 'bg-red-500'
    : pct >= 85
      ? 'bg-amber-500'
      : 'bg-indigo-600';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Media &amp; Image Storage
          </p>
        </div>
        {quota && quota.totalLimitBytes > 0 && (
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
            {formatBytes(quota.usedBytes)} / {formatBytes(quota.totalLimitBytes)} ({pct}%)
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading storage usage...</p>
      ) : !usage ? (
        <p className="text-xs text-slate-400">No media usage data available.</p>
      ) : (
        <>
          {quota && quota.totalLimitBytes > 0 && (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-50 rounded-lg py-1.5 px-2 border border-slate-100">
              <p className="text-xs font-bold text-slate-800">{usage.storage?.totalImageCount || 0}</p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase">
                Images ({usage.storage?.r2?.imageCount || 0} R2)
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg py-1.5 px-2 border border-slate-100">
              <p className="text-xs font-bold text-slate-800">
                {usage.writes?.totalOperations ?? usage.monthly?.uploadCount ?? 0}
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase">Writes (Mo)</p>
            </div>
            <div className="bg-slate-50 rounded-lg py-1.5 px-2 border border-slate-100">
              <p className="text-xs font-bold text-slate-800">
                {usage.reads?.totalRequests !== null && usage.reads?.totalRequests !== undefined
                  ? usage.reads.totalRequests.toLocaleString()
                  : '—'}
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase">
                {usage.reads?.totalBytes ? formatBytes(usage.reads.totalBytes) : 'Reads (Mo)'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
