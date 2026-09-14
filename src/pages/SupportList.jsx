import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LifeBuoy,
  Search,
  Eye,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CalendarDays,
} from "lucide-react";
import {
  useGetAllTicketsQuery,
  useGetTicketStatsQuery,
} from "../store/apiSlice";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export default function SupportList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 10 });

  const navigate = useNavigate();

  // RTK Query Hooks
  const {
    data: ticketsRes,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useGetAllTicketsQuery({
    search: debouncedSearch,
    page: pagination.currentPage,
    limit: pagination.limit,
    timeFilter,
  });

  const { data: statsRes, refetch: refetchStats } = useGetTicketStatsQuery({
    timeFilter,
  });

  const tickets = ticketsRes?.data || [];
  const loading = ticketsLoading;
  const stats = statsRes?.data || {
    solved: 0,
    pending: 0,
    open: 0,
    total: 0,
    thisMonthCount: 0,
    thisYearCount: 0,
  };
  const paginationData = ticketsRes?.pagination || {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 3000); // 3 seconds debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    const socket = io("/");
    const adminUserStr = localStorage.getItem("user");
    if (adminUserStr) {
      try {
        const user = JSON.parse(adminUserStr);
        socket.emit("join_user_room", user._id);
      } catch (err) {}
    }

    const triggerRefetch = () => {
      refetchTickets();
      refetchStats();
    };

    socket.on("new_ticket", triggerRefetch);
    socket.on("refresh_tickets", triggerRefetch);

    return () => {
      if (adminUserStr) {
        try {
          const user = JSON.parse(adminUserStr);
          socket.emit("leave_user_room", user._id);
        } catch (err) {}
      }
      socket.off("new_ticket");
      socket.off("refresh_tickets");
      socket.close();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "text-red-600 bg-red-50";
      case "IN_PROGRESS":
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      case "RESOLVED":
        return "text-green-600 bg-green-50";
      case "CLOSED":
        return "text-slate-600 bg-slate-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-blue-600" />
            Support Tickets
          </h1>
          <p className="text-slate-500 mt-1">
            Manage merchant support requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              Total Open/Pending
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {stats.open + stats.pending}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              Total Solved
            </p>
            <p className="text-2xl font-bold text-green-600">{stats.solved}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              Tickets This Month
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {stats.thisMonthCount}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              Tickets This Year
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {stats.thisYearCount}
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <CalendarDays className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl gap-4 flex-wrap">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Subject, or Store..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="py-2 pl-3 pr-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Time</option>
              <option value="weekly">Past Week</option>
              <option value="monthly">Past Month</option>
              <option value="yearly">Past Year</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                  Subject
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                  Tenant
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                  Priority
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                  Date
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    {searchQuery
                      ? "No tickets match your search."
                      : "No support tickets found."}
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        ID: {ticket.ticketId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {ticket.tenantId?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {ticket.tenantId?.domain}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                      >
                        <CircleDot className="w-3 h-3" />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/support/${ticket._id}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white rounded-b-xl">
          <span className="text-sm text-slate-600">
            Page {paginationData.currentPage} of {paginationData.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage - 1,
                }))
              }
              disabled={paginationData.currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage + 1,
                }))
              }
              disabled={
                paginationData.currentPage === paginationData.totalPages
              }
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
