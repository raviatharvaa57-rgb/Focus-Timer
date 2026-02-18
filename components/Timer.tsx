
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

  const playAlarmThrice = useCallback(() => {
    if (!alarmAudioRef.current) return;
    let count = 1;
    const audio = alarmAudioRef.current;
    
    const onEnded = () => {
      if (count < 3) {
        count++;
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audio.removeEventListener('ended', onEnded);
      }
    };

    audio.addEventListener('ended', onEnded);
    audio.currentTime = 0;
    audio.play().catch(e => console.error("Audio play failed:", e));
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
            playAlarmThrice();
            if (window.navigator.vibrate) window.navigator.vibrate([400, 100, 400]);
            return totalTime;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, totalTime, playAlarmThrice]);

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
    <div className={`relative flex flex-col h-full w-full bg-black overflow-hidden transition-all duration-1000`}>
      {/* Background with Theme Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.bgGradient} opacity-30 transition-all duration-1000`} />
      
      {/* HEADER */}
      <header className="w-full flex flex-col items-start pt-16 lg:pt-14 pb-2 px-10 z-50 relative pointer-events-none">
        <h1 className="text-4xl lg:text-3xl font-bold tracking-tight text-white/90">Focus</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] font-black mt-1 opacity-30 text-white">
            {currentTheme.name}
        </p>
      </header>

      {/* CONTENT AREA - justify-between pushes bottom group down. Reduced pb from 12/20 to 4/8 to lower the pill. */}
      <div className="w-full flex-1 flex flex-col items-center justify-between relative z-10 px-6 pt-4 pb-4 lg:pb-8">
        
        {/* Top Group: Theme and Time */}
        <div className="flex flex-col items-center flex-1 justify-center lg:gap-10">
          {/* Theme Bubble */}
          <div 
            className="relative w-52 h-52 lg:w-48 lg:h-48 flex flex-col items-center justify-center cursor-pointer group mb-4"
            onClick={nextTheme}
          >
            {/* Bubble Ring */}
            <div 
              className="absolute inset-0 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md transition-all duration-700 group-hover:scale-105 group-active:scale-95 shadow-2xl" 
            />
            
            {/* Animated Component */}
            <div className="scale-[0.85] lg:scale-[0.8] transition-transform duration-700 z-10">
               <ThemeAnimator themeId={currentTheme.id} />
            </div>
          </div>

          {/* Time and Dots */}
          <div className="flex flex-col items-center">
            <button 
              onClick={openPicker}
              className="text-[6.5rem] lg:text-[6rem] font-bold tracking-tighter leading-none tabular-nums text-white mb-2 active:scale-95 transition-transform focus:outline-none"
            >
              {formatTime(timeLeft)}
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2">
              {FOCUS_THEMES.map((t, idx) => (
                <div 
                  key={idx} 
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${themeIndex === idx ? 'opacity-100 scale-125' : 'opacity-10'}`}
                  style={{ backgroundColor: themeIndex === idx ? currentTheme.color : '#fff' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Group: The Control Pill - Moved down by reducing mb from 4/8 to 2/4 */}
        <div className="flex items-center justify-center gap-6 lg:gap-10 bg-zinc-900/60 backdrop-blur-3xl py-4 lg:py-5 px-7 lg:px-10 rounded-[2.5rem] border border-white/5 shadow-2xl mt-8 lg:mt-0 mb-2 lg:mb-4">
          <button 
            onClick={resetTimer} 
            className="w-12 h-12 lg:w-11 lg:h-11 rounded-full bg-white/[0.05] border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
          >
            <RotateCcw size={18} strokeWidth={2} />
          </button>
          
          <button 
            onClick={toggleTimer} 
            className="w-16 h-16 lg:w-16 lg:h-16 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] bg-white text-black"
          >
            {isActive ? (
                <Pause size={24} fill="currentColor" />
            ) : (
                <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button 
            onClick={openPicker} 
            className="w-12 h-12 lg:w-11 lg:h-11 rounded-full bg-white/[0.05] border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
          >
            <Settings2 size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* CUSTOMIZE OVERLAY */}
      {isCustomizing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsCustomizing(false)} />
          <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            <h3 className="text-[10px] font-black mb-8 text-center opacity-30 uppercase tracking-[0.5em]">Set Duration</h3>
            
            <div className="flex items-center justify-center space-x-10 mb-10">
              <button onClick={() => setCustomMinutes(m => Math.max(1, m - 1))} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><Minus size={20} /></button>
              <div className="text-center min-w-[80px]">
                <div className="text-6xl font-light tabular-nums text-white leading-none">{customMinutes}</div>
                <div className="text-[9px] uppercase tracking-widest font-bold opacity-20 mt-2">Mins</div>
              </div>
              <button onClick={() => setCustomMinutes(m => Math.min(180, m + 1))} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><Plus size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-10">
              {[15, 25, 45, 60].map(min => (
                <button 
                  key={min}
                  onClick={() => setCustomMinutes(min)}
                  className={`py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${customMinutes === min ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
                >
                  {min} MINS
                </button>
              ))}
            </div>

            <button 
              onClick={() => { 
                setTotalTime(customMinutes * 60); 
                setTimeLeft(customMinutes * 60); 
                setIsCustomizing(false); 
              }} 
              className="w-full py-5 rounded-[2rem] text-black text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl" 
              style={{ backgroundColor: currentTheme.color }}
            >
              Set Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
