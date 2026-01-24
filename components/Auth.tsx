
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Mail, Key } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('focus_remembered_creds');
    if (saved) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
      } catch (e) {
        console.error("Failed to parse remembered credentials");
      }
    }
  }, []);

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  const syncUserToFirestore = async (user: any, displayName?: string) => {
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      await userRef.set({
        name: displayName || user.displayName || 'Focus User',
        email: user.email,
        photoFileName: 'default_avatar.png',
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isResetting) {
        await auth.sendPasswordResetEmail(email);
        setResetSentEmail(email);
        setIsResetting(false);
      } else if (isLogin) {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        if (cred.user) {
          if (!cred.user.emailVerified) {
            await cred.user.sendEmailVerification();
            localStorage.setItem('focus_remembered_creds', JSON.stringify({ email, password }));
            await auth.signOut();
            setVerificationEmail(email);
          } else {
            // Check and sync user doc
            await syncUserToFirestore(cred.user);
            localStorage.removeItem('focus_remembered_creds');
          }
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if (cred.user) {
          // Register in Firestore immediately
          await syncUserToFirestore(cred.user, name);
          
          await cred.user.sendEmailVerification();
          localStorage.setItem('focus_remembered_creds', JSON.stringify({ email, password }));
          await auth.signOut();
          setVerificationEmail(email);
        }
      }
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    } catch (err: any) {
      setShake(true);
      if (window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
      console.error("Auth error:", err.code, err.message);

      if (isResetting) {
        setError(err.code === 'auth/user-not-found' ? "No account found" : "Reset failed");
      } else if (isLogin) {
        setError("Invalid email or password");
      } else {
        setError(err.code === 'auth/email-already-in-use' ? "User already exists. Sign in?" : err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setIsResetting(false);
    setError(null);
    setVerificationEmail(null);
    setResetSentEmail(null);
  };

  const enterResetMode = () => {
    setIsResetting(true);
    setError(null);
  };

  const returnToLogin = () => {
    setVerificationEmail(null);
    setResetSentEmail(null);
    setIsResetting(false);
    setIsLogin(true);
  };

  if (verificationEmail) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[3000]">
        <div className="w-full max-w-sm apple-blur rounded-[3rem] p-10 border border-white/10 text-center animate-in fade-in zoom-in-95">
          <Mail size={40} className="text-white mx-auto mb-8 animate-pulse" />
          <h2 className="text-3xl font-bold text-white mb-4">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-8">Verification sent to <span className="text-white font-semibold">{verificationEmail}</span>.</p>
          <button onClick={returnToLogin} className="w-full bg-white text-black rounded-[1.75rem] py-5 px-6 text-[10px] font-black uppercase tracking-widest">Go to Login</button>
        </div>
      </div>
    );
  }

  if (resetSentEmail) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[3000]">
        <div className="w-full max-w-sm apple-blur rounded-[3rem] p-10 border border-white/10 text-center animate-in fade-in zoom-in-95">
          <Key size={40} className="text-white mx-auto mb-8 animate-pulse" />
          <h2 className="text-3xl font-bold text-white mb-4">Reset link sent</h2>
          <p className="text-zinc-400 text-sm mb-8">Follow instructions in your email to reset password.</p>
          <button onClick={returnToLogin} className="w-full bg-white text-black rounded-[1.75rem] py-5 px-6 text-[10px] font-black uppercase tracking-widest">Back to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[3000] overflow-y-auto">
      <div className={`w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl">{isResetting ? "🔑" : "⏳"}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{isResetting ? "Recovery" : "Focus"}</h2>
          <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-black">{isResetting ? "Password Reset" : (isLogin ? "Welcome Back" : "New Account")}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && !isResetting && (
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-4">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display Name" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white" required={!isLogin && !isResetting} />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-4">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white" required />
          </div>
          {!isResetting && (
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-4">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isLogin && (
                <div className="flex justify-end px-2">
                  <button 
                    type="button" 
                    onClick={enterResetMode}
                    className="text-[8px] uppercase tracking-widest text-orange-500/60 hover:text-orange-500 font-black transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}
          {!isLogin && !isResetting && (
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black ml-4">Confirm</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white" required />
            </div>
          )}
          {error && <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 text-[11px] font-bold text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-white text-black rounded-[1.75rem] py-5 px-6 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isResetting ? "Get Reset Link" : (isLogin ? "Sign In" : "Sign Up"))}
          </button>
        </form>
        <div className="mt-8 text-center">
           <button 
             onClick={isResetting ? returnToLogin : switchMode} 
             className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-widest transition-colors"
           >
             {isResetting ? "Back to sign in" : (isLogin ? "Create an account" : "Back to sign in")}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
