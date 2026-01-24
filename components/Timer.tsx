
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { FOCUS_THEMES, PRESETS } from '../constants';
import ThemeAnimator from './ThemeAnimator';

const ZEN_BOWL_URL = 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3';

const ThemeBackgroundFX: React.FC<{ themeId: string; isActive: boolean }> = ({ themeId, isActive }) => {
  const [particles] = useState(() => [...Array(20)].map(() => ({
    id: Math.random(),
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 5 + Math.random() * 10,
    delay: Math.random() * 5,
    size: 4 + Math.random() * 10
  })));

  const renderBackgroundElements = () => {
    switch (themeId) {
      case 'night':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"
                style={{ width: '2px', height: '2px', left: p.left + '%', top: p.top + '%', animationDelay: p.delay + 's', opacity: 0.5 }}
              />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(100,100,255,0.1)_0%,transparent_70%)]" />
          </>
        );
      case 'snow':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute text-white/20 animate-[fall_12s_linear_infinite]"
                style={{ left: p.left + '%', top: '-10%', animationDelay: p.delay + 's', fontSize: p.size + 'px' }}
              >❄️</div>
            ))}
            <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }`}</style>
          </>
        );
      case 'sakura':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute text-pink-300/30 animate-[petal-fall_10s_linear_infinite]"
                style={{ left: p.left + '%', top: '-10%', animationDelay: p.delay + 's', fontSize: '20px' }}
              >🌸</div>
            ))}
            <style>{`@keyframes petal-fall { 0% { transform: translateY(0) rotate(0) translateX(0); } 100% { transform: translateY(110vh) rotate(720deg) translateX(100px); } }`}</style>
          </>
        );
      case 'campfire':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute w-1 h-1 bg-orange-500 rounded-full animate-[ember_4s_infinite_linear]"
                style={{ left: p.left + '%', bottom: '0%', animationDelay: p.delay + 's', opacity: 0.6 }}
              />
            ))}
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-orange-600/10 to-transparent" />
            <style>{`@keyframes ember { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px) scale(0); opacity: 0; } }`}</style>
          </>
        );
      case 'ocean':
      case 'aquarium':
        return (
          <>
            {particles.map((p) => (
              <div key={p.id} className="absolute bg-white/10 rounded-full animate-[bubble_6s_infinite_ease-in]"
                style={{ width: p.size + 'px', height: p.size + 'px', left: p.left + '%', bottom: '-10%', animationDelay: p.delay + 's' }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-cyan-500/10" />
            <style>{`@keyframes bubble { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 50% { opacity: 0.4; } 100% { transform: translateY(-110vh) scale(1.2); opacity: 0; } }`}</style>
          </>
        );
      case 'art':
        return (
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute w-full h-20 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-3xl animate-[stroke-bg_8s_infinite_linear]"
                style={{ top: `${i * 20}%`, animationDelay: `${i * 1.5}s` }}
              />
            ))}
            <style>{`@keyframes stroke-bg { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
          </div>
        );
      case 'sun':
        return <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-transparent to-transparent animate-pulse duration-[5000ms]" />;
      case 'forest':
        return <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-5 rotate-45 scale-150" />;
      case 'coffee':
        return <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,69,19,0.05)_0%,transparent_70%)]" />;
      default:
        return <div className="absolute inset-0 bg-black/40 transition-all duration-1000" />;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000">
      {renderBackgroundElements()}
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
  const [customMins, setCustomMins] = useState(25);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  const touchStart = useRef<number | null>(null);
  const minSwipeDistance = 60;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTheme = FOCUS_THEMES[themeIndex];

  useEffect(() => {
    audioRef.current = new Audio(ZEN_BOWL_URL);
    audioRef.current.volume = 0.5;

    const savedState = localStorage.getItem('focus_timer_state');
    if (savedState) {
      try {
        const { time, total, active, lastTimestamp, themeIdx } = JSON.parse(savedState);
        setThemeIndex(themeIdx || 0);
        setTotalTime(total || time || 25 * 60);
        if (active) {
          const elapsed = Math.floor((Date.now() - lastTimestamp) / 1000);
          const remaining = Math.max(0, time - elapsed);
          setTimeLeft(remaining);
          setIsActive(remaining > 0);
        } else {
          setTimeLeft(time);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('focus_timer_state', JSON.stringify({
      time: timeLeft,
      total: totalTime,
      active: isActive,
      lastTimestamp: Date.now(),
      themeIdx: themeIndex
    }));

    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
            if (window.navigator.vibrate) window.navigator.vibrate([500, 100, 500]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, themeIndex, totalTime]);

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

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (window.navigator.vibrate) window.navigator.vibrate(15);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  const handleApplyCustomTime = (mins: number) => {
    const seconds = mins * 60;
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setIsCustomizing(false);
    setIsActive(false);
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

      <header className="w-full flex justify-between items-center pt-16 pb-2 px-8 z-50 relative">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-white opacity-90">Focus</h1>
          <div className="overflow-hidden">
            <p 
              key={currentTheme.id}
              className="text-[8px] uppercase tracking-[0.4em] opacity-40 font-black mt-0.5 animate-in slide-in-from-bottom-1 duration-500" 
              style={{ color: currentTheme.color }}
            >
              {currentTheme.name}
            </p>
          </div>
        </div>
      </header>

      <div className="w-full flex-1 flex flex-col items-center justify-center relative -translate-y-12 z-10 px-6">
        <div 
          className="relative flex items-center justify-center mb-10 group cursor-pointer transition-transform duration-150 ease-out"
          style={{ transform: `translateX(${swipeOffset}px) scale(${1 - Math.abs(swipeOffset) / 1000})` }}
          onClick={nextTheme}
        >
          <svg className="absolute w-[240px] h-[240px] -rotate-90 pointer-events-none overflow-visible">
            <circle cx="120" cy="120" r="90" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
            <circle cx="120" cy="120" r="90" fill="transparent" stroke={currentTheme.color} strokeWidth="3" strokeDasharray="565" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-linear" style={{ filter: `drop-shadow(0 0 10px ${currentTheme.color}88)` }} />
          </svg>

          <div 
            key={themeIndex}
            className={`transition-all duration-1000 ${isActive ? 'scale-110' : 'scale-100'} active:scale-95 ${
              slideDirection === 'right' ? 'animate-in slide-in-from-right-12 duration-500' : 
              slideDirection === 'left' ? 'animate-in slide-in-from-left-12 duration-500' : ''
            }`}
          >
            <div className="scale-[0.85]">
              <ThemeAnimator themeId={currentTheme.id} />
            </div>
          </div>
        </div>
        
        <div className="text-center w-full">
          <div className="text-5xl font-light tracking-tight leading-none tabular-nums mb-8 transition-all duration-1000 text-white"
            style={{ textShadow: isActive ? `0 0 30px ${currentTheme.color}44` : 'none' }}
          >
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {FOCUS_THEMES.map((t, idx) => (
              <button 
                key={idx} 
                onClick={(e) => { e.stopPropagation(); setThemeIndex(idx); }} 
                className={`transition-all duration-500 rounded-full ${
                  themeIndex === idx ? 'w-1.5 h-1.5 scale-110 opacity-100 ring-2 ring-white/10' : 'w-1 h-1 opacity-10'
                }`} 
                style={{ backgroundColor: themeIndex === idx ? currentTheme.color : '#fff' }} 
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-10">
          <button onClick={resetTimer} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 active:scale-90 transition-all shadow-xl backdrop-blur-3xl">
            <RotateCcw size={20} />
          </button>
          <button onClick={toggleTimer} className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-2xl border border-white/20 bg-white">
            {isActive ? <Pause size={22} fill="black" /> : <Play size={22} className="ml-1" fill="black" />}
          </button>
        </div>
      </div>

      {isCustomizing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsCustomizing(false)} />
          <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-base font-bold mb-8 text-center opacity-40 uppercase tracking-[0.3em]">Session</h3>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setCustomMins(preset.minutes); handleApplyCustomTime(preset.minutes); }}
                    className="py-4 px-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30 active:scale-95 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col items-center">
                <input 
                  type="number" 
                  value={customMins} 
                  onChange={(e) => setCustomMins(Math.min(999, Math.max(1, parseInt(e.target.value) || 1)))} 
                  className="bg-transparent text-7xl font-extralight w-full text-center focus:outline-none text-white tabular-nums" 
                  autoFocus 
                />
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] mt-3">Minutes</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsCustomizing(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/30 active:scale-95 transition-all">Cancel</button>
                <button onClick={() => handleApplyCustomTime(customMins)} className="flex-1 py-4 rounded-2xl text-black text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all" style={{ backgroundColor: currentTheme.color }}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
