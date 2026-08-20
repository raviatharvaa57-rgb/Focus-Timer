import React, { useState } from 'react';
import Timer from './components/Timer';

const App: React.FC = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleFocusSessionComplete = (minutes: number) => {
    console.log(`Focus session complete: ${minutes} minutes`);
  };

  const handleMascotAction = (action: 'start' | 'pause' | 'reset' | 'milestone') => {
    console.log(`Mascot action triggered: ${action}`);
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
      <Timer
        isCustomizing={isCustomizing}
        setIsCustomizing={setIsCustomizing}
        onFocusSessionComplete={handleFocusSessionComplete}
        onMascotAction={handleMascotAction}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default App;