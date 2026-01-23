
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
      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Navigation Tab Bar - Exactly like the screenshot */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[1000]">
        <nav className="bg-[#1c1c1e]/80 backdrop-blur-3xl rounded-[2.5rem] h-20 border border-white/5 px-2 flex justify-around items-center shadow-2xl">
          <TabButton 
            active={activeTab === 'clock'} 
            onClick={() => setActiveTab('clock')} 
            icon={<ClockIcon size={22} strokeWidth={1.5} />} 
            label="CLOCK" 
          />
          <TabButton 
            active={activeTab === 'alarm'} 
            onClick={() => setActiveTab('alarm')} 
            icon={<AlarmClock size={22} strokeWidth={1.5} />} 
            label="ALARM" 
          />
          <TabButton 
            active={activeTab === 'stopwatch'} 
            onClick={() => setActiveTab('stopwatch')} 
            icon={<StopwatchIcon size={22} strokeWidth={1.5} />} 
            label="STOPWATCH" 
          />
          <TabButton 
            active={activeTab === 'timer'} 
            onClick={() => setActiveTab('timer')} 
            icon={<TimerIcon size={22} strokeWidth={1.5} />} 
            label="TIMER" 
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
    className={`flex flex-col items-center justify-center space-y-1.5 flex-1 h-full transition-all duration-300 ${
      active ? 'text-white' : 'text-zinc-500'
    }`}
  >
    <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${active ? 'bg-white/10' : ''}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold tracking-[0.1em] transition-all duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
      {label}
    </span>
  </button>
);

export default App;
