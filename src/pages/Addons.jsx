import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Plus, Edit2, CheckCircle, XCircle, Trash2, ShieldCheck, Zap, Mail, BarChart } from 'lucide-react';
import { useGetAllAddonsQuery, useGetPredefinedAddonsQuery } from '../store/apiSlice';

const DeleteButton = ({ onClick, isDeleting }) => {
  return (
    <button
      onClick={onClick}
      disabled={isDeleting}
      className={`w-full py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors select-none bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Trash2 className="w-4 h-4" /> 
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
};

export default function Addons() {
  const { data: addonsRes, refetch: refetchAddons } = useGetAllAddonsQuery();
  const { data: predefinedRes } = useGetPredefinedAddonsQuery();

  const addons = addonsRes?.data || [];
  const predefinedAddons = predefinedRes?.data || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', price: '', billingCycle: 'monthly', defaultLimit: '', isActive: true });
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({ name: '', slug: '', description: '', price: '', billingCycle: 'monthly', defaultLimit: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (addon) => {
    setEditId(addon._id);
    setFormData({ 
      name: addon.name, 
      slug: addon.slug, 
      description: addon.description, 
      price: addon.price, 
      billingCycle: addon.billingCycle, 
      defaultLimit: addon.defaultLimit,
      isActive: addon.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const fetchAddons = () => { refetchAddons(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        defaultLimit: Number(formData.defaultLimit),
      };

      let res;
      if (editId) {
        res = await api.put(`/addons/${editId}`, payload);
      } else {
        res = await api.post('/addons', payload);
      }

      if (res.data.success || res.data.status === 'ok') {
        toast.success(res.data.message || (editId ? 'Add-on updated successfully' : 'Add-on created successfully'));
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ name: '', slug: '', description: '', price: '', billingCycle: 'monthly', defaultLimit: '', isActive: true });
        fetchAddons();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || (editId ? 'Failed to update add-on' : 'Failed to create add-on'));
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.delete(`/addons/${id}`);
      if (res.data.success || res.data.status === 'ok') {
        toast.success('Add-on deleted successfully');
        fetchAddons();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete add-on');
    } finally {
      setActionLoading(null);
    }
  };

  const generateDefaultAddons = async () => {
    const defaultAddons = [
      { name: 'Fraud Check (Basic)', slug: 'fraud_check', description: 'Advanced ML-based fraud detection for your orders.', price: 100, billingCycle: 'monthly', defaultLimit: 2, isActive: true },
      { name: 'Fraud Check (Pro)', slug: 'fraud_check_pro', description: 'Unlimited fraud detection for high volume stores.', price: 200, billingCycle: 'monthly', defaultLimit: 150, isActive: true },
      { name: 'Abandoned Checkout', slug: 'abandoned_checkout', description: 'Capture and recover abandoned checkout leads to increase sales.', price: 9.99, billingCycle: 'monthly', defaultLimit: 4, isActive: true },
      { name: 'Courier Automation', slug: 'courier_automation', description: 'Automate your shipping and fulfillment processes seamlessly.', price: 99, billingCycle: 'monthly', defaultLimit: 100, isActive: true },
    ];

    try {
      toast.info('Generating default add-ons...');
      for (const addon of defaultAddons) {
        await api.post('/addons', addon);
      }
      toast.success('Default add-ons generated successfully');
      fetchAddons();
    } catch (error) {
      toast.error('Failed to generate some add-ons');
    }
  };

  const getAddonIcon = (slug) => {
    if (slug.includes('fraud')) return <ShieldCheck className="w-8 h-8 text-blue-500" />;
    if (slug.includes('sms') || slug.includes('mail')) return <Mail className="w-8 h-8 text-emerald-500" />;
    if (slug.includes('analytic')) return <BarChart className="w-8 h-8 text-indigo-500" />;
    return <Zap className="w-8 h-8 text-amber-500" />;
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (!editId) {
      const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
      setFormData({ ...formData, name: newName, slug: newSlug });
    } else {
      setFormData({ ...formData, name: newName });
    }
  };

  const handlePredefinedSelect = (e) => {
    const slug = e.target.value;
    if (!slug) return;
    
    const selected = predefinedAddons.find(a => a.slug === slug);
    if (selected) {
      setFormData({
        ...formData,
        name: selected.name,
        slug: selected.slug,
        description: selected.description,
        price: selected.price,
        billingCycle: selected.billingCycle,
        defaultLimit: selected.defaultLimit,
        isActive: selected.isActive !== false
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Add-on Packages</h2>
          <p className="text-slate-500 mt-1">Manage extra features and services available to merchants.</p>
        </div>
        <div className="flex items-center gap-3">
          {addons.length === 0 && (
            <button onClick={generateDefaultAddons} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200">
              Generate Default Add-ons
            </button>
          )}
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Add-on
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {addons.map((addon) => (
          <div key={addon._id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${addon.billingCycle === 'monthly' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : addon.billingCycle === 'yearly' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>
            
            <div className="absolute top-5 right-5">
              {addon.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  <XCircle className="w-3.5 h-3.5" /> Inactive
                </span>
              )}
            </div>

            <div className="mb-4 mt-2">
              <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {getAddonIcon(addon.slug)}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800">{addon.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{addon.description}</p>
            
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900">৳ {addon.price}</span>
              <span className="text-slate-500 font-medium">/{addon.billingCycle === 'yearly' ? 'yr' : addon.billingCycle === 'one_time' ? 'one time' : 'mo'}</span>
            </div>
            
            <div className="mt-6 space-y-4 flex-grow">
              <div className="flex items-center justify-between text-sm p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Included Limit</span>
                <span className="font-bold text-slate-900">{addon.defaultLimit}</span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button onClick={() => handleEdit(addon)} className="flex-1 py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5 text-sm">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <div className="flex-1">
                <DeleteButton 
                  onClick={() => setDeleteConfirmId(addon._id)}
                  isDeleting={actionLoading === addon._id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{editId ? 'Edit Add-on' : 'Create New Add-on'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editId && predefinedAddons.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Predefined Templates</label>
                  <select 
                    className="input-field bg-purple-50/50 border-purple-200 text-purple-900" 
                    onChange={handlePredefinedSelect}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a template to auto-fill...</option>
                    {predefinedAddons.map(pa => (
                      <option key={pa.slug} value={pa.slug}>{pa.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Add-on Name</label>
                <input required type="text" className="input-field" value={formData.name} onChange={handleNameChange} placeholder="e.g. Fraud Check" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unique Slug</label>
                <input required type="text" className="input-field" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="e.g. fraud_check" disabled={!!editId} />
                <p className="text-xs text-slate-500 mt-1">Used internally to identify this add-on in code.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required className="input-field" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. Prevent fraudulent orders..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (৳)</label>
                  <input required type="number" className="input-field" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                  <select className="input-field" value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One-Time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Limit</label>
                  <input required type="number" className="input-field" value={formData.defaultLimit} onChange={(e) => setFormData({...formData, defaultLimit: e.target.value})} placeholder="1000" />
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
                      <span className="ml-3 text-sm font-medium text-slate-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editId ? 'Update Add-on' : 'Create Add-on'}</button>
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Add-on</h3>
            <p className="text-slate-500 mb-6 text-sm">Are you sure you want to delete this add-on package? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">
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
