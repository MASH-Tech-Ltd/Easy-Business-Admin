import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Wallet,
  DollarSign,
  Store,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function AffiliateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('referrals');

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/affiliates/admin/${id}`);
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load affiliate partner details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading affiliate partner details...
      </div>
    );
  }

  if (!data?.affiliate) {
    return (
      <div className="py-20 text-center text-slate-500">
        Affiliate partner not found.
      </div>
    );
  }

  const { affiliate, referrals, commissions, withdrawals, ledger, auditLogs } = data;
  const user = affiliate.userId || {};

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/affiliates')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-800">{user.name || 'Affiliate Partner'}</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                {affiliate.affiliateCode}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                  affiliate.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {affiliate.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.email} · {user.phone || 'No Phone'} · Joined{' '}
              {new Date(affiliate.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={fetchDetail}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold">Total Referrals</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {affiliate.totalReferrals || 0}{' '}
            <span className="text-xs text-emerald-600 font-normal">
              ({affiliate.subscribedReferrals || 0} subscribed)
            </span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold">Total Earnings</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            ৳{Number(affiliate.totalEarnings || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold">Available Balance</p>
          <p className="text-xl font-bold text-blue-700 mt-1">
            ৳{Number(affiliate.availableBalance || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold">Reserved / Pending</p>
          <p className="text-xl font-bold text-amber-700 mt-1">
            ৳{Number((affiliate.reservedBalance || 0) + (affiliate.pendingBalance || 0)).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold">Total Withdrawn</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            ৳{Number(affiliate.totalWithdrawn || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'referrals', label: `Referred Merchants (${referrals?.meta?.total || 0})` },
          { id: 'commissions', label: `Commissions (${commissions?.meta?.total || 0})` },
          { id: 'withdrawals', label: `Withdrawals (${withdrawals?.meta?.total || 0})` },
          { id: 'ledger', label: `Financial Ledger (${ledger?.length || 0})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'referrals' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Eligibility Window</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(referrals?.data || []).map((r) => (
                <tr key={r._id}>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {r.referredStoreName}
                    <p className="text-[11px] font-normal text-slate-400">{r.referredEmail}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(r.registeredAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 capitalize font-semibold">{r.subscriptionStatus}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {r.eligibilityStartDate && r.eligibilityEndDate
                      ? `${new Date(r.eligibilityStartDate).toLocaleDateString()} → ${new Date(
                          r.eligibilityEndDate
                        ).toLocaleDateString()}`
                      : 'Starts on 1st Paid Plan'}
                  </td>
                  <td className="py-3 px-4 font-semibold">৳{r.totalPaidAmount || 0}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    ৳{r.totalCommissionEarned || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Store</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Actual Paid</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(commissions?.data || []).map((c) => (
                <tr key={c._id}>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold">{c.referredStoreName}</td>
                  <td className="py-3 px-4 text-slate-600">{c.paymentDescription}</td>
                  <td className="py-3 px-4">৳{c.actualAmountPaid}</td>
                  <td className="py-3 px-4 font-bold text-blue-600">{c.commissionRate}%</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">৳{c.commissionAmount}</td>
                  <td className="py-3 px-4 capitalize font-semibold">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Requested Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Account</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reference / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(withdrawals?.data || []).map((w) => (
                <tr key={w._id}>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(w.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold">৳{w.amount}</td>
                  <td className="py-3 px-4">
                    {w.paymentMethod} — {w.paymentDetails?.accountNumber}
                  </td>
                  <td className="py-3 px-4 capitalize font-bold">{w.status}</td>
                  <td className="py-3 px-4">
                    {w.transactionReference || w.rejectionReason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(ledger || []).map((l) => (
                <tr key={l._id}>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono">{l.type}</td>
                  <td className="py-3 px-4 uppercase font-bold">{l.direction}</td>
                  <td className="py-3 px-4 font-bold">৳{l.amount}</td>
                  <td className="py-3 px-4 font-semibold">৳{l.balanceAfter}</td>
                  <td className="py-3 px-4 text-slate-600">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

