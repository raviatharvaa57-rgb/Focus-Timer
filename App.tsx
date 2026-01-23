
import React, { useState, useCallback } from 'react';
import { 
  Hourglass as TimerIcon, 
  AlarmClock, 
  Timer as StopwatchIcon, 
  Globe as ClockIcon 
} from 'lucide-react';
import { AppTab } from './types';
import Timer from './components/Timer';
import Alarm from './components/Alarm';
import Stopwatch from './components/Stopwatch';
import Clock from './components/Clock';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('timer');

  const handleTabChange = useCallback((tab: AppTab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    if (window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'timer': return <Timer />;
      case 'alarm': return <Alarm />;
      case 'stopwatch': return <Stopwatch />;
      case 'clock': return <Clock />;
      default: return <Timer />;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden select-none text-white">
      {/* Visual Overlay Layer */}
      <div className="fixed inset-0 pointer-events-none z-[60] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {renderContent()}
      </main>

      {/* Tab Bar Container - Moved lower with mb-2 and shorter height h-16 */}
      <div className="w-full px-5 safe-bottom z-[1000] mb-2">
        <nav className="mx-auto max-w-lg h-16 apple-blur rounded-[2rem] border border-white/10 px-2 flex justify-around items-center shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
          <TabButton 
            active={activeTab === 'clock'} 
            onClick={() => handleTabChange('clock')} 
            icon={<ClockIcon size={18} strokeWidth={1.5} />} 
            label="World" 
          />
          <TabButton 
            active={activeTab === 'alarm'} 
            onClick={() => handleTabChange('alarm')} 
            icon={<AlarmClock size={18} strokeWidth={1.5} />} 
            label="Alarm" 
          />
          <TabButton 
            active={activeTab === 'stopwatch'} 
            onClick={() => handleTabChange('stopwatch')} 
            icon={<StopwatchIcon size={18} strokeWidth={1.5} />} 
            label="Stop" 
          />
          <TabButton 
            active={activeTab === 'timer'} 
            onClick={() => handleTabChange('timer')} 
            icon={<TimerIcon size={18} strokeWidth={1.5} />} 
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
    className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition-all duration-300 active:scale-90 ${
      active ? 'text-white' : 'text-zinc-500'
    }`}
  >
    <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
      active ? 'bg-white/10' : 'bg-transparent'
    }`}>
      {icon}
      {active && (
        <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
      )}
    </div>
    <span className={`text-[8px] font-bold tracking-[0.12em] transition-all duration-300 uppercase ${active ? 'opacity-100' : 'opacity-40'}`}>
      {label}
    </span>
  </button>
);

export default App;
