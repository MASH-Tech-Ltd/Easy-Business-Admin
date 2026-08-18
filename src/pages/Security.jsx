import { ShieldAlert, ShieldCheck, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Security() {
  const [securityData, setSecurityData] = useState(null);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const res = await api.get('/system/security');
        setSecurityData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch security data');
      }
    };
    fetchSecurity();
  }, []);

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Security Center</h2>
        <p className="text-slate-500 text-sm mt-1">Monitor authentication attempts and security alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-sm">System Status</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{securityData?.status || 'Secure'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="font-semibold text-sm">Active Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{securityData?.alerts || '0'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-600">
            <Key className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-sm">Failed Logins (24h)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{securityData?.failedLogins || '3'}</p>
        </div>
      </div>
    </div>
  );
}
