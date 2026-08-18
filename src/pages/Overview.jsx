import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, PackageOpen, CreditCard, TrendingUp, Activity, PlusCircle, Settings, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${trendUp ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon: Icon, colorClass }) => (
  <button className="flex items-center text-left p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-300 transition-all group">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  </button>
);

export default function Overview() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activePackages: 0,
    monthlyMRR: 0,
    systemLoad: '0%',
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/analytics/super-admin-stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm mt-1">System status and key metrics across all tenants.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors">
          Download Report
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Tenants" value={stats.totalTenants.toLocaleString()} icon={Users} trend="12%" trendUp={true} />
            <StatCard title="Active Packages" value={stats.activePackages.toLocaleString()} icon={PackageOpen} trend="4%" trendUp={true} />
            <StatCard title="Monthly MRR" value={`৳${stats.monthlyMRR.toLocaleString()}`} icon={CreditCard} trend="8%" trendUp={true} />
            <StatCard title="System Load" value={stats.systemLoad} icon={Activity} trend="2%" trendUp={false} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96 flex flex-col">
              <h3 className="text-base font-semibold text-slate-800 mb-6">Revenue Growth</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} tickFormatter={(value) => `৳${value}`} />
                    <Tooltip 
                      formatter={(value) => [`৳${value}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-slate-800 mb-2">Quick Actions</h3>
              <QuickAction 
                title="Create Package" 
                desc="Add a new subscription tier" 
                icon={PlusCircle} 
                colorClass="bg-blue-50 text-blue-600" 
              />
              <QuickAction 
                title="System Settings" 
                desc="Manage global configurations" 
                icon={Settings} 
                colorClass="bg-indigo-50 text-indigo-600" 
              />
              <QuickAction 
                title="Security Alerts" 
                desc="View 3 recent security notices" 
                icon={ShieldAlert} 
                colorClass="bg-rose-50 text-rose-600" 
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
