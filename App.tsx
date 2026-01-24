
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Hourglass as TimerIcon, 
  AlarmClock, 
  Timer as StopwatchIcon, 
  Globe as ClockIcon,
  User as UserIcon,
  LogOut,
  Plus
} from 'lucide-react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebase';
import { AppTab } from './types';
import Timer from './components/Timer';
import Alarm from './components/Alarm';
import Stopwatch from './components/Stopwatch';
import Clock from './components/Clock';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { FOCUS_THEMES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isActionActive, setIsActionActive] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = useCallback((tab: AppTab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setIsActionActive(false);
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  }, [activeTab]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      if (window.navigator.vibrate) window.navigator.vibrate(10);
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const getDomeColor = () => {
    if (activeTab === 'timer') return FOCUS_THEMES[0].color;
    if (activeTab === 'alarm') return '#f97316'; // Vivid Orange for Alarm
    if (activeTab === 'clock') return '#3b82f6'; // Deep Blue for World Clock
    if (activeTab === 'stopwatch') return '#ffffff'; // White for Stopwatch
    return '#ffffff';
  };

  const renderContent = () => {
    if (!user) return null;
    switch (activeTab) {
      case 'timer': return <Timer isCustomizing={isActionActive} setIsCustomizing={setIsActionActive} />;
      case 'alarm': return <Alarm user={user} isAdding={isActionActive} setIsAdding={setIsActionActive} />;
      case 'stopwatch': return <Stopwatch />;
      case 'clock': return <Clock user={user} isAdding={isActionActive} setIsAdding={setIsActionActive} />;
      default: return <Timer isCustomizing={isActionActive} setIsCustomizing={setIsActionActive} />;
    }
  };

  if (loading) return null;
  if (!user) return <Auth />;

  const showPlusButton = activeTab === 'timer' || activeTab === 'alarm';

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden select-none text-white transition-opacity duration-700">
      {/* Immersive Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-[60] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      
      {/* Tab Dome - Atmospheric Glow focused at the top */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[180%] h-[400px] blur-[140px] opacity-[0.12] pointer-events-none transition-all duration-1000 ease-in-out z-0"
        style={{ 
          background: `radial-gradient(circle, ${getDomeColor()} 0%, transparent 70%)`,
          transform: `translateX(-50%) translateY(-50%)`
        }}
      />

      {/* Global Actions */}
      <div className="fixed top-16 right-8 z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
        <button 
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all bg-white/5 border border-white/10 active:scale-90 shadow-xl backdrop-blur-md"
        >
          <UserIcon size={18} strokeWidth={1.5} />
        </button>

        {showPlusButton && (
          <button 
            onClick={() => setIsActionActive(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-orange-500 hover:text-orange-400 transition-all bg-white/10 border border-white/10 active:scale-90 shadow-xl backdrop-blur-md"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        )}

        <button 
          onClick={handleSignOut}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:text-white transition-all bg-white/5 border border-white/5 active:scale-90 shadow-xl backdrop-blur-md"
        >
          <LogOut size={16} />
        </button>
      </div>

      <main className="flex-1 relative overflow-hidden">
        {renderContent()}
      </main>

      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}

      {/* Modern Navigation Bar inspired by promo */}
      <div className="w-full px-5 safe-bottom z-[1000] mb-8">
        <nav className="mx-auto max-w-lg h-24 apple-blur rounded-[3.5rem] border border-white/5 px-4 flex justify-around items-center shadow-[0_40px_80px_rgba(0,0,0,1)] transition-all duration-500">
          <TabButton 
            active={activeTab === 'clock'} 
            onClick={() => handleTabChange('clock')} 
            icon={<ClockIcon size={26} strokeWidth={1.5} />} 
            label="World" 
          />
          <TabButton 
            active={activeTab === 'alarm'} 
            onClick={() => handleTabChange('alarm')} 
            icon={<AlarmClock size={26} strokeWidth={1.5} />} 
            label="Alarm" 
          />
          <TabButton 
            active={activeTab === 'stopwatch'} 
            onClick={() => handleTabChange('stopwatch')} 
            icon={<StopwatchIcon size={26} strokeWidth={1.5} />} 
            label="Stop" 
          />
          <TabButton 
            active={activeTab === 'timer'} 
            onClick={() => handleTabChange('timer')} 
            icon={<TimerIcon size={26} strokeWidth={1.5} />} 
            label="Focus" 
          />
        </nav>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-2 flex-1 h-full transition-all duration-500 active:scale-95 relative ${
      active ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
    }`}
  >
    <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 ${
      active ? 'bg-white/10 shadow-inner' : 'bg-transparent'
    }`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black tracking-[0.2em] transition-all duration-500 uppercase ${active ? 'opacity-100' : 'opacity-20'}`}>
      {label}
    </span>
  </button>
);

export default App;
