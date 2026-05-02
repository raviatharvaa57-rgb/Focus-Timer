
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { LapTime } from '../types';

interface StopwatchProps {
  isDarkMode: boolean;
}

const Stopwatch: React.FC<StopwatchProps> = ({ isDarkMode }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => setIsRunning(!isRunning);

  const handleLapReset = () => {
    if (isRunning) {
      const lastLapTime = laps.length > 0 ? laps[0].time : 0;
      const newLap: LapTime = {
        id: laps.length + 1,
        time: time,
        diff: time - lastLapTime
      };
      setLaps([newLap, ...laps]);
    } else {
      setTime(0);
      setLaps([]);
    }
  };

  return (
    <div className={`h-full flex flex-col safe-top transition-colors duration-700 ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'}`}>
      <header className="px-8 pt-12 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Stopwatch</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`text-[5.5rem] font-thin tracking-tighter tabular-nums mb-12 transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {formatTime(time)}
        </div>
        
        <div className="flex items-center justify-center gap-10 w-full max-w-xs mb-16 px-4">
          <button 
            onClick={handleLapReset}
            className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-xl ${
              isDarkMode
                ? 'apple-blur text-white/40 border border-white/5 active:bg-white/10'
                : 'bg-slate-50 text-slate-500 border border-slate-200 active:bg-slate-100'
            }`}
            aria-label={isRunning ? "Lap" : "Reset"}
          >
            {isRunning ? (
              <Flag size={20} strokeWidth={1.5} />
            ) : (
              <RotateCcw size={20} strokeWidth={1.5} />
            )}
          </button>
          
          <button 
            onClick={handleStartStop}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${
              isRunning 
                ? isDarkMode
                  ? 'bg-white/10 text-white border border-white/20 apple-blur'
                  : 'bg-slate-900 text-white border border-slate-900'
                : isDarkMode
                  ? 'bg-white text-black shadow-white/10'
                  : 'bg-slate-900 text-white shadow-slate-300/40'
            }`}
            aria-label={isRunning ? "Stop" : "Start"}
          >
            {isRunning ? (
              <Pause size={22} strokeWidth={1.5} fill="currentColor" />
            ) : (
              <Play size={22} className="ml-1" strokeWidth={1.5} fill="currentColor" />
            )}
          </button>
        </div>
      </div>

      <div className={`h-1/3 overflow-y-auto px-8 pt-4 pb-32 hide-scrollbar transition-colors duration-700 ${isDarkMode ? 'border-t border-white/5' : 'border-t border-slate-200'}`}>
        {laps.map((lap, index) => (
          <div key={lap.id} className={`flex justify-between py-5 text-xl font-light transition-colors duration-700 ${isDarkMode ? 'border-b border-white/5' : 'border-b border-slate-200'}`}>
            <span className={isDarkMode ? 'text-zinc-500' : 'text-slate-500'}>Lap {laps.length - index}</span>
            <span className="tabular-nums">{formatTime(lap.time)}</span>
          </div>
        ))}
        {laps.length === 0 && (
          <div className={`h-full flex items-center justify-center text-[10px] uppercase tracking-[0.3em] mt-10 font-bold opacity-30 ${isDarkMode ? 'text-zinc-700' : 'text-slate-400'}`}>
            No Laps
          </div>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
