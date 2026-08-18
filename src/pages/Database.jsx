import { Database as DbIcon, HardDrive, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Database() {
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    const fetchDbStats = async () => {
      try {
        const res = await api.get('/system/database');
        setDbStats(res.data.data);
      } catch (error) {
        console.error('Failed to fetch DB stats');
      }
    };
    fetchDbStats();
  }, []);

  return (
    <div className="space-y-8 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Database Management</h2>
          <p className="text-slate-500 text-sm mt-1">MongoDB cluster status and collection sizing.</p>
        </div>
        <button className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-700 flex items-center gap-2 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <DbIcon className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-sm">Cluster Status</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-2xl font-bold text-slate-800">{dbStats?.status || 'Connected'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <HardDrive className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-sm">Total Storage Used</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{dbStats?.storage || '1.2 GB'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <DbIcon className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-sm">Active Connections</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{dbStats?.connections || '42'}</p>
        </div>
      </div>
    </div>
  );
}
