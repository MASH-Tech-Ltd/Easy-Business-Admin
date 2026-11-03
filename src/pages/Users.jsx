import { useState, useMemo } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { Eye, Shield, Search, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useGetAllUsersQuery } from "../store/apiSlice";

export default function Users() {
  const { data: usersRes, isLoading: loading } = useGetAllUsersQuery();
  const users = usersRes?.data || [];

  const [activeUser, setActiveUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const openViewModal = (user) => {
    setActiveUser(user);
    setIsModalOpen(true);
  };

  // Filtered & Paginated Users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q));
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Merchant Users</h2>
          <p className="text-slate-500 mt-1">
            Manage all tenant administrators and their profiles.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="tenant_admin">Tenant Admin</option>
              <option value="affiliate_partner">Affiliate Partner</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-xs border border-slate-200/60 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading merchant users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar?.secure_url ? (
                          <img
                            src={user.avatar.secure_url}
                            alt={user.name}
                            className="w-10 h-10 rounded-lg object-cover shadow-xs border border-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {(user.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/70 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        {(user.role || "").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs sm:text-sm font-medium">
                      {user.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs sm:text-sm truncate max-w-[200px]">
                      {user.address || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openViewModal(user)}
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalUsers > 0 && (
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-bold text-slate-900">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-900">{Math.min(page * pageSize, totalUsers)}</span> of{" "}
                <span className="font-bold text-slate-900">{totalUsers}</span> users
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="font-bold text-slate-800 px-2 sm:px-3">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && activeUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> User Details
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex items-center gap-6 mb-8">
                {activeUser.avatar?.secure_url ? (
                  <img
                    src={activeUser.avatar.secure_url}
                    alt={activeUser.name}
                    className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-slate-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl shadow-sm">
                    {activeUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-slate-800">
                    {activeUser.name}
                  </h4>
                  <p className="text-slate-500">{activeUser.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                    {activeUser.role.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Contact Phone
                    </p>
                    <p className="text-slate-800 font-medium text-lg">
                      {activeUser.phone || "Not provided"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Full Address
                    </p>
                    <p className="text-slate-800 font-medium">
                      {activeUser.address || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Additional Details
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      if (!activeUser.details) return <p className="text-slate-500">No details provided</p>;
                      try {
                        const parsed = typeof activeUser.details === 'string' ? JSON.parse(activeUser.details) : activeUser.details;
                        if (typeof parsed === 'object' && parsed !== null) {
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {Object.entries(parsed).map(([key, value]) => (
                                <div key={key} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </p>
                                  <p className="text-slate-800 text-sm break-words">
                                    {String(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return <p className="text-slate-800">{String(parsed)}</p>;
                      } catch (e) {
                        return <p className="text-slate-800 whitespace-pre-line break-words">{activeUser.details}</p>;
                      }
                    })()}
                  </div>
                </div>

                {activeUser.tenantId && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                      Store (Tenant) Details
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-purple-400">Store Name</p>
                        <p className="text-purple-900 font-bold">
                          {activeUser.tenantId.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">Store Domain</p>
                        <p className="text-purple-900 font-bold">
                          {activeUser.tenantId.domain ||
                            `${activeUser.tenantId.slug}.localhost:3000`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">Database</p>
                        <p className="text-purple-900 font-bold">
                          {activeUser.tenantId.databaseName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">Status</p>
                        <p className="text-purple-900 font-bold capitalize">
                          {activeUser.tenantId.status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
