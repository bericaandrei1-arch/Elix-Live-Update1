import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bell, BellOff, Globe, LogOut, Scale, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore, type AppLanguage } from '../store/useSettingsStore';
import { trackEvent } from '../lib/analytics';

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const { muteAllSounds, notificationsEnabled, language, setMuteAllSounds, setNotificationsEnabled, setLanguage } =
    useSettingsStore();

  const [isDeleting, setIsDeleting] = useState(false);

  const languageOptions = useMemo(() => {
    const opts: { value: AppLanguage; label: string }[] = [
      { value: 'ro', label: 'Română' },
      { value: 'en', label: 'English' },
    ];
    return opts;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 flex justify-center">
      <div className="w-full max-w-[500px]">
        <header className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
            <h1 className="font-bold text-lg">Settings and privacy</h1>
            <div className="w-6"></div>
        </header>

        <div className="space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white/90">Preferences</h2>
            </div>
            <div className="divide-y divide-white/10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {muteAllSounds ? <VolumeX size={18} className="text-white/70" /> : <Volume2 size={18} className="text-white/70" />}
                  <div>
                    <div className="text-sm font-semibold">Mute all sounds</div>
                    <div className="text-xs text-white/60">Applies to feed, live and gifts</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`w-12 h-7 rounded-full border transition-colors ${
                    muteAllSounds ? 'bg-[#E6B36A] border-[#E6B36A]' : 'bg-white/10 border-white/10'
                  }`}
                  onClick={() => {
                    const next = !muteAllSounds;
                    setMuteAllSounds(next);
                    trackEvent('settings_toggle_mute_all', { value: next });
                  }}
                  aria-label="Toggle mute all sounds"
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-black transition-transform ${
                      muteAllSounds ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {notificationsEnabled ? <Bell size={18} className="text-white/70" /> : <BellOff size={18} className="text-white/70" />}
                  <div>
                    <div className="text-sm font-semibold">Notifications</div>
                    <div className="text-xs text-white/60">MVP toggle (device push later)</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`w-12 h-7 rounded-full border transition-colors ${
                    notificationsEnabled ? 'bg-[#E6B36A] border-[#E6B36A]' : 'bg-white/10 border-white/10'
                  }`}
                  onClick={() => {
                    const next = !notificationsEnabled;
                    setNotificationsEnabled(next);
                    trackEvent('settings_toggle_notifications', { value: next });
                  }}
                  aria-label="Toggle notifications"
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-black transition-transform ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-white/70" />
                  <div>
                    <div className="text-sm font-semibold">Language</div>
                    <div className="text-xs text-white/60">UI language preference</div>
                  </div>
                </div>
                <select
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                  value={language}
                  onChange={(e) => {
                    const next = e.target.value as AppLanguage;
                    setLanguage(next);
                    trackEvent('settings_change_language', { value: next });
                  }}
                  aria-label="Select language"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white/90">Legal</h2>
            </div>
            <div className="divide-y divide-white/10">
              <button
                type="button"
                className="w-full flex items-center p-4 hover:bg-white/5 cursor-pointer text-left"
                onClick={() => {
                  trackEvent('settings_open_legal', { to: '/legal' });
                  navigate('/legal');
                }}
              >
                <Scale size={18} className="mr-3 text-white/60" />
                <span className="text-sm font-semibold">Open legal pages</span>
              </button>
            </div>
          </section>
        </div>

        <div className="mt-8 space-y-2">
          <button
            type="button"
            className="w-full flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 cursor-pointer text-left text-red-400 disabled:opacity-60"
            disabled={isDeleting}
            onClick={async () => {
              if (isDeleting) return;
              const ok = window.confirm('Delete account? This will sign you out and start the deletion request.');
              if (!ok) return;
              setIsDeleting(true);
              trackEvent('settings_delete_account_start');
              try {
                window.location.href =
                  'mailto:support@elixstarlive.co.uk?subject=Delete%20my%20account&body=Please%20delete%20my%20account.%20My%20email%3A%20';
              } catch {}
              await signOut();
              trackEvent('settings_delete_account_signed_out');
              navigate('/login', { replace: true });
              setIsDeleting(false);
            }}
          >
            <Trash2 size={18} className="mr-3" />
            <span className="text-sm font-bold">Delete account</span>
          </button>

          <button
            type="button"
            className="w-full flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 cursor-pointer text-left"
            onClick={async () => {
              trackEvent('settings_logout');
              await signOut();
              navigate('/login', { replace: true });
            }}
          >
            <LogOut size={18} className="mr-3 text-white/70" />
            <span className="text-sm font-bold">Log out</span>
          </button>
        </div>
        
        <div className="mt-10 text-center text-xs text-white/40">v1.0.0</div>
      </div>
    </div>
  );
}
