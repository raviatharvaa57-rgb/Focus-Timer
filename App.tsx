
import React, { useState } from 'react';
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
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden select-none relative text-white">
      {/* Decorative Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[60] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      
      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Navigation Tab Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[1000]">
        <nav className="bg-[#1c1c1e]/60 backdrop-blur-[40px] rounded-[2.8rem] h-20 border border-white/10 px-2 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <TabButton 
            active={activeTab === 'clock'} 
            onClick={() => setActiveTab('clock')} 
            icon={<ClockIcon size={22} strokeWidth={1.5} />} 
            label="Clock" 
          />
          <TabButton 
            active={activeTab === 'alarm'} 
            onClick={() => setActiveTab('alarm')} 
            icon={<AlarmClock size={22} strokeWidth={1.5} />} 
            label="Alarm" 
          />
          <TabButton 
            active={activeTab === 'stopwatch'} 
            onClick={() => setActiveTab('stopwatch')} 
            icon={<StopwatchIcon size={22} strokeWidth={1.5} />} 
            label="Stop" 
          />
          <TabButton 
            active={activeTab === 'timer'} 
            onClick={() => setActiveTab('timer')} 
            icon={<TimerIcon size={22} strokeWidth={1.5} />} 
            label="Focus" 
          />
        </nav>
      </div>
      
      {/* Home Indicator Spacer */}
      <div className="h-4 bg-transparent safe-bottom" />
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
    className={`flex flex-col items-center justify-center space-y-1.5 flex-1 h-full transition-all duration-500 ${
      active ? 'text-white translate-y-[-2px]' : 'text-zinc-500'
    }`}
  >
    <div className={`relative flex items-center justify-center p-2.5 rounded-2xl transition-all duration-500 ${
      active ? 'bg-white/10 shadow-lg shadow-white/5' : 'bg-transparent'
    }`}>
      {icon}
      {active && (
        <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_5px_white]" />
      )}
    </div>
    <span className={`text-[9px] font-bold tracking-[0.1em] transition-all duration-500 uppercase ${active ? 'opacity-100' : 'opacity-40'}`}>
      {label}
    </span>
  </button>
);

export default App;
