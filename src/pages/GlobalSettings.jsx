import { useState, useEffect } from 'react';
import { Settings, Save, Globe, Mail, Shield, Server, RefreshCw, Activity, Lock, AlertTriangle, Wallet, Plus, Trash, Check, X, ArrowUp, ArrowDown, ChevronUp, ChevronDown, ExternalLink, Eye, Palette, Sparkles, Link as LinkIcon, Zap, Store } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { MFSLogo } from '../components/MFSLogo';

export default function GlobalSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [seedingThemeId, setSeedingThemeId] = useState(null);
  const [isSeedingAll, setIsSeedingAll] = useState(false);
  const [deletingThemeId, setDeletingThemeId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [formData, setFormData] = useState({
    platformName: 'MASH ECO',
    supportEmail: 'support@masheco.com',
    currency: 'BDT',
    timezone: 'UTC+06:00',
    maintenanceMode: false,
    maxTenants: 100,
    allowRegistration: true
  });

  const [themePreviews, setThemePreviews] = useState({
    'design-01': '',
    'design-02': '',
    'design-03': '',
    'design-04': '',
    'design-05': '',
  });

  const [platformTracking, setPlatformTracking] = useState({
    googleAnalytics: { enabled: false, measurementId: '' },
    metaPixel: { enabled: false, pixelId: '' },
    googleTagManager: { enabled: false, containerId: '' },
  });

  const [platformAccounts, setPlatformAccounts] = useState([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    provider: 'bKash',
    type: 'Merchant',
    accountNumber: '',
    accountName: 'MASH ECO Platform',
    bankName: '',
    branchName: '',
    instructions: 'Send money/payment to this number and provide TrxID.',
    isActive: true,
  });

  const fetchGlobalSettings = async () => {
    try {
      setIsLoadingGlobal(true);
      const res = await api.get('/system/global-settings');
      if (res.data?.data) {
        const data = res.data.data;
        setFormData({
          platformName: data.platformName || 'MASH ECO',
          supportEmail: data.supportEmail || 'support@masheco.com',
          currency: data.currency || 'BDT',
          timezone: data.timezone || 'UTC+06:00',
          maintenanceMode: Boolean(data.maintenanceMode),
          maxTenants: data.maxTenants ?? 100,
          allowRegistration: data.allowRegistration !== false,
        });
        if (data.themePreviews) {
          setThemePreviews({
            'design-01': data.themePreviews['design-01'] || '',
            'design-02': data.themePreviews['design-02'] || '',
            'design-03': data.themePreviews['design-03'] || '',
            'design-04': data.themePreviews['design-04'] || '',
            'design-05': data.themePreviews['design-05'] || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load global settings', err);
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  const fetchPlatformTracking = async () => {
    try {
      setIsLoadingTracking(true);
      const res = await api.get('/tracking/platform');
      if (res.data?.data) {
        setPlatformTracking({
          googleAnalytics: {
            enabled: Boolean(res.data.data.googleAnalytics?.enabled),
            measurementId: res.data.data.googleAnalytics?.measurementId || '',
          },
          metaPixel: {
            enabled: Boolean(res.data.data.metaPixel?.enabled),
            pixelId: res.data.data.metaPixel?.pixelId || '',
          },
          googleTagManager: {
            enabled: Boolean(res.data.data.googleTagManager?.enabled),
            containerId: res.data.data.googleTagManager?.containerId || '',
          },
        });
      }
    } catch (err) {
      console.error('Failed to load platform tracking config', err);
    } finally {
      setIsLoadingTracking(false);
    }
  };

  const fetchPlatformPayments = async () => {
    try {
      setIsLoadingPayments(true);
      const res = await api.get('/billing/platform-payment-settings');
      if (res.data?.data?.accounts) {
        setPlatformAccounts(res.data.data.accounts);
      }
    } catch (err) {
      console.error('Failed to load platform payment accounts', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchPlatformTracking();
    } else if (activeTab === 'payments') {
      fetchPlatformPayments();
    } else if (activeTab === 'general' || activeTab === 'system' || activeTab === 'security' || activeTab === 'themes') {
      fetchGlobalSettings();
    }
  }, [activeTab]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'tracking') {
        const res = await api.put('/tracking/platform', platformTracking);
        if (res.data?.success) {
          toast.success('Platform tracking configuration updated successfully!');
        }
      } else if (activeTab === 'payments') {
        const res = await api.put('/billing/platform-payment-settings', { accounts: platformAccounts });
        if (res.data?.success) {
          toast.success('Platform payment accounts updated successfully!');
        }
      } else {
        const res = await api.put('/system/global-settings', {
          ...formData,
          themePreviews,
        });
        if (res.data?.success) {
          toast.success('Global settings & theme preview links updated successfully!');
        }
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDemoStore = async (themeId, subdomain) => {
    try {
      setSeedingThemeId(themeId);
      toast.info(`Generating ${themeId} demo store (15 categories, 450 products, banner, footer & policies)...`, { autoClose: 4000 });
      const res = await api.post('/seed/generate-demo-store', { themeId, subdomain });
      if (res.data?.success) {
        const data = res.data.data;
        setThemePreviews(prev => ({
          ...prev,
          [themeId]: data.previewUrl || prev[themeId],
        }));
        toast.success(`Demo store "${data.storeName}" (${subdomain}) seeded with ${data.categoriesCount} categories and ${data.productsCount} products!`);
        fetchGlobalSettings();
      }
    } catch (err) {
      console.error('Failed to seed demo store', err);
      toast.error(err.response?.data?.message || 'Failed to generate demo store');
    } finally {
      setSeedingThemeId(null);
    }
  };

  const handleSeedAllDemoStores = async () => {
    try {
      setIsSeedingAll(true);
      toast.info('Generating all 5 demo stores (store1-store5, 75 categories, 2,250 products, themes & banners)... This may take a few moments.', { autoClose: 8000 });
      const res = await api.post('/seed/generate-all-demo-stores');
      if (res.data?.success) {
        const data = res.data.data;
        if (data.themePreviews) {
          setThemePreviews(data.themePreviews);
        }
        toast.success('All 5 demo stores generated with complete banners, footers, 15 categories, and 30 products each!');
        fetchGlobalSettings();
      }
    } catch (err) {
      console.error('Failed to seed all demo stores', err);
      toast.error(err.response?.data?.message || 'Failed to generate all demo stores');
    } finally {
      setIsSeedingAll(false);
    }
  };

  const handleDeleteDemoStore = async (themeId, subdomain) => {
    if (!window.confirm(`Are you sure you want to completely delete the demo store for ${themeId} (${subdomain})? All associated products, categories, theme settings, and preview links will be removed.`)) {
      return;
    }
    try {
      setDeletingThemeId(themeId);
      const res = await api.delete('/seed/delete-demo-store', { data: { themeId, subdomain } });
      if (res.data?.success) {
        setThemePreviews(prev => ({
          ...prev,
          [themeId]: '',
        }));
        toast.success(`Demo store for ${themeId} (${subdomain}) deleted successfully!`);
        fetchGlobalSettings();
      }
    } catch (err) {
      console.error('Failed to delete demo store', err);
      toast.error(err.response?.data?.message || 'Failed to delete demo store');
    } finally {
      setDeletingThemeId(null);
    }
  };

  const handleDeleteAllDemoStores = async () => {
    if (!window.confirm('Are you sure you want to delete ALL 5 demo stores (store1-store5)? All categories, products, and storefront configurations will be deleted.')) {
      return;
    }
    try {
      setIsDeletingAll(true);
      const res = await api.delete('/seed/delete-all-demo-stores');
      if (res.data?.success) {
        setThemePreviews({
          'design-01': '',
          'design-02': '',
          'design-03': '',
          'design-04': '',
          'design-05': '',
        });
        toast.success('All 5 demo stores and preview links deleted successfully!');
        fetchGlobalSettings();
      }
    } catch (err) {
      console.error('Failed to delete all demo stores', err);
      toast.error(err.response?.data?.message || 'Failed to clear all demo stores');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleAddOrUpdateAccount = (e) => {
    e.preventDefault();
    if (!accountForm.accountNumber) {
      toast.error('Account Number is required');
      return;
    }
    if (editingAccount) {
      setPlatformAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? { ...accountForm, id: acc.id } : acc));
      toast.info('Account updated in list. Click Save Changes to publish.');
    } else {
      const newAcc = { ...accountForm, id: Date.now().toString() };
      setPlatformAccounts(prev => [...prev, newAcc]);
      toast.info('Account added to list. Click Save Changes to publish.');
    }
    setShowAddAccountModal(false);
    setEditingAccount(null);
  };

  const handleRemoveAccount = (id) => {
    setPlatformAccounts(prev => prev.filter(a => a.id !== id));
    toast.info('Account removed. Click Save Changes to publish.');
  };

  const toggleAccountActive = (id) => {
    setPlatformAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const handleMoveAccount = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= platformAccounts.length) return;
    const updated = [...platformAccounts];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPlatformAccounts(updated);
    toast.info(`Moved account to position #${targetIndex + 1}. Click Save Changes to publish.`);
  };

  return (
    <div className="space-y-8 w-full animate-fade-in pb-12">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Global Settings</h1>
          <p className="text-slate-500 mt-1 text-sm">Configure core platform configurations, default limits, platform tracking, and payment accounts.</p>
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
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tracking' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className={`w-5 h-5 ${activeTab === 'tracking' ? 'text-blue-600' : 'text-slate-400'}`} />
            Platform Tracking
          </button>
          <button 
            onClick={() => setActiveTab('themes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'themes' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Palette className={`w-5 h-5 ${activeTab === 'themes' ? 'text-blue-600' : 'text-slate-400'}`} />
            Theme Preview Links
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'payments' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'payments' ? 'text-blue-600' : 'text-slate-400'}`} />
            Platform Payment Accounts
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

          {activeTab === 'tracking' && (
            <div className="p-8 space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Platform-Level Marketing & Tracking</h2>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="font-semibold">STRICT PLATFORM SCOPE:</strong> Tracking IDs configured here apply <strong>ONLY</strong> to central SaaS platform public landing pages. Platform tracking credentials will <strong>NEVER</strong> appear or fire on merchant storefronts.
                </div>
              </div>

              {isLoadingTracking ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {/* GA4 */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">Platform Google Analytics 4 (GA4)</h3>
                        <p className="text-xs text-slate-500">Track central SaaS product visitors and conversion funnels</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={platformTracking.googleAnalytics.enabled} 
                          onChange={(e) => setPlatformTracking({
                            ...platformTracking,
                            googleAnalytics: { ...platformTracking.googleAnalytics, enabled: e.target.checked }
                          })} 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Platform GA4 Measurement ID (e.g. G-XXXXXXXXXX)"
                      value={platformTracking.googleAnalytics.measurementId}
                      onChange={(e) => setPlatformTracking({
                        ...platformTracking,
                        googleAnalytics: { ...platformTracking.googleAnalytics, measurementId: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Meta Pixel */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">Platform Meta (Facebook) Pixel</h3>
                        <p className="text-xs text-slate-500">Track central SaaS marketing campaigns and landing page conversions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={platformTracking.metaPixel.enabled} 
                          onChange={(e) => setPlatformTracking({
                            ...platformTracking,
                            metaPixel: { ...platformTracking.metaPixel, enabled: e.target.checked }
                          })} 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Platform Meta Pixel ID (e.g. 1234567890)"
                      value={platformTracking.metaPixel.pixelId}
                      onChange={(e) => setPlatformTracking({
                        ...platformTracking,
                        metaPixel: { ...platformTracking.metaPixel, pixelId: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* GTM */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">Platform Google Tag Manager (GTM)</h3>
                        <p className="text-xs text-slate-500">Inject central platform analytics container</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={platformTracking.googleTagManager.enabled} 
                          onChange={(e) => setPlatformTracking({
                            ...platformTracking,
                            googleTagManager: { ...platformTracking.googleTagManager, enabled: e.target.checked }
                          })} 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Platform GTM Container ID (e.g. GTM-XXXXXXX)"
                      value={platformTracking.googleTagManager.containerId}
                      onChange={(e) => setPlatformTracking({
                        ...platformTracking,
                        googleTagManager: { ...platformTracking.googleTagManager, containerId: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="p-8 space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Platform Payment Accounts & Gateway Config</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage official platform payment numbers shown to merchants in their dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setAccountForm({
                      provider: 'bKash',
                      type: 'Merchant',
                      accountNumber: '',
                      accountName: 'MASH ECO Platform',
                      bankName: '',
                      branchName: '',
                      instructions: 'Send money or payment to this account and submit your TrxID.',
                      isActive: true,
                    });
                    setShowAddAccountModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Payment Account
                </button>
              </div>

              {isLoadingPayments ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : platformAccounts.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No payment accounts configured</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Click below to add bKash, Nagad, Bank, or EPS details for merchants.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccount(null);
                      setShowAddAccountModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    + Add First Account
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platformAccounts.map((acc, index) => (
                    <div key={acc.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between space-y-4 relative group hover:border-blue-300 transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-mono font-bold tracking-wider shadow-xs">
                              #{index + 1}
                            </span>
                            <MFSLogo provider={acc.provider} className="h-6 w-auto object-contain" />
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              ({acc.type})
                            </span>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={acc.isActive}
                              onChange={() => toggleAccountActive(acc.id)}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="text-lg font-extrabold text-slate-900 tracking-wider font-sans">{acc.accountNumber}</div>
                        {acc.accountName && <div className="text-xs font-medium text-slate-600 mt-0.5">{acc.accountName}</div>}
                        {acc.bankName && <div className="text-xs text-slate-500 mt-1">{acc.bankName} {acc.branchName ? `(${acc.branchName})` : ''}</div>}
                        {acc.instructions && <div className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">{acc.instructions}</div>}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        {/* Serializing / Reordering Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveAccount(index, 'up')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move Up (Decrease Serial Position)"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === platformAccounts.length - 1}
                            onClick={() => handleMoveAccount(index, 'down')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move Down (Increase Serial Position)"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] font-bold text-slate-400 ml-1">
                            Pos #{index + 1}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccount(acc);
                              setAccountForm(acc);
                              setShowAddAccountModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAccount(acc.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="p-8 space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Theme Preview & Live Demo Stores</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Auto-generate complete demo stores (15 categories, 30 products each, banners & policies) or configure dynamic preview links for merchants.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                  <button
                    type="button"
                    disabled={isSeedingAll || Boolean(seedingThemeId) || isDeletingAll || Boolean(deletingThemeId)}
                    onClick={handleSeedAllDemoStores}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 hover:shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
                  >
                    {isSeedingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    <span>{isSeedingAll ? 'Seeding All Stores (2,250 Prods)...' : '⚡ Seed All 5 Stores'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSeedingAll || Boolean(seedingThemeId) || isDeletingAll || Boolean(deletingThemeId)}
                    onClick={handleDeleteAllDemoStores}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                    title="Delete all 5 demo stores and reset preview links"
                  >
                    {isDeletingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Trash className="w-3.5 h-3.5 text-red-500" />}
                    <span>{isDeletingAll ? 'Clearing All...' : '🗑️ Clear All'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/40 border border-blue-200/60 rounded-2xl flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-semibold text-slate-900">Admin Demo Store Control Center</p>
                  <p className="text-slate-600">
                    Click <strong className="text-slate-800 font-semibold">"⚡ Seed Store"</strong> to automatically provision a demo tenant (<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-600 font-bold">store1</code>–<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-600 font-bold">store5</code>), <strong>15 categories</strong>, <strong>30 products each (450 total)</strong>, hero slides, and footer policies. You can test or delete stores anytime.
                  </p>
                </div>
              </div>

              {isLoadingGlobal ? (
                <div className="py-16 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {[
                    {
                      id: 'design-01',
                      subdomain: 'store1',
                      name: 'Design 01 (Classic)',
                      badge: 'Classic Multi-Category',
                      color: '#5022C3',
                      desc: 'Clean high-converting electronics store layout with hero carousel & featured collections.',
                      placeholder: 'http://store1.localhost:3000 or https://store1.masheco.com'
                    },
                    {
                      id: 'design-02',
                      subdomain: 'store2',
                      name: 'Design 02 (Minimal)',
                      badge: 'Clean & Minimalist',
                      color: '#3b82f6',
                      desc: 'Modern minimalist layout with cool blue accents and streamlined navigation.',
                      placeholder: 'http://store2.localhost:3000 or https://store2.masheco.com'
                    },
                    {
                      id: 'design-03',
                      subdomain: 'store3',
                      name: 'Design 03 (Brutalist)',
                      badge: 'Dark Tech / Cyber',
                      color: '#06b6d4',
                      desc: 'High-contrast dark-mode theme engineered for modern tech & gadget brands.',
                      placeholder: 'http://store3.localhost:3000 or https://store3.masheco.com'
                    },
                    {
                      id: 'design-04',
                      subdomain: 'store4',
                      name: 'Design 04 (Clean)',
                      badge: 'Modern Grid & Spec Focus',
                      color: '#111827',
                      desc: 'Crisp layout with enhanced product specifications and modern cards.',
                      placeholder: 'http://store4.localhost:3000 or https://store4.masheco.com'
                    },
                    {
                      id: 'design-05',
                      subdomain: 'store5',
                      name: 'Design 05 (Premium)',
                      badge: 'Luxury Boutique Electronics',
                      color: '#000000',
                      desc: 'Exclusive premium storefront aesthetics for flagship electronics and luxury gadgets.',
                      placeholder: 'http://store5.localhost:3000 or https://store5.masheco.com'
                    },
                  ].map((themeItem) => (
                    <div 
                      key={themeItem.id} 
                      className="p-5 border border-slate-200/90 rounded-2xl bg-white hover:border-blue-300 shadow-sm transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 xl:w-4/12">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs flex-shrink-0" 
                            style={{ backgroundColor: themeItem.color }}
                          />
                          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{themeItem.name}</h3>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {themeItem.id}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {themeItem.subdomain}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{themeItem.desc}</p>
                      </div>

                      <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
                        <div className="relative w-full">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <input 
                            type="url"
                            value={themePreviews[themeItem.id] || ''}
                            onChange={(e) => setThemePreviews({
                              ...themePreviews,
                              [themeItem.id]: e.target.value
                            })}
                            placeholder={themeItem.placeholder}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-800"
                          />
                        </div>

                        {/* Seed Button for this theme */}
                        <button
                          type="button"
                          disabled={Boolean(seedingThemeId) || isSeedingAll || Boolean(deletingThemeId) || isDeletingAll}
                          onClick={() => handleSeedDemoStore(themeItem.id, themeItem.subdomain)}
                          className="flex-shrink-0 bg-slate-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                          title={`Auto-generate ${themeItem.name} with 15 categories, 450 products, banner & footer`}
                        >
                          {seedingThemeId === themeItem.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>
                            {seedingThemeId === themeItem.id ? 'Seeding...' : '⚡ Seed Store'}
                          </span>
                        </button>

                        {/* Test Link Button */}
                        {themePreviews[themeItem.id] ? (
                          <a
                            href={themePreviews[themeItem.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
                            title="Open demo store in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Test Link</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex-shrink-0 bg-slate-100 text-slate-400 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-not-allowed opacity-60 whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>No Link</span>
                          </button>
                        )}

                        {/* Delete Single Demo Store Button */}
                        <button
                          type="button"
                          disabled={Boolean(seedingThemeId) || isSeedingAll || Boolean(deletingThemeId) || isDeletingAll}
                          onClick={() => handleDeleteDemoStore(themeItem.id, themeItem.subdomain)}
                          className="flex-shrink-0 p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all disabled:opacity-40"
                          title={`Delete demo store ${themeItem.subdomain} and clear preview link`}
                        >
                          {deletingThemeId === themeItem.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Payment Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                {editingAccount ? 'Edit Platform Account' : 'Add Platform Account'}
              </h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Provider</label>
                  <select
                    value={accountForm.provider}
                    onChange={(e) => setAccountForm({ ...accountForm, provider: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Upay">Upay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EPS (Easy Payment System)">EPS (Easy Payment System)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Merchant">Merchant</option>
                    <option value="Personal">Personal</option>
                    <option value="Agent">Agent</option>
                    <option value="Bank Account">Bank Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Account Number / IBAN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01700000000 or Account No"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Account Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g. MASH ECO Platform Ltd"
                  value={accountForm.accountName || ''}
                  onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(accountForm.provider === 'Bank Transfer' || accountForm.provider === 'EPS (Easy Payment System)') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. BRAC Bank PLC"
                      value={accountForm.bankName || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulshan Branch"
                      value={accountForm.branchName || ''}
                      onChange={(e) => setAccountForm({ ...accountForm, branchName: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Merchant Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Send Money/Payment to this number and submit TrxID"
                  value={accountForm.instructions || ''}
                  onChange={(e) => setAccountForm({ ...accountForm, instructions: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={accountForm.isActive}
                    onChange={(e) => setAccountForm({ ...accountForm, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  Active & Visible to Merchants
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAccountModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    {editingAccount ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
