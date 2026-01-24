
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
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

  // Load remembered credentials on mount
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
        if (cred.user && !cred.user.emailVerified) {
          await cred.user.sendEmailVerification();
          localStorage.setItem('focus_remembered_creds', JSON.stringify({ email, password }));
          await auth.signOut();
          setVerificationEmail(email);
        } else if (cred.user && cred.user.emailVerified) {
          localStorage.removeItem('focus_remembered_creds');
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if (cred.user) {
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
      console.error("Auth error details:", err.code, err.message);

      if (isResetting) {
        if (err.code === 'auth/user-not-found') setError("No account found with this email");
        else if (err.code === 'auth/invalid-email') setError("Invalid email format");
        else setError("Reset failed. Try again.");
      } else if (isLogin) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
          setError("Password or Email Incorrect");
        } else setError("Login failed. Check connection.");
      } else {
        if (err.code === 'auth/email-already-in-use') setError("User already exists. Sign in?");
        else if (err.message === "Passwords do not match") setError("Passwords do not match");
        else if (err.code === 'auth/weak-password') setError("Password too weak");
        else if (err.code === 'auth/invalid-email') setError("Invalid email format");
        else setError("Registration error. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setIsResetting(false);
    setError(null);
    if (!isLogin) {
        const saved = localStorage.getItem('focus_remembered_creds');
        if (saved) {
            const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
            setEmail(savedEmail || '');
            setPassword(savedPassword || '');
        }
    } else {
        setEmail('');
        setPassword('');
    }
    setConfirmPassword('');
    setName('');
    setVerificationEmail(null);
    setResetSentEmail(null);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  const returnToLogin = () => {
    setVerificationEmail(null);
    setResetSentEmail(null);
    setIsResetting(false);
    setIsLogin(true);
    setError(null);
  };

  if (verificationEmail) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[3000]">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_50%)] pointer-events-none" />
        <div className="w-full max-w-sm apple-blur rounded-[3rem] p-10 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
            <Mail size={40} className="text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Check your email</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            We have sent you a verification email to <span className="text-white font-semibold">{verificationEmail}</span>. 
            Please verify your account and then log in.
          </p>
          <button onClick={returnToLogin} className="w-full bg-white text-black rounded-[1.75rem] py-5 px-6 text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center shadow-xl">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (resetSentEmail) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[3000]">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_50%)] pointer-events-none" />
        <div className="w-full max-w-sm apple-blur rounded-[3rem] p-10 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
            <Key size={40} className="text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Reset link sent</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            We sent you a password change link to <span className="text-white font-semibold">{resetSentEmail}</span>. 
            Follow the instructions in the email to reset your password.
          </p>
          <button onClick={returnToLogin} className="w-full bg-white text-black rounded-[1.75rem] py-5 px-6 text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center shadow-xl">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[3000] overflow-y-auto hide-scrollbar">
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.03)_0%,transparent_50%),radial-gradient(circle_at_70%_70%,rgba(255,100,0,0.02)_0%,transparent_50%)] pointer-events-none" />

      <div className={`w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl">{isResetting ? "🔑" : "⏳"}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{isResetting ? "Recovery" : "Focus"}</h2>
          <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-black">{isResetting ? "Password Reset" : (isLogin ? "Welcome Back" : "New Account")}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && !isResetting && (
            <div className="space-y-2 group">
              <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black ml-4 group-focus-within:text-white transition-colors">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-white/10 focus:bg-white/10 transition-all text-white placeholder:text-zinc-800" required={!isLogin && !isResetting} />
            </div>
          )}

          <div className="space-y-2 group">
            <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black ml-4 group-focus-within:text-white transition-colors">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={`w-full bg-white/5 border rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:bg-white/10 transition-all text-white placeholder:text-zinc-800 ${error && error.includes('Email') ? 'border-red-500/50' : 'border-white/5'}`} required />
          </div>

          {!isResetting && (
            <div className="space-y-2 group">
              <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black ml-4 group-focus-within:text-white transition-colors">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={`w-full bg-white/5 border rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:bg-white/10 transition-all text-white placeholder:text-zinc-800 ${error && error.includes('Password') ? 'border-red-500/50' : 'border-white/5'}`} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isLogin && (
                <div className="flex justify-end pr-2">
                  <button type="button" onClick={() => { setIsResetting(true); setError(null); }} className="text-[10px] text-zinc-600 hover:text-white transition-colors font-bold uppercase tracking-widest">Forgot password?</button>
                </div>
              )}
            </div>
          )}

          {!isLogin && !isResetting && (
            <div className="space-y-2 group">
              <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black ml-4 group-focus-within:text-white transition-colors">Confirm</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className={`w-full bg-white/5 border rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:bg-white/10 transition-all text-white placeholder:text-zinc-800 ${error && error.includes('match') ? 'border-red-500/50' : 'border-white/5'}`} required={!isLogin} />
            </div>
          )}

          {error && (
            <div className={`p-5 rounded-2xl flex items-center space-x-3 transition-all animate-in slide-in-from-top-4 duration-500 cursor-pointer group active:scale-[0.98] ${error === "User already exists. Sign in?" ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/10'}`} onClick={() => { if (error === "User already exists. Sign in?") switchMode(); }}>
              <div className="flex-shrink-0">{error === "User already exists. Sign in?" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}</div>
              <span className="text-[11px] font-bold tracking-tight leading-snug">{error}</span>
              {error === "User already exists. Sign in?" && <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-white text-black rounded-[1.75rem] py-5 px-6 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center mt-6">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isResetting ? "Get Reset Link" : (isLogin ? "Sign In" : "Sign Up"))}
          </button>
        </form>

        <div className="mt-10 text-center space-y-4">
          {isResetting ? (
            <button onClick={() => { setIsResetting(false); setIsLogin(true); setError(null); }} className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-[0.2em] transition-colors">Back to Sign In</button>
          ) : (
            <button onClick={switchMode} className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-[0.2em] transition-colors">{isLogin ? "Create an account" : "Back to sign in"}</button>
          )}
        </div>
      </div>

      <div className="mt-12 flex items-center space-x-4 opacity-10">
        <div className="w-8 h-[1px] bg-white" />
        <p className="text-[9px] text-white font-black uppercase tracking-[0.8em]">Focus v2.2</p>
        <div className="w-8 h-[1px] bg-white" />
      </div>
    </div>
  );
};

export default Auth;
