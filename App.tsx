
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Hourglass as TimerIcon, 
  AlarmClock, 
  Timer as StopwatchIcon, 
  Globe as ClockIcon,
  User as UserIcon,
  ListChecks as TasksIcon,
  Plus,
  LogOut
} from 'lucide-react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebase';
import { AppTab } from './types';
import Timer from './components/Timer';
import Alarm from './components/Alarm';
import Stopwatch from './components/Stopwatch';
import Clock from './components/Clock';
import Tasks from './components/Tasks';
import AppUsageActivity from './components/AppUsageActivity';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { FOCUS_THEMES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const [previousTab, setPreviousTab] = useState<AppTab>('timer');
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isActionActive, setIsActionActive] = useState(false);
  const [isImmersiveLandscape, setIsImmersiveLandscape] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [currentSessionTime, setCurrentSessionTime] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const metadata = currentUser.metadata;
        const isNewUser = metadata?.creationTime === metadata?.lastSignInTime;
        if (isNewUser && !currentUser.emailVerified) {
          setUser(null);
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const checkRes = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsImmersiveLandscape(isLandscape && window.innerWidth < 1000);
    };
    window.addEventListener('resize', checkRes);
    checkRes();
    return () => unsubscribe();
  }, []);

  // Session timer effect
  useEffect(() => {
    const startTime = Date.now();
    setSessionStartTime(startTime);

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentSessionTime(now - startTime);
    }, 1000);

    // Save session when component unmounts (app closes)
    return () => {
      clearInterval(interval);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Only save sessions longer than 10 seconds to avoid accidental closes
      if (duration > 10000) {
        const sessionRecord = {
          id: `session_${startTime}`,
          startTime,
          endTime,
          duration,
          date: new Date().toISOString(),
        };

        // Load existing history
        const existingHistory = localStorage.getItem('appUsageSessions');
        let history: any[] = [];
        if (existingHistory) {
          try {
            history = JSON.parse(existingHistory);
          } catch (error) {
            console.error('Error parsing session history:', error);
          }
        }

        // Add new session and save
        history.push(sessionRecord);
        localStorage.setItem('appUsageSessions', JSON.stringify(history));
      }
    };
  }, []);

  const handleTabChange = useCallback((tab: AppTab) => {
    if (activeTab === tab) return;
    setPreviousTab(activeTab);
    setActiveTab(tab);
    setIsActionActive(false);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  }, [activeTab]);

  const openTasksTab = () => {
    if (activeTab !== 'tasks') {
      setPreviousTab(activeTab);
      setActiveTab('tasks');
      setShowProfile(false);
    }
  };

  const exitTasks = () => {
    setActiveTab(previousTab || 'timer');
    setPreviousTab('timer');
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  if (loading) return null;
  if (!user) return <Auth />;

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden select-none text-white transition-opacity duration-1000">
      {/* Background Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[180%] h-[500px] blur-[140px] opacity-[0.1] pointer-events-none transition-all duration-1000 z-0"
        style={{ background: `radial-gradient(circle, #8D6E63 0%, transparent 70%)`, transform: 'translateX(-50%) translateY(-40%)' }}
      />

      {/* MATCHED TOP-RIGHT ACTIONS */}
      {!isImmersiveLandscape && activeTab !== 'tasks' && activeTab !== 'appUsage' && (
        <div className="fixed z-[100] top-12 right-8 flex items-center gap-3">
          <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 bg-white/5 border border-white/5 active:scale-90 backdrop-blur-md">
            <UserIcon size={16} />
          </button>
          <button onClick={openTasksTab} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 bg-white/5 border border-white/5 active:scale-90 backdrop-blur-md">
            <TasksIcon size={16} />
          </button>
          <button onClick={() => setIsActionActive(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 bg-white/5 border border-white/5 active:scale-90 backdrop-blur-md">
            <Plus size={18} strokeWidth={2} />
          </button>
          <button onClick={handleSignOut} className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 bg-white/5 border border-white/5 active:scale-90 backdrop-blur-md">
            <LogOut size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden">
        {/* Render all tabs simultaneously but hide inactive ones to keep background processes running */}
        <div className={`absolute inset-0 ${activeTab === 'timer' ? 'block' : 'hidden'}`}>
          <Timer isCustomizing={isActionActive} setIsCustomizing={setIsActionActive} />
        </div>
        
        <div className={`absolute inset-0 ${activeTab === 'alarm' ? 'block' : 'hidden'}`}>
          <Alarm user={user} isAdding={isActionActive} setIsAdding={setIsActionActive} />
        </div>
        
        <div className={`absolute inset-0 ${activeTab === 'stopwatch' ? 'block' : 'hidden'}`}>
          <Stopwatch />
        </div>
        
        <div className={`absolute inset-0 ${activeTab === 'clock' ? 'block' : 'hidden'}`}>
          <Clock user={user} isAdding={isActionActive} setIsAdding={setIsActionActive} />
        </div>

        <div className={`absolute inset-0 ${activeTab === 'tasks' ? 'block' : 'hidden'}`}>
          <Tasks onExit={exitTasks} />
        </div>

        <div className={`absolute inset-0 ${activeTab === 'appUsage' ? 'block' : 'hidden'}`}>
          <AppUsageActivity onClose={exitTasks} currentSessionTime={currentSessionTime} />
        </div>
      </main>

      {showProfile && <Profile onClose={() => setShowProfile(false)} onOpenStock={() => { setShowProfile(false); setPreviousTab(activeTab); setActiveTab('appUsage'); }} />}

      {/* MATCHED BOTTOM NAVIGATION - Moved lower by reducing bottom padding and height */}
      {!isImmersiveLandscape && activeTab !== 'appUsage' && (
        <div className="w-full px-6 pb-3 safe-bottom z-[1000]">
          <nav className="mx-auto max-w-lg h-18 bg-black/40 backdrop-blur-[60px] rounded-[3rem] border border-white/[0.05] px-3 flex justify-around items-center shadow-2xl">
            <TabButton active={activeTab === 'clock'} onClick={() => handleTabChange('clock')} icon={<ClockIcon size={20} strokeWidth={1.5} />} label="WORLD" />
            <TabButton active={activeTab === 'alarm'} onClick={() => handleTabChange('alarm')} icon={<AlarmClock size={20} strokeWidth={1.5} />} label="ALARM" />
            <TabButton active={activeTab === 'stopwatch'} onClick={() => handleTabChange('stopwatch')} icon={<StopwatchIcon size={20} strokeWidth={1.5} />} label="STOP" />
            <TabButton active={activeTab === 'timer'} onClick={() => handleTabChange('timer')} icon={<TimerIcon size={20} strokeWidth={1.5} />} label="FOCUS" />
          </nav>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 flex-1 h-12 rounded-2xl transition-all duration-500 active:scale-95 ${active ? 'bg-white/5 text-white' : 'text-zinc-600'}`}>
    <div className={`flex items-center justify-center transition-all ${active ? 'scale-110' : 'opacity-60'}`}>
      {icon}
    </div>
    <span className={`text-[7px] font-black tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-30'}`}>
      {label}
    </span>
  </button>
);

export default App;
