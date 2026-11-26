import React, { useEffect, useState } from 'react';
import { HardDrive, Image, UploadCloud, Database } from 'lucide-react';
import api from '../utils/api';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 10 || idx === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[idx]}`;
}

export default function MediaUsageSection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/media/usage/platform')
      .then((res) => {
        if (mounted && res.data?.data) {
          setData(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return null;

  const { storage, activeProvider, month, merchants = [] } = data;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Platform Media &amp; R2 Storage</h3>
          <p className="text-xs text-slate-500">
            Month: {month} &bull; Active upload provider:{' '}
            <span className="font-bold uppercase text-slate-800">{activeProvider}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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
            <Database className="w-4 h-4 text-blue-600" />
            <span>Merchants with Tracked Media</span>
          </div>
          <div className="text-xl font-black text-slate-900">{merchants.length}</div>
        </div>
      </div>

      {merchants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-bold">Store</th>
                <th className="py-2 px-3 font-bold">R2 Images</th>
                <th className="py-2 px-3 font-bold">R2 Storage</th>
                <th className="py-2 px-3 font-bold">Cloudinary Tracked</th>
                <th className="py-2 pl-3 font-bold">Monthly Uploads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.slice(0, 15).map((m) => (
                <tr key={m.tenantId} className="hover:bg-slate-50/70">
                  <td className="py-2 pr-3 font-semibold text-slate-800">{m.storeName}</td>
                  <td className="py-2 px-3 text-slate-700">{m.r2Images}</td>
                  <td className="py-2 px-3 text-slate-700">{formatBytes(m.r2Bytes)}</td>
                  <td className="py-2 px-3 text-slate-700">
                    {m.cloudinaryImages} ({formatBytes(m.cloudinaryBytes)})
                  </td>
                  <td className="py-2 pl-3 text-slate-700">
                    {m.monthlyUploadCount} ({formatBytes(m.monthlyUploadBytes)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
