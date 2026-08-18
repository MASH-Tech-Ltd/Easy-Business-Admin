import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Eye, Shield, Search, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users`);
      if (res.data.success || res.data.status === 'ok') {
        setUsers(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openViewModal = (user) => {
    setActiveUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Merchant Users</h2>
          <p className="text-slate-500 mt-1">Manage all tenant administrators and their profiles.</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100/50 text-slate-500 text-sm font-medium">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar?.secure_url ? (
                      <img src={user.avatar.secure_url} alt={user.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">{user.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-[200px]">{user.address || 'N/A'}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openViewModal(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                  >
                    <Eye className="w-4 h-4" /> <span className="text-sm font-medium">View</span>
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && activeUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> User Details
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex items-center gap-6 mb-8">
                {activeUser.avatar?.secure_url ? (
                  <img src={activeUser.avatar.secure_url} alt={activeUser.name} className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-slate-100" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl shadow-sm">
                    {activeUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{activeUser.name}</h4>
                  <p className="text-slate-500">{activeUser.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                    {activeUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</p>
                  <p className="text-slate-800 font-medium">{activeUser.phone || 'Not provided'}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Address</p>
                  <p className="text-slate-800 font-medium whitespace-pre-line">{activeUser.address || 'Not provided'}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Additional Details</p>
                  <p className="text-slate-800 font-medium whitespace-pre-line">{activeUser.details || 'No details provided'}</p>
                </div>

                {activeUser.tenantId && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Store (Tenant) Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-purple-400">Store Name</p>
                        <p className="text-purple-900 font-bold">{activeUser.tenantId.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">Store Domain</p>
                        <p className="text-purple-900 font-bold">{activeUser.tenantId.domain || `${activeUser.tenantId.slug}.localhost:3000`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">Database</p>
                        <p className="text-purple-900 font-bold">{activeUser.tenantId.databaseName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">Status</p>
                        <p className="text-purple-900 font-bold capitalize">{activeUser.tenantId.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
