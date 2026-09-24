import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Mail, CheckCircle, Trash2, Eye, X, Globe } from 'lucide-react';
import api from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function ContactInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const fetchInquiries = async () => {
    try {
      const res = await api.get('/contact-inquiries/get-all-inquiries');
      setInquiries(res.data.data);
    } catch (error) {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/contact-inquiries/update-inquiry-status/${id}`, { status: 'resolved' });
      toast.success('Inquiry marked as resolved');
      fetchInquiries();
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry(prev => ({ ...prev, status: 'resolved' }));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.delete(`/contact-inquiries/delete-inquiry/${id}`);
      toast.success('Inquiry deleted');
      fetchInquiries();
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry(null);
      }
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Landing Page Contact Inquiries</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Topic</th>
                <th className="px-6 py-4 max-w-xs">Message</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{inquiry.firstName} {inquiry.lastName}</div>
                      <div className="text-gray-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {inquiry.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {inquiry.topic}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={inquiry.message}>
                      {inquiry.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(inquiry.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {inquiry.status === 'resolved' ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center gap-1 w-max">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded w-max inline-block">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5 inline" />
                      </button>
                      {inquiry.status === 'pending' && (
                        <button
                          onClick={() => handleResolve(inquiry._id)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Mark as Resolved"
                        >
                          <CheckCircle className="w-5 h-5 inline" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inquiry._id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                Inquiry Details
                {selectedInquiry.status === 'resolved' ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Resolved
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    Pending
                  </span>
                )}
              </h2>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Sender</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedInquiry.firstName} {selectedInquiry.lastName}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <Mail className="w-3.5 h-3.5" /> {selectedInquiry.email}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Metadata</label>
                  <p className="text-gray-900 text-sm mt-1">
                    Topic: <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{selectedInquiry.topic}</span>
                  </p>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-2">
                    <Globe className="w-3.5 h-3.5" /> IP: {selectedInquiry.ipAddress || 'Unknown'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Date: {new Date(selectedInquiry.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Message</label>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap text-sm border border-gray-100">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedInquiry.status === 'pending' && (
                <button
                  onClick={() => handleResolve(selectedInquiry._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
