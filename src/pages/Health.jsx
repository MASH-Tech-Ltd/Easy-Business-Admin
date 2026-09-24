import { Activity, Cpu, HardDrive, Wifi, Server, Monitor, Shield, Code, Clock } from 'lucide-react';
import { useGetSystemHealthQuery } from '../store/apiSlice';

export default function Health() {
  const { data: healthRes } = useGetSystemHealthQuery(undefined, {
    pollingInterval: 60000,
  });
  
  const healthData = healthRes?.data || null;

  return (
    <div className="space-y-8 w-full animate-fade-in pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Health & Metrics</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time infrastructure performance and service status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-blue-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Node.js Server Uptime</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{healthData?.processUptime || '---'}</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Online & Stable
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Monitor className="w-16 h-16 text-purple-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Monitor className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-sm">Operating System</h3>
          </div>
          <p className="text-xl font-bold text-slate-800 tracking-tight">{healthData?.os || '---'}</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Arch: {healthData?.arch || '---'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group lg:col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-16 h-16 text-rose-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Cpu className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-sm">Processor Information</h3>
          </div>
          <p className="text-xl font-bold text-slate-800 tracking-tight leading-tight mb-2 max-w-[85%]">{healthData?.cpu || '---'}</p>
          <div className="flex items-center gap-4 text-sm mt-3">
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <span className="font-medium">{healthData?.cpuCores || 0}</span> Cores
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              Load Avg: <span className="font-medium text-rose-600">{healthData?.loadAvg || '---'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group lg:col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HardDrive className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Memory Allocation</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{healthData?.memory || '---'}</p>
          
          <div className="mt-5 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div 
              className={`h-2.5 rounded-full transition-all duration-1000 ${
                (healthData?.memoryPercent || 0) > 85 ? 'bg-red-500' : 
                (healthData?.memoryPercent || 0) > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${healthData?.memoryPercent || 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs font-medium text-slate-500">
            <span>Used</span>
            <span>{healthData?.memoryPercent || 0}% Utilized</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group lg:col-span-2">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wifi className="w-16 h-16 text-amber-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Wifi className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-sm">Network Configuration</h3>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">{healthData?.ipAddress ? '***.***.***.***' : '---'}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Internal IP Address</p>
            </div>
            <div className="h-12 w-px bg-slate-200"></div>
            <div>
              <p className="text-xl font-bold text-slate-800 tracking-tight">{healthData?.hostname ? '********' : '---'}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Hostname</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group lg:col-span-4">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Code className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Code className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-sm">Node.js Process Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500 font-medium">Machine OS Uptime</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.osUptime || '---'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Process PID</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.processPid || '---'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Heap Used / Limit</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.heapUsed || '---'} <span className="text-sm text-slate-400 font-normal">/ {healthData?.v8HeapLimit || '---'}</span></p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Process RSS (Resident Set)</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.processRss || '---'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">External Memory</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.externalMem || '---'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Array Buffers</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.arrayBuffers || '---'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Node Version</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{healthData?.nodeVersion || '---'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Environment</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                {healthData?.env || '---'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
