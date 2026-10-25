import { useSocket } from "../context/SocketContext";
import { useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  ThumbsUp,
  X,
  Check,
  Package as PackageIcon,
  Zap,
  Sparkles,
  ShieldCheck,
  Tag,
  DollarSign,
  Layers,
  Sliders,
  Info,
} from "lucide-react";
import { useGetAllPackagesQuery } from "../store/apiSlice";

const STANDARD_PRESETS = {
  basic: [
    "Up to 199 Products Capacity",
    "Courier Automation: 5 Free Orders / Month",
    "Abandoned Checkout: 5 Free Leads / Month",
    "Online Storefront & All 5 Modern Themes",
    "Mash Eco Subdomain & Custom Domain",
    "Cash on Delivery (COD) & Manual Payments",
    "Customer Support: Standard Ticket Support",
    "Google Analytics 4 (GA4): Not included",
    "Meta (Facebook) Pixel & Conversion Tracking: Not included",
    "Advanced Sales & Business Insights: Not included",
    "Automated SMS & Email Marketing: Not included",
    "Multi-channel GTM Custom Scripts: Not included",
    "Advanced Customer Fraud Risk Scoring: Not included",
    "Swift VIP Dedicated 24/7 Priority Support: Not included",
  ],
  standard: [
    "Up to 399 Products (2x Capacity)",
    "Courier Automation: 10 Free Orders / Month (2x)",
    "Abandoned Checkout: 10 Free Leads / Month (2x)",
    "Online Storefront & All 5 Modern Themes",
    "Mash Eco Subdomain & Custom Domain",
    "Cash on Delivery (COD) & Manual Payments",
    "Customer Support: Priority Support Queue",
    "Google Analytics 4 (GA4) Native Integration",
    "Meta (Facebook) Pixel & Conversion Tracking",
    "Advanced Sales & Conversion Analytics",
    "Automated SMS & Email Marketing Ready",
    "Multi-channel GTM Custom Scripts: Not included",
    "Advanced Customer Fraud Risk Scoring: Not included",
    "Swift VIP Dedicated 24/7 Priority Support: Not included",
  ],
  premium: [
    "Up to 1,500 Products (Maximum Catalog Size)",
    "Courier Automation: 15 Free Orders / Month (3x Volume)",
    "Abandoned Checkout: 15 Free Leads / Month (3x Volume)",
    "Online Storefront & All 5 Modern Themes",
    "Mash Eco Subdomain & Custom Domain",
    "Cash on Delivery (COD) & Manual Payments",
    "Customer Support: Fast-Track VIP Ticket Support",
    "Google Analytics 4 (GA4) Native Integration",
    "Meta (Facebook) Pixel & Conversion Tracking",
    "Advanced Sales & Business Insights Dashboard",
    "Automated SMS & Email Marketing Ready",
    "Multi-channel GTM Tracking & Custom Scripts",
    "Advanced Customer Fraud Risk Scoring",
    "Swift VIP Dedicated 24/7 Priority Support",
  ],
};

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

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      if (typeof refetch === "function") refetch();
    };

    socket.on("refresh_packages", handleRefresh);

    return () => {
      socket.off("refresh_packages", handleRefresh);
    };
  }, [socket, refetch]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    billingCycle: "monthly",
    productLimit: "",
    freeCourierLimit: 0,
    freeAbandonedLimit: 0,
    tagline: "",
    description: "",
    isActive: true,
    isPopular: false,
    isRecommended: false,
    features: [],
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      name: "",
      price: "",
      billingCycle: "monthly",
      productLimit: "",
      freeCourierLimit: 0,
      freeAbandonedLimit: 0,
      tagline: "",
      description: "",
      isActive: true,
      isPopular: false,
      isRecommended: false,
      features: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditId(pkg._id);
    setFormData({
      name: pkg.name || "",
      price: pkg.price ?? "",
      billingCycle: pkg.billingCycle || "monthly",
      productLimit: pkg.productLimit ?? "",
      freeCourierLimit: pkg.freeCourierLimit ?? 0,
      freeAbandonedLimit: pkg.freeAbandonedLimit ?? 0,
      tagline: pkg.tagline || "",
      description: pkg.description || "",
      isActive: pkg.isActive !== false,
      isPopular: pkg.isPopular || false,
      isRecommended: pkg.isRecommended || false,
      features: Array.isArray(pkg.features) ? [...pkg.features] : [],
    });
    setIsModalOpen(true);
  };

  const toggleFeatureExcluded = (index) => {
    const current = formData.features[index] || "";
    let updated = "";
    if (/\s*:\s*not included$/i.test(current)) {
      updated = current.replace(/\s*:\s*not included$/i, "");
    } else {
      updated = `${current.replace(/\s*:\s*not included$/i, "")}: Not included`;
    }
    const newFeatures = [...formData.features];
    newFeatures[index] = updated;
    setFormData({ ...formData, features: newFeatures });
  };

  const loadStandardPreset = () => {
    const nameLower = (formData.name || "").toLowerCase().trim();
    let presetKey = "basic";
    if (nameLower.includes("standard")) presetKey = "standard";
    else if (nameLower.includes("premium")) presetKey = "premium";

    const preset = STANDARD_PRESETS[presetKey] || STANDARD_PRESETS.basic;
    setFormData({
      ...formData,
      features: [...preset],
    });
    toast.info(`Loaded 14-feature preset for ${formData.name || "Basic"}!`);
  };

  const fetchPackages = () => {
    refetch();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        productLimit: Number(formData.productLimit),
        freeCourierLimit: Number(formData.freeCourierLimit) || 0,
        freeAbandonedLimit: Number(formData.freeAbandonedLimit) || 0,
        features: formData.features.filter((f) => f && f.trim() !== ""),
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
        fetchPackages(currentPage);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editId ? "Failed to update package" : "Failed to create package"),
      );
    } finally {
      setSubmitting(false);
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
    const defaultPackages = [
      {
        name: "Basic",
        price: 299,
        billingCycle: "monthly",
        productLimit: 199,
        isActive: true,
        isPopular: false,
        isRecommended: false,
        description: "Turn your Facebook shop into a professional e-commerce store. An affordable, essential package built for new sellers launching their brand.",
        tagline: "Simple & Affordable Online Store for Small Businesses",
        features: [
          "Up to 199 Products",
          "Professional Online Store",
          "Product, Category & Order Management",
          "Customer Management",
          "Cash on Delivery (COD)",
          "MASH ECO Subdomain & Custom Domain Support",
          "All Available Store Themes",
          "Basic Dashboard & Mobile-Friendly Store",
          "Support: Standard Ticket Support (Submit a ticket and our team will review and respond accordingly).",
          "Best For: New ventures and small businesses with a limited product lineup."
        ],
      },
      {
        name: "Standard",
        price: 499,
        billingCycle: "monthly",
        productLimit: 399,
        isActive: true,
        isPopular: true,
        isRecommended: true,
        description: "Scale your growing business with higher product capacity, smart insights, and priority support.",
        tagline: "More Capacity & Insights for Growing Businesses",
        features: [
          "Up to 399 Products",
          "Professional Online Store",
          "Product, Category & Order Management",
          "Customer Management",
          "Cash on Delivery (COD)",
          "MASH ECO Subdomain & Custom Domain Support",
          "All Available Store Themes",
          "Basic Dashboard & Mobile-Friendly Store",
          "Support: Priority Support (Get direct messaging access alongside standard tickets, handled with priority).",
          "Best For: Fast-growing businesses handling regular daily orders."
        ],
      },
      {
        name: "Premium",
        price: 799,
        billingCycle: "monthly",
        productLimit: 699,
        isActive: true,
        isPopular: false,
        isRecommended: false,
        description: "Maximum power for large catalogs with advanced inventory control and instant priority support.",
        tagline: "Full-Scale Power for High Volume & Large Catalogs",
        features: [
          "Up to 400 Products",
          "Professional Online Store",
          "Product, Category & Order Management",
          "Customer Management",
          "Cash on Delivery (COD)",
          "MASH ECO Subdomain & Custom Domain Support",
          "All Available Store Themes",
          "Basic Dashboard & Mobile-Friendly Store",
          "Support: Swift Priority Support (Fastest turnaround via direct messaging and priority ticketing for critical issues).",
          "Best For: Established e-commerce stores with large catalogs and high order volume."
        ],
      },
      {
        name: "Basic",
        price: 2990,
        billingCycle: "yearly",
        productLimit: 199,
        isActive: true,
        isPopular: false,
        isRecommended: false,
        description: "Turn your Facebook shop into a professional e-commerce store. An affordable, essential package built for new sellers launching their brand.",
        tagline: "Simple & Affordable Online Store for Small Businesses",
        features: [
          "Up to 199 Products",
          "Professional Online Store",
          "Product, Category & Order Management",
          "Customer Management",
          "Cash on Delivery (COD)",
          "MASH ECO Subdomain & Custom Domain Support",
          "All Available Store Themes",
          "Basic Dashboard & Mobile-Friendly Store",
          "Support: Standard Ticket Support (Submit a ticket and our team will review and respond accordingly).",
          "Best For: New ventures and small businesses with a limited product lineup."
        ],
      },
      {
        name: "Standard",
        price: 4990,
        billingCycle: "yearly",
        productLimit: 399,
        isActive: true,
        isPopular: true,
        isRecommended: true,
        description: "Scale your growing business with higher product capacity, smart insights, and priority support.",
        tagline: "More Capacity & Insights for Growing Businesses",
        features: [
          "Up to 399 Products",
          "Professional Online Store",
          "Product, Category & Order Management",
          "Customer Management",
          "Cash on Delivery (COD)",
          "MASH ECO Subdomain & Custom Domain Support",
          "All Available Store Themes",
          "Basic Dashboard & Mobile-Friendly Store",
          "Support: Priority Support (Get direct messaging access alongside standard tickets, handled with priority).",
          "Best For: Fast-growing businesses handling regular daily orders."
        ],
      },
      {
        name: "Premium",
        price: 7990,
        billingCycle: "yearly",
        productLimit: 699,
        isActive: true,
        isPopular: false,
        isRecommended: false,
        description: "Maximum power for large catalogs with advanced inventory control and instant priority support.",
        tagline: "Full-Scale Power for High Volume & Large Catalogs",
        features: [
          "Up to 400 Products",
          "Professional Online Store",
          "Product, Category & Order Management",
          "Customer Management",
          "Cash on Delivery (COD)",
          "MASH ECO Subdomain & Custom Domain Support",
          "All Available Store Themes",
          "Basic Dashboard & Mobile-Friendly Store",
          "Support: Swift Priority Support (Fastest turnaround via direct messaging and priority ticketing for critical issues).",
          "Best For: Established e-commerce stores with large catalogs and high order volume."
        ],
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
              {pkg.isRecommended && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                  <ThumbsUp className="w-3.5 h-3.5 fill-current" /> Recommended
                </span>
              )}
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

            <div className="mt-4">
              {pkg.billingCycle === "yearly" ? (
                <div className="text-base sm:text-lg font-semibold text-slate-400 line-through decoration-red-300 decoration-1 leading-tight">
                  ৳{Math.round(pkg.price * 1.2).toLocaleString()}
                </div>
              ) : (
                <div className="text-base sm:text-lg font-semibold invisible select-none leading-tight">
                  ৳0
                </div>
              )}
              <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                <span className="text-4xl font-extrabold text-slate-900">
                  ৳{pkg.price.toLocaleString()}
                </span>
                <span className="text-slate-500 font-medium text-sm">
                  / Per {pkg.billingCycle === "yearly" ? "Year" : "Month"}
                </span>
              </div>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <PackageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {editId ? "Edit Package" : "Create New Package"}
                    </h3>
                    {formData.name && (
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {formData.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure pricing, product limits, monthly free automations, and capabilities.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSubmit} id="package-form" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-7">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    1. General Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Package Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="input-field text-sm font-semibold text-slate-900 placeholder:font-normal"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Basic, Standard, Premium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Billing Cycle *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, billingCycle: "monthly" })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          formData.billingCycle === "monthly"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Monthly (মাসিক)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, billingCycle: "yearly" })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          formData.billingCycle === "yearly"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Yearly (বাৎসরিক)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tagline (Subtitle)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                    placeholder="e.g. Essential Storefront for New Sellers & Small Businesses"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    className="input-field text-sm resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief summary of the target audience and value proposition..."
                  />
                </div>
              </div>

              {/* Section 2: Pricing & Product Limit */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    2. Pricing & Catalog Capacity
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Price (৳ BDT) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                        ৳
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        className="input-field pl-8 text-base font-black text-slate-900"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="299"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Charged {formData.billingCycle === "yearly" ? "annually" : "per month"} to merchant.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Product Catalog Limit *
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="number"
                        min="1"
                        className="input-field text-base font-black text-slate-900"
                        value={formData.productLimit}
                        onChange={(e) =>
                          setFormData({ ...formData, productLimit: e.target.value })
                        }
                        placeholder="199"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Products
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Maximum active products merchant can create.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Monthly Free Automation Quotas */}
              <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-4 h-4 fill-current text-yellow-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-900">
                        3. Monthly Free Automation Credits
                      </h4>
                      <p className="text-[11px] text-blue-700/80">
                        Refreshes automatically each monthly billing cycle. Unused credits expire.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Courier Automation Orders / Mo
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        className="input-field text-sm font-bold text-slate-900"
                        value={formData.freeCourierLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            freeCourierLimit: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        Free / Month
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Pathao, Steadfast, Redx auto-booking allowance.
                    </p>
                  </div>

                  <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Abandoned Cart Leads / Mo
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        className="input-field text-sm font-bold text-slate-900"
                        value={formData.freeAbandonedLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            freeAbandonedLimit: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        Free / Month
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Shopper phone & cart capture recovery leads.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Visibility & Promotion Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    4. Status & Promotion Badges
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Active Toggle */}
                  <label
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      formData.isActive
                        ? "bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-500/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Active Status
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                      />
                      <div className="relative shrink-0 w-9 h-5 bg-slate-300 peer-checked:bg-emerald-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {formData.isActive ? "Visible on landing page" : "Hidden from public"}
                    </span>
                  </label>

                  {/* Popular Toggle */}
                  <label
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      formData.isPopular
                        ? "bg-blue-50/70 border-blue-200 ring-1 ring-blue-500/30"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className={`w-3.5 h-3.5 ${formData.isPopular ? "text-blue-600 fill-current" : "text-slate-400"}`} />
                        <span className="text-xs font-bold text-slate-800">
                          Most Popular
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isPopular}
                        onChange={(e) =>
                          setFormData({ ...formData, isPopular: e.target.checked })
                        }
                      />
                      <div className="relative shrink-0 w-9 h-5 bg-slate-300 peer-checked:bg-blue-600 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {formData.isPopular ? "Highlights with blue border" : "Standard card style"}
                    </span>
                  </label>

                  {/* Recommended Toggle */}
                  <label
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      formData.isRecommended
                        ? "bg-amber-50/70 border-amber-200 ring-1 ring-amber-500/30"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp className={`w-3.5 h-3.5 ${formData.isRecommended ? "text-amber-600 fill-current" : "text-slate-400"}`} />
                        <span className="text-xs font-bold text-slate-800">
                          Recommended
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isRecommended}
                        onChange={(e) =>
                          setFormData({ ...formData, isRecommended: e.target.checked })
                        }
                      />
                      <div className="relative shrink-0 w-9 h-5 bg-slate-300 peer-checked:bg-amber-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {formData.isRecommended ? "Shows Recommended badge" : "No badge"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 5: Features Matrix (Capabilities) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      5. Capability Matrix ({formData.features.length} Features)
                    </h4>
                  </div>

                  {/* Preset Button */}
                  <button
                    type="button"
                    onClick={loadStandardPreset}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Populate with verified 14-feature preset"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Load 14-Feature Preset
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Smart Cross & Tick Icons:</strong> Features ending with <code>: Not included</code> or containing <code>0 free</code> will automatically render with a red cross (✕) on the pricing section. Included items render with a green checkmark (✓).
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {formData.features.map((feature, index) => {
                    const isExcluded = /\b(not included|0 free)\b/i.test(feature);
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                          isExcluded
                            ? "bg-rose-50/40 border-rose-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Status Icon */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isExcluded
                              ? "bg-rose-100 text-rose-600 border border-rose-300"
                              : "bg-emerald-500 text-white"
                          }`}
                          title={isExcluded ? "Feature Excluded (Red ✕)" : "Feature Included (Green ✓)"}
                        >
                          {isExcluded ? (
                            <X className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : (
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          )}
                        </div>

                        {/* Text Input */}
                        <input
                          type="text"
                          className={`flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                            isExcluded
                              ? "text-slate-500 border-rose-200"
                              : "text-slate-800 border-slate-200"
                          }`}
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[index] = e.target.value;
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          placeholder="e.g. Courier Automation: 5 Free Orders / Month"
                        />

                        {/* Quick Toggle Excluded / Included */}
                        <button
                          type="button"
                          onClick={() => toggleFeatureExcluded(index)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                            isExcluded
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                          title={isExcluded ? "Click to Mark as Included" : "Click to Mark as Not Included"}
                        >
                          {isExcluded ? "✓ Include" : "✕ Exclude"}
                        </button>

                        {/* Delete Item */}
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = formData.features.filter(
                              (_, i) => i !== index,
                            );
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Feature"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Feature Button */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      features: [...formData.features, ""],
                    })
                  }
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Capability Feature
                </button>
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="px-6 sm:px-8 py-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Changes reflect across public pricing and merchant store dashboards.</span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="package-form"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editId ? (
                    "Update Package"
                  ) : (
                    "Create Package"
                  )}
                </button>
              </div>
            </div>
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
