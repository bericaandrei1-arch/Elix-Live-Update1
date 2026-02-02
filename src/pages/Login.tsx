import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, loginAsGuest, resendSignupConfirmation } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const state = location.state as { from?: string } | null;
  const from = state?.from ?? '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    const res = await signInWithPassword(email.trim(), password);
    setIsSubmitting(false);
    if (res.error) {
      if (res.error.toLowerCase().includes('email not confirmed')) {
        setError('Email neconfirmat. Verifică inbox-ul și confirmă contul, apoi încearcă din nou.');
        setShowResend(true);
      } else {
        setError(res.error);
        if (/confirm|verification|verify|email/i.test(res.error)) {
          setShowResend(true);
        }
      }
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-black/60 border border-white/10 rounded-2xl p-5">
        <h1 className="text-xl font-bold mb-4">Login</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-secondary/50"
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-secondary/50"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="text-xs text-rose-300">{error}</div>}
          {info && <div className="text-xs text-white/70">{info}</div>}

          {showResend && (
            <button
              type="button"
              disabled={isResending}
              className="w-full bg-white/10 border border-white/10 rounded-xl py-2 text-sm disabled:opacity-60"
              onClick={async () => {
                const trimmed = email.trim();
                if (!trimmed) {
                  setError('Introdu email-ul mai întâi.');
                  return;
                }
                setError(null);
                setInfo(null);
                setIsResending(true);
                try {
                  const res = await resendSignupConfirmation(trimmed);
                  if (res.error) {
                    setError(res.error);
                    return;
                  }
                  setInfo('Email de confirmare trimis din nou. Verifică Inbox și Spam.');
                } finally {
                  setIsResending(false);
                }
              }}
            >
              {isResending ? 'Sending...' : 'Resend confirmation email'}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-secondary text-black font-bold rounded-xl py-2 text-sm disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsGuest();
              navigate(from, { replace: true });
            }}
            className="w-full bg-white/10 text-white font-bold rounded-xl py-2 text-sm hover:bg-white/20"
          >
            Guest Login (Demo)
          </button>
        </form>

        <div className="mt-4 text-xs text-white/70 space-y-2">
          <div className="flex justify-between items-center">
            <Link to="/register" className="text-secondary hover:underline">
              Don&apos;t have an account? Register
            </Link>
          </div>
          
          <div className="text-[10px] text-white/40 text-center pt-2 border-t border-white/5">
            By continuing, you agree to our{' '}
            <Link to="/legal/terms" className="text-white/60 hover:text-white underline">EULA</Link>
            {' '}and{' '}
            <Link to="/legal/privacy" className="text-white/60 hover:text-white underline">Privacy Policy</Link>.
            <br />
            There is zero tolerance for abusive content.
          </div>
        </div>
      </div>
    </div>
  );
}
