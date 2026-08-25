import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Plus, Edit2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useRef } from 'react';

const HoldToDeleteButton = ({ onDelete, isDeleting }) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const holdDuration = 5000;
  const updateInterval = 50;

  const startHold = () => {
    setIsHolding(true);
    setProgress(0);
    
    let elapsed = 0;
    progressTimerRef.current = setInterval(() => {
      elapsed += updateInterval;
      setProgress(Math.min((elapsed / holdDuration) * 100, 100));
    }, updateInterval);

    holdTimerRef.current = setTimeout(() => {
      clearInterval(progressTimerRef.current);
      setProgress(100);
      onDelete();
      setIsHolding(false);
    }, holdDuration);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIsHolding(false);
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      disabled={isDeleting}
      className={`relative overflow-hidden w-full py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors select-none ${isHolding ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'} ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 bg-rose-200 transition-all ease-linear"
        style={{ width: `${progress}%`, transitionDuration: `${updateInterval}ms` }}
      />
      <span className="relative z-10 flex items-center gap-1.5 text-sm">
        <Trash2 className="w-4 h-4" /> 
        {isHolding ? 'Hold 5s...' : 'Delete'}
      </span>
    </button>
  );
};

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', billingCycle: 'monthly', productLimit: '', isActive: true });
  const [actionLoading, setActionLoading] = useState(null);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({ name: '', price: '', billingCycle: 'monthly', productLimit: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditId(pkg._id);
    setFormData({ 
      name: pkg.name, 
      price: pkg.price, 
      billingCycle: pkg.billingCycle, 
      productLimit: pkg.productLimit,
      isActive: pkg.isActive !== false
    });
    setIsModalOpen(true);
  };

  const fetchPackages = async (page = 1) => {
    try {
      const res = await api.get(`/packages/get-all-packages?page=${page}&limit=10`);
      if (res.data.status === 'ok') {
        setPackages(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (error) {
      toast.error('Failed to fetch packages');
    }
  };

  useEffect(() => {
    fetchPackages(currentPage);
  }, [currentPage]);

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
        res = await api.post('/packages/create-package', payload);
      }

      if (res.data.success || res.data.status === 'ok') {
        toast.success(res.data.message || (editId ? 'Package updated successfully' : 'Package created successfully'));
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ name: '', price: '', billingCycle: 'monthly', productLimit: '', isActive: true });
        fetchPackages(currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || (editId ? 'Failed to update package' : 'Failed to create package'));
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.delete(`/packages/delete-package/${id}`);
      if (res.data.success || res.data.status === 'ok') {
        toast.success('Package deleted successfully');
        fetchPackages(currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pricing Packages</h2>
          <p className="text-slate-500 mt-1">Manage subscription tiers for your clients.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div key={pkg._id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${pkg.billingCycle === 'yearly' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}></div>
            
            <div className="absolute top-5 right-5">
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
               <span className={`text-xs font-bold uppercase tracking-wider ${pkg.billingCycle === 'yearly' ? 'text-purple-600' : 'text-blue-600'}`}>
                 {pkg.billingCycle} Billing
               </span>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 pr-20">{pkg.name}</h3>
            
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">${pkg.price}</span>
              <span className="text-slate-500 font-medium">/{pkg.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
            </div>
            
            <div className="mt-8 space-y-4 flex-grow">
              <div className="flex items-center justify-between text-sm p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Product Limit</span>
                <span className="font-bold text-slate-900">{pkg.productLimit} Items</span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button onClick={() => handleEdit(pkg)} className="flex-1 py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5 text-sm">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <div className="flex-1">
                <HoldToDeleteButton 
                  onDelete={() => handleDelete(pkg._id)}
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
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-600 font-medium">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button 
            disabled={meta.page >= meta.totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{editId ? 'Edit Package' : 'Create New Package'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Package Name</label>
                <input required type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Premium Plan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                  <input required type="number" className="input-field" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="99.99" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                  <select className="input-field" value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Limit</label>
                  <input required type="number" className="input-field" value={formData.productLimit} onChange={(e) => setFormData({...formData, productLimit: e.target.value})} placeholder="1000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.isActive} 
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">Active Package</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editId ? 'Update Package' : 'Create Package'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
