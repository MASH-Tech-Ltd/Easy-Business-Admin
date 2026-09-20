import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  UserPlus,
  MoreVertical,
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  PackageMinus,
  Sparkles,
} from "lucide-react";
import { useGetAllTenantsQuery } from "../store/apiSlice";

export default function Clients() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const {
    data: clientsRes,
    isLoading: clientsLoading,
    refetch,
  } = useGetAllTenantsQuery({
    page,
    limit: 10,
    search,
    sortBy,
    sortOrder,
  });

  const clients = clientsRes?.data || [];
  const meta = clientsRes?.meta || {
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteProductsModalOpen, setIsDeleteProductsModalOpen] =
    useState(false);
  const [isDeletingProducts, setIsDeletingProducts] = useState(false);
  const [activeClient, setActiveClient] = useState(null);

  const [formData, setFormData] = useState({
    tenantName: "",
    domain: "",
    subdomain: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    domain: "",
    subdomain: "",
    status: "",
    showDemoSeed: true,
  });

  const [activeMetrics, setActiveMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsFilter, setMetricsFilter] = useState("lifetime");
  const [metricsMonth, setMetricsMonth] = useState(new Date().getMonth() + 1);
  const [metricsYear, setMetricsYear] = useState(new Date().getFullYear());
  const [metricsStartDate, setMetricsStartDate] = useState("");
  const [metricsEndDate, setMetricsEndDate] = useState("");

  useEffect(() => {
    const adminUserStr = localStorage.getItem("user");
    let socket;
    if (adminUserStr) {
      try {
        socket = io("/");
        const user = JSON.parse(adminUserStr);
        socket.emit("join_user_room", user._id);
        
        socket.on("refresh_tenants", () => {
          // Trigger refetch depending on what RTK query or fetch is used
          // We can use a simple state toggle to trigger re-renders or assume refetch() exists
          if (typeof refetch === 'function') refetch();
          if (typeof fetchData === 'function') fetchData();
        });
      } catch (err) {}
    }
    return () => {
      if (socket) {
        socket.off("refresh_tenants");
        socket.close();
      }
    };
  }, []);

  const fetchClients = () => {
    refetch();
  }; // Stub to allow explicit refetch if needed by modals

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/tenants/create-tenant", formData);
      if (res.data.success || res.data.status === "ok") {
        toast.success(
          res.data.message || "Client store and admin created successfully!",
        );
        setIsModalOpen(false);
        setFormData({
          tenantName: "",
          domain: "",
          subdomain: "",
          adminName: "",
          adminEmail: "",
          adminPassword: "",
        });
        fetchClients();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to onboard client");
    }
  };

  const fetchClientMetrics = async (clientId) => {
    try {
      setMetricsLoading(true);
      let query = `?filter=${metricsFilter}`;
      if (metricsFilter === 'month') {
        query += `&month=${metricsMonth}&year=${metricsYear}`;
      } else if (metricsFilter === 'custom') {
        query += `&startDate=${metricsStartDate}&endDate=${metricsEndDate}`;
      }
      const res = await api.get(`/tenants/${clientId}/metrics${query}`);
      if (res.data?.status === "ok" || res.data?.success) {
        setActiveMetrics(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch client metrics");
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditModalOpen && activeClient) {
      fetchClientMetrics(activeClient._id);
    }
  }, [metricsFilter, metricsMonth, metricsYear, metricsStartDate, metricsEndDate]);

  const openEditModal = (client) => {
    setActiveClient(client);
    setEditFormData({
      name: client.name,
      domain: client.domain || "",
      subdomain: client.slug || "",
      status: client.status,
      showDemoSeed: client.showDemoSeed !== false,
    });
    setActiveMetrics(null);
    fetchClientMetrics(client._id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editFormData, slug: editFormData.subdomain };
      delete payload.subdomain;
      const res = await api.patch(
        `/tenants/update-tenant/${activeClient._id}`,
        payload,
      );
      if (res.data.success || res.data.status === "ok") {
        toast.success("Client updated successfully");
        setIsEditModalOpen(false);
        fetchClients();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update client");
    }
  };

  const openDeleteModal = (client) => {
    setActiveClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    try {
      const res = await api.delete(
        `/tenants/delete-tenant/${activeClient._id}`,
      );
      if (res.data.success || res.data.status === "ok") {
        toast.success("Client deleted successfully");
        setIsDeleteModalOpen(false);
        fetchClients();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete client");
    }
  };

  const openDeleteProductsModal = (client) => {
    setActiveClient(client);
    setIsDeleteProductsModalOpen(true);
  };

  const handleDeleteProductsSubmit = async () => {
    try {
      setIsDeletingProducts(true);
      const res = await api.delete(`/products/tenant/${activeClient._id}/all`);
      if (res.data.success || res.data.status === "ok") {
        toast.success("All products and categories for this store deleted successfully");
        setIsDeleteProductsModalOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete products");
    } finally {
      setIsDeletingProducts(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Client Management
          </h2>
          <p className="text-slate-500 mt-1">
            Onboard and manage tenant stores.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Onboard Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name or domain..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">Date Created</option>
              <option value="name">Store Name</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <select
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100/50 text-slate-500 text-sm font-medium">
            <tr>
              <th className="px-6 py-4">Store Name</th>
              <th className="px-6 py-4">Subdomain</th>
              <th className="px-6 py-4">Domain</th>
              <th className="px-6 py-4">Owner Email</th>
              <th className="px-6 py-4">Package</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {clients.map((client) => (
              <tr
                key={client._id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {client.ownerId?.avatar?.secure_url ? (
                      <img
                        src={client.ownerId.avatar.secure_url}
                        alt={client.name}
                        className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {client.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">
                        {client.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID: {client._id.slice(-6)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {client.slug || "N/A"}
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {client.domain || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    {client.ownerId?.email || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {client.package ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      {client.package.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">None</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      client.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {client.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      title={client.showDemoSeed !== false ? "Disable Demo Seed Button" : "Enable Demo Seed Button"}
                      onClick={async () => {
                        try {
                          const newStatus = client.showDemoSeed === false ? true : false;
                          const res = await api.patch(`/tenants/update-tenant/${client._id}`, { showDemoSeed: newStatus });
                          if (res.data.success || res.data.status === "ok") {
                            toast.success(`Demo Seed Button ${newStatus ? 'enabled' : 'disabled'} for ${client.name}`);
                            fetchClients();
                          }
                        } catch (error) {
                          toast.error("Failed to update demo seed status");
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${client.showDemoSeed !== false ? 'text-indigo-600 hover:bg-indigo-50 bg-indigo-50/50' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      title="Edit Client"
                      onClick={() => openEditModal(client)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete All Products & Categories"
                      onClick={() => openDeleteProductsModal(client)}
                      className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <PackageMinus className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete Client"
                      onClick={() => openDeleteModal(client)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No clients found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="px-6 py-4 bg-white/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium">
                {clients.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              of <span className="font-medium">{meta.total}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium text-slate-700 px-4">
                Page {meta.page} of {meta.totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-6">
              Onboard New Client
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Store Name
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field"
                    value={formData.tenantName}
                    onChange={(e) =>
                      setFormData({ ...formData, tenantName: e.target.value })
                    }
                    placeholder="Mikes MashEasy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subdomain{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.subdomain}
                    onChange={(e) =>
                      setFormData({ ...formData, subdomain: e.target.value })
                    }
                    placeholder="mikes-masheasy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Domain{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  placeholder="mikes.famous.com"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> Store Admin
                  Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Admin Name
                    </label>
                    <input
                      required
                      type="text"
                      className="input-field"
                      value={formData.adminName}
                      onChange={(e) =>
                        setFormData({ ...formData, adminName: e.target.value })
                      }
                      placeholder="Mike Ross"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      required
                      type="email"
                      className="input-field"
                      value={formData.adminEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, adminEmail: e.target.value })
                      }
                      placeholder="mike@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Admin Password
                    </label>
                    <input
                      required
                      type="password"
                      className="input-field"
                      value={formData.adminPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          adminPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Onboard Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Manage Client Store
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Update store details and view merchant information
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm border border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto max-h-[65vh]">
                {/* Left Side: Edit Store Details */}
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-slate-800">
                      Store Configuration
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Store Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Store Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subdomain
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        value={editFormData.subdomain}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            subdomain: e.target.value,
                          })
                        }
                        placeholder="subdomain"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        .localhost:3000
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Custom Domain
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        value={editFormData.domain}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            domain: e.target.value,
                          })
                        }
                        placeholder="e.g. domain.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-medium"
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="active">🟢 Active</option>
                      <option value="inactive">🔴 Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Show Demo Seed Button</label>
                      <p className="text-xs text-slate-500 mt-0.5">Allow merchant to seed demo data in their dashboard</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, showDemoSeed: !editFormData.showDemoSeed })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${editFormData.showDemoSeed ? 'bg-blue-600' : 'bg-slate-300'}`}
                      role="switch"
                      aria-checked={editFormData.showDemoSeed}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editFormData.showDemoSeed ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  {/* Advanced Analytics */}
                  <div className="mt-8 border-t border-slate-200/60 pt-5">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-semibold text-slate-800">Advanced Analytics</h4>
                    </div>
                    {metricsLoading ? (
                      <div className="animate-pulse flex flex-col space-y-4">
                        <div className="h-24 bg-slate-100 rounded-xl"></div>
                        <div className="h-24 bg-slate-100 rounded-xl"></div>
                      </div>
                    ) : activeMetrics && activeMetrics.advancedAnalytics ? (
                      <div className="space-y-4">
                        {/* Revenue Dashboard */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-2">Revenue Dashboard</p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] font-semibold text-indigo-600/70 uppercase">Filtered Revenue</p>
                              <p className="text-xl font-bold text-indigo-900">৳ {activeMetrics.advancedAnalytics.filteredRevenue.toFixed(2)}</p>
                              <p className="text-xs text-indigo-700/70">{activeMetrics.advancedAnalytics.filteredDeliveredOrders} Delivered Orders</p>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-[10px] font-semibold text-indigo-600/70 uppercase">This Month</p>
                                <p className="text-sm font-bold text-indigo-900">৳ {activeMetrics.advancedAnalytics.thisMonthRevenue.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-indigo-600/70 uppercase">This Year</p>
                                <p className="text-sm font-bold text-indigo-900">৳ {activeMetrics.advancedAnalytics.thisYearRevenue.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Pipeline */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Order Pipeline</p>
                           <div className="grid grid-cols-4 gap-2 text-center">
                             <div className="bg-slate-50 rounded-lg py-2 border border-slate-100">
                                <p className="text-sm font-bold text-slate-700">{activeMetrics.advancedAnalytics.pipeline?.pending || 0}</p>
                                <p className="text-[9px] font-semibold text-slate-500 uppercase">Pending</p>
                             </div>
                             <div className="bg-blue-50 rounded-lg py-2 border border-blue-100">
                                <p className="text-sm font-bold text-blue-700">{activeMetrics.advancedAnalytics.pipeline?.confirmed || 0}</p>
                                <p className="text-[9px] font-semibold text-blue-500 uppercase">Confirmed</p>
                             </div>
                             <div className="bg-indigo-50 rounded-lg py-2 border border-indigo-100">
                                <p className="text-sm font-bold text-indigo-700">{activeMetrics.advancedAnalytics.pipeline?.shipped || 0}</p>
                                <p className="text-[9px] font-semibold text-indigo-500 uppercase">Shipped</p>
                             </div>
                             <div className="bg-red-50 rounded-lg py-2 border border-red-100">
                                <p className="text-sm font-bold text-red-700">{activeMetrics.advancedAnalytics.pipeline?.cancelled || 0}</p>
                                <p className="text-[9px] font-semibold text-red-500 uppercase">Cancelled</p>
                             </div>
                           </div>
                        </div>

                        {/* Subscription Dates */}
                        {activeMetrics.subscription && (
                           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sub Start Date</p>
                                <p className="text-sm font-semibold text-slate-700">{new Date(activeMetrics.subscription.startDate).toLocaleDateString()}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sub Expiry Date</p>
                                <p className="text-sm font-semibold text-slate-700">{new Date(activeMetrics.subscription.endDate).toLocaleDateString()}</p>
                             </div>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm italic">
                        Select a filter to view analytics
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Merchant / Tenant Details Read-only */}
                <div className="flex-1 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/60">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-slate-800">
                      Merchant Information
                    </h4>
                  </div>

                  {activeClient?.ownerId ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        {activeClient.ownerId.avatar?.secure_url ? (
                          <img
                            src={activeClient.ownerId.avatar.secure_url}
                            alt={activeClient.ownerId.name}
                            className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm border border-purple-200/50">
                            {activeClient.ownerId.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-lg">
                            {activeClient.ownerId.name}
                          </p>
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            Store Admin
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Email Address
                          </p>
                          <p className="text-sm font-medium text-slate-700">
                            {activeClient.ownerId.email}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Contact Phone
                          </p>
                          <p className="text-sm font-medium text-slate-700">
                            {activeClient.ownerId.phone || "Not provided"}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Store Database ID
                          </p>
                          <p className="text-sm font-mono text-slate-600">
                            {activeClient._id || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                      No merchant details associated.
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-200/60 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                        Store Metrics
                      </h4>
                      <select 
                        className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 shadow-sm"
                        value={metricsFilter === 'month' ? `${metricsYear}-${metricsMonth}` : metricsFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'lifetime' || val === 'custom') {
                            setMetricsFilter(val);
                          } else {
                            setMetricsFilter('month');
                            const [y, m] = val.split('-');
                            setMetricsYear(y);
                            setMetricsMonth(m);
                          }
                        }}
                      >
                        <option value="lifetime">Lifetime</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const d = new Date();
                          d.setMonth(d.getMonth() - i);
                          return (
                            <option key={i} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>
                              {d.toLocaleString('default', { month: 'long' })} {d.getFullYear()}
                            </option>
                          );
                        })}
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    {metricsFilter === 'custom' && (
                      <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <input type="date" className="text-xs font-medium text-slate-600 bg-transparent border-none outline-none w-full" value={metricsStartDate} onChange={e => setMetricsStartDate(e.target.value)} />
                        <span className="text-slate-400 text-xs font-bold">-</span>
                        <input type="date" className="text-xs font-medium text-slate-600 bg-transparent border-none outline-none w-full" value={metricsEndDate} onChange={e => setMetricsEndDate(e.target.value)} />
                      </div>
                    )}

                    {metricsLoading ? (
                      <div className="animate-pulse flex flex-col space-y-4 mt-2">
                        <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
                        <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
                      </div>
                    ) : activeMetrics ? (
                      <div className="space-y-4">
                        {/* Summary Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Total Orders
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                              {activeMetrics.totalOrders}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Fraud Checks
                            </p>
                            <p className="text-lg font-bold text-red-500">
                              {activeMetrics.fraudChecks}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Categories
                            </p>
                            <div>
                              <p className="text-lg font-bold text-indigo-600">
                                {activeMetrics.totalCategories}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-green-600">
                                  {activeMetrics.activeCategories}
                                </span>{" "}
                                Active
                              </p>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Products
                            </p>
                            <div>
                              <p className="text-lg font-bold text-purple-600">
                                {activeMetrics.totalProducts}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-green-600">
                                  {activeMetrics.activeProducts}
                                </span>{" "}
                                Active
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Subscription & Addons Details */}
                        {activeMetrics.subscription && (
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                              <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Active Subscription
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                  {activeMetrics.subscription.packageId?.name || (activeMetrics.subscription.isTrial ? 'Free Trial' : 'Custom')}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase">
                                {activeMetrics.subscription.status}
                              </span>
                            </div>

                            {activeMetrics.subscription.purchasedAddons?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                  Add-on Usage
                                </p>
                                <div className="space-y-3">
                                  {activeMetrics.subscription.purchasedAddons.map((addon, idx) => (
                                    <div key={idx}>
                                      <div className="flex justify-between text-xs font-medium mb-1">
                                        <span className="text-slate-700">{addon.addonId?.name || 'Unknown Add-on'}</span>
                                        <span className="text-slate-500">{addon.used} / {addon.limit}</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div 
                                          className="bg-blue-500 h-1.5 rounded-full transition-all" 
                                          style={{ width: `${Math.min((addon.used / Math.max(addon.limit, 1)) * 100, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Courier Integration
                          </p>
                          <p className="text-sm font-medium text-slate-700">
                            {activeMetrics.courierStatus}
                          </p>
                          {activeMetrics.configuredCouriers && activeMetrics.configuredCouriers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {activeMetrics.configuredCouriers.map((courier, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider border border-blue-100">
                                  {courier}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm italic">
                        Metrics unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Delete Client?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-700">
                {activeClient?.name}
              </span>
              ? This action is permanent and will delete the store, admin user,
              all products, orders, categories, and settings associated with
              this merchant.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-500/30"
              >
                Delete Store & Data
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteProductsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageMinus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Delete All Products & Categories?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to delete all products and categories for{" "}
              <span className="font-bold text-slate-700">
                {activeClient?.name}
              </span>
              ? This action is permanent and cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => !isDeletingProducts && setIsDeleteProductsModalOpen(false)}
                disabled={isDeletingProducts}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                  isDeletingProducts 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProductsSubmit}
                disabled={isDeletingProducts}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium shadow-lg ${
                  isDeletingProducts
                    ? "bg-orange-400 text-white cursor-wait shadow-orange-500/20"
                    : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/30"
                }`}
              >
                {isDeletingProducts ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete Products & Categories"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
