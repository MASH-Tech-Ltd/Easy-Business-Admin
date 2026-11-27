import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  HardDrive, Activity, ShieldAlert, Package, Plus, Edit2, Trash2, Save, RefreshCw,
  Check, X, DollarSign, Clock, Bell, Database, Power
} from 'lucide-react';
import api from '../utils/api';

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

const formatBytes = (bytes) => {
  const b = Number(bytes || 0);
  if (b === 0) return '0 B';
  if (b >= GB) return `${(b / GB).toFixed(2)} GB`;
  if (b >= MB) return `${(b / MB).toFixed(2)} MB`;
  if (b >= KB) return `${(b / KB).toFixed(2)} KB`;
  return `${b} B`;
};

const bytesToDisplay = (bytes) => {
  const b = Number(bytes || 0);
  if (!b) return { qty: 0, unit: 'GB' };
  if (b % GB === 0) return { qty: b / GB, unit: 'GB' };
  return { qty: Math.round((b / MB) * 100) / 100, unit: 'MB' };
};

const displayToBytes = (qty, unit) => {
  const n = Number(qty || 0);
  if (n <= 0) return 0;
  return Math.round(n * (unit === 'GB' ? GB : MB));
};

const CATEGORY_LABELS = {
  storage: 'Image Storage',
  image_bandwidth: 'Image Bandwidth',
  general_bandwidth: 'General Traffic',
};

const POLICY_OPTIONS = [
  { value: 'warn_only', label: 'Warning only (no blocking)' },
  { value: 'block_uploads', label: 'Block new uploads when full' },
  { value: 'block_uploads_keep_existing', label: 'Keep existing images, block new uploads' },
  { value: 'show_prompt', label: 'Show upgrade / add-on prompt' },
  { value: 'apply_restrictions', label: 'Apply configured restrictions' },
];

const emptyAddonForm = {
  name: '',
  description: '',
  category: 'storage',
  quantity: 1,
  unit: 'GB',
  price: 50,
  promoPrice: '',
  durationType: 'billing_period',
  durationDays: 30,
  billingType: 'one_time',
  isCustomQuantity: false,
  minQuantity: 1,
  maxQuantity: 5,
  isActive: true,
  availablePackageIds: [],
  autoRenew: false,
  displayOrder: 0,
};

