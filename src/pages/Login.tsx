import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, loginAsGuest } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as { from?: string } | null;
  const from = state?.from ?? '/';

  // Load saved details on mount
  useEffect(() => {
    const savedSaveDetails = window.localStorage.getItem('login_save_details') === 'true';
    const savedEmail = window.localStorage.getItem('login_saved_email') || '';
    const savedPassword = window.localStorage.getItem('login_saved_password') || '';
    
    setSaveDetails(savedSaveDetails);
    if (savedEmail) setEmail(savedEmail);
    if (savedSaveDetails && savedPassword) setPassword(savedPassword);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await signInWithPassword(email.trim(), password);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      // Save details if checkbox is checked
      if (saveDetails) {
        window.localStorage.setItem('login_saved_email', email.trim());
        window.localStorage.setItem('login_saved_password', password);
        window.localStorage.setItem('login_save_details', 'true');
      } else {
        window.localStorage.removeItem('login_saved_email');
        window.localStorage.removeItem('login_saved_password');
        window.localStorage.setItem('login_save_details', 'false');
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-black60 border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:border-secondary/50"
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black40 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-secondary/50"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 px-3 py-2 bg-black40 border border-white/10 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={saveDetails}
              onChange={(e) => {
                const checked = e.target.checked;
                setSaveDetails(checked);
                window.localStorage.setItem('login_save_details', checked ? 'true' : 'false');
                if (!checked) {
                  window.localStorage.removeItem('login_saved_email');
                  window.localStorage.removeItem('login_saved_password');
                }
              }}
              className="w-4 h-4 rounded border-white/20 bg-black40 text-secondary focus:ring-secondary"
            />
            <span className="text-sm text-white/70">Save email and password</span>
          </label>

          {error && (
            <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-secondary text-black font-bold rounded-xl py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsGuest();
              navigate(from, { replace: true });
            }}
            className="w-full bg-transparent10 text-white font-bold rounded-xl py-3 text-sm hover:bg-transparent20"
          >
            Continue as Guest
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm text-secondary hover:underline">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
