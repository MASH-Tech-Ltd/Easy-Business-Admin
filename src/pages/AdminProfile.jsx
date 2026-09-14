import { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Key, Camera, Save, Activity, Settings, Calendar } from 'lucide-react';
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.success || res.data.status === 'ok') {
        toast.update(toastId, { render: 'Profile image uploaded successfully!', type: 'success', isLoading: false, autoClose: 3000 });
        const updatedUser = res.data.data;
        
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.avatar = updatedUser.avatar;
          localStorage.setItem('user', JSON.stringify(storedUser));
          
          // Dispatch event to update other components like Header
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

  useEffect(() => {
    // Try to load user from localStorage
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        const userData = {
          name: storedUser.name || 'Admin User',
          email: storedUser.email || 'superadmin@platform.com',
          role: storedUser.role === 'admin' ? 'Super Admin' : (storedUser.role || 'Super Admin'),
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
  }, []);

  const handleSave = () => {
    // Here we would typically make an API call
    setUser(prev => ({ ...prev, name: formData.name, email: formData.email }));
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="space-y-8 w-full animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden relative group">
            {/* Cover Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
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

        {/* Right Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
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
                

                
                <div className="space-y-2">
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

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                Security Settings
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-100 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Password</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Last changed 3 months ago</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
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
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm shadow-blue-500/20"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
