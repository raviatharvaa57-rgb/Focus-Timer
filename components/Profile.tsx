
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { User, Mail, Trash2, Camera, X, Loader2 } from 'lucide-react';

interface ProfileProps {
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
            setNewPhoto(data?.photoFileName || '');
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
        name: newName,
        photoFileName: newPhoto
      });
      // Also update Auth profile for consistency
      await user.updateProfile({ displayName: newName });
      
      setProfile({ ...profile, name: newName, photoFileName: newPhoto });
      setIsEditing(false);
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    } catch (e) {
      console.error(e);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No active session found.");
      return;
    }

    const confirm = window.confirm(
      "PERMANENT ACTION: Are you sure you want to delete your Focus account? " +
      "This will remove all your saved alarms, world clocks, and profile data. " +
      "This cannot be undone."
    );
    
    if (!confirm) return;

    setDeleting(true);
    const uid = user.uid;

    try {
      // 1. Delete all sub-collections (Alarms)
      const alarmsSnap = await db.collection('users').doc(uid).collection('alarms').get();
      const alarmDeletions = alarmsSnap.docs.map(doc => doc.ref.delete());
      await Promise.all(alarmDeletions);

      // 2. Delete all sub-collections (Clocks)
      const clocksSnap = await db.collection('users').doc(uid).collection('clocks').get();
      const clockDeletions = clocksSnap.docs.map(doc => doc.ref.delete());
      await Promise.all(clockDeletions);

      // 3. Delete the user document itself
      await db.collection('users').doc(uid).delete();

      // 4. Delete the authentication record
      await user.delete();
      
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
      onClose(); // Redirect handled by App.tsx listener
      
    } catch (e: any) {
      console.error("Delete account error:", e);
      
      if (e.code === 'auth/requires-recent-login') {
        alert(
          "Security Requirement: Deleting an account requires a recent login. " +
          "Please sign out and sign back in, then try deleting again immediately."
        );
      } else {
        alert("An error occurred while deleting your account: " + (e.message || "Unknown error"));
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <div className="w-full h-full rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-white/20">
               {profile?.photoFileName && profile.photoFileName !== 'default_avatar.png' ? (
                 <span className="text-4xl">📸</span>
               ) : (
                 <User size={40} className="text-white/20" />
               )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{profile?.name || "Focus User"}</h2>
          <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-black mt-1">Focus Profile</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Mail size={18} className="text-zinc-600" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Email Address</span>
                <span className="text-sm font-medium text-white/80">{profile?.email || auth.currentUser?.email}</span>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-4">Full Name</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:border-white/30 outline-none transition-all" 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdate} 
                    disabled={saving}
                    className="flex-1 bg-white text-black rounded-xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-4 bg-white/10 text-white rounded-xl py-3 hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={handleDeleteAccount}
              disabled={deleting}
              className={`w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 ${
                deleting 
                ? 'bg-red-500/20 text-red-500 opacity-50 cursor-not-allowed' 
                : 'text-red-500/50 hover:text-red-500 hover:bg-red-500/10'
              }`}
            >
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Removing Account...
                </>
              ) : (
                <>
                  <Trash2 size={14} /> 
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
