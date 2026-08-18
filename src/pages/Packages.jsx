import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', billingCycle: 'monthly', productLimit: '', isActive: true });

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg._id} className="glass p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4">
              {pkg.isActive ? <CheckCircle className="text-green-500 w-6 h-6" /> : <XCircle className="text-rose-500 w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{pkg.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-blue-600">${pkg.price}</span>
              <span className="text-slate-500 font-medium">/{pkg.billingCycle}</span>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Product Limit</span>
                <span className="font-semibold text-slate-800">{pkg.productLimit} Items</span>
              </div>
            </div>
            <button onClick={() => handleEdit(pkg)} className="w-full mt-6 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Package
            </button>
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