function ByteInput({ label, valueBytes, onChangeBytes, hint }) {
  const init = bytesToDisplay(valueBytes);
  const [qty, setQty] = useState(init.qty);
  const [unit, setUnit] = useState(init.unit);

  useEffect(() => {
    const next = bytesToDisplay(valueBytes);
    setQty(next.qty);
    setUnit(next.unit);
  }, [valueBytes]);

  const commit = (nextQty, nextUnit) => {
    onChangeBytes(displayToBytes(nextQty, nextUnit));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="any"
          value={qty}
          onChange={(e) => {
            const v = e.target.value;
            setQty(v);
            commit(v, unit);
          }}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <select
          value={unit}
          onChange={(e) => {
            const u = e.target.value;
            setUnit(u);
            commit(qty, u);
          }}
          className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
        >
          <option value="MB">MB</option>
          <option value="GB">GB</option>
        </select>
      </div>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default function ResourceSettingsTab() {
  const [subTab, setSubTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState(null);
  const [packages, setPackages] = useState([]);
  const [addons, setAddons] = useState([]);
  const [ingestStatus, setIngestStatus] = useState(null);

  // Package edit state
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgDraft, setPkgDraft] = useState({});

  // Addon modal/form state
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonForm, setAddonForm] = useState(emptyAddonForm);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, aRes, iRes] = await Promise.all([
        api.get('/resources/admin/settings'),
        api.get('/resources/admin/packages'),
        api.get('/resources/admin/addons'),
        api.get('/resources/admin/ingest-status').catch(() => null),
      ]);
      setSettings(sRes.data?.data || null);
      setPackages(pRes.data?.data || []);
      setAddons(aRes.data?.data || []);
      setIngestStatus(iRes?.data?.data || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load resource configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.put('/resources/admin/settings', settings);
      setSettings(res.data?.data || settings);
      toast.success('Resource & Bandwidth settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const startEditPkg = (pkg) => {
    setEditingPkgId(pkg._id);
    setPkgDraft({
      storageBytes: pkg.resources?.storageBytes ?? null,
      imageBandwidthBytes: pkg.resources?.imageBandwidthBytes ?? null,
      generalBandwidthBytes: pkg.resources?.generalBandwidthBytes ?? null,
      combinedBandwidthBytes: pkg.resources?.combinedBandwidthBytes ?? null,
      trackingEnabled: pkg.resources?.trackingEnabled !== false,
      overLimitPolicy: pkg.resources?.overLimitPolicy || '',
    });
  };

  const savePackage = async (pkgId) => {
    try {
      const payload = {
        ...pkgDraft,
        overLimitPolicy: pkgDraft.overLimitPolicy || null,
      };
      await api.put(`/resources/admin/packages/${pkgId}`, payload);
      toast.success('Package resource limits updated');
      setEditingPkgId(null);
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update package');
    }
  };

  const openCreateAddon = () => {
    setEditingAddonId(null);
    setAddonForm(emptyAddonForm);
    setAddonModalOpen(true);
  };

  const openEditAddon = (a) => {
    setEditingAddonId(a._id);
    setAddonForm({
      name: a.name,
      description: a.description || '',
      category: a.category,
      quantity: a.displayQuantity,
      unit: a.displayUnit || 'GB',
      price: a.price,
      promoPrice: a.promoPrice ?? '',
      durationType: a.durationType,
      durationDays: a.durationDays || 30,
      billingType: a.billingType || 'one_time',
      isCustomQuantity: !!a.isCustomQuantity,
      minQuantity: a.minQuantity || 1,
      maxQuantity: a.maxQuantity || 1,
      isActive: a.isActive,
      availablePackageIds: (a.availablePackageIds || []).map(String),
      autoRenew: !!a.autoRenew,
      displayOrder: a.displayOrder || 0,
    });
    setAddonModalOpen(true);
  };

  const submitAddon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...addonForm,
        quantity: Number(addonForm.quantity),
        price: Number(addonForm.price),
        promoPrice: addonForm.promoPrice === '' || addonForm.promoPrice === null ? null : Number(addonForm.promoPrice),
        durationDays: Number(addonForm.durationDays) || 30,
        minQuantity: Number(addonForm.minQuantity) || 1,
        maxQuantity: Number(addonForm.maxQuantity) || 1,
        displayOrder: Number(addonForm.displayOrder) || 0,
      };
      if (editingAddonId) {
        await api.put(`/resources/admin/addons/${editingAddonId}`, payload);
        toast.success('Add-on updated');
      } else {
        await api.post('/resources/admin/addons', payload);
        toast.success('Add-on created and published to Merchant Dashboard');
      }
      setAddonModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save add-on');
    }
  };

  const toggleAddonActive = async (a) => {
    try {
      await api.patch(`/resources/admin/addons/${a._id}/active`, { isActive: !a.isActive });
      toast.success(a.isActive ? 'Add-on deactivated' : 'Add-on activated');
      loadAll();
    } catch (err) {
      toast.error('Failed to update add-on status');
    }
  };

  const deleteAddon = async (id) => {
    if (!window.confirm('Delete this add-on? (If already purchased, it will be deactivated instead to preserve history.)')) return;
    try {
      const res = await api.delete(`/resources/admin/addons/${id}`);
      const d = res.data?.data;
      toast.info(d?.deactivated ? 'Add-on deactivated (existing purchases preserved)' : 'Add-on deleted');
      loadAll();
    } catch (err) {
      toast.error('Failed to remove add-on');
    }
  };

  const createSuggestedAddons = async () => {
    if (!window.confirm('Replace/create 3 customizable add-ons (1 for Image Storage, 1 for Image Bandwidth, 1 for General Traffic)?')) return;
    const samples = [
      { name: 'Custom Image Storage', description: 'Choose how much extra Cloudflare R2 image storage you need (min 512 MB).', category: 'storage', quantity: 512, unit: 'MB', price: 25, durationType: 'subscription_bound', isCustomQuantity: true, minQuantity: 1, maxQuantity: 40, displayOrder: 1 },
      { name: 'Custom Image Bandwidth', description: 'Choose how much extra image CDN delivery bandwidth you need (min 512 MB).', category: 'image_bandwidth', quantity: 512, unit: 'MB', price: 30, durationType: 'billing_period', isCustomQuantity: true, minQuantity: 1, maxQuantity: 40, displayOrder: 2 },
      { name: 'Custom General Traffic', description: 'Choose how much extra general storefront & API traffic you need (min 512 MB).', category: 'general_bandwidth', quantity: 512, unit: 'MB', price: 25, durationType: 'billing_period', isCustomQuantity: true, minQuantity: 1, maxQuantity: 40, displayOrder: 3 },
    ];
    try {
      const existingNames = new Set(addons.map((a) => a.name.toLowerCase()));
      let created = 0;
      for (const s of samples) {
        if (existingNames.has(s.name.toLowerCase())) continue;
        await api.post('/resources/admin/addons', { ...s, billingType: 'one_time', isActive: true, availablePackageIds: [], autoRenew: false });
        created++;
      }
      toast.success(created > 0 ? `Created ${created} customizable add-on(s)` : 'The 3 customizable add-ons already exist');
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create customizable add-ons');
    }
  };

  const clearAllAddons = async () => {
    if (!addons.length) return;
    if (!window.confirm(`Remove all ${addons.length} add-on(s)? (Any already-purchased add-ons will be deactivated to preserve history.)`)) return;
    try {
      for (const a of addons) {
        await api.delete(`/resources/admin/addons/${a._id}`);
      }
      toast.success('Cleared add-ons list');
      loadAll();
    } catch {
      toast.error('Failed to clear some add-ons');
    }
  };

  const runIngestNow = async () => {
    try {
      const res = await api.post('/resources/admin/ingest/run');
      const d = res.data?.data;
      toast.info(d?.ran ? `Ingested ${d.windows} Cloudflare window(s)` : `Skipped: ${d?.reason}`);
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Ingest failed');
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading Resource & Bandwidth Management...</span>
      </div>
    );
  }

  const updateThreshold = (idx, patch) => {
    const next = settings.warning.thresholds.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    setSettings({ ...settings, warning: { ...settings.warning, thresholds: next } });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            Resource & Bandwidth Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure storage &amp; bandwidth tracking, global defaults, warning thresholds, over-limit policies, package allocations, and dynamic add-ons.
          </p>
        </div>
        {subTab !== 'packages' && subTab !== 'addons' && (
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Resource Settings'}
          </button>
        )}
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {[
          { id: 'config', label: 'Global Config & Units', icon: Activity },
          { id: 'warnings', label: 'Warnings & Over-Limit', icon: ShieldAlert },
          { id: 'packages', label: 'Package Allocations', icon: Package },
          { id: 'addons', label: `Add-on Configuration (${addons.length})`, icon: DollarSign },
          { id: 'billing', label: 'Billing, Sync & Retention', icon: Database },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                active ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Global Resource Config & Defaults */}
      {subTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'storage', title: 'Image Storage Tracking', desc: 'Track R2 / media storage bytes per merchant' },
              { key: 'imageBandwidth', title: 'Image Bandwidth Tracking', desc: 'Track Cloudflare image delivery (HIT & MISS)' },
              { key: 'generalTraffic', title: 'General Traffic Tracking', desc: 'Track HTML, CSS, JS, JSON API & static bytes' },
              { key: 'combinedBandwidth', title: 'Combined Bandwidth Tracking', desc: 'Aggregate Image + General traffic against combined limits' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!settings.tracking[item.key]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tracking: { ...settings.tracking, [item.key]: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded accent-blue-600"
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Display Unit</label>
              <select
                value={settings.units.displayUnit}
                onChange={(e) => setSettings({ ...settings, units: { ...settings.units, displayUnit: e.target.value } })}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="auto">Auto (MB / GB, binary 1024)</option>
                <option value="MB">Always MB</option>
                <option value="GB">Always GB</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Enforcement Mode</label>
              <select
                value={settings.enforcementMode}
                onChange={(e) => setSettings({ ...settings, enforcementMode: e.target.value })}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="enforce">Enforce configured policies</option>
                <option value="monitor">Monitor &amp; notify only (no blocking)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Aggregation Interval (min)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.aggregationIntervalMin}
                onChange={(e) => setSettings({ ...settings, aggregationIntervalMin: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Global Fallback Defaults</h3>
            <p className="text-xs text-slate-500 mb-4">
              Used when a merchant&apos;s package does not define a specific resource limit. Set 0 for unlimited.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ByteInput
                label="Default Image Storage"
                valueBytes={settings.defaults.storageBytes}
                onChangeBytes={(v) => setSettings({ ...settings, defaults: { ...settings.defaults, storageBytes: v } })}
                hint="0 = unlimited"
              />
              <ByteInput
                label="Default Image Bandwidth / mo"
                valueBytes={settings.defaults.imageBandwidthBytes}
                onChangeBytes={(v) => setSettings({ ...settings, defaults: { ...settings.defaults, imageBandwidthBytes: v } })}
                hint="0 = unlimited"
              />
              <ByteInput
                label="Default General Traffic / mo"
                valueBytes={settings.defaults.generalBandwidthBytes}
                onChangeBytes={(v) => setSettings({ ...settings, defaults: { ...settings.defaults, generalBandwidthBytes: v } })}
                hint="0 = unlimited"
              />
              <ByteInput
                label="Default Combined Limit / mo"
                valueBytes={settings.defaults.combinedBandwidthBytes}
                onChangeBytes={(v) => setSettings({ ...settings, defaults: { ...settings.defaults, combinedBandwidthBytes: v } })}
                hint="0 = sum of image + general"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Warnings & Over-limit */}
      {subTab === 'warnings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-800">Threshold Warning Notifications</div>
              <div className="text-xs text-slate-500">Sent at most once per threshold per billing period.</div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.warning.enabled}
              onChange={(e) => setSettings({ ...settings, warning: { ...settings.warning, enabled: e.target.checked } })}
              className="w-5 h-5 accent-blue-600"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800">Editable Warning Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.warning.thresholds.map((th, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <input
                    type="checkbox"
                    checked={th.enabled}
                    onChange={(e) => updateThreshold(idx, { enabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={th.percent}
                    onChange={(e) => updateThreshold(idx, { percent: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                  />
                  <span className="text-xs font-semibold text-slate-500">%</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium capitalize">
                    {th.level.replace('_', ' ')}
                  </span>
                  <input
                    type="text"
                    value={th.label || ''}
                    onChange={(e) => updateThreshold(idx, { label: e.target.value })}
                    placeholder="Label"
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800">Storage Over-Limit Policy</label>
              <select
                value={settings.overLimit.storagePolicy}
                onChange={(e) => setSettings({ ...settings, overLimit: { ...settings.overLimit, storagePolicy: e.target.value } })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                {POLICY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800">Bandwidth Over-Limit Policy</label>
              <select
                value={settings.overLimit.bandwidthPolicy}
                onChange={(e) => setSettings({ ...settings, overLimit: { ...settings.overLimit, bandwidthPolicy: e.target.value } })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                {POLICY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">Warning-first is recommended; storefronts are never auto-shut down.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Subscription Package Allocations */}
      {subTab === 'packages' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Configure resource limits directly on existing Subscription Packages. Leave a field at <strong>0</strong> for unlimited, or clear/inherit global defaults.
          </p>
          <div className="space-y-3">
            {packages.map((pkg) => {
              const isEdit = editingPkgId === pkg._id;
              return (
                <div key={pkg._id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800">{pkg.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                        {pkg.billingCycle} • ৳{pkg.price}
                      </span>
                    </div>
                    {!isEdit ? (
                      <button
                        type="button"
                        onClick={() => startEditPkg(pkg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Limits
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => savePackage(pkg._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPkgId(null)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEdit ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50">
                        <div className="text-slate-400">Image Storage</div>
                        <div className="font-bold text-slate-800">
                          {pkg.resources?.storageBytes == null ? 'Global Default' : pkg.resources.storageBytes === 0 ? 'Unlimited' : formatBytes(pkg.resources.storageBytes)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50">
                        <div className="text-slate-400">Image Bandwidth</div>
                        <div className="font-bold text-slate-800">
                          {pkg.resources?.imageBandwidthBytes == null ? 'Global Default' : pkg.resources.imageBandwidthBytes === 0 ? 'Unlimited' : formatBytes(pkg.resources.imageBandwidthBytes)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50">
                        <div className="text-slate-400">General Traffic</div>
                        <div className="font-bold text-slate-800">
                          {pkg.resources?.generalBandwidthBytes == null ? 'Global Default' : pkg.resources.generalBandwidthBytes === 0 ? 'Unlimited' : formatBytes(pkg.resources.generalBandwidthBytes)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50">
                        <div className="text-slate-400">Combined Limit</div>
                        <div className="font-bold text-slate-800">
                          {pkg.resources?.combinedBandwidthBytes == null ? 'Global Default' : pkg.resources.combinedBandwidthBytes === 0 ? 'Auto / Unlimited' : formatBytes(pkg.resources.combinedBandwidthBytes)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                      <ByteInput
                        label="Image Storage"
                        valueBytes={pkgDraft.storageBytes ?? 0}
                        onChangeBytes={(v) => setPkgDraft({ ...pkgDraft, storageBytes: v })}
                        hint="0 = unlimited"
                      />
                      <ByteInput
                        label="Image Bandwidth / mo"
                        valueBytes={pkgDraft.imageBandwidthBytes ?? 0}
                        onChangeBytes={(v) => setPkgDraft({ ...pkgDraft, imageBandwidthBytes: v })}
                      />
                      <ByteInput
                        label="General Traffic / mo"
                        valueBytes={pkgDraft.generalBandwidthBytes ?? 0}
                        onChangeBytes={(v) => setPkgDraft({ ...pkgDraft, generalBandwidthBytes: v })}
                      />
                      <ByteInput
                        label="Combined Limit / mo"
                        valueBytes={pkgDraft.combinedBandwidthBytes ?? 0}
                        onChangeBytes={(v) => setPkgDraft({ ...pkgDraft, combinedBandwidthBytes: v })}
                      />
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Over-limit Override</label>
                        <select
                          value={pkgDraft.overLimitPolicy || ''}
                          onChange={(e) => setPkgDraft({ ...pkgDraft, overLimitPolicy: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="">Use Global Policy</option>
                          {POLICY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5">
                        <input
                          type="checkbox"
                          checked={pkgDraft.trackingEnabled}
                          onChange={(e) => setPkgDraft({ ...pkgDraft, trackingEnabled: e.target.checked })}
                          className="w-4 h-4 accent-blue-600"
                        />
                        Tracking Enabled for Package
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Dynamic Add-on Configuration */}
      {subTab === 'addons' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Create and price resource add-ons dynamically. Active add-ons immediately appear in the Merchant Dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              {addons.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllAddons}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
              <button
                type="button"
                onClick={createSuggestedAddons}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create 3 Custom Add-ons
              </button>
              <button
                type="button"
                onClick={openCreateAddon}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Resource Add-on
              </button>
            </div>
          </div>

          {addons.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              No resource add-ons created yet. Click &ldquo;Create Resource Add-on&rdquo; to publish your first storage or bandwidth pack.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addons.map((a) => (
                <div key={a._id} className={`p-4 rounded-xl border ${a.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-75'} space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{a.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                          {CATEGORY_LABELS[a.category] || a.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900">
                        ৳{a.promoPrice != null && a.promoPrice < a.price ? a.promoPrice : a.price}
                      </div>
                      {a.promoPrice != null && a.promoPrice < a.price && (
                        <div className="text-[11px] text-slate-400 line-through">৳{a.price}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">
                      +{a.displayQuantity} {a.displayUnit}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 capitalize">
                      {a.durationType.replace('_', ' ')}{a.durationType === 'days' ? ` (${a.durationDays}d)` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">
                      {a.isCustomQuantity ? `Custom (${a.minQuantity || 1}–${a.maxQuantity}x)` : `Max qty: ${a.maxQuantity}`}
                    </span>
                    {a.autoRenew && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Auto-renew</span>}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleAddonActive(a)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        a.isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" /> {a.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditAddon(a)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAddon(a._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Billing, Cloudflare Sync & Retention */}
      {subTab === 'billing' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Add-on Stacking Rule</label>
              <select
                value={settings.billing.stacking}
                onChange={(e) => setSettings({ ...settings, billing: { ...settings.billing, stacking: e.target.value } })}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="stack">Stack multiple active add-ons</option>
                <option value="highest_only">Highest single add-on only</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Expiry Warning (days before)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.notifications.expiryWarnDays}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, expiryWarnDays: Number(e.target.value) } })}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Historical Retention (months)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={settings.analytics.retentionMonths}
                onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, retentionMonths: Number(e.target.value) } })}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-800">Cloudflare GraphQL Bandwidth Ingestion</div>
                <div className="text-xs text-slate-500">
                  Credentials configured: <strong>{ingestStatus?.credentialsConfigured ? 'Yes' : 'No (set CLOUDFLARE_ZONE_ID & CLOUDFLARE_API_TOKEN)'}</strong>
                  {ingestStatus?.lastCompletedWindowEnd && ` • Last synced: ${new Date(ingestStatus.lastCompletedWindowEnd).toLocaleString()}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={!!settings.analytics.cloudflareSyncEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        analytics: { ...settings.analytics, cloudflareSyncEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  Enable Sync
                </label>
                <button
                  type="button"
                  onClick={runIngestNow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Run Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-on Create / Edit Modal */}
      {addonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={submitAddon}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingAddonId ? 'Edit Resource Add-on' : 'Create Resource Add-on'}
              </h3>
              <button type="button" onClick={() => setAddonModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Add-on Name</label>
                <input
                  required
                  type="text"
                  value={addonForm.name}
                  onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                  placeholder="e.g. 2 GB Additional Image Bandwidth"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={addonForm.description}
                  onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Resource Category</label>
                <select
                  value={addonForm.category}
                  onChange={(e) => setAddonForm({ ...addonForm, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="storage">Image Storage</option>
                  <option value="image_bandwidth">Image Bandwidth</option>
                  <option value="general_bandwidth">General Traffic Bandwidth</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-700">Quantity</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={addonForm.quantity}
                    onChange={(e) => setAddonForm({ ...addonForm, quantity: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-semibold text-slate-700">Unit</label>
                  <select
                    value={addonForm.unit}
                    onChange={(e) => setAddonForm({ ...addonForm, unit: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Price (BDT ৳)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={addonForm.price}
                  onChange={(e) => setAddonForm({ ...addonForm, price: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Promotional Price (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={addonForm.promoPrice}
                  onChange={(e) => setAddonForm({ ...addonForm, promoPrice: e.target.value })}
                  placeholder="Leave blank if none"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Duration</label>
                <select
                  value={addonForm.durationType}
                  onChange={(e) => setAddonForm({ ...addonForm, durationType: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="billing_period">Current Billing Period (Monthly)</option>
                  <option value="days">Custom Days</option>
                  <option value="subscription_bound">Subscription Bound</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              {addonForm.durationType === 'days' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration Days</label>
                  <input
                    type="number"
                    min="1"
                    value={addonForm.durationDays}
                    onChange={(e) => setAddonForm({ ...addonForm, durationDays: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-700">Billing Type</label>
                <select
                  value={addonForm.billingType}
                  onChange={(e) => setAddonForm({ ...addonForm, billingType: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="one_time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              <label className="sm:col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                <input
                  type="checkbox"
                  checked={!!addonForm.isCustomQuantity}
                  onChange={(e) => setAddonForm({ ...addonForm, isCustomQuantity: e.target.checked })}
                />
                Allow Merchant Custom Quantity (Editable amount &amp; auto-calculated price)
              </label>
              {addonForm.isCustomQuantity && (
                <div>
                  <label className="text-xs font-semibold text-slate-700">Minimum Purchase Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={addonForm.minQuantity}
                    onChange={(e) => setAddonForm({ ...addonForm, minQuantity: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-700">Max Purchase Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={addonForm.maxQuantity}
                  onChange={(e) => setAddonForm({ ...addonForm, maxQuantity: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Display Order</label>
                <input
                  type="number"
                  value={addonForm.displayOrder}
                  onChange={(e) => setAddonForm({ ...addonForm, displayOrder: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Available Packages (none selected = all packages)</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {packages.map((p) => {
                    const checked = addonForm.availablePackageIds.includes(String(p._id));
                    return (
                      <label key={p._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const id = String(p._id);
                            setAddonForm({
                              ...addonForm,
                              availablePackageIds: e.target.checked
                                ? [...addonForm.availablePackageIds, id]
                                : addonForm.availablePackageIds.filter((x) => x !== id),
                            });
                          }}
                        />
                        {p.name} ({p.billingCycle})
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={addonForm.isActive}
                  onChange={(e) => setAddonForm({ ...addonForm, isActive: e.target.checked })}
                />
                Active &amp; Published
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={addonForm.autoRenew}
                  onChange={(e) => setAddonForm({ ...addonForm, autoRenew: e.target.checked })}
                />
                Auto-renewal option
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddonModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                {editingAddonId ? 'Save Changes' : 'Save & Publish'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
