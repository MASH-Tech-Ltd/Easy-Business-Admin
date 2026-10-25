import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Mail,
  Phone,
  CheckCircle,
  Trash2,
  Eye,
  X,
  Globe,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  AlertCircle,
  Clock,
  PhoneCall,
  MessageSquare,
  Copy,
  Check,
  Tag,
  Share2,
  ExternalLink,
  Save,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../utils/api';
import ConfirmModal from '../components/ConfirmModal';
import { useSocket } from '../context/SocketContext';

// Helper for BD WhatsApp link
const formatWhatsAppLink = (rawPhone, name = '') => {
  if (!rawPhone) return '#';
  const clean = rawPhone.replace(/\D/g, '');
  let fullNumber = clean;
  if (clean.startsWith('01')) {
    fullNumber = `88${clean}`;
  } else if (clean.startsWith('8801')) {
    fullNumber = clean;
  }
  const text = encodeURIComponent(
    `Hello ${name || 'Merchant'}, thank you for your interest in MASH ECO! We are reaching out regarding your inquiry.`
  );
  return `https://wa.me/${fullNumber}?text=${text}`;
};

export default function ContactInquiries() {
  const { socket } = useSocket();

  // Data states
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    pendingLeads: 0,
    contactedLeads: 0,
    resolvedLeads: 0,
    todayLeads: 0,
    thisWeekLeads: 0,
    thisMonthLeads: 0,
    facebookLeads: 0,
    googleLeads: 0,
    directLeads: 0,
    topicBreakdown: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

  // Detail Modal & Notes
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: null,
    details: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    isLoading: false,
    onConfirm: () => {},
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/contact-inquiries/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load inquiry stats', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Inquiries with Pagination and Filters
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(topicFilter !== 'all' && { topic: topicFilter }),
      };

      const res = await api.get('/contact-inquiries/get-all-inquiries', { params });
      if (res.data?.success) {
        setInquiries(res.data.data || []);
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      }
    } catch (error) {
      toast.error('Failed to load merchant inquiries');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, sourceFilter, topicFilter]);

  // Initial and reactive fetch
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeLead = () => {
      fetchInquiries();
      fetchStats();
    };

    socket.on('refresh_inquiries', handleRealtimeLead);
    socket.on('new_inquiry', handleRealtimeLead);

    return () => {
      socket.off('refresh_inquiries', handleRealtimeLead);
      socket.off('new_inquiry', handleRealtimeLead);
    };
  }, [socket, fetchInquiries, fetchStats]);

  // Sync admin notes when an inquiry is selected
  useEffect(() => {
    if (selectedInquiry) {
      setAdminNotes(selectedInquiry.adminNotes || '');
    }
  }, [selectedInquiry]);

  // Status update
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/contact-inquiries/update-inquiry-status/${id}`, {
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchInquiries();
        fetchStats();
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Save Follow-up Notes
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      const res = await api.patch(
        `/contact-inquiries/update-inquiry-status/${selectedInquiry._id}`,
        { adminNotes }
      );
      if (res.data?.success) {
        toast.success('Follow-up notes saved');
        setSelectedInquiry((prev) => ({ ...prev, adminNotes }));
        setInquiries((prev) =>
          prev.map((item) =>
            item._id === selectedInquiry._id ? { ...item, adminNotes } : item
          )
        );
      }
    } catch (error) {
      toast.error('Failed to save follow-up notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete Inquiry
  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Merchant Lead?',
      message: 'Are you sure you want to permanently delete this lead record?',
      details: 'This action cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      isLoading: false,
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id) => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/contact-inquiries/delete-inquiry/${id}`);
      toast.success('Lead inquiry deleted');
      fetchInquiries();
      fetchStats();
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry(null);
      }
    } catch (error) {
      toast.error('Failed to delete inquiry');
    } finally {
      setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (inquiries.length === 0) {
      toast.info('No inquiries to export');
      return;
    }

    const headers = [
      'Name',
      'Business Name',
      'Phone',
      'Email',
      'Topic',
      'Ad Source',
      'UTM Campaign',
      'UTM Medium',
      'Status',
      'Admin Notes',
      'Date',
      'Message',
    ];

    const rows = inquiries.map((inq) => [
      `"${inq.firstName || ''} ${inq.lastName || ''}"`,
      `"${inq.businessName || ''}"`,
      `"${inq.phone || ''}"`,
      `"${inq.email || ''}"`,
      `"${inq.topic || ''}"`,
      `"${inq.source || 'direct'}"`,
      `"${inq.utmCampaign || ''}"`,
      `"${inq.utmMedium || ''}"`,
      `"${inq.status || 'pending'}"`,
      `"${(inq.adminNotes || '').replace(/"/g, '""')}"`,
      `"${new Date(inq.createdAt).toLocaleString()}"`,
      `"${(inq.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `masheco_merchant_leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully');
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSourceFilter('all');
    setTopicFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    search || statusFilter !== 'all' || sourceFilter !== 'all' || topicFilter !== 'all';

  // Badge helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Resolved / Converted
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PhoneCall className="w-3.5 h-3.5 text-blue-600" /> Contacted
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3.5 h-3.5 text-rose-500" /> Cancelled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Action
          </span>
        );
    }
  };

  const getSourceBadge = (source, inq = {}) => {
    const isFb =
      source === 'facebook' ||
      inq.fbclid ||
      /facebook|fb|ig|instagram/i.test(inq.utmSource || '');
    const isGoogle =
      source === 'google' ||
      inq.gclid ||
      /google|adwords/i.test(inq.utmSource || '');

    if (isFb) {
      return (
        <div className="flex flex-col gap-0.5 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] animate-pulse" />
            Facebook Ad
          </span>
          {inq.utmCampaign && (
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={inq.utmCampaign}>
              Campaign: {inq.utmCampaign}
            </span>
          )}
        </div>
      );
    }

    if (isGoogle) {
      return (
        <div className="flex flex-col gap-0.5 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Google Ad
          </span>
          {inq.utmCampaign && (
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={inq.utmCampaign}>
              Campaign: {inq.utmCampaign}
            </span>
          )}
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Direct / Organic
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#5022C3]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Merchant Landing Page Leads
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Capture, track attribution (Facebook & Google Ads), and convert prospective merchant leads.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              fetchInquiries();
              fetchStats();
              toast.info('Refreshed lead data');
            }}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Leads
            </span>
            <div className="p-2 bg-purple-50 rounded-lg text-[#5022C3]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalLeads}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">All time records</p>
          </div>
        </div>

        {/* Facebook Ads Leads */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#1877F2]/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1877F2]">
              Facebook Ads
            </span>
            <div className="p-2 bg-[#1877F2]/10 rounded-lg text-[#1877F2]">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1877F2]">
              {stats.facebookLeads}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.totalLeads > 0
                ? `${Math.round((stats.facebookLeads / stats.totalLeads) * 100)}% of total`
                : '0% of total'}
            </p>
          </div>
        </div>

        {/* Google Ads Leads */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Google Ads
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-800">
              {stats.googleLeads}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.totalLeads > 0
                ? `${Math.round((stats.googleLeads / stats.totalLeads) * 100)}% of total`
                : '0% of total'}
            </p>
          </div>
        </div>

        {/* Pending Action */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Pending
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats.pendingLeads}
            </span>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Requires call / reply</p>
          </div>
        </div>

        {/* Contacted */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Contacted
            </span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">
              {stats.contactedLeads}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">In follow-up</p>
          </div>
        </div>

        {/* Converted / Resolved */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Converted
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.resolvedLeads}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Onboarded / Closed</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, phone, business, campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Source Filter */}
          <div className="lg:col-span-3">
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-700 font-medium"
            >
              <option value="all">All Ad Sources</option>
              <option value="facebook">Facebook Ads (Meta)</option>
              <option value="google">Google Ads</option>
              <option value="direct">Direct & Organic</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div className="lg:col-span-2">
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-700 font-medium"
            >
              <option value="all">All Topics</option>
              <option value="Demo Request">Demo Request</option>
              <option value="Business Consultation (ব্যবসার পরামর্শ)">
                Business Consultation
              </option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Enterprise Solution">Enterprise</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="lg:col-span-1 flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors text-center"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4">Merchant / Lead</th>
                <th className="px-6 py-4">Ad Attribution</th>
                <th className="px-6 py-4">Topic / Intent</th>
                <th className="px-6 py-4 max-w-xs">Message Preview</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-purple-200 border-t-[#5022C3] rounded-full animate-spin" />
                      <p className="text-slate-500 text-sm font-medium">Loading merchant leads...</p>
                    </div>
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">No Merchant Leads Found</h3>
                      <p className="text-xs text-slate-500">
                        {hasActiveFilters
                          ? 'No results match the current filters. Try resetting the filters.'
                          : 'Leads from Facebook Ads, Google Ads, and landing page forms will appear here.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-xs font-semibold text-[#5022C3] hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => {
                  const leadName = `${inquiry.firstName || ''} ${inquiry.lastName || ''}`.trim() || 'Anonymous Lead';
                  return (
                    <tr
                      key={inquiry._id}
                      className="hover:bg-purple-50/20 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-[#5022C3] transition-colors">
                          {leadName}
                        </div>
                        {inquiry.businessName && (
                          <div className="text-xs font-semibold text-purple-700 mt-0.5">
                            🏢 {inquiry.businessName}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <a
                            href={`tel:${inquiry.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                            title="Call Phone"
                          >
                            <Phone className="w-3 h-3 text-[#5022C3]" />
                            {inquiry.phone || 'N/A'}
                          </a>
                          {inquiry.phone && (
                            <a
                              href={formatWhatsAppLink(inquiry.phone, leadName)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                        {inquiry.email && (
                          <div className="text-slate-400 flex items-center gap-1 mt-1 text-xs">
                            <Mail className="w-3 h-3" />
                            {inquiry.email}
                          </div>
                        )}
                      </td>

                      {/* Marketing / Ad Attribution */}
                      <td className="px-6 py-4">
                        {getSourceBadge(inquiry.source, inquiry)}
                      </td>

                      {/* Topic */}
                      <td className="px-6 py-4">
                        <span className="inline-block bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200/80">
                          {inquiry.topic || 'General'}
                        </span>
                      </td>

                      {/* Message preview */}
                      <td className="px-6 py-4 max-w-xs">
                        <p
                          className="text-xs text-slate-600 truncate"
                          title={inquiry.message}
                        >
                          {inquiry.message || 'No message provided'}
                        </p>
                        {inquiry.adminNotes && (
                          <div className="text-[11px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200/60 truncate" title={inquiry.adminNotes}>
                            📝 Note: {inquiry.adminNotes}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="font-medium text-slate-700">
                          {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(inquiry.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(inquiry.status)}
                          <select
                            value={inquiry.status}
                            onChange={(e) => handleUpdateStatus(inquiry._id, e.target.value)}
                            className="text-[11px] bg-transparent text-slate-500 hover:text-slate-800 cursor-pointer focus:outline-none underline"
                          >
                            <option value="pending">Mark Pending</option>
                            <option value="contacted">Mark Contacted</option>
                            <option value="resolved">Mark Resolved</option>
                            <option value="cancelled">Mark Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#5022C3] hover:bg-purple-50 transition-colors"
                            title="View Full Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inquiry._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <p>
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {inquiries.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-800">{meta.total}</span> leads
              </p>

              <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                <span className="text-xs text-slate-400">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none font-medium text-slate-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-semibold text-slate-700">
                  Page {meta.page} of {meta.totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Details & Follow-up Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Merchant Lead Details</span>
                  {getStatusBadge(selectedInquiry.status)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono">{selectedInquiry._id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Contact & Action Bar */}
              <div className="flex flex-wrap items-center gap-2.5 p-3 bg-purple-50/50 rounded-2xl border border-purple-100/60">
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-800 font-semibold text-xs border border-purple-200 hover:bg-purple-100/50 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-[#5022C3]" />
                  Call {selectedInquiry.phone}
                </a>

                {selectedInquiry.phone && (
                  <a
                    href={formatWhatsAppLink(
                      selectedInquiry.phone,
                      `${selectedInquiry.firstName} ${selectedInquiry.lastName}`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open WhatsApp Chat
                  </a>
                )}

                {selectedInquiry.email && (
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="px-3.5 py-2 rounded-xl bg-white text-slate-800 font-semibold text-xs border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    Email
                  </a>
                )}
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead Contact Info */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Contact Information
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Name:</span>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedInquiry.firstName} {selectedInquiry.lastName}
                    </p>
                  </div>
                  {selectedInquiry.businessName && (
                    <div>
                      <span className="text-xs text-slate-500">Business / Store:</span>
                      <p className="text-sm font-bold text-purple-700">
                        {selectedInquiry.businessName}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-500">Phone:</span>
                    <p className="text-sm font-semibold text-slate-800">{selectedInquiry.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Email:</span>
                    <p className="text-sm text-slate-700">{selectedInquiry.email || 'None provided'}</p>
                  </div>
                </div>

                {/* Marketing & Attribution Intelligence */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Marketing & Ad Attribution
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Ad Platform:</span>
                    <div className="mt-0.5">{getSourceBadge(selectedInquiry.source, selectedInquiry)}</div>
                  </div>
                  {selectedInquiry.utmCampaign && (
                    <div>
                      <span className="text-xs text-slate-500">Campaign:</span>
                      <p className="text-xs font-mono font-semibold text-slate-800">
                        {selectedInquiry.utmCampaign}
                      </p>
                    </div>
                  )}
                  {selectedInquiry.utmMedium && (
                    <div>
                      <span className="text-xs text-slate-500">Medium / Content:</span>
                      <p className="text-xs font-mono text-slate-600">
                        {selectedInquiry.utmMedium} {selectedInquiry.utmContent ? `| ${selectedInquiry.utmContent}` : ''}
                      </p>
                    </div>
                  )}
                  {(selectedInquiry.fbclid || selectedInquiry.gclid) && (
                    <div>
                      <span className="text-xs text-slate-500">
                        {selectedInquiry.fbclid ? 'Facebook Click ID (fbclid):' : 'Google Click ID (gclid):'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]">
                          {selectedInquiry.fbclid || selectedInquiry.gclid}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedInquiry.fbclid || selectedInquiry.gclid);
                            setCopiedId(true);
                            setTimeout(() => setCopiedId(false), 2000);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Copy Click ID"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-400">
                    Received: {new Date(selectedInquiry.createdAt).toLocaleString()} | IP: {selectedInquiry.ipAddress || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Lead Message & Requirements
                </label>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-800 whitespace-pre-wrap text-sm border border-slate-200 font-sans leading-relaxed">
                  {selectedInquiry.message || 'No additional message.'}
                </div>
              </div>

              {/* Follow-up Notes Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    📝 Admin Follow-up Notes
                  </label>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1.5 rounded-lg bg-[#5022C3] hover:bg-[#401ab0] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs disabled:opacity-50 transition-colors"
                  >
                    {savingNotes ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Notes
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Record follow-up notes (e.g. Called merchant, scheduled walkthrough demo for tomorrow 4 PM, interested in Pro Tier)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-800"
                />
              </div>

              {/* Status Switcher in Modal */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs font-semibold text-slate-600">Quick Change Status:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry._id, 'pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedInquiry.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry._id, 'contacted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedInquiry.status === 'contacted'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Contacted
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry._id, 'resolved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedInquiry.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Resolved / Converted
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry._id, 'cancelled')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedInquiry.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/75 flex justify-between items-center">
              <button
                onClick={() => handleDelete(selectedInquiry._id)}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Record
              </button>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => !confirmModal.isLoading && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}
