import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LifeBuoy, Search, Eye, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export default function SupportList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();

    const socket = io('http://localhost:8000');
    const adminUserStr = localStorage.getItem('user');
    if (adminUserStr) {
      try {
        const user = JSON.parse(adminUserStr);
        socket.emit('join_user_room', user._id);
      } catch(err) {}
    }
    
    socket.on('new_ticket', (ticket) => {
      setTickets((prev) => {
        // Prevent duplicate tickets
        if (prev.some(t => t._id === ticket._id)) return prev;
        return [ticket, ...prev];
      });
    });

    socket.on('refresh_tickets', () => {
      fetchTickets();
    });

    return () => {
      if (adminUserStr) {
        try {
          const user = JSON.parse(adminUserStr);
          socket.emit('leave_user_room', user._id);
        } catch(err) {}
      }
      socket.off('new_ticket');
      socket.off('refresh_tickets');
      socket.close();
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/support/all-tickets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setTickets(response.data.data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'text-red-600 bg-red-50';
      case 'IN_PROGRESS': return 'text-yellow-600 bg-yellow-50';
      case 'RESOLVED': return 'text-green-600 bg-green-50';
      case 'CLOSED': return 'text-slate-600 bg-slate-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-blue-600" />
            Support Tickets
          </h1>
          <p className="text-slate-500 mt-1">Manage merchant support requests</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tickets..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Subject</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tenant</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Priority</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No support tickets found.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{ticket.subject}</div>
                      <div className="text-xs text-slate-500 mt-1">ID: {ticket.ticketId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{ticket.tenantId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{ticket.tenantId?.domain}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        <CircleDot className="w-3 h-3" />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{ticket.priority}</span>
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
      </div>
    </div>
  );
}
