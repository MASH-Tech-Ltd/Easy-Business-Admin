import { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Shield, Key, Camera, Save, Activity, Settings, Calendar, 
  X, Eye, EyeOff, Smartphone, CheckCircle, Copy, Lock, ShieldCheck, 
  Download, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function AdminProfile() {
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'superadmin@platform.com',
    role: 'Super Admin',
    joined: 'Jan 2024'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Change Password State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '', otp: '', resetToken: '' });
  const [isPassLoading, setIsPassLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // 2FA Authenticator State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(1); // 1: QR & Secret, 2: OTP verify, 3: Recovery codes
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [setupOtp, setSetupOtp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [disableOtp, setDisableOtp] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        const userData = {
          name: storedUser.name || 'Admin User',
          email: storedUser.email || 'superadmin@platform.com',
          role: storedUser.role === 'super_admin' ? 'Super Admin' : (storedUser.role || 'Super Admin'),
          joined: storedUser.createdAt ? new Date(storedUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2024',
          avatar: storedUser.avatar?.secure_url || storedUser.avatar || null
        };
        setUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email
        });
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        setFormData({ name: user.name, email: user.email });
      }
    } else {
      setFormData({ name: user.name, email: user.email });
    }

    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const res = await api.get('/auth/2fa/status');
      if (res.data.success || res.data.status === 'ok') {
        setIs2FAEnabled(!!res.data.data?.twoFactorEnabled);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirmModal(true);
    }
  };

  const confirmUpload = async () => {
    setShowConfirmModal(false);
    if (!selectedFile) return;

    const toastId = toast.loading('Uploading profile picture, please wait...');

    const reader = new FileReader();
    reader.onloadend = () => {
      setUser(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(selectedFile);

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const res = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (res.data.success || res.data.status === 'ok') {
        toast.update(toastId, { render: 'Profile image uploaded successfully!', type: 'success', isLoading: false, autoClose: 3000 });
        const updatedUser = res.data.data;
        
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.avatar = updatedUser.avatar;
          localStorage.setItem('user', JSON.stringify(storedUser));
          window.dispatchEvent(new Event('profileUpdated'));
        }
      }
    } catch (error) {
      toast.update(toastId, { render: 'Failed to upload image to server', type: 'error', isLoading: false, autoClose: 3000 });
      console.error(error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
    }
  };

  const cancelUpload = () => {
    setShowConfirmModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
  };

  const handleSave = async () => {
    try {
      const res = await api.put('/users/me', { name: formData.name });
      if (res.data.success || res.data.status === 'ok') {
        setUser(prev => ({ ...prev, name: formData.name }));
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.name = formData.name;
          localStorage.setItem('user', JSON.stringify(storedUser));
          window.dispatchEvent(new Event('profileUpdated'));
        }
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    if (!passData.oldPassword) return toast.error('Please enter your old password');
    setIsPassLoading(true);
    try {
      const res = await api.post('/auth/change-password-request', { oldPassword: passData.oldPassword });
      toast.success('OTP sent to your email address!');
      setPasswordStep(2);
      setPassData(prev => ({ ...prev, resetToken: res.data.data.resetToken }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify old password');
    } finally {
      setIsPassLoading(false);
    }
  };

  const handleVerifyPasswordChange = async (e) => {
    e.preventDefault();
    if (!passData.otp) return toast.error('Please enter the OTP');
    if (passData.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (passData.newPassword !== passData.confirmPassword) return toast.error('Passwords do not match');
    
    setIsPassLoading(true);
    try {
      await api.post('/auth/change-password-verify', { 
        otp: passData.otp, 
        newPassword: passData.newPassword,
        resetToken: passData.resetToken
      });
      toast.success('Password changed successfully!');
      setIsChangePasswordOpen(false);
      setPasswordStep(1);
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '', otp: '', resetToken: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsPassLoading(false);
    }
  };

  // 2FA Actions
  const handleStart2FASetup = async () => {
    setIs2FALoading(true);
    try {
      const res = await api.post('/auth/2fa/setup');
      if (res.data.success || res.data.status === 'ok') {
        setQrCodeUrl(res.data.data.qrCodeUrl);
        setTwoFactorSecret(res.data.data.secret);
        setSetupOtp('');
        setTwoFactorStep(1);
        setIs2FAModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate 2FA setup');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerifyEnable2FA = async (e) => {
    e.preventDefault();
    if (!setupOtp.trim() || setupOtp.trim().length < 6) {
      return toast.error('Please enter a valid 6-digit code');
    }
    setIs2FALoading(true);
    try {
      const res = await api.post('/auth/2fa/verify-enable', { code: setupOtp.trim() });
      if (res.data.success || res.data.status === 'ok') {
        toast.success('2FA Authenticator enabled successfully!');
        setIs2FAEnabled(true);
        setRecoveryCodes(res.data.data.recoveryCodes || []);
        setTwoFactorStep(3); // Step 3 displays backup recovery codes
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setIs2FALoading(true);
    try {
      const res = await api.post('/auth/2fa/disable', { code: disableOtp.trim() });
      if (res.data.success || res.data.status === 'ok') {
        toast.success('2FA Authenticator has been disabled');
        setIs2FAEnabled(false);
        setIsDisable2FAModalOpen(false);
        setDisableOtp('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setIs2FALoading(false);
    }
  };

  const copyToClipboard = (text, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="space-y-8 w-full animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings, password, and two-factor authentication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden relative group">
            {/* Cover Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            </div>
            
            {/* Avatar & Info */}
            <div className="px-6 pb-6 text-center relative -mt-16">
              <div className="relative inline-block group/avatar">
                <div 
                  className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white overflow-hidden transition-transform duration-300 group-hover/avatar:scale-105 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {user.avatar ? (
                    <img src={typeof user.avatar === 'string' ? user.avatar : user.avatar.secure_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-90">{user.name.charAt(0)}</span>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 bg-white text-slate-600 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 hover:text-blue-600 transition-colors z-10 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <div className="mt-5 space-y-1">
                <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                <div className="flex items-center justify-center gap-1.5 text-blue-600 font-medium">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">{user.role}</span>
                </div>
                <p className="text-slate-500 text-sm flex items-center justify-center gap-1.5 mt-2">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">12</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Months Active</p>
                </div>
                <div className="text-center border-l border-slate-100">
                  <p className="text-2xl font-bold text-slate-800">5k+</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Actions Logged</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats/Info */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Account Status
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Status</span>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">2FA Security</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${is2FAEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {is2FAEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Last Login</span>
                <span className="text-slate-800 text-sm font-medium">Just now</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500 text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined
                </span>
                <span className="text-slate-800 text-sm font-medium">{user.joined}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Personal Info & Security Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Personal Information
              </h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`text-sm font-medium transition-colors ${isEditing ? 'text-slate-500 hover:text-slate-700' : 'text-blue-600 hover:text-blue-700'}`}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50/50 rounded-lg border border-transparent text-slate-800 font-medium">
                      {user.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <div className="px-4 py-2.5 bg-slate-100 rounded-lg border border-transparent text-slate-500 cursor-not-allowed">
                    {user.email}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Timezone</label>
                  {isEditing ? (
                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all">
                      <option>UTC+06:00 Astana, Dhaka</option>
                      <option>UTC+05:30 Indian Standard Time</option>
                      <option>UTC+00:00 Greenwich Mean Time</option>
                      <option>UTC-05:00 Eastern Time (US & Canada)</option>
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50/50 rounded-lg border border-transparent text-slate-800 font-medium">
                      UTC+06:00 Astana, Dhaka
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                Security Settings
              </h2>
            </div>
            <div className="p-6 space-y-4">
              
              {/* 1. Password Item */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50/80 border border-slate-100 rounded-xl gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-500" /> Password
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">Secure your admin account with a strong password</p>
                </div>
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
              </div>

              {/* 2. 2FA Authenticator Item */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50/80 border border-slate-100 rounded-xl gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500" /> 2FA Authenticator
                    </h4>
                    {is2FAEnabled ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {is2FAEnabled 
                      ? 'Two-Factor Authentication is enabled using Google Authenticator / Authy.' 
                      : 'Add an extra layer of protection using Google Authenticator, Authy, or Microsoft Authenticator.'}
                  </p>
                </div>

                {is2FAEnabled ? (
                  <button 
                    onClick={() => setIsDisable2FAModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-sm font-medium rounded-lg transition-all shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    Disable 2FA
                  </button>
                ) : (
                  <button 
                    onClick={handleStart2FASetup}
                    disabled={is2FALoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-emerald-500/20"
                  >
                    {is2FALoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Enable 2FA
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Image Upload Confirm Modal ─────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Update Profile Picture</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to change your profile picture?</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={cancelUpload}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpload}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ────────────────────────────────────────────── */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
              <button 
                onClick={() => { setIsChangePasswordOpen(false); setPasswordStep(1); setPassData({ oldPassword: '', newPassword: '', confirmPassword: '', otp: '', resetToken: '' }); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {passwordStep === 1 ? (
                <form onSubmit={handleRequestPasswordChange} className="space-y-4">
                  <p className="text-sm text-slate-500 mb-4">Please enter your current password. We will send an OTP to your email to verify your identity.</p>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPass ? 'text' : 'password'}
                        value={passData.oldPassword}
                        onChange={e => setPassData({...passData, oldPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isPassLoading}
                    className="w-full py-2.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    {isPassLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPasswordChange} className="space-y-4">
                  <p className="text-sm text-slate-500 mb-4">We've sent a 6-digit OTP to <strong>{user.email}</strong>. Enter it below along with your new password.</p>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Verification OTP</label>
                    <input 
                      type="text"
                      maxLength={6}
                      value={passData.otp}
                      onChange={e => setPassData({...passData, otp: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center tracking-widest font-mono text-lg"
                      placeholder="------"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPass ? 'text' : 'password'}
                        value={passData.newPassword}
                        onChange={e => setPassData({...passData, newPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                    <input 
                      type={showPass ? 'text' : 'password'}
                      value={passData.confirmPassword}
                      onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isPassLoading}
                    className="w-full py-2.5 mt-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    {isPassLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Update Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2FA Setup Modal ─────────────────────────────────────────────────── */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Set Up 2FA Authenticator</h2>
                  <p className="text-xs text-slate-500">Protect your account with Time-based OTP</p>
                </div>
              </div>
              <button 
                onClick={() => setIs2FAModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {twoFactorStep === 1 && (
                <div className="space-y-5 text-center">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 text-left">
                    <p className="font-semibold mb-1">Step 1: Scan QR Code</p>
                    Open your <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong> app on your smartphone, and scan the QR code below.
                  </div>

                  {qrCodeUrl && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-md inline-block">
                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-500 font-medium">Can't scan? Use manual setup key:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono text-sm tracking-wider select-all font-bold">
                        {twoFactorSecret}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(twoFactorSecret, 'Secret key copied!')}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        title="Copy Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setTwoFactorStep(2)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
                  >
                    Next: Enter 6-Digit Code
                  </button>
                </div>
              )}

              {twoFactorStep === 2 && (
                <form onSubmit={handleVerifyEnable2FA} className="space-y-5">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                    <p className="font-semibold mb-1">Step 2: Enter Verification Code</p>
                    Enter the 6-digit verification code currently shown in your Authenticator app to confirm setup.
                  </div>

                  <div className="space-y-2 text-center">
                    <label className="text-sm font-semibold text-slate-700">6-Digit Authenticator Code</label>
                    <input 
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={setupOtp}
                      onChange={(e) => setSetupOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-mono text-2xl font-bold text-slate-800"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setTwoFactorStep(1)}
                      className="w-1/3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={is2FALoading}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-500/20 flex justify-center items-center gap-2 text-sm"
                    >
                      {is2FALoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Enable 2FA'}
                    </button>
                  </div>
                </form>
              )}

              {twoFactorStep === 3 && (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">2FA Enabled Successfully!</p>
                      <p className="mt-1">Save these backup recovery codes in a safe place. If you lose your phone, you can use these codes to log into your account.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 border border-slate-200 rounded-xl font-mono text-xs text-center font-bold tracking-wider text-slate-800">
                    {recoveryCodes.map((code, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200 shadow-xs">
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button 
                      onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'Recovery codes copied!')}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copy All Codes
                    </button>
                    <button 
                      onClick={() => { setIs2FAModalOpen(false); setTwoFactorStep(1); }}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2FA Disable Modal ────────────────────────────────────────────────── */}
      {isDisable2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Disable 2FA Authenticator
              </h3>
              <button onClick={() => setIsDisable2FAModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Are you sure you want to disable 2FA? This will decrease your account security. Please enter your current 6-digit 2FA code to confirm.
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <input 
                type="text"
                maxLength={8}
                value={disableOtp}
                onChange={(e) => setDisableOtp(e.target.value)}
                placeholder="6-digit code or recovery code"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono tracking-widest text-center text-lg"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsDisable2FAModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={is2FALoading}
                  className="px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  {is2FALoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Disable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
