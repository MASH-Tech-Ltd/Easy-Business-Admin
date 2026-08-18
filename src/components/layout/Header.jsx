import { Search, User } from 'lucide-react';
import NotificationBell from '../NotificationBell';

export default function Header() {
  // Try to parse admin user from localStorage to get the userId for the socket connection
  const adminUserStr = localStorage.getItem('user');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;

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
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">Admin User</p>
            <p className="text-xs text-slate-500">superadmin@platform.com</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
