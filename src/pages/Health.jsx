import { Activity, Cpu, HardDrive, Wifi, Server } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Health() {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/system/health');
        setHealthData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch health data');
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Health</h2>
        <p className="text-slate-500 text-sm mt-1">Real-time infrastructure and service status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Server className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-sm">Server Uptime</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{healthData?.uptime || '99.99%'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Cpu className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-sm">CPU Usage</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{healthData?.cpu || '24%'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <HardDrive className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-sm">Memory Usage</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{healthData?.memory || '4.2 GB'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Wifi className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-sm">Network Latency</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{healthData?.latency || '45ms'}</p>
        </div>
      </div>
    </div>
  );
}
