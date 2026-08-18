import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, Package, Users, Settings, LogOut, 
  Activity, Server, CreditCard, Bell, Shield, Database,
  LifeBuoy, ShieldCheck, Key
} from 'lucide-react';

const Badge = ({ children, type = 'NEW' }) => (
  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${
    type === 'BETA' ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white'
  }`}>
    {children}
  </span>
);

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { default: axios } = await import('axios');
        const res = await axios.get('http://localhost:8000/api/v1/support/all-tickets', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const openTickets = res.data.data.filter(t => t.status === 'OPEN');
        setOpenTicketsCount(openTickets.length);
      } catch (err) {}
    };

    fetchCount();

    const socket = io('http://localhost:8000');
    const adminUserStr = localStorage.getItem('user');
    if (adminUserStr) {
      try {
        const user = JSON.parse(adminUserStr);
        socket.emit('join_user_room', user._id);
      } catch(err) {}
    }

    socket.on('refresh_tickets', fetchCount);

    return () => {
      if (adminUserStr) {
        try {
          const user = JSON.parse(adminUserStr);
          socket.emit('leave_user_room', user._id);
        } catch(err) {}
      }
      socket.off('refresh_tickets');
      socket.close();
    };
  }, []);

  const navGroups = [
    {
      items: [
        { name: 'Overview', path: '/', icon: LayoutDashboard },
        { name: 'System Health', path: '/health', icon: Activity, badge: 'NEW' },
      ]
    },
    {
      title: 'Tenant Management',
      items: [
        { name: 'Clients (Shops)', path: '/clients', icon: Users },
        { name: 'Merchants (Users)', path: '/users', icon: Users },
        { name: 'Packages', path: '/packages', icon: Package },
        { name: 'Billing', path: '/billing', icon: CreditCard },
        { name: 'Support', path: '/support', icon: LifeBuoy, badge: openTicketsCount > 0 ? String(openTicketsCount) : undefined },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Server Logs', path: '/logs', icon: Server },
        { name: 'Database', path: '/database', icon: Database, badge: 'BETA' },
        { name: 'Security', path: '/security', icon: Shield },
        { name: 'Fraud Checks', path: '/fraud-checks', icon: ShieldCheck, badge: 'NEW' },
        { name: 'Courier APIs', path: '/courier-credentials', icon: Key, badge: 'NEW' },
      ]
    }
  ];

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {import.meta.env.VITE_PLATFORM_NAME || 'Platform'}
            </h1>
            <span className="text-xs font-medium text-slate-500">SuperAdmin</span>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-6' : ''}>
            {group.title && (
              <div className="flex items-center px-3 mb-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>
            )}
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm transition-colors group ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.name}</span>
                      {item.badge && <Badge type={item.badge}>{item.badge}</Badge>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white space-y-1">
        <button className="flex items-center px-3 py-2 w-full rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group">
          <Settings className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-600" />
          <span>Global Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center px-3 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors group"
        >
          <LogOut className="w-4 h-4 mr-3 text-red-500 group-hover:text-red-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
