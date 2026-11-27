import React, { useEffect, useState } from 'react';
import { HardDrive, Image, Database, Activity, Search } from 'lucide-react';
import api from '../utils/api';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 10 || idx === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[idx]}`;
}

let cachedPlatformMedia = null;

export default function MediaUsageSection() {
  const [data, setData] = useState(cachedPlatformMedia);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    api
      .get('/media/usage/platform')
      .then((res) => {
        if (res.data?.data) {
          cachedPlatformMedia = res.data.data;
          if (mounted) setData(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return null;

  const { storage, reads, activeProvider, month, merchants = [] } = data;
  const filteredMerchants = merchants.filter((m) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.storeName || '').toLowerCase().includes(q) ||
      (m.slug || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Platform Media &amp; R2 Storage</h3>
          <p className="text-xs text-slate-500">
            Month: {month} &bull; Active upload provider:{' '}
            <span className="font-bold uppercase text-slate-800">{activeProvider}</span>
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter merchant store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <span>Total Tracked Storage</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {formatBytes(storage?.totalTrackedBytes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            R2: {formatBytes(storage?.r2?.totalBytes)} &bull; Cloudinary:{' '}
            {formatBytes(storage?.cloudinaryTracked?.totalBytes)}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Image className="w-4 h-4 text-emerald-600" />
            <span>Tracked Images</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {(storage?.totalTrackedImages || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            R2: {(storage?.r2?.imageCount || 0).toLocaleString()} &bull; Cloudinary:{' '}
            {(storage?.cloudinaryTracked?.imageCount || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Activity className="w-4 h-4 text-amber-600" />
            <span>Monthly R2 Reads</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {reads?.totalRequests !== null && reads?.totalRequests !== undefined
              ? reads.totalRequests.toLocaleString()
              : 'Not synced'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {reads?.totalBytes !== null && reads?.totalBytes !== undefined
              ? `${formatBytes(reads.totalBytes)} delivered`
              : 'Enable MEDIA_ANALYTICS_SYNC'}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Merchants Tracked</span>
          </div>
          <div className="text-xl font-black text-slate-900">{merchants.length}</div>
        </div>
      </div>

      {filteredMerchants.length > 0 && (
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-bold">Store</th>
                <th className="py-2 px-3 font-bold">Storage / Quota</th>
                <th className="py-2 px-3 font-bold">Images (R2 / CL)</th>
                <th className="py-2 px-3 font-bold">Writes (Month)</th>
                <th className="py-2 pl-3 font-bold">Reads &amp; Bandwidth (Month)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMerchants.map((m) => {
                const limit = m.baseLimitBytes ?? 0;
                const pct = limit > 0 ? Math.min(100, (m.totalBytes / limit) * 100).toFixed(2) : '0';
                return (
                  <tr key={m.tenantId} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-slate-800">{m.storeName}</div>
                      {m.slug && <div className="text-[11px] text-slate-400">/{m.slug}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-semibold">{formatBytes(m.r2Bytes)}</div>
                      <div className="text-[11px] text-slate-400">
                        {limit > 0 ? `${pct}% of ${formatBytes(limit)}` : 'Unlimited'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {m.r2Images} R2 / {m.cloudinaryImages} CL
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-semibold">{m.monthlyWriteOps ?? m.monthlyUploadCount}</div>
                      <div className="text-[11px] text-slate-400">
                        {m.monthlyUploadCount} up &bull; {m.monthlyDeleteCount || 0} del
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-700">
                      {m.monthlyReadRequests !== null && m.monthlyReadRequests !== undefined ? (
                        <>
                          <div className="font-semibold">
                            {m.monthlyReadRequests.toLocaleString()} reads
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatBytes(m.monthlyReadBytes)} delivered
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
