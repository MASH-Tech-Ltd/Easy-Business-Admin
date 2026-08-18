import { Server, Terminal, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/system/logs');
        setLogs(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch logs');
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Server Logs</h2>
          <p className="text-slate-500 text-sm mt-1">Live streaming application and server logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-700 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl flex-1 overflow-hidden flex flex-col shadow-lg border border-slate-800">
        <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#404040] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 text-xs font-mono">syslog -f</span>
        </div>
        <div className="p-4 overflow-y-auto font-mono text-xs flex-1">
          {logs.map((log, i) => (
            <div key={i} className="mb-1 flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded">
              <span className="text-slate-500 shrink-0">{log.timestamp || new Date().toISOString()}</span>
              <span className={`shrink-0 font-bold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'}`}>
                [{log.level || 'INFO'}]
              </span>
              <span className="text-slate-300">{log.message || 'System initialized successfully.'}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-500">Connecting to log stream...</div>
          )}
        </div>
      </div>
    </div>
  );
}
