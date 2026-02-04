
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Settings2 } from 'lucide-react';
import { FOCUS_THEMES, PRESETS } from '../constants';
import ThemeAnimator from './ThemeAnimator';

const ZEN_BOWL_URL = 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3';

interface TimerProps {
  isCustomizing: boolean;
  setIsCustomizing: (val: boolean) => void;
}

const Timer: React.FC<TimerProps> = ({ isCustomizing, setIsCustomizing }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  
  const [customMinutes, setCustomMinutes] = useState(25);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentTheme = FOCUS_THEMES[themeIndex];

  useEffect(() => {
    const alarm = new Audio(ZEN_BOWL_URL);
    alarm.volume = 0.5;
    alarmAudioRef.current = alarm;
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current = null;
    }
    if (currentTheme.soundUrl) {
      const audio = new Audio(currentTheme.soundUrl);
      audio.loop = true;
      audio.volume = 0;
      ambientAudioRef.current = audio;
      if (isActive && !isMuted) {
        audio.play().catch(() => {});
        let vol = 0;
        const fade = setInterval(() => {
          vol += 0.05;
          if (vol >= 0.3) { audio.volume = 0.3; clearInterval(fade); }
          else audio.volume = vol;
        }, 150);
      }
    }
    return () => { if (ambientAudioRef.current) ambientAudioRef.current.pause(); };
  }, [themeIndex, isActive, isMuted]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            alarmAudioRef.current?.play();
            if (window.navigator.vibrate) window.navigator.vibrate([400, 100, 400]);
            return totalTime;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, totalTime]);

  const toggleTimer = () => { setIsActive(!isActive); if (window.navigator.vibrate) window.navigator.vibrate(10); };
  const resetTimer = () => { setIsActive(false); setTimeLeft(totalTime); if (window.navigator.vibrate) window.navigator.vibrate(5); };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const nextTheme = useCallback(() => {
    setThemeIndex((prev) => (prev + 1) % FOCUS_THEMES.length);
    if (window.navigator.vibrate) window.navigator.vibrate(8);
  }, []);

  const openPicker = () => {
    setIsActive(false);
    setIsCustomizing(true);
    if (window.navigator.vibrate) window.navigator.vibrate(12);
  };

  return (
    <div className={`relative flex flex-col items-center h-full w-full bg-black overflow-hidden transition-all duration-1000`}>
      {/* Background with Theme Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.bgGradient} opacity-40 transition-all duration-1000`} />
      
      {/* HEADER */}
      <header className="w-full flex justify-between items-start pt-16 pb-2 px-10 z-50 relative pointer-events-none">
        <div className="flex flex-col">
          <h1 className="text-5xl font-bold tracking-tight text-white/95">Focus</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] font-black mt-2 opacity-30 text-white">
              {currentTheme.name}
          </p>
        </div>
      </header>

      {/* CENTER CONTENT */}
      <div className="w-full flex-1 flex flex-col items-center justify-center relative z-10 px-6 -mt-12">
        {/* Theme Bubble Container - Reduced to w-52 h-52 (a bit small) */}
        <div 
          className="relative w-52 h-52 flex flex-col items-center justify-center cursor-pointer group mb-10"
          onClick={nextTheme}
        >
          {/* Bubble Ring - Matches promo image ring */}
          <div 
            className="absolute inset-0 rounded-full border-[2px] bg-white/[0.03] backdrop-blur-md transition-all duration-700 group-hover:scale-105 group-active:scale-95 shadow-[0_0_35px_rgba(0,0,0,0.5)]" 
            style={{ borderColor: currentTheme.color + 'AA' }} 
          />
          
          {/* Animated Component - Scaled to scale-[0.7] to fit comfortably in the smaller ring */}
          <div className="scale-[0.7] transition-transform duration-700 z-10">
             <ThemeAnimator themeId={currentTheme.id} />
          </div>
        </div>

        {/* Digital Time - Kept big as previously requested */}
        <button 
          onClick={openPicker}
          className="text-7xl font-extralight tracking-tight leading-none tabular-nums text-white/90 mb-10 active:scale-95 transition-transform focus:outline-none"
        >
          {formatTime(timeLeft)}
        </button>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5 mb-12">
          {FOCUS_THEMES.map((t, idx) => (
            <div 
              key={idx} 
              className={`w-1 h-1 rounded-full transition-all duration-700 ${themeIndex === idx ? 'opacity-100 scale-125' : 'opacity-10 scale-100'}`}
              style={{ backgroundColor: themeIndex === idx ? currentTheme.color : '#fff' }}
            />
          ))}
        </div>

        {/* CONTROLS - All buttons same size */}
        <div className="flex items-center justify-center gap-8">
          <button onClick={resetTimer} className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90 shadow-lg">
            <RotateCcw size={18} strokeWidth={1.5} />
          </button>
          
          <button onClick={toggleTimer} className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-[0_15px_45px_rgba(255,255,255,0.05)] bg-white text-black">
            {isActive ? (
                <Pause size={18} fill="black" />
            ) : (
                <Play size={18} fill="black" className="ml-0.5" />
            )}
          </button>

          <button onClick={openPicker} className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90 shadow-lg">
            <Settings2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* CUSTOMIZE OVERLAY */}
      {isCustomizing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsCustomizing(false)} />
          <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            <h3 className="text-[9px] font-black mb-10 text-center opacity-30 uppercase tracking-[0.5em]">Set Duration</h3>
            
            <div className="flex items-center justify-center space-x-10 mb-10">
              <button onClick={() => setCustomMinutes(m => Math.max(1, m - 1))} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><Minus size={20} /></button>
              <div className="text-center min-w-[80px]">
                <div className="text-6xl font-extralight tabular-nums text-white leading-none">{customMinutes}</div>
                <div className="text-[8px] uppercase tracking-widest font-black opacity-20 mt-2">Mins</div>
              </div>
              <button onClick={() => setCustomMinutes(m => Math.min(180, m + 1))} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><Plus size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-10">
              {[15, 25, 45, 60].map(min => (
                <button 
                  key={min}
                  onClick={() => setCustomMinutes(min)}
                  className={`py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${customMinutes === min ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
                >
                  {min} MINS
                </button>
              ))}
            </div>

            <button 
              onClick={() => { setTotalTime(customMinutes * 60); setTimeLeft(customMinutes * 60); setIsActive(true); setIsCustomizing(false); }} 
              className="w-full py-5 rounded-[2rem] text-black text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl" 
              style={{ backgroundColor: currentTheme.color }}
            >
              Start Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
