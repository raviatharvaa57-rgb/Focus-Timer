
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { User, Mail, ShieldAlert, Trash2, Camera, Check, X, Loader2 } from 'lucide-react';

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
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          setProfile(data);
          setNewName(data?.name || '');
          setNewPhoto(data?.photoFileName || '');
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
      setProfile({ ...profile, name: newName, photoFileName: newPhoto });
      setIsEditing(false);
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Are you absolutely sure? This cannot be undone.");
    if (!confirm) return;

    setDeleting(true);
    const user = auth.currentUser;
    if (user) {
      try {
        await db.collection('users').doc(user.uid).delete();
        await user.delete();
        // Firebase will automatically handle sign out state change
      } catch (e: any) {
        if (e.code === 'auth/requires-recent-login') {
          alert("Please log out and sign back in to delete your account for security.");
        }
        console.error(e);
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-600 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <div className="w-full h-full rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               {profile?.photoFileName && profile.photoFileName !== 'default_avatar.png' ? (
                 <span className="text-4xl">📸</span>
               ) : (
                 <User size={40} className="text-white/20" />
               )}
            </div>
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{profile?.name}</h2>
          <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-black mt-1">Focus Profile</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Mail size={18} className="text-zinc-600" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Email Address</span>
                <span className="text-sm font-medium text-white/80">{profile?.email}</span>
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
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-4">Photo Filename</label>
                  <input 
                    type="text" 
                    value={newPhoto} 
                    onChange={e => setNewPhoto(e.target.value)} 
                    placeholder="e.g. avatar1.png"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white" 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdate} 
                    disabled={saving}
                    className="flex-1 bg-white text-black rounded-xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-4 bg-white/10 text-white rounded-xl py-3"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full py-4 rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Delete Account</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
