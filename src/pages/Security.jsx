import { useState } from 'react';
import { 
  ShieldAlert, RefreshCw, Plus, Search, 
  Unlock, Eye, X, Activity, Globe, MonitorSmartphone,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { useGetBlockedIpsQuery, useGetSecurityLogsQuery, useGetVisitorLogsQuery } from '../store/apiSlice';
import api from '../utils/api';
import { toast } from 'react-toastify';

const formatDate = (dateString) => {
  if (!dateString) return 'Permanent';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  });
};

export default function Security() {
  const [activeTab, setActiveTab] = useState('blocked-ips');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const queryParams = { page, limit, search };

  const { data: blockedIpsRes, isLoading: blockedLoading, refetch: refetchBlocked } = useGetBlockedIpsQuery(
    queryParams,
    { skip: activeTab !== 'blocked-ips' }
  );
  
  const { data: logsRes, isLoading: logsLoading, refetch: refetchLogs } = useGetSecurityLogsQuery(
    queryParams,
    { skip: activeTab !== 'security-logs' }
  );

  const { data: visitorLogsRes, isLoading: visitorLoading, refetch: refetchVisitor } = useGetVisitorLogsQuery(
    queryParams,
    { skip: activeTab !== 'visitor-logs' }
  );

  const blockedIps = blockedIpsRes?.data?.ips || [];
  const securityLogs = logsRes?.data?.logs || [];
  const visitorLogs = visitorLogsRes?.data?.logs || [];

  const currentTotal = activeTab === 'blocked-ips'
    ? (blockedIpsRes?.data?.total || 0)
    : activeTab === 'security-logs'
    ? (logsRes?.data?.total || 0)
    : (visitorLogsRes?.data?.total || 0);

  const totalPages = Math.max(1, Math.ceil(currentTotal / limit));
  const startItem = currentTotal > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, currentTotal);

  const loading = blockedLoading || logsLoading || visitorLoading;
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ ipAddress: '', reason: '' });
  
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchBlockedIps = () => refetchBlocked();
  const fetchSecurityLogs = () => refetchLogs();

  const handleSyncCache = async () => {
    try {
      await api.post('/system/security/sync');
      toast.success('IP Cache synced across all instances');
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await api.delete(`/system/security/blocked-ips/${encodeURIComponent(ip)}`);
      toast.success('IP Unblocked successfully');
      fetchBlockedIps();
    } catch (err) {
      toast.error('Failed to unblock IP');
    }
  };

  const handleBlockIp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/system/security/block-ip', blockForm);
      toast.success('IP Blocked manually');
      setIsBlockModalOpen(false);
      setBlockForm({ ipAddress: '', reason: '' });
      fetchBlockedIps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block IP');
    }
  };

  const getMethodColor = (method) => {
    if (!method) return 'text-slate-600 bg-slate-50';
    if (method.includes('GET')) return 'text-blue-600 bg-blue-50';
    if (method.includes('POST')) return 'text-rose-600 bg-rose-50';
    if (method.includes('PATCH') || method.includes('PUT')) return 'text-amber-600 bg-amber-50';
    if (method.includes('DELETE')) return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getRoleBadgeColor = (role) => {
    if (!role) return 'bg-slate-100 text-slate-700 border border-slate-200';
    const roleLower = role.toLowerCase();
    if (roleLower.includes('admin') || roleLower.includes('super')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    if (roleLower.includes('merchant')) {
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    }
    if (roleLower.includes('customer')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Security & IPs</h2>
          <p className="text-slate-500 mt-1">Manage blocked IPs, users, and security logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncCache}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sync IP Cache
          </button>
          <button 
            onClick={() => setIsBlockModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Block IP Address
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 px-4 border-b border-slate-200 bg-white gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => handleTabChange('blocked-ips')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'blocked-ips' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Blocked IPs
            </button>
            <button
              onClick={() => handleTabChange('security-logs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'security-logs' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              Security Logs
            </button>
            <button
              onClick={() => handleTabChange('visitor-logs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'visitor-logs' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Visitor Logs
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={handleSearchChange}
              placeholder="Search IP, reason, user..." 
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm w-full sm:w-64 outline-none"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto min-h-[450px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {activeTab === 'blocked-ips' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100/50 text-slate-500 text-sm font-medium">
                <tr>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Blocked At</th>
                  <th className="px-6 py-4">Expires At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {blockedIps.map(ip => (
                  <tr key={ip._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold text-slate-700">{ip.ipAddress}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {ip.type === 'auto' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 mb-1">
                          <ShieldAlert className="w-3 h-3" /> AUTO-PROTECTED
                        </div>
                      )}
                      <p className="text-sm text-slate-500 truncate">{ip.reason}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(ip.blockedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium border border-purple-100">
                        {ip.expiresAt ? formatDate(ip.expiresAt) : 'Permanent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleUnblock(ip.ipAddress)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
                {blockedIps.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No blocked IPs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'security-logs' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100/50 text-slate-500 text-sm font-medium">
                <tr>
                  <th className="px-6 py-4">Incident Type</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Requested From</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {securityLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMethodColor(log.incidentType)}`}>
                          {log.incidentType === 'RATE_LIMIT' ? 'RATELIMIT' : log.incidentType === 'ATTACK_DETECTED' ? 'ATTACK' : 'AUTH'}
                        </span>
                        <span className="text-xs text-slate-500 max-w-[120px] truncate">{log.endpoint}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                        {log.ipAddress}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-xs text-slate-500 truncate">{log.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        {log.requestedFrom === 'Web/Admin' || log.requestedFrom === 'super_admin' ? <Globe className="w-3.5 h-3.5"/> : <MonitorSmartphone className="w-3.5 h-3.5"/>}
                        {log.requestedFrom}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 italic">{log.user}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
                {securityLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">No security logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'visitor-logs' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100/50 text-slate-500 text-sm font-medium">
                <tr>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Context Info</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Browser Details</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visitorLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getRoleBadgeColor(log.role)}`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.storeName ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{log.storeName}</p>
                          <p className="text-xs text-slate-500">Owner: {log.ownerName || 'N/A'}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Merchant Dashboard</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-slate-700">{log.ipAddress}</span>
                    </td>
                    <td className="px-6 py-4 max-w-[250px]">
                      <p className="text-xs text-slate-500 truncate" title={log.userAgent}>{log.userAgent}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(log.accessedAt)}
                    </td>
                  </tr>
                ))}
                {visitorLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No visitor logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 bg-white/90">
          {/* Left: Showing Range */}
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
            <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
            <span className="font-semibold text-slate-800">{currentTotal}</span> entries
          </div>

          {/* Middle: Rows Per Page Selector */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Right: Page Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First Page"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous Page"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    page === pNum
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {pNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              title="Next Page"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              title="Last Page"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Block Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Block IP Address
              </h3>
              <button onClick={() => setIsBlockModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBlockIp} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">IP Address</label>
                <input 
                  type="text" 
                  required
                  value={blockForm.ipAddress}
                  onChange={e => setBlockForm({...blockForm, ipAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-slate-700" 
                  placeholder="e.g. 192.168.1.1" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Reason</label>
                <textarea 
                  required
                  value={blockForm.reason}
                  onChange={e => setBlockForm({...blockForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-slate-700 min-h-[100px]" 
                  placeholder="Reason for blocking..." 
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsBlockModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-rose-600/20">
                  Block IP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B231D]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#3D261A] text-white">
              <h3 className="font-bold flex items-center gap-2">
                <span className="text-amber-500 font-mono text-xl">{'>_'}</span> Security Log Details
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-white/10 rounded-lg text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-[#FAF9F7] space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Incident Type (Full URL)</label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMethodColor(selectedLog.incidentType)}`}>
                    {selectedLog.incidentType}
                  </span>
                  <span className="font-mono text-sm text-slate-700">{selectedLog.endpoint}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">IP Address</label>
                  <span className="font-mono text-sm font-semibold text-slate-800">{selectedLog.ipAddress}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Date</label>
                  <span className="text-sm font-medium text-slate-800">{formatDate(selectedLog.date)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Requested From</label>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100 mt-1">
                    <Globe className="w-3.5 h-3.5"/> {selectedLog.requestedFrom}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Users</label>
                  <span className="text-sm italic text-slate-500">{selectedLog.user}</span>
                </div>
              </div>

              <div className="bg-white border border-rose-200 rounded-xl p-4">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Reason</label>
                <span className="text-sm font-medium text-rose-600">{selectedLog.reason}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">User Agent / Browser</label>
                <p className="font-mono text-xs text-slate-600 break-all leading-relaxed">
                  {selectedLog.userAgent}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
              <button onClick={() => setSelectedLog(null)} className="px-6 py-2 bg-[#3D261A] hover:bg-[#2B231D] text-white font-medium rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

