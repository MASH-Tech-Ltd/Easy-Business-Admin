import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export default function SupportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketDetails();

    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [id]);

  useEffect(() => {
    if (socket && ticket) {
      socket.emit('join_ticket', ticket.ticketId);

      socket.on('new_message', (message) => {
        setTicket((prev) => {
          if (!prev) return prev;
          if (prev.messages.some(m => m._id === message._id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        });
      });

      socket.on('status_changed', (status) => {
        setTicket((prev) => ({
          ...prev,
          status
        }));
      });

      socket.on('ticket_deleted', () => {
        toast.error('This ticket was deleted');
        navigate('/support');
      });

      socket.on('typing_start', (data) => {
        if (data.ticketId === ticket.ticketId) {
          setIsTyping(true);
          setTypingUser(data.senderName);
        }
      });

      socket.on('typing_end', (data) => {
        if (data.ticketId === ticket.ticketId) {
          setIsTyping(false);
          setTypingUser('');
        }
      });

      return () => {
        socket.emit('leave_ticket', ticket.ticketId);
        socket.off('new_message');
        socket.off('status_changed');
        socket.off('ticket_deleted');
        socket.off('typing_start');
        socket.off('typing_end');
      };
    }
  }, [socket, ticket?.ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicketDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/support/ticket/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setTicket(response.data.data);
    } catch (error) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const response = await axios.post(`http://localhost:8000/api/v1/support/ticket/${id}/reply`, {
        message: replyMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setTicket(response.data.data);
      setReplyMessage('');
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await axios.patch(`http://localhost:8000/api/v1/support/ticket/${id}/status`, {
        status
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setTicket({ ...ticket, status });
      toast.success(`Ticket marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/support/ticket/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      toast.success('Ticket deleted');
      navigate('/support');
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-500">Ticket not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/support')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{ticket.subject} (ID: {ticket.ticketId})</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span>{ticket.tenantId?.name}</span>
              <span>•</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <button 
              onClick={() => updateStatus('RESOLVED')}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Resolved
            </button>
          )}
          <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
            Status: {ticket.status}
          </div>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Delete Ticket
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">
          {ticket.messages.map((msg, idx) => {
            const isAdmin = msg.senderType === 'ADMIN';
            return (
              <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  isAdmin 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  <div className="text-[11px] font-medium opacity-70 mb-1 flex items-center gap-1.5">
                    <span className="font-bold">{msg.senderId?.name || (isAdmin ? 'Admin' : 'Merchant')}</span>
                    <span className="opacity-50">•</span>
                    <Clock className="w-3 h-3" />
                    {new Date(msg.createdAt || msg._id.getTimestamp?.() || Date.now()).toLocaleString()}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {isTyping && (
          <div className="px-6 py-2 bg-slate-50 text-xs text-slate-500 italic border-t border-slate-100 flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
            {typingUser} is typing...
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleReply} className="flex gap-3 relative">
            <textarea
              value={replyMessage}
              onChange={(e) => {
                setReplyMessage(e.target.value);
                if (socket) {
                  socket.emit('typing_start', { ticketId: ticket.ticketId, senderName: 'Admin' });
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit('typing_end', { ticketId: ticket.ticketId });
                  }, 2000);
                }
              }}
              placeholder="Type your reply here..."
              className="flex-1 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-14"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (socket) socket.emit('typing_end', { ticketId: ticket.ticketId });
                  handleReply(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 w-14"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
