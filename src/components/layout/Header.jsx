import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NotificationBell from '../NotificationBell';

export default function Header() {
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const adminUserStr = localStorage.getItem('user');
      setAdminUser(adminUserStr ? JSON.parse(adminUserStr) : null);
    };
    
    loadUser();
    
    window.addEventListener('profileUpdated', loadUser);
    return () => window.removeEventListener('profileUpdated', loadUser);
  }, []);

  return (
    <header className="h-16 glass flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center w-96 relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3" />
        <input 
          type="text" 
          placeholder="Search clients, packages..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
        />
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell userId={adminUser?._id} />
        
        <Link to="/profile" className="flex items-center gap-3 border-l border-slate-200 pl-6 hover:bg-slate-50/50 p-1.5 rounded-xl transition-colors cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              {adminUser?.name || 'Admin User'}
            </p>
            <p className="text-xs text-slate-500">
              {adminUser?.email || 'superadmin@platform.com'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 overflow-hidden">
            {adminUser?.avatar ? (
              <img src={typeof adminUser.avatar === 'string' ? adminUser.avatar : adminUser.avatar.secure_url} alt="Profile" className="w-full h-full object-cover" />
            ) : adminUser?.name ? (
              <span className="text-lg">{adminUser.name.charAt(0)}</span>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
