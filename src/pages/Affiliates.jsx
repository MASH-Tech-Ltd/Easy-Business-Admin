import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Store,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  ShieldAlert,
  Check,
  X,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  Settings,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function Affiliates() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('affiliates'); // 'affiliates' | 'withdrawals' | 'commissions' | 'audit'

  // Overview stats
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    suspendedAffiliates: 0,
    newAffiliatesThisMonth: 0,
    totalReferredMerchants: 0,
    totalCommissionGenerated: 0,
    totalCommissionPaid: 0,
    pendingCommission: 0,
    pendingWithdrawalRequests: 0,
    totalAffiliateWithdrawals: 0,
    maxAffiliates: 500,
    allowAffiliateRegistration: true,
    programEnabled: true,
  });

  // Tab 1: Affiliates List
  const [affiliates, setAffiliates] = useState([]);
  const [affMeta, setAffMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [affSearch, setAffSearch] = useState('');
  const [affStatus, setAffStatus] = useState('all');
  const [affSort, setAffSort] = useState('newest');
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  // Tab 2: Withdrawals List
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdMeta, setWdMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [wdSearch, setWdSearch] = useState('');
  const [wdStatus, setWdStatus] = useState('all');
  const [wdMethod, setWdMethod] = useState('all');
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // Tab 3: Commissions List
  const [commissions, setCommissions] = useState([]);
  const [commMeta, setCommMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [commSearch, setCommSearch] = useState('');
  const [commStatus, setCommStatus] = useState('all');
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  // Tab 4: Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMeta, setAuditMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Process Withdrawal Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [wdAction, setWdAction] = useState('completed');
  const [trxRef, setTrxRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingWd, setProcessingWd] = useState(false);

  // Status Action Modal
  const [statusModalAffiliate, setStatusModalAffiliate] = useState(null);
  const [nextStatus, setNextStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.get('/affiliates/admin/overview');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load affiliate stats', err);
    }
  }, []);

  const fetchAffiliates = useCallback(async (page = 1) => {
    try {
      setLoadingAffiliates(true);
      const res = await api.get('/affiliates/admin/list', {
        params: {
          page,
          limit: 10,
          search: affSearch || undefined,
          status: affStatus,
          sortBy: affSort,
        },
      });
      if (res.data?.data) {
        setAffiliates(res.data.data.data || []);
        setAffMeta(res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Failed to load affiliates list');
    } finally {
      setLoadingAffiliates(false);
    }
  }, [affSearch, affStatus, affSort]);

  const fetchWithdrawals = useCallback(async (page = 1) => {
    try {
      setLoadingWithdrawals(true);
      const res = await api.get('/affiliates/admin/withdrawals/list', {
        params: {
          page,
          limit: 10,
          search: wdSearch || undefined,
          status: wdStatus,
          paymentMethod: wdMethod,
        },
      });
      if (res.data?.data) {
        setWithdrawals(res.data.data.data || []);
        setWdMeta(res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [wdSearch, wdStatus, wdMethod]);

  const fetchCommissions = useCallback(async (page = 1) => {
    try {
      setLoadingCommissions(true);
      const res = await api.get('/affiliates/admin/commissions/list', {
        params: {
          page,
          limit: 10,
          search: commSearch || undefined,
          status: commStatus,
        },
      });
      if (res.data?.data) {
        setCommissions(res.data.data.data || []);
        setCommMeta(res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Failed to load commissions');
    } finally {
      setLoadingCommissions(false);
    }
  }, [commSearch, commStatus]);

  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setLoadingAudit(true);
      const res = await api.get('/affiliates/admin/audit-logs', {
        params: { page, limit: 15 },
      });
      if (res.data?.data) {
        setAuditLogs(res.data.data.data || []);
        setAuditMeta(res.data.data.meta || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'affiliates') fetchAffiliates(1);
    else if (activeTab === 'withdrawals') fetchWithdrawals(1);
    else if (activeTab === 'commissions') fetchCommissions(1);
    else if (activeTab === 'audit') fetchAuditLogs(1);
  }, [activeTab, fetchAffiliates, fetchWithdrawals, fetchCommissions, fetchAuditLogs]);

  // Real-Time Socket.IO updates
  useEffect(() => {
    if (!socket) return;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser?._id) {
        socket.emit('join_admin_affiliate_room', storedUser._id);
      }
    } catch (_) {}

    const handleRealtimeRefresh = () => {
      fetchOverview();
      if (activeTab === 'affiliates') fetchAffiliates(affMeta.page);
      if (activeTab === 'withdrawals') fetchWithdrawals(wdMeta.page);
      if (activeTab === 'commissions') fetchCommissions(commMeta.page);
    };

    socket.on('admin:affiliate:registered', handleRealtimeRefresh);
    socket.on('admin:affiliate:withdrawal-requested', handleRealtimeRefresh);
    socket.on('admin:affiliate:commission-generated', handleRealtimeRefresh);
    socket.on('admin:affiliate:stats-updated', handleRealtimeRefresh);

    return () => {
      socket.off('admin:affiliate:registered', handleRealtimeRefresh);
      socket.off('admin:affiliate:withdrawal-requested', handleRealtimeRefresh);
      socket.off('admin:affiliate:commission-generated', handleRealtimeRefresh);
      socket.off('admin:affiliate:stats-updated', handleRealtimeRefresh);
    };
  }, [socket, activeTab, affMeta.page, wdMeta.page, commMeta.page, fetchOverview, fetchAffiliates, fetchWithdrawals, fetchCommissions]);

  const handleUpdateAffiliateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalAffiliate) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/affiliates/admin/${statusModalAffiliate._id}/status`, {
        status: nextStatus,
        reason: statusReason,
      });
      toast.success(`Affiliate status updated to ${nextStatus}`);
      setStatusModalAffiliate(null);
      setStatusReason('');
      fetchOverview();
      fetchAffiliates(affMeta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProcessWithdrawal = async (e) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    if (wdAction === 'rejected' && !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessingWd(true);
    try {
      await api.patch(`/affiliates/admin/withdrawals/${selectedWithdrawal._id}/process`, {
        status: wdAction,
        transactionReference: trxRef,
        rejectionReason: rejectReason,
        adminNotes,
      });
      toast.success(`Withdrawal marked as ${wdAction}`);
      setSelectedWithdrawal(null);
      setTrxRef('');
      setRejectReason('');
      setAdminNotes('');
      fetchOverview();
      fetchWithdrawals(wdMeta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setProcessingWd(false);
    }
  };

  const handleCommissionAction = async (commissionId, status) => {
    const reason =
      status === 'reversed'
        ? window.prompt('Enter reason for reversing this commission:', 'Payment refunded / cancelled')
        : 'Approved by Admin';
    if (status === 'reversed' && !reason) return;
    try {
      await api.patch(`/affiliates/admin/commissions/${commissionId}/status`, {
        status,
        reason,
      });
      toast.success(`Commission ${status} successfully`);
      fetchOverview();
      fetchCommissions(commMeta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission');
    }
  };

  const overviewCards = [
    {
      label: lang === 'bn' ? 'মোট অ্যাফিলিয়েট' : 'Total Affiliates',
      value: `${stats.totalAffiliates} / ${stats.maxAffiliates || 500}`,
      sub: lang === 'bn' ? 'সর্বোচ্চ রেজিস্ট্রেশন সীমা' : 'Registered / Max Capacity',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: lang === 'bn' ? 'সক্রিয় অ্যাফিলিয়েট' : 'Active Affiliates',
      value: stats.activeAffiliates,
      sub: lang === 'bn' ? 'বর্তমানে সক্রিয় পার্টনার' : 'Currently active partners',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: lang === 'bn' ? 'সাসপেন্ডেড / নিষ্ক্রিয়' : 'Suspended Affiliates',
      value: stats.suspendedAffiliates,
      sub: lang === 'bn' ? 'স্থগিত বা নিষ্ক্রিয় অ্যাকাউন্ট' : 'Suspended or deactivated',
      icon: UserX,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      label: lang === 'bn' ? 'এই মাসে নতুন' : 'New Affiliates This Month',
      value: stats.newAffiliatesThisMonth,
      sub: lang === 'bn' ? 'চলতি মাসে যুক্ত হয়েছে' : 'Joined in current month',
      icon: UserPlus,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      label: lang === 'bn' ? 'রেফারকৃত মার্চেন্ট' : 'Total Referred Merchants',
      value: stats.totalReferredMerchants,
      sub: `${stats.subscribedReferredMerchants || 0} ${lang === 'bn' ? 'পেইড সাবস্ক্রাইবার' : 'paid subscribers'}`,
      icon: Store,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      label: lang === 'bn' ? 'মোট কমিশন তৈরি' : 'Total Commission Generated',
      value: `৳${Number(stats.totalCommissionGenerated || 0).toLocaleString()}`,
      sub: lang === 'bn' ? 'সর্বমোট অর্জিত কমিশন' : 'Lifetime commission earned',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      label: lang === 'bn' ? 'মোট পরিশোধিত কমিশন' : 'Total Commission Paid',
      value: `৳${Number(stats.totalCommissionPaid || 0).toLocaleString()}`,
      sub: lang === 'bn' ? 'সফলভাবে উইথড্র করা হয়েছে' : 'Completed affiliate payouts',
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-700 border-teal-100',
    },
    {
      label: lang === 'bn' ? 'পেন্ডিং কমিশন' : 'Pending Commission',
      value: `৳${Number(stats.pendingCommission || 0).toLocaleString()}`,
      sub: `৳${Number(stats.availableCommissionBalance || 0).toLocaleString()} ${lang === 'bn' ? 'উত্তোলনযোগ্য' : 'available'}`,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      label: lang === 'bn' ? 'পেন্ডিং উইথড্রয়াল রিকোয়েস্ট' : 'Pending Withdrawal Requests',
      value: stats.pendingWithdrawalRequests,
      sub: `৳${Number(stats.reservedWithdrawalBalance || 0).toLocaleString()} ${lang === 'bn' ? 'রিজার্ভড' : 'reserved'}`,
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-700 border-orange-100',
    },
    {
      label: lang === 'bn' ? 'সর্বমোট অ্যাফিলিয়েট উইথড্রয়াল' : 'Total Affiliate Withdrawals',
      value: `৳${Number(stats.totalAffiliateWithdrawals || 0).toLocaleString()}`,
      sub: `${stats.totalCompletedWithdrawalsCount || 0} ${lang === 'bn' ? 'টি সফল লেনদেন' : 'completed payouts'}`,
      icon: Wallet,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {lang === 'bn' ? 'অ্যাফিলিয়েট পার্টনার ম্যানেজমেন্ট' : 'Affiliate Partner Management'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                stats.programEnabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {stats.programEnabled
                ? lang === 'bn'
                  ? 'প্রোগ্রাম চালু'
                  : 'Program Active'
                : lang === 'bn'
                ? 'প্রোগ্রাম বন্ধ'
                : 'Program Paused'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'bn'
              ? 'অ্যাফিলিয়েট পার্টনার, ৩০% রেকারিং কমিশন, রেফারকৃত মার্চেন্ট এবং উইথড্রয়াল রিকোয়েস্ট পরিচালনা করুন।'
              : 'Monitor affiliate partners, 30% recurring commissions, referred merchants, and withdrawal requests.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাংলা
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Settings className="w-4 h-4 text-blue-600" />
            {lang === 'bn' ? 'অ্যাফিলিয়েট সেটিংস' : 'Affiliate Settings'}
          </button>
        </div>
      </div>

      {/* 10 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {overviewCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xl font-bold text-slate-800">{card.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          {
            id: 'affiliates',
            label: lang === 'bn' ? 'অ্যাফিলিয়েট পার্টনার তালিকা' : 'Affiliate Partners',
            count: stats.totalAffiliates,
          },
          {
            id: 'withdrawals',
            label: lang === 'bn' ? 'উইথড্রয়াল রিকোয়েস্ট' : 'Withdrawal Requests',
            count: stats.pendingWithdrawalRequests,
            alert: stats.pendingWithdrawalRequests > 0,
          },
          {
            id: 'commissions',
            label: lang === 'bn' ? 'কমিশন হিস্ট্রি' : 'Commissions Ledger',
          },
          {
            id: 'audit',
            label: lang === 'bn' ? 'অডিট লগ' : 'Audit Logs',
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === t.id
                    ? 'bg-white/20 text-white'
                    : t.alert
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: AFFILIATES TABLE */}
      {activeTab === 'affiliates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  lang === 'bn'
                    ? 'নাম, ইমেইল, ফোন বা রেফারেল কোড দিয়ে খুঁজুন...'
                    : 'Search by name, email, phone, or referral code...'
                }
                value={affSearch}
                onChange={(e) => setAffSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={affStatus}
                onChange={(e) => setAffStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">{lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Statuses'}</option>
                <option value="active">{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
                <option value="pending">{lang === 'bn' ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
                <option value="suspended">{lang === 'bn' ? 'সাসপেন্ডেড (Suspended)' : 'Suspended'}</option>
                <option value="deactivated">{lang === 'bn' ? 'নিষ্ক্রিয় (Deactivated)' : 'Deactivated'}</option>
              </select>

              <select
                value={affSort}
                onChange={(e) => setAffSort(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="newest">{lang === 'bn' ? 'নতুন আগে' : 'Newest First'}</option>
                <option value="earnings_desc">{lang === 'bn' ? 'সর্বোচ্চ আয়' : 'Highest Earnings'}</option>
                <option value="referrals_desc">{lang === 'bn' ? 'সর্বোচ্চ রেফারেল' : 'Most Referrals'}</option>
                <option value="balance_desc">{lang === 'bn' ? 'সর্বোচ্চ ব্যালেন্স' : 'Highest Balance'}</option>
              </select>

              <button
                onClick={() => fetchAffiliates(affMeta.page)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAffiliates ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পার্টনার' : 'Affiliate Partner'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'রেফারেল সংখ্যা' : 'Referrals'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট আয়' : 'Total Commission'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Available Balance'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট উত্তোলন' : 'Total Withdrawn'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingAffiliates ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading affiliate partners...
                    </td>
                  </tr>
                ) : affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {lang === 'bn' ? 'কোনো অ্যাফিলিয়েট পার্টনার পাওয়া যায়নি' : 'No affiliate partners found'}
                    </td>
                  </tr>
                ) : (
                  affiliates.map((aff) => {
                    const u = aff.userId || {};
                    return (
                      <tr key={aff._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{u.name || 'Affiliate Partner'}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                          <p className="text-[11px] text-slate-400">{u.phone || '—'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            {aff.affiliateCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">{aff.totalReferrals || 0}</span>
                          <span className="text-slate-400 ml-1">
                            ({aff.subscribedReferrals || 0} paid)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          ৳{Number(aff.totalEarnings || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          ৳{Number(aff.availableBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          ৳{Number(aff.totalWithdrawn || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                              aff.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : aff.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {aff.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/affiliates/${aff._id}`)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg font-bold flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {lang === 'bn' ? 'বিস্তারিত' : 'Details'}
                            </button>
                            <button
                              onClick={() => {
                                setStatusModalAffiliate(aff);
                                setNextStatus(aff.status === 'active' ? 'suspended' : 'active');
                                setStatusReason(aff.suspensionReason || '');
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg font-bold transition-colors"
                            >
                              {lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}
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

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {affMeta.page} of {affMeta.totalPages} ({affMeta.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={affMeta.page <= 1}
                onClick={() => fetchAffiliates(affMeta.page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={affMeta.page >= affMeta.totalPages}
                onClick={() => fetchAffiliates(affMeta.page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAWALS MANAGEMENT */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  lang === 'bn'
                    ? 'অ্যাকাউন্ট নম্বর, নাম বা TrxID দিয়ে খুঁজুন...'
                    : 'Search by account number, name, or TrxID...'
                }
                value={wdSearch}
                onChange={(e) => setWdSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={wdStatus}
                onChange={(e) => setWdStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={wdMethod}
                onChange={(e) => setWdMethod(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Methods</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Bank">Bank</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Affiliate Partner</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method & Account</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Trx Reference / Reason</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingWithdrawals ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading withdrawal requests...
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No withdrawal requests found
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((wd) => {
                    const u = wd.userId || {};
                    const aff = wd.affiliateId || {};
                    return (
                      <tr key={wd._id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(wd.requestedAt || wd.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{u.name || 'Partner'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{aff.affiliateCode}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          ৳{Number(wd.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] mr-2">
                            {wd.paymentMethod}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {wd.paymentDetails?.accountNumber}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {wd.paymentDetails?.accountName} ({wd.paymentDetails?.accountType || 'Personal'})
                            {wd.paymentDetails?.bankName ? ` · ${wd.paymentDetails.bankName}` : ''}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                              wd.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : wd.status === 'rejected'
                                ? 'bg-rose-100 text-rose-700'
                                : wd.status === 'processing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {wd.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {wd.transactionReference && (
                            <p className="font-mono font-bold text-emerald-700">
                              TrxID: {wd.transactionReference}
                            </p>
                          )}
                          {wd.rejectionReason && (
                            <p className="text-rose-600 text-[11px]">{wd.rejectionReason}</p>
                          )}
                          {!wd.transactionReference && !wd.rejectionReason && '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {wd.status === 'pending' || wd.status === 'processing' ? (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(wd);
                                setWdAction('completed');
                                setTrxRef(wd.transactionReference || '');
                                setRejectReason('');
                                setAdminNotes(wd.adminNotes || '');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                            >
                              {lang === 'bn' ? 'প্রসেস করুন' : 'Process'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Finalized</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {wdMeta.page} of {wdMeta.totalPages} ({wdMeta.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={wdMeta.page <= 1}
                onClick={() => fetchWithdrawals(wdMeta.page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={wdMeta.page >= wdMeta.totalPages}
                onClick={() => fetchWithdrawals(wdMeta.page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSIONS LEDGER */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by referred store, merchant, or plan..."
                value={commSearch}
                onChange={(e) => setCommSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <select
              value={commStatus}
              onChange={(e) => setCommStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Affiliate Partner</th>
                  <th className="py-3.5 px-4">Referred Store</th>
                  <th className="py-3.5 px-4">Payment Details</th>
                  <th className="py-3.5 px-4">Actual Paid</th>
                  <th className="py-3.5 px-4">Rate</th>
                  <th className="py-3.5 px-4">Commission</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingCommissions ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading commissions...
                    </td>
                  </tr>
                ) : commissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No commission records found
                    </td>
                  </tr>
                ) : (
                  commissions.map((c) => {
                    const aff = c.affiliateId || {};
                    const affUser = aff.userId || {};
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{affUser.name || 'Partner'}</p>
                          <p className="text-[11px] font-mono text-blue-600">{aff.affiliateCode}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {c.referredStoreName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{c.paymentDescription}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          ৳{Number(c.actualAmountPaid || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-600">{c.commissionRate}%</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          ৳{Number(c.commissionAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                              c.status === 'available' || c.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : c.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {c.status === 'pending' && (
                              <button
                                onClick={() => handleCommissionAction(c._id, 'available')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                              >
                                Approve
                              </button>
                            )}
                            {c.status !== 'reversed' && c.status !== 'rejected' && (
                              <button
                                onClick={() => handleCommissionAction(c._id, 'reversed')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-[11px]"
                              >
                                Reverse
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-4">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No audit logs recorded yet
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.actorId?.name || log.actorRole}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {log.targetType}: {log.targetId}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.reason || JSON.stringify(log.metadata || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Process Withdrawal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                Process Affiliate Withdrawal (৳{selectedWithdrawal.amount})
              </h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessWithdrawal} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p>
                  <strong>Method:</strong> {selectedWithdrawal.paymentMethod} (
                  {selectedWithdrawal.paymentDetails?.accountType || 'Personal'})
                </p>
                <p>
                  <strong>Account Number:</strong>{' '}
                  <span className="font-mono font-bold">
                    {selectedWithdrawal.paymentDetails?.accountNumber}
                  </span>
                </p>
                <p>
                  <strong>Account Name:</strong> {selectedWithdrawal.paymentDetails?.accountName}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision</label>
                <select
                  value={wdAction}
                  onChange={(e) => setWdAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="completed">Mark as Completed (Paid)</option>
                  <option value="processing">Mark as Processing</option>
                  <option value="rejected">Reject & Return to Available Balance</option>
                </select>
              </div>

              {wdAction !== 'rejected' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Transaction Reference (TrxID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BKA92817261"
                    value={trxRef}
                    onChange={(e) => setTrxRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              )}

              {wdAction === 'rejected' && (
                <div>
                  <label className="block font-bold text-rose-600 mb-1">Rejection Reason *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Explain why this withdrawal was rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-200 rounded-xl"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingWd}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {processingWd ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Affiliate Status */}
      {statusModalAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                Update Affiliate Account Status
              </h3>
              <button
                onClick={() => setStatusModalAffiliate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAffiliateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Admin Note</label>
                <textarea
                  rows={2}
                  placeholder="Optional reason for status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalAffiliate(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

