import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { useSocket } from "../context/SocketContext";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Filter,
  Calendar,
  User,
  Clock,
  Layers,
  Star,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Product Update",
  "E-commerce Tips",
  "Business Growth",
  "Guides",
  "Tutorial",
  "Case Study",
];

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Product Update",
    tags: "",
    thumbnail: "",
    author: "MASH ECO Team",
    authorRole: "Editor",
    readTime: "4 min read",
    isPublished: true,
    featured: false,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size should be less than 10MB");
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Uploading thumbnail image to server...");

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await api.post("/blogs/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success || res.data?.status === "ok") {
        const uploadedUrl = res.data.data?.url || res.data.data?.secure_url;
        setFormData((prev) => ({ ...prev, thumbnail: uploadedUrl }));
        toast.update(toastId, {
          render: "Thumbnail image uploaded successfully!",
          type: "success",
          isLoading: false,
          autoClose: 2500,
        });
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast.update(toastId, {
        render: err.response?.data?.message || "Failed to upload image",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchBlogs = useCallback(async (page = meta.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(meta.limit || 10),
      });

      if (searchTerm.trim()) params.append("searchTerm", searchTerm.trim());
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const res = await api.get(`/blogs/get-all-blogs?${params.toString()}`);
      if (res.data?.success || res.data?.data) {
        setBlogs(res.data.data || []);
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      }
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      toast.error(err.response?.data?.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchBlogs(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Real-time socket listener
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchBlogs(meta.page);
    socket.on("refresh_blogs", handleRefresh);
    return () => socket.off("refresh_blogs", handleRefresh);
  }, [socket, fetchBlogs, meta.page]);

  const handleOpenCreateModal = () => {
    setEditId(null);
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      category: "Product Update",
      tags: "",
      thumbnail: "",
      author: "MASH ECO Team",
      authorRole: "Editor",
      readTime: "4 min read",
      isPublished: true,
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog) => {
    setEditId(blog._id);
    setFormData({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      category: blog.category || "Product Update",
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : (blog.tags || ""),
      thumbnail: blog.thumbnail || "",
      author: blog.author || "MASH ECO Team",
      authorRole: blog.authorRole || "Editor",
      readTime: blog.readTime || "4 min read",
      isPublished: blog.isPublished !== false,
      featured: !!blog.featured,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !formData.content) {
      toast.warning("Title, excerpt, and content are required!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        tags: typeof formData.tags === "string"
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : formData.tags,
      };

      let res;
      if (editId) {
        res = await api.patch(`/blogs/update-blog/${editId}`, payload);
      } else {
        res = await api.post("/blogs/create-blog", payload);
      }

      if (res.data?.success || res.data?.status === "ok") {
        toast.success(editId ? "Article updated successfully!" : "Article published successfully!");
        setIsModalOpen(false);
        setEditId(null);
        fetchBlogs(meta.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save article");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (blog) => {
    setActionLoading(blog._id);
    try {
      const res = await api.patch(`/blogs/update-blog/${blog._id}`, {
        isPublished: !blog.isPublished,
      });
      if (res.data?.success) {
        toast.success(
          blog.isPublished ? "Article moved to drafts" : "Article published!"
        );
        fetchBlogs(meta.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.delete(`/blogs/delete-blog/${id}`);
      if (res.data?.success) {
        toast.success("Article deleted successfully");
        setDeleteConfirmId(null);
        fetchBlogs(meta.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete article");
    } finally {
      setActionLoading(null);
    }
  };

  const [seedLoading, setSeedLoading] = useState(false);

  const handleAutoSeed = async () => {
    if (
      !window.confirm(
        "Are you sure you want to auto-seed default blog articles? This will populate the database with the official curated guides."
      )
    ) {
      return;
    }

    setSeedLoading(true);
    const toastId = toast.loading("Seeding default blog articles to database...");
    try {
      const res = await api.post("/blogs/seed-blogs?force=true", { force: true });
      toast.update(toastId, {
        render: res.data?.message || "Default blogs seeded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchBlogs(1);
    } catch (err) {
      console.error("Failed to seed blogs:", err);
      toast.update(toastId, {
        render: err.response?.data?.message || "Failed to seed default blogs",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setSeedLoading(false);
    }
  };

  const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalPublished = blogs.filter((b) => b.isPublished).length;
  const totalDrafts = blogs.filter((b) => !b.isPublished).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Blog & Article Management
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Publish educational guides, platform announcements, and business insights for MASH ECO merchants.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleAutoSeed}
            disabled={seedLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-sm shadow-xs transition-all disabled:opacity-60 cursor-pointer select-none"
            title="Auto seed official default blog articles into the database"
          >
            {seedLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-600" />
            )}
            <span>{seedLoading ? "Seeding..." : "Auto Seed Blogs"}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all select-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Articles</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{meta.total || blogs.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalPublished}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalDrafts}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reads</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalViews.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, author, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus("published")}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedStatus === "published" ? "bg-white text-emerald-600 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setSelectedStatus("draft")}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedStatus === "draft" ? "bg-white text-amber-600 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Drafts
            </button>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Published</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="font-semibold text-xs">Loading articles...</p>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-base">No blog articles found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || selectedCategory !== "All"
                        ? "Try clearing filters or search term."
                        : "Click 'Write New Article' to create your first post."}
                    </p>
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#122846] via-[#0369a1] to-[#0284c7] text-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                          {blog.thumbnail ? (
                            <img src={blog.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-sky-200" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 line-clamp-1 hover:text-blue-600">
                              {blog.title}
                            </span>
                            {blog.featured && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {blog.excerpt}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            /{blog.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                        {blog.category || "General"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-800">
                        {blog.author || "MASH ECO"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {blog.readTime || "4 min read"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{(blog.views || 0).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(blog)}
                        disabled={actionLoading === blog._id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          blog.isPublished
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${blog.isPublished ? "bg-emerald-500" : "bg-slate-400"}`} />
                        <span>{blog.isPublished ? "Published" : "Draft"}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {blog.publishedAt
                        ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://masheco.com/landing/blog/${blog.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on landing page"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleOpenEditModal(blog)}
                          title="Edit article"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(blog._id)}
                          title="Delete article"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Proper Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{blogs.length}</strong> of{" "}
            <strong className="text-slate-800">{meta.total || 0}</strong> articles
            (Page {meta.page} of {meta.totalPages || 1})
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchBlogs(meta.page - 1)}
              disabled={meta.page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: meta.totalPages || 1 }, (_, i) => i + 1).map((p) => {
              // Show window around current page
              if (
                p === 1 ||
                p === meta.totalPages ||
                (p >= meta.page - 1 && p <= meta.page + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => fetchBlogs(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      meta.page === p
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (p === meta.page - 2 || p === meta.page + 2) {
                return (
                  <span key={p} className="text-xs text-slate-400 px-1">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => fetchBlogs(meta.page + 1)}
              disabled={meta.page >= meta.totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create or Edit Article */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {editId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {editId ? "Edit Blog Article" : "Write New Article"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Article Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Introducing Advanced Courier Automation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Category, Author, Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Author Name
                  </label>
                  <input
                    type="text"
                    placeholder="MASH ECO Team"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Read Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Short Summary / Excerpt *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="A compelling 1-2 sentence preview displayed on the article card..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Content Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Article Body / Markdown Content *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Supports Markdown: ## Headings, lists, bold text
                  </span>
                </div>
                <textarea
                  required
                  rows={10}
                  placeholder="Write the full article content here. You can use markdown headings (##), bold (**text**), bullet points (- item)..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Thumbnail / Cover Image & Tags */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Thumbnail Image / Cover Image
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Upload from computer or paste direct link
                    </span>
                  </div>

                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {formData.thumbnail ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 relative shadow-2xs">
                          <img
                            src={formData.thumbnail}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Image Uploaded
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate font-mono">
                            {formData.thumbnail}
                          </p>
                          <div className="flex items-center gap-2 mt-2.5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                              <span>{uploadingImage ? "Uploading..." : "Change Image"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const prevUrl = formData.thumbnail;
                                setFormData({ ...formData, thumbnail: "" });
                                if (prevUrl && prevUrl.includes("cloudinary.com")) {
                                  try {
                                    await api.post("/blogs/delete-image", { url: prevUrl });
                                  } catch (e) {}
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        uploadingImage
                          ? "border-blue-400 bg-blue-50/40 cursor-wait"
                          : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      {uploadingImage ? (
                        <div className="py-2">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="text-sm font-bold text-blue-700">Uploading image to cloud...</p>
                          <p className="text-xs text-slate-400 mt-0.5">Please wait a moment</p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-800">
                            Click here to upload image from your computer
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PNG, JPG, JPEG or WEBP (Max 10MB)
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1.5 italic">
                            Leave blank to use sleek MASH ECO gradient cover
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct URL input fallback */}
                  <div className="mt-2">
                    <input
                      type="url"
                      placeholder="Or enter direct image URL link (e.g. https://...)"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50/60 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Courier, Automation, E-commerce, Tips"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Publish & Featured Toggles */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">Publish Immediately</span>
                    <p className="text-[11px] text-slate-500">
                      If unchecked, article will be saved as draft and hidden from landing page.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">Featured Article</span>
                    <p className="text-[11px] text-slate-500">
                      Highlighted prominently at the top of the blog page.
                    </p>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editId ? "Update Article" : "Publish Article"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Delete this article?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This action cannot be undone. The article will be permanently removed from the database and landing page.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={actionLoading === deleteConfirmId}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all"
              >
                {actionLoading === deleteConfirmId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
