
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { FOCUS_THEMES, PRESETS } from '../constants';
import ThemeAnimator from './ThemeAnimator';

const ZEN_BOWL_URL = 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3';

const ThemeBackgroundFX: React.FC<{ themeId: string; isActive: boolean }> = ({ themeId, isActive }) => {
  const [particles] = useState(() => [...Array(25)].map(() => ({
    id: Math.random(),
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 5 + Math.random() * 15,
    delay: Math.random() * 5,
    size: 2 + Math.random() * 8
  })));

  const renderBackgroundElements = () => {
    switch (themeId) {
      case 'night':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute bg-white rounded-full animate-pulse shadow-[0_0_12px_white]"
                style={{ width: '1.5px', height: '1.5px', left: p.left + '%', top: p.top + '%', animationDelay: p.delay + 's', opacity: 0.4 }}
              />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(100,100,255,0.15)_0%,transparent_70%)]" />
          </>
        );
      case 'snow':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute text-white/10 animate-[fall_15s_linear_infinite]"
                style={{ left: p.left + '%', top: '-10%', animationDelay: p.delay + 's', fontSize: p.size + 'px' }}
              >❄️</div>
            ))}
          </>
        );
      case 'sakura':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute text-pink-300/20 animate-[petal-fall_12s_linear_infinite]"
                style={{ left: p.left + '%', top: '-10%', animationDelay: p.delay + 's', fontSize: '18px' }}
              >🌸</div>
            ))}
          </>
        );
      case 'ocean':
      case 'aquarium':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-transparent to-cyan-500/10" />
        );
      default:
        return <div className="absolute inset-0 bg-black/40 transition-all duration-1000" />;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
        {renderBackgroundElements()}
      </div>
    </div>
  );
};

interface TimerProps {
  isCustomizing: boolean;
  setIsCustomizing: (val: boolean) => void;
}

