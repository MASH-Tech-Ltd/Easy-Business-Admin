import { Search, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NotificationBell from '../NotificationBell';

export default function Header({ onToggleSidebar }) {
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
    <header className="h-16 glass flex items-center justify-between px-3 sm:px-6 z-10 sticky top-0 shrink-0 gap-3">
      {/* Left: Mobile hamburger menu toggle + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center w-full max-w-xs sm:max-w-sm md:max-w-md relative min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 shrink-0" />
          <input 
            type="text" 
            placeholder="Search clients, packages..." 
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-100/60 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-xs sm:text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
        <NotificationBell userId={adminUser?._id} />
        
        <Link 
          to="/profile" 
          className="flex items-center gap-2.5 sm:gap-3 border-l border-slate-200 pl-2.5 sm:pl-4 md:pl-6 hover:bg-slate-50/50 p-1 sm:p-1.5 rounded-xl transition-colors cursor-pointer group shrink-0"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-[130px] md:max-w-[180px]">
              {adminUser?.name || 'Admin User'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[130px] md:max-w-[180px] hidden md:block">
              {adminUser?.email || 'superadmin@platform.com'}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 overflow-hidden shrink-0">
            {adminUser?.avatar ? (
              <img 
                src={typeof adminUser.avatar === 'string' ? adminUser.avatar : adminUser.avatar.secure_url} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : adminUser?.name ? (
              <span>{adminUser.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
