import { useState } from 'react';
import {
  Database as DbIcon,
  HardDrive,
  RefreshCw,
  Download,
  Clock,
  FileArchive,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import {
  useGetDatabaseStatsQuery,
  useGetBackupFilesQuery,
  useGetBackupLogsQuery,
  useTriggerDatabaseSyncMutation,
} from '../store/apiSlice';

export default function Database() {
  const [activeBackupTab, setActiveBackupTab] = useState('archives'); // 'archives' | 'logs'
  const [downloadingFile, setDownloadingFile] = useState(null);

  const {
    data: dbStatsRes,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useGetDatabaseStatsQuery();
  const {
    data: backupFilesRes,
    isLoading: isFilesLoading,
    refetch: refetchFiles,
  } = useGetBackupFilesQuery();
  const {
    data: backupLogsRes,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useGetBackupLogsQuery();

  const [triggerSync, { isLoading: isSyncing }] = useTriggerDatabaseSyncMutation();

  const dbStats = dbStatsRes?.data || null;
  const backupFiles = backupFilesRes?.data || [];
  const backupLogs = backupLogsRes?.data || [];

  const handleRefreshAll = () => {
    refetchStats();
    refetchFiles();
    refetchLogs();
    toast.info('Database information refreshed');
  };

  const handleManualSync = async () => {
    try {
      toast.info('Starting database backup & secondary replication...');
      const res = await triggerSync().unwrap();
      if (res?.data?.success === false) {
        toast.warn(res?.data?.message || 'Backup skipped due to safety checks.');
      } else {
        toast.success('Database backup & replication completed successfully!');
      }
      refetchFiles();
      refetchLogs();
      refetchStats();
    } catch (err) {
      console.error('Manual backup error:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to trigger backup.');
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      setDownloadingFile(filename);
      const response = await api.get(`/system/database/download-backup/${filename}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/gzip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download backup file.');
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DbIcon className="w-6 h-6 text-amber-600" /> Database Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Primary cluster monitoring, secondary database replication, and local archives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            className="bg-white border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> Refresh
          </button>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-60"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Replicating...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Sync Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cluster Status</span>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{dbStats?.status || 'Connected'}</p>
          <p className="text-xs text-slate-400 mt-1">MongoDB Primary Replica</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Storage</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{dbStats?.storage || 'Calculating...'}</p>
          <p className="text-xs text-slate-400 mt-1">Data size on cluster</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collections</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{dbStats?.collections || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Active registered schemas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Documents</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{dbStats?.documents?.toLocaleString() || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Primary records count</p>
        </div>
      </div>

      {/* Main Database Backups & Sync History Card */}
      <div className="bg-[#fffdfa] rounded-2xl border border-[#e8ddd0] p-6 flex flex-col gap-5 shadow-sm">
        {/* Card Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8ddd0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f5f0e8] border border-[#e8ddd0] flex items-center justify-center text-[#8B6914]">
              <DbIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#3a2a1a] text-base leading-tight">Database Backups</h3>
              <p className="text-xs text-[#9a8a7a] mt-0.5">
                {activeBackupTab === 'archives'
                  ? 'Compressed JSON backup archives (.gz) stored on the server disk. Click download to save locally.'
                  : 'Read-only logs of database synchronization events and secondary cluster replication.'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl p-1 self-start sm:self-center">
            <button
              onClick={() => setActiveBackupTab('archives')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeBackupTab === 'archives'
                  ? 'bg-[#8B6914] text-white shadow-sm'
                  : 'text-[#9a8a7a] hover:text-[#3a2a1a]'
              }`}
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>Backup Archives ({backupFiles.length})</span>
            </button>
            <button
              onClick={() => setActiveBackupTab('logs')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeBackupTab === 'logs'
                  ? 'bg-[#8B6914] text-white shadow-sm'
                  : 'text-[#9a8a7a] hover:text-[#3a2a1a]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sync Logs ({backupLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Backup Archives List */}
        {activeBackupTab === 'archives' && (
          <div className="flex flex-col gap-3">
            {isFilesLoading ? (
              <div className="flex items-center justify-center py-12 text-[#9a8a7a] gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#8B6914]" />
                <span className="text-xs">Loading backup archives...</span>
              </div>
            ) : backupFiles.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#9a8a7a] italic bg-[#fcfaf7] border border-dashed border-[#e8ddd0] rounded-xl flex flex-col items-center gap-2">
                <FileArchive className="w-8 h-8 text-[#d4c3b2]" />
                <p>No backup archives found on server disk.</p>
                <button
                  onClick={handleManualSync}
                  className="mt-2 text-xs text-[#8B6914] font-bold hover:underline"
                >
                  Click here to create your first backup
                </button>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto flex flex-col gap-2.5 pr-1">
                {backupFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="border border-[#e8ddd0] rounded-xl p-3.5 bg-[#fcfaf7] flex items-center justify-between gap-4 hover:border-[#8B6914] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-[#f5f0e8] border border-[#e8ddd0] flex items-center justify-center text-[#8B6914] shrink-0">
                        <FileArchive className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[#3a2a1a] truncate font-mono" title={file.filename}>
                          {file.filename}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="text-[10px] font-semibold text-[#8B6914] bg-[#f5f0e8] px-2 py-0.5 rounded border border-[#e8ddd0]">
                            {Number(file.sizeMB) > 0.1 ? `${file.sizeMB} MB` : `${file.sizeKB} KB`}
                          </span>
                          <span className="text-[10px] text-[#9a8a7a] flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {new Date(file.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadBackup(file.filename)}
                      disabled={downloadingFile === file.filename}
                      className="bg-[#8B6914] text-white hover:bg-[#6a5010] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 shadow-sm"
                      title="Download backup file"
                    >
                      {downloadingFile === file.filename ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-xs">Download</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sync Logs */}
        {activeBackupTab === 'logs' && (
          <div className="flex flex-col gap-3">
            {isLogsLoading ? (
              <div className="flex items-center justify-center py-12 text-[#9a8a7a] gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#8B6914]" />
                <span className="text-xs">Loading sync logs...</span>
              </div>
            ) : backupLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#9a8a7a] italic bg-[#fcfaf7] border border-dashed border-[#e8ddd0] rounded-xl flex flex-col items-center gap-2">
                <Clock className="w-8 h-8 text-[#d4c3b2]" />
                <p>No synchronization logs found in history.</p>
              </div>
            ) : (
              <div className="max-h-[550px] overflow-y-auto flex flex-col gap-3.5 pr-1">
                {backupLogs.map((log, index) => (
                  <div
                    key={index}
                    className="border border-[#e8ddd0] rounded-xl p-4 bg-[#fcfaf7] flex flex-col gap-2.5 shadow-sm"
                  >
                    {/* Log Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#9a8a7a]" />
                        <span className="text-xs font-bold text-[#3a2a1a]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : log.status === 'bypassed'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status === 'success' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {log.status === 'bypassed' && <AlertTriangle className="w-2.5 h-2.5" />}
                          {log.status === 'failed' && <XCircle className="w-2.5 h-2.5" />}
                          {log.status}
                        </span>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full uppercase font-semibold">
                          {log.triggerType}
                        </span>
                      </div>
                    </div>

                    {/* Message Box */}
                    {log.message && (
                      <p className="text-xs text-[#5a4a3a] leading-relaxed bg-[#f5f0e8] p-2.5 rounded-lg border border-[#e8ddd0]">
                        {log.message}
                      </p>
                    )}

                    {/* Synchronized Collections Grid */}
                    {log.recordsDetail && Object.keys(log.recordsDetail).length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-[#8B6914] uppercase tracking-wider">
                          Synchronized Collections:
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 bg-white border border-[#e8ddd0] rounded-xl p-3 max-h-[160px] overflow-y-auto">
                          {Object.entries(log.recordsDetail).map(([coll, count]) => (
                            <div
                              key={coll}
                              className="flex items-center justify-between text-[11px] py-0.5 px-1.5 bg-[#fcfaf7] rounded border border-[#f5f0e8]"
                            >
                              <span className="font-medium text-[#3a2a1a] truncate" title={coll}>
                                {coll}
                              </span>
                              <span className="font-bold text-[#8B6914] ml-2 shrink-0">
                                {count} records
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