const Timer: React.FC<TimerProps> = ({ isCustomizing, setIsCustomizing }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  const touchStart = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTheme = FOCUS_THEMES[themeIndex];

  // Initialize sounds
  useEffect(() => {
    const alarm = new Audio(ZEN_BOWL_URL);
    alarm.volume = 0.5;
    audioRef.current = alarm;
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
            if (window.navigator.vibrate) window.navigator.vibrate([400, 100, 400]);
            return totalTime;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, totalTime]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  const nextTheme = useCallback(() => {
    setSlideDirection('right');
    setThemeIndex((prev) => (prev + 1) % FOCUS_THEMES.length);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setSlideDirection(null), 500);
  }, []);

  const prevTheme = useCallback(() => {
    setSlideDirection('left');
    setThemeIndex((prev) => (prev - 1 + FOCUS_THEMES.length) % FOCUS_THEMES.length);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setSlideDirection(null), 500);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    setSwipeOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current !== null) {
      const currentTouch = e.targetTouches[0].clientX;
      const diff = currentTouch - touchStart.current;
      setSwipeOffset(diff * 0.4);
    }
  };

  const onTouchEnd = () => {
    if (touchStart.current === null) return;
    const minSwipeDistance = 60;
    if (Math.abs(swipeOffset) > minSwipeDistance / 2) {
      if (swipeOffset < 0) nextTheme();
      else prevTheme();
    }
    setSwipeOffset(0);
    touchStart.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const strokeDashoffset = 565 - (565 * progress) / 100;

  return (
    <div 
      className={`relative flex flex-col items-center h-full w-full transition-all duration-1000 bg-gradient-to-b ${currentTheme.bgGradient} overflow-hidden`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <ThemeBackgroundFX themeId={currentTheme.id} isActive={isActive} />

      <header className="w-full flex flex-col pt-16 pb-2 px-8 z-50 relative animate-in fade-in slide-in-from-top-2">
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">Focus</h1>
        <div className="flex items-center gap-2 mt-1">
            <p className="text-[9px] uppercase tracking-[0.5em] opacity-40 font-black" style={{ color: currentTheme.color }}>
                {currentTheme.name}
            </p>
            {isActive && <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ backgroundColor: currentTheme.color, color: currentTheme.color }} />}
        </div>
      </header>

      <div className="w-full flex-1 flex flex-col items-center justify-center relative -translate-y-16 z-10 px-6">
        <div 
          className={`relative flex items-center justify-center mb-10 transition-all duration-700 cursor-pointer ${isActive ? 'animate-[breath_4s_infinite_ease-in-out]' : ''}`}
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onClick={nextTheme}
        >
          <svg className="absolute w-[260px] h-[260px] -rotate-90 pointer-events-none overflow-visible">
            <circle cx="130" cy="130" r="90" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <circle 
              cx="130" cy="130" r="90" 
              fill="transparent" stroke={currentTheme.color} strokeWidth="3" 
              strokeDasharray="565" strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-linear" 
              style={{ filter: `drop-shadow(0 0 20px ${currentTheme.color}88)` }} 
            />
          </svg>

          <div className={`transition-all duration-1000 ${isActive ? 'scale-110' : 'scale-100'} active:scale-95 ${
            slideDirection === 'right' ? 'animate-in slide-in-from-right-12' : 
            slideDirection === 'left' ? 'animate-in slide-in-from-left-12' : ''
          }`}>
            <div className="scale-[0.9]">
              <ThemeAnimator themeId={currentTheme.id} />
            </div>
          </div>
        </div>
        
        <div className="text-center w-full mb-6">
          <div className="text-7xl font-extralight tracking-tighter leading-none tabular-nums text-white drop-shadow-2xl mb-4 transition-all duration-700"
            style={{ 
                textShadow: isActive ? `0 0 30px ${currentTheme.color}66` : 'none',
                opacity: isActive ? 1 : 0.8
            }}
          >
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            {FOCUS_THEMES.map((t, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${themeIndex === idx ? 'opacity-100 scale-125' : 'opacity-10 scale-75'}`}
                style={{ backgroundColor: themeIndex === idx ? currentTheme.color : '#fff' }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-12">
          <button onClick={resetTimer} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 active:scale-90 transition-all backdrop-blur-3xl shadow-lg">
            <RotateCcw size={22} />
          </button>
          <button onClick={toggleTimer} className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-2xl border border-white/20 bg-white hover:scale-105 group relative overflow-hidden">
            {isActive ? (
                <Pause size={28} fill="black" className="group-active:scale-90 transition-transform relative z-10" />
            ) : (
                <Play size={28} className="ml-1 group-active:scale-90 transition-transform relative z-10" fill="black" />
            )}
            <div className={`absolute inset-0 bg-zinc-100/10 opacity-0 group-active:opacity-100 transition-opacity`} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes breath {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.03); filter: brightness(1.1); }
        }
        @keyframes petal-fall {
          0% { transform: translateY(-10vh) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg) translateX(50px); opacity: 0; }
        }
        @keyframes fall {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>

      {isCustomizing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsCustomizing(false)} />
          <div className="relative w-full max-w-sm apple-blur rounded-[3.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
            <h3 className="text-[11px] font-black mb-10 text-center opacity-30 uppercase tracking-[0.5em]">Focus Duration</h3>
            <div className="grid grid-cols-2 gap-3 mb-10">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setTotalTime(p.minutes * 60); setTimeLeft(p.minutes * 60); setIsCustomizing(false); if (window.navigator.vibrate) window.navigator.vibrate(5); }}
                  className="py-5 px-2 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  {p.label} • {p.minutes}M
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsCustomizing(false)} className="flex-1 py-5 rounded-[2rem] bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 active:scale-95 transition-all">Cancel</button>
              <button onClick={() => setIsCustomizing(false)} className="flex-1 py-5 rounded-[2rem] text-black text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all" style={{ backgroundColor: currentTheme.color }}>Set Timer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
