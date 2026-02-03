
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { User, Mail, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

interface ProfileProps {
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
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
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors z-20">
          <X size={20} />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="w-full h-full rounded-[2.2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <User size={32} className="text-white/20" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{profile?.name || "Focus User"}</h2>
          <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-600 font-black mt-1">Focus Account</p>
        </div>

        <div className="space-y-8">
          {/* Account Settings */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Mail size={18} className="text-zinc-600" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Email</span>
                <span className="text-sm font-medium text-white/80 truncate w-48">{profile?.email || auth.currentUser?.email}</span>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-white/30 outline-none transition-all" 
                  placeholder="Change name"
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdate} disabled={saving} className="flex-1 bg-white text-black rounded-xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="px-4 bg-white/10 text-white rounded-xl py-3 hover:bg-white/20 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-full py-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all text-white/40">
                Edit Profile
              </button>
            )}
            
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-4 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Trash2 size={14} /> 
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-10 border border-red-500/20 text-center animate-in zoom-in-95">
            <AlertTriangle size={32} className="text-red-500 mx-auto mb-6 animate-pulse" />
            <h3 className="text-red-500 text-[11px] font-black uppercase tracking-[0.4em] mb-4">Dangerous Action</h3>
            <p className="text-white/80 text-sm mb-10">Delete your account and all data permanently?</p>
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
