import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Shield, Search, RefreshCw, X, MoreVertical } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function FraudChecks() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChecks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fraud/all');
      if (res.data?.success) {
        setChecks(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load fraud checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'safe': return 'bg-green-100 text-green-700 border-green-200';
      case 'suspicious': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'fraud': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'safe': return <ShieldCheck className="w-4 h-4" />;
      case 'suspicious': return <ShieldAlert className="w-4 h-4" />;
      case 'fraud': return <Shield className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#5022C3]" /> Global Fraud Checks
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Monitor fraud detection activities across all tenant stores.</p>
        </div>
        <button onClick={fetchChecks} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-[#5022C3] rounded-full"></div></div>
        ) : checks.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No fraud checks found across the platform.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Tenant / Store</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {checks.map((check) => (
                  <tr key={check._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{check.tenantId?.name || 'Unknown Store'}</div>
                      <div className="text-xs text-gray-500">{check.tenantId?.slug || 'unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{check.customerName}</div>
                      <div className="text-xs text-gray-500">{check.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {check.orderId?._id?.slice(-6) || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{check.score}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(check.status)}`}>
                        {getStatusIcon(check.status)} {check.status.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={check.details}>
                      {check.details || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {new Date(check.checkedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
