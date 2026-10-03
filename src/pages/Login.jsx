import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Challenge States
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const loginTimeStr = localStorage.getItem('adminLoginTime');
      if (userStr) {
        const user = JSON.parse(userStr);
        const isExpired = loginTimeStr && (Date.now() - parseInt(loginTimeStr, 10) > TWENTY_FOUR_HOURS);
        if (user && user.role === 'super_admin' && !isExpired) {
          navigate('/', { replace: true });
        } else if (isExpired) {
          localStorage.removeItem('user');
          localStorage.removeItem('adminLoginTime');
        }
      }
    } catch (e) {}
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});
    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success || res.data.status === 'ok') {
        // Check 2FA requirement
        if (res.data.data?.requires2FA) {
          setIs2FARequired(true);
          setTwoFactorToken(res.data.data.twoFactorToken);
          toast.info('2FA Authenticator code required');
          return;
        }

        const user = res.data.data.user;
        if (user && user.role !== 'super_admin') {
          throw new Error('Access denied. Super Admin privileges required.');
        }
        
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('adminLoginTime', Date.now().toString());
        }
        toast.success(res.data.message || 'Welcome back, Admin!');
        window.location.href = '/';
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = {};
        error.response.data.errors.forEach(err => {
          const field = err.field.replace('body.', ''); // Handle nested Zod errors like 'body.password'
          errors[field] = err.message;
        });
        setFieldErrors(errors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      return toast.error('Please enter your 6-digit authenticator or recovery code');
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/2fa/verify-login', {
        twoFactorToken,
        code: twoFactorCode.trim(),
      });
      if (res.data.success || res.data.status === 'ok') {
        const user = res.data.data.user;
        if (user && user.role !== 'super_admin') {
          throw new Error('Access denied. Super Admin privileges required.');
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('adminLoginTime', Date.now().toString());
        }
        toast.success(res.data.message || 'Welcome back, Admin!');
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid 2FA code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="dark-glass rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/masheco-logo.png" alt="MASH ECO Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-xl relative z-10" />
              <span className="text-3xl md:text-4xl font-righteous text-white tracking-tight">
                MASH ECO
              </span>
            </div>
            <h2 className="text-xl font-bold text-blue-400 mb-3 tracking-wide uppercase">
              Super Admin
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-slate-700"></div>
              <div className="h-1 w-1.5 bg-blue-500 rounded-full"></div>
              <div className="h-px w-8 bg-slate-700"></div>
            </div>
            <p className="text-slate-400 text-center text-sm font-medium tracking-wide">
              {is2FARequired ? 'Two-Factor Verification' : 'Secure platform management'}
            </p>
          </div>

          {!is2FARequired ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="admin@platform.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" /> Secure Login
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Enter the 6-digit code generated by your Authenticator App (Google Authenticator / Authy), or one of your 8-digit recovery codes.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">2FA Authenticator Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    id="totpCode"
                    name="totpCode"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-center text-lg"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" /> Verify 2FA & Login
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIs2FARequired(false);
                  setTwoFactorCode('');
                  setTwoFactorToken('');
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Only authorized administrators may access this portal.
            </p>
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Setup Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
