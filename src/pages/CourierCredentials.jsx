import { useState, useEffect } from 'react';
import { Truck, Key, CheckCircle, XCircle, Search, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function CourierCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTokens, setShowTokens] = useState({});
  const [syncReport, setSyncReport] = useState(null);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courier/all-credentials');
      if (res.data?.success) {
        setCredentials(res.data.data.filter(c => c.provider)); // only show those that have configured credentials
      }
    } catch (error) {
      toast.error('Failed to load courier credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const toggleTokenVisibility = (id) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600" /> Courier API Credentials
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Monitor connected courier APIs for all merchant stores. Tokens are decrypted for admin view.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              const toastId = toast.loading('Syncing statuses globally...');
              try {
                const res = await api.post('/courier/sync-status');
                if (res.data?.success) {
                  const data = res.data.data;
                  toast.success(`Sync complete! ${data.updated} updated.`, { id: toastId });
                  if (data.details && data.details.length > 0) {
                    setSyncReport(data.details);
                  } else {
                    toast.info('No orders needed updating.');
                  }
                } else {
                  toast.error('Sync failed', { id: toastId });
                }
              } catch (err) {
                toast.error('Failed to sync', { id: toastId });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Global Sync
          </button>
          <button onClick={fetchCredentials} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors tooltip" title="Refresh Credentials">
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div></div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No courier credentials configured by merchants yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Client ID</th>
                  <th className="px-6 py-4">API Token (Decrypted)</th>
                  <th className="px-6 py-4 text-center">Auto-forward</th>
                  <th className="px-6 py-4 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {credentials.map((cred) => (
                  <tr key={cred._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{cred.tenantId?.name || 'Unknown Store'}</div>
                      <div className="text-xs text-gray-500">{cred.tenantId?.slug || 'unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-700 border-gray-200 capitalize">
                        <Truck className="w-3 h-3" /> {cred.provider}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {cred.clientId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate flex-1">
                          {showTokens[cred._id] ? (cred.apiSecret || 'No token set') : '••••••••••••••••••••'}
                        </span>
                        {cred.apiSecret && (
                          <button onClick={() => toggleTokenVisibility(cred._id)} className="text-blue-500 hover:text-blue-700 tooltip" title="Toggle visibility">
                            {showTokens[cred._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cred.autoForward ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {new Date(cred.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {syncReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Global Sync Report</h3>
              <button onClick={() => setSyncReport(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-4">Successfully updated {syncReport.length} orders across the platform.</p>
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Store ID</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Previous Status</th>
                      <th className="px-4 py-3">New Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {syncReport.map((rep, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{rep.tenantId}</td>
                        <td className="px-4 py-3 capitalize font-semibold text-gray-700">{rep.provider}</td>
                        <td className="px-4 py-3 font-mono text-blue-600">#{rep.orderId}</td>
                        <td className="px-4 py-3 capitalize text-gray-500">{rep.oldStatus}</td>
                        <td className="px-4 py-3 capitalize font-bold text-green-600">{rep.newStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSyncReport(null)}
                className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-800"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
