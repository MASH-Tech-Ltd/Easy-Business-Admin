import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io('/');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_user_room', userId);
    });

    newSocket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast(
        <div onClick={() => setIsOpen(true)} className="flex items-start gap-3 cursor-pointer">
          <div className="bg-blue-50 p-2 rounded-full flex-shrink-0 mt-1 shadow-sm border border-blue-100">
            <Bell className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm tracking-tight">{notification.title || 'New Notification'}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{notification.message || 'You have a new alert.'}</p>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { 
            borderRadius: '16px', 
            padding: '16px', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }
      );
    });

    return () => {
      newSocket.emit('leave_user_room', userId);
      newSocket.close();
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/my-notifications');
      const data = res.data?.data || {};
      setNotifications(Array.isArray(data) ? data : (data.notifications || []));
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    
    if (notification.type.startsWith('TICKET') && notification.relatedEntityId) {
      navigate(`/support/${notification.relatedEntityId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.slice(0, 5).map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.title}
                      </span>
                      {!notification.read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-1">{notification.message}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline p-1"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
