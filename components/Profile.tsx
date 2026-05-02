
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { User, Mail, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import { AchievementBadge, AchievementPreferences } from '../types';

interface ProfileProps {
  onClose: () => void;
  onOpenStock: () => void;
  dailyGoal: string;
  achievementPreferences: AchievementPreferences;
  achievementBadges: AchievementBadge[];
  onUpdateAchievementPreferences: (updater: (previous: AchievementPreferences) => AchievementPreferences) => void;
  notificationPermissionStatus: string;
  isDarkMode: boolean;
  currentThemeMode: 'dark' | 'light';
  autoSwitchTheme: boolean;
  onSetThemeMode: (mode: 'dark' | 'light') => void;
  onSetAutoSwitchTheme: (enabled: boolean) => void;
}

const AchievementToggle: React.FC<{
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
  isDarkMode: boolean;
}> = ({ checked, label, description, onChange, isDarkMode }) => (
  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{label}</p>
        <p className={`text-xs ${isDarkMode ? 'text-white/45' : 'text-slate-500'}`}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-[74px] shrink-0 items-center rounded-full border px-2 transition-all ${
          checked
            ? 'border-emerald-300/30 bg-emerald-300/20'
            : isDarkMode ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-100'
        }`}
      >
        <span
          className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-[38px]' : 'translate-x-0'
          }`}
        />
        <span className={`w-full text-[10px] font-black uppercase tracking-[0.28em] ${checked ? 'pr-2 text-emerald-200' : isDarkMode ? 'pl-7 text-white/45' : 'pl-7 text-slate-500'}`}>
          {checked ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  </div>
);

const Profile: React.FC<ProfileProps> = ({
  onClose,
  onOpenStock,
  dailyGoal,
  achievementPreferences,
  achievementBadges,
  onUpdateAchievementPreferences,
  notificationPermissionStatus,
  isDarkMode,
  currentThemeMode,
  autoSwitchTheme,
  onSetThemeMode,
  onSetAutoSwitchTheme,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const doc = await db.collection('users').doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            setProfile(data);
            setNewName(data?.name || '');
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await db.collection('users').doc(user.uid).update({
        name: newName
      });
      await user.updateProfile({ displayName: newName });
      setProfile({ ...profile, name: newName });
      setIsEditing(false);
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDeleting(true);
    try {
      const uid = user.uid;
      const alarmsSnap = await db.collection('users').doc(uid).collection('alarms').get();
      await Promise.all(alarmsSnap.docs.map(doc => doc.ref.delete()));
      const clocksSnap = await db.collection('users').doc(uid).collection('clocks').get();
      await Promise.all(clocksSnap.docs.map(doc => doc.ref.delete()));
      await db.collection('users').doc(uid).delete();
      await user.delete();
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
      onClose();
    } catch (e: any) {
      console.error("Delete account error:", e);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className={`${isDarkMode ? 'bg-black/90' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-2xl transition-colors duration-700`} onClick={onClose} />
      
      <div className={`relative w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto hide-scrollbar transition-colors duration-700 ${
        isDarkMode ? 'apple-blur border border-white/10 bg-[#111827]/92 text-white' : 'border border-slate-200 bg-white/96 text-slate-900'
      }`}>
        <button onClick={onClose} className={`absolute top-6 right-6 transition-colors z-20 ${isDarkMode ? 'text-zinc-600 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>
          <X size={20} />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="w-full h-full rounded-[2.2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <User size={32} className={isDarkMode ? 'text-white/20' : 'text-slate-300'} />
            </div>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profile?.name || "Focus User"}</h2>
          <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-600 font-black mt-1">Focus Account</p>
        </div>

        <div className="space-y-8">
          {/* Account Settings */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <div className={`flex items-center space-x-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <Mail size={18} className="text-zinc-600" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Email</span>
                <span className={`text-sm font-medium truncate w-48 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{profile?.email || auth.currentUser?.email}</span>
              </div>
            </div>

            <button onClick={() => { onOpenStock(); onClose(); }} className={`w-full py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              isDarkMode ? 'border-white/5 bg-white/5 hover:bg-white/10 text-white/40' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'
            }`}>
              Session History
            </button>

            {isEditing ? (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className={`w-full rounded-2xl py-4 px-6 text-sm outline-none transition-all ${
                    isDarkMode ? 'bg-white/10 border border-white/10 text-white focus:border-white/30' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-slate-400'
                  }`} 
                  placeholder="Change name"
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdate} disabled={saving} className="flex-1 bg-white text-black rounded-xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                  </button>
                  <button onClick={() => setIsEditing(false)} className={`px-4 rounded-xl py-3 transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className={`w-full py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                isDarkMode ? 'border-white/5 bg-white/5 hover:bg-white/10 text-white/40' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'
              }`}>
                Edit Profile
              </button>
            )}
            
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-4 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Trash2 size={14} /> 
              Delete Account
            </button>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Achievements</p>
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-white/75' : 'text-slate-600'}`}>Daily goal: {dailyGoal || 'Not set yet'}</p>
            </div>

            <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Appearance</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSetThemeMode('dark')}
                  className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                    currentThemeMode === 'dark'
                      ? 'bg-slate-900 text-white'
                      : isDarkMode
                        ? 'bg-black/20 text-white/50'
                        : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => onSetThemeMode('light')}
                  className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                    currentThemeMode === 'light'
                      ? 'bg-amber-100 text-slate-900 border border-amber-200'
                      : isDarkMode
                        ? 'bg-black/20 text-white/50'
                        : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  Light
                </button>
              </div>

              <div className="mt-4">
                <AchievementToggle
                  checked={autoSwitchTheme}
                  label="Auto-Switch Theme"
                  description="Change between light and dark automatically based on device time."
                  onChange={onSetAutoSwitchTheme}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            <AchievementToggle
              checked={achievementPreferences.showGoalPrompt}
              label="Daily Goal Pop-Up"
              description="When ON, the Daily Goal pop-up can appear when the app opens."
              onChange={(checked) => onUpdateAchievementPreferences((previous) => ({
                ...previous,
                showGoalPrompt: checked,
              }))}
              isDarkMode={isDarkMode}
            />

            <AchievementToggle
              checked={achievementPreferences.showDailyGoalCompletePopup}
              label="Daily Goal Completed Pop-Up"
              description="When ON, the completion pop-up can appear after you finish your goal tasks."
              onChange={(checked) => onUpdateAchievementPreferences((previous) => ({
                ...previous,
                showDailyGoalCompletePopup: checked,
              }))}
              isDarkMode={isDarkMode}
            />

            <AchievementToggle
              checked={achievementPreferences.showTimerCompletionPopup}
              label="Timer Completion Pop-Up"
              description="When ON, the timer completion pop-up can appear after each finished session."
              onChange={(checked) => onUpdateAchievementPreferences((previous) => ({
                ...previous,
                showTimerCompletionPopup: checked,
              }))}
              isDarkMode={isDarkMode}
            />

            <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Unlocked Badges</p>
              {achievementBadges.length === 0 ? (
                <p className={`mt-3 text-xs ${isDarkMode ? 'text-white/45' : 'text-slate-500'}`}>No badges unlocked yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {achievementBadges.map((badge) => (
                    <div key={badge.id} className={`rounded-2xl border p-3 ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-slate-200 bg-white'}`}>
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{badge.title}</p>
                      <p className={`mt-1 text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{badge.description}</p>
                      <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                        {badge.category === 'dailyGoal' ? 'Daily Goal' : 'Timer'} • {new Date(badge.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Notifications</p>
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-white/75' : 'text-slate-600'}`}>
                System permission: {notificationPermissionStatus === 'granted' ? 'Allowed' : notificationPermissionStatus === 'denied' ? 'Blocked' : 'Not enabled'}
              </p>
            </div>

            <AchievementToggle
              checked={achievementPreferences.showNotificationPermissionPrompt}
              label="Notification Permission Pop-Up"
              description="When ON, the app can ask to enable notifications when it opens."
              onChange={(checked) => onUpdateAchievementPreferences((previous) => ({
                ...previous,
                showNotificationPermissionPrompt: checked,
                notificationsEnabled: checked ? previous.notificationsEnabled : false,
              }))}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`${isDarkMode ? 'bg-black/95' : 'bg-slate-200/80'} absolute inset-0 backdrop-blur-2xl`} />
          <div className={`relative w-full max-w-sm rounded-[3rem] p-10 border border-red-500/20 text-center animate-in zoom-in-95 ${isDarkMode ? 'apple-blur' : 'bg-white'}`}>
            <AlertTriangle size={32} className="text-red-500 mx-auto mb-6 animate-pulse" />
            <h3 className="text-red-500 text-[11px] font-black uppercase tracking-[0.4em] mb-4">Dangerous Action</h3>
            <p className={`text-sm mb-10 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Delete your account and all data permanently?</p>
            <div className="space-y-3">
              <button onClick={executeDeleteAccount} disabled={deleting} className="w-full py-5 rounded-[2rem] bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : "Delete Forever"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 rounded-[2rem] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
