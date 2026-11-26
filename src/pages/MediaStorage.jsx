import React from 'react';
import MediaUsageSection from '../components/MediaUsageSection';

export default function MediaStorage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Media &amp; Storage
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform-wide Cloudflare R2 &amp; Cloudinary image storage, writes, and customer read analytics per merchant.
        </p>
      </div>

      <MediaUsageSection />
    </div>
  );
}
