import { useState } from 'react';
import { Settings, Save, Globe, Mail, Shield, Server, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function GlobalSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    platformName: 'MashEasy',
    supportEmail: 'support@masheasy.com',
    currency: 'USD',
    timezone: 'UTC+06:00',
    maintenanceMode: false,
    maxTenants: 100,
    allowRegistration: true
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Global settings updated successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-8 w-full animate-fade-in pb-12">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Global Settings</h1>
          <p className="text-slate-500 mt-1 text-sm">Configure core platform configurations and defaults.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className={`w-5 h-5 ${activeTab === 'general' ? 'text-blue-600' : 'text-slate-400'}`} />
            General Settings
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'system' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Server className={`w-5 h-5 ${activeTab === 'system' ? 'text-blue-600' : 'text-slate-400'}`} />
            System & Limits
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-blue-600' : 'text-slate-400'}`} />
            Security Rules
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === 'general' && (
            <div className="p-8 space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">General Platform Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Platform Name</label>
                  <input 
                    type="text" 
                    value={formData.platformName}
                    onChange={(e) => setFormData({...formData, platformName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Support Email</label>
                  <input 
                    type="email" 
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({...formData, supportEmail: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Default Currency</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Default Timezone</label>
                  <select 
                    value={formData.timezone}
                    onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="UTC+06:00">UTC+06:00 Dhaka</option>
                    <option value="UTC+00:00">UTC+00:00 London</option>
                    <option value="UTC-05:00">UTC-05:00 New York</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="p-8 space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">System Operations</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <h3 className="font-semibold text-slate-800">Maintenance Mode</h3>
                    <p className="text-sm text-slate-500">Disable access for all tenants while performing updates.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.maintenanceMode} onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="space-y-2 max-w-md">
                  <label className="text-sm font-medium text-slate-700">Maximum Allowed Tenants</label>
                  <input 
                    type="number" 
                    value={formData.maxTenants}
                    onChange={(e) => setFormData({...formData, maxTenants: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <p className="text-xs text-slate-500">Hard limit on how many separate tenants can exist on this installation.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-8 space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Security Rules</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <h3 className="font-semibold text-slate-800">Allow New Tenant Registrations</h3>
                    <p className="text-sm text-slate-500">Enable or disable open signups for new merchants.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.allowRegistration} onChange={(e) => setFormData({...formData, allowRegistration: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
