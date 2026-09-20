import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { Plus, Edit2, CheckCircle, XCircle, Trash2, Star } from "lucide-react";
import { useGetAllPackagesQuery } from "../store/apiSlice";

const DeleteButton = ({ onClick, isDeleting }) => {
  return (
    <button
      onClick={onClick}
      disabled={isDeleting}
      className={`w-full py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors select-none bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Trash2 className="w-4 h-4" />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
};

export default function Packages() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: packagesRes, refetch } = useGetAllPackagesQuery({
    page: currentPage,
    limit: 10,
  });

  const packages = packagesRes?.data || [];
  const meta = packagesRes?.meta || null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    billingCycle: "monthly",
    productLimit: "",
    tagline: "",
    description: "",
    isActive: true,
    isPopular: false,
    features: [],
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const openCreateModal = () => {
  useEffect(() => {
    const adminUserStr = localStorage.getItem("user");
    let socket;
    if (adminUserStr) {
      try {
        socket = io("/");
        const user = JSON.parse(adminUserStr);
        socket.emit("join_user_room", user._id);
        
        socket.on("refresh_packages", () => {
          // Trigger refetch depending on what RTK query or fetch is used
          // We can use a simple state toggle to trigger re-renders or assume refetch() exists
          if (typeof refetch === 'function') refetch();
          if (typeof fetchData === 'function') fetchData();
        });
      } catch (err) {}
    }
    return () => {
      if (socket) {
        socket.off("refresh_packages");
        socket.close();
      }
    };
  }, []);

    setEditId(null);
    setFormData({
      name: "",
      price: "",
      billingCycle: "monthly",
      productLimit: "",
      tagline: "",
      description: "",
      isActive: true,
      isPopular: false,
      features: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditId(pkg._id);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      billingCycle: pkg.billingCycle,
      productLimit: pkg.productLimit,
      tagline: pkg.tagline || "",
      description: pkg.description || "",
      isActive: pkg.isActive !== false,
      isPopular: pkg.isPopular || false,
      features: pkg.features || [],
    });
    setIsModalOpen(true);
  };

  const fetchPackages = () => {
    refetch();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        productLimit: Number(formData.productLimit),
      };

      let res;
      if (editId) {
        res = await api.patch(`/packages/update-package/${editId}`, payload);
      } else {
        res = await api.post("/packages/create-package", payload);
      }

      if (res.data.success || res.data.status === "ok") {
        toast.success(
          res.data.message ||
            (editId
              ? "Package updated successfully"
              : "Package created successfully"),
        );
        setIsModalOpen(false);
        setEditId(null);
        setFormData({
          name: "",
          price: "",
          billingCycle: "monthly",
          productLimit: "",
          tagline: "",
          description: "",
          isActive: true,
          isPopular: false,
          features: [],
        });
        fetchPackages(currentPage);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editId ? "Failed to update package" : "Failed to create package"),
      );
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.delete(`/packages/delete-package/${id}`);
      if (res.data.success || res.data.status === "ok") {
        toast.success("Package deleted successfully");
        fetchPackages(currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete package");
    } finally {
      setActionLoading(null);
    }
  };

  const generateDefaultPackages = async () => {
    const defaultFeatures = [
      "Custom Domain Setup",
      "Advanced Analytics",
      "24/7 Priority Support",
    ];
    const defaultPackages = [
      {
        name: "Basic",
        price: 199,
        billingCycle: "monthly",
        productLimit: 50,
        isActive: true,
        features: defaultFeatures,
      },
      {
        name: "Standard",
        price: 299,
        billingCycle: "monthly",
        productLimit: 200,
        isActive: true,
        features: defaultFeatures,
      },
      {
        name: "Premium",
        price: 499,
        billingCycle: "monthly",
        productLimit: 400,
        isActive: true,
        features: defaultFeatures,
      },
      {
        name: "Basic",
        price: 1990,
        billingCycle: "yearly",
        productLimit: 50,
        isActive: true,
        features: defaultFeatures,
      },
      {
        name: "Standard",
        price: 2990,
        billingCycle: "yearly",
        productLimit: 200,
        isActive: true,
        features: defaultFeatures,
      },
      {
        name: "Premium",
        price: 4990,
        billingCycle: "yearly",
        productLimit: 400,
        isActive: true,
        features: defaultFeatures,
      },
    ];

    try {
      toast.info("Generating default packages...");
      for (const pkg of defaultPackages) {
        await api.post("/packages/create-package", pkg);
      }
      toast.success("Default packages generated successfully");
      fetchPackages(1);
    } catch (error) {
      toast.error("Failed to generate some packages");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Pricing Packages
          </h2>
          <p className="text-slate-500 mt-1">
            Manage subscription tiers for your clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {packages.length === 0 && (
            <button
              onClick={generateDefaultPackages}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
            >
              Generate Default Packages
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Package
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div
            key={pkg._id}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${pkg.billingCycle === "yearly" ? "bg-gradient-to-r from-purple-500 to-indigo-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"}`}
            ></div>

            <div className="absolute top-5 right-5 flex items-center gap-2">
              {pkg.isPopular && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-200">
                  <Star className="w-3.5 h-3.5 fill-current" /> Popular
                </span>
              )}
              {pkg.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  <XCircle className="w-3.5 h-3.5" /> Inactive
                </span>
              )}
            </div>

            <div className="mb-2 mt-2 inline-block">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${pkg.billingCycle === "yearly" ? "text-purple-600" : "text-blue-600"}`}
              >
                {pkg.billingCycle} Billing
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 pr-20">
              {pkg.name}
            </h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">
                ৳ {pkg.price}
              </span>
              <span className="text-slate-500 font-medium">
                /{pkg.billingCycle === "yearly" ? "yr" : "mo"}
              </span>
            </div>

            <div className="mt-8 space-y-4 flex-grow">
              <div className="flex items-center justify-between text-sm p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">
                  Product Limit
                </span>
                <span className="font-bold text-slate-900">
                  {pkg.productLimit} Items
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleEdit(pkg)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5 text-sm"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <div className="flex-1">
                <DeleteButton
                  onClick={() => setDeleteConfirmId(pkg._id)}
                  isDeleting={actionLoading === pkg._id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={meta.page <= 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-600 font-medium">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-6">
              {editId ? "Edit Package" : "Create New Package"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Package Name
                </label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Premium Plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g. Perfect for growing businesses..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tagline (Subtitle)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData({ ...formData, tagline: e.target.value })
                  }
                  placeholder="e.g. Full-Scale Power for High Volume..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    required
                    type="number"
                    className="input-field"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="99.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    className="input-field"
                    value={formData.billingCycle}
                    onChange={(e) =>
                      setFormData({ ...formData, billingCycle: e.target.value })
                    }
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product Limit
                  </label>
                  <input
                    required
                    type="number"
                    className="input-field"
                    value={formData.productLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, productLimit: e.target.value })
                    }
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">
                        Active Package
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Most Popular
                  </label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isPopular}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isPopular: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">
                        Popular Package
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Features
                </label>
                <div className="space-y-2 mb-2 max-h-[150px] overflow-y-auto">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="input-field flex-1"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...formData.features];
                          newFeatures[index] = e.target.value;
                          setFormData({ ...formData, features: newFeatures });
                        }}
                        placeholder="e.g. Advanced Analytics"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = formData.features.filter(
                            (_, i) => i !== index,
                          );
                          setFormData({ ...formData, features: newFeatures });
                        }}
                        className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      features: [...formData.features, ""],
                    })
                  }
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Feature
                </button>
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
                  {editId ? "Update Package" : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Delete Package
            </h3>
            <p className="text-slate-500 mb-6 text-sm">
              Are you sure you want to delete this package? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
