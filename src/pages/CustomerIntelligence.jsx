import { useState } from 'react';
import { Search, Phone, ShoppingBag, XCircle, CheckCircle2, ShieldCheck, ShieldAlert, Store, Loader2, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function CustomerIntelligence() {
  const [phone, setPhone] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/fraud/customer-stats?phone=${encodeURIComponent(phone)}`);
      if (res.data?.success) {
        setStats(res.data.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch customer data');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'safe': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'suspicious': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'fraud': return 'text-rose-500 bg-rose-50 border-rose-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2 mb-2">
          <Search className="w-6 h-6 text-blue-600" /> Customer Intelligence
        </h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Look up a customer's phone number to view their global order history, cancellation rates, and fraud likelihood across the entire platform.
        </p>

        <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-24 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            placeholder="Enter phone number (e.g. +8801...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !phone}
            className="absolute inset-y-1 right-1 px-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {searched && !loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Total Orders</h3>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats.totalOrders}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Delivered</h3>
                </div>
                <div className="text-3xl font-bold text-emerald-600">{stats.deliveredOrders}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Cancelled</h3>
                </div>
                <div className="text-3xl font-bold text-rose-600">{stats.cancelledOrders}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Fraud Analysis</h3>
              <div className={`p-4 rounded-xl border flex items-start gap-4 ${getStatusColor(stats.status)}`}>
                {stats.status === 'safe' ? <ShieldCheck className="w-8 h-8 mt-1" /> : <ShieldAlert className="w-8 h-8 mt-1" />}
                <div>
                  <h4 className="font-bold text-lg capitalize">{stats.status}</h4>
                  <p className="opacity-90 mt-1">{stats.details}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs font-bold uppercase tracking-wider mb-1">Risk Score</div>
                  <div className="text-2xl font-black">{stats.score}%</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-600">Cancellation Rate</span>
                  <span className="font-bold text-slate-900">{(stats.cancellationRate * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${stats.cancellationRate > 0.5 ? 'bg-rose-500' : stats.cancellationRate > 0.2 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(0, stats.cancellationRate * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Stores */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-slate-400" /> Stores Interacted With
            </h3>
            
            {stats.stores?.length > 0 ? (
              <div className="space-y-3">
                {stats.stores.map(store => (
                  <div key={store._id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="font-semibold text-slate-800">{store.name}</div>
                    <div className="text-xs text-blue-600 mt-0.5">{store.domain}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No stores found.
              </div>
            )}
          </div>
        </div>
      )}

      {searched && !loading && !stats && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No Data Found</h3>
          <p className="text-sm text-slate-500 mt-1">We couldn't find any global records for this phone number.</p>
        </div>
      )}
    </div>
  );
}
