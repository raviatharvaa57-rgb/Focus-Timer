
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Loader2, Trash2 } from 'lucide-react';
import { CLOCK_THEMES } from '../constants';
import { WorldLocation } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

interface ClockProps {
  user: firebase.User;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}

const SwipeableLocationItem: React.FC<{
  loc: WorldLocation;
  time: Date;
  theme: any;
  onDelete: (id: string) => void;
}> = ({ loc, time, theme, onDelete }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const getFormattedLocalTime = (baseTime: Date, offset: number) => {
    const utc = baseTime.getTime() + (baseTime.getTimezoneOffset() * 60000);
    const targetDate = new Date(utc + (3600000 * offset));
    const hours = targetDate.getHours().toString().padStart(2, '0');
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeInfo = (offset: number) => {
    const localOffset = -new Date().getTimezoneOffset() / 60;
    const diff = offset - localOffset;
    const baseTime = time.getTime() + (time.getTimezoneOffset() * 60000);
    const targetDate = new Date(baseTime + (3600000 * offset));
    const today = new Date();
    
    let dayLabel = 'Today';
    if (targetDate.getDate() > today.getDate()) dayLabel = 'Tomorrow';
    if (targetDate.getDate() < today.getDate()) dayLabel = 'Yesterday';

    const absDiff = Math.abs(diff);
    const hourStr = absDiff === 1 ? 'hr' : 'hrs';
    const diffLabel = diff === 0 ? 'Same time' : `${diff > 0 ? '+' : '-'}${absDiff}${hourStr}`;
    
    return { dayLabel, diffLabel };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setStartX(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const x = e.targetTouches[0].clientX;
    const diff = x - startX;
    if (isOpen) {
      const newX = -80 + diff;
      setCurrentX(newX > 0 ? 0 : newX);
    } else {
      setCurrentX(diff > 0 ? 0 : diff);
    }
  };

  const onTouchEnd = () => {
    setIsSwiping(false);
    if (currentX < -40) {
      setIsOpen(true);
      setCurrentX(-80);
      if (window.navigator.vibrate) window.navigator.vibrate(10);
    } else {
      setIsOpen(false);
      setCurrentX(0);
    }
  };

  const { dayLabel, diffLabel } = getTimeInfo(loc.offset);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] mb-3 group">
      <div className="absolute inset-0 bg-red-600 flex items-center justify-end px-8">
        <button 
          onClick={() => onDelete(loc.id)}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div 
        ref={itemRef}
        className="relative apple-blur py-6 px-7 border border-white/5 flex items-center justify-between transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${currentX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-1.5">
            <Globe size={10} className="text-white/20" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-black">{loc.name}</p>
            {loc.mood && (
              <span className="text-[8px] bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-500/50 uppercase tracking-widest font-black">
                {loc.mood}
              </span>
            )}
          </div>
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
            {dayLabel} • {diffLabel}
          </p>
        </div>
        <div className="flex items-center space-x-5">
          <p className={`text-3xl font-light tracking-tight tabular-nums ${theme.textColor}`}>
            {getFormattedLocalTime(time, loc.offset)}
          </p>
        </div>
      </div>
    </div>
  );
};

const Clock: React.FC<ClockProps> = ({ user, isAdding, setIsAdding }) => {
  const [time, setTime] = useState(new Date());
  const [themeIndex, setThemeIndex] = useState(0);
  const [locations, setLocations] = useState<WorldLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  const touchStart = useRef<number | null>(null);
  const currentTheme = CLOCK_THEMES[themeIndex];

  useEffect(() => {
    const update = () => {
      setTime(new Date());
      requestAnimationFrame(update);
    };
    const frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const unsubscribe = db.collection('users')
      .doc(user.uid)
      .collection('clocks')
      .onSnapshot((snapshot) => {
        const fetched = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as WorldLocation[];
        setLocations(fetched);
        setLoading(false);
      }, (err) => {
        console.error("Firestore fetch error:", err);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [user.uid]);

  const nextTheme = useCallback(() => {
    setSlideDirection('right');
    setThemeIndex((prev) => (prev + 1) % CLOCK_THEMES.length);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setSlideDirection(null), 500);
  }, []);

  const prevTheme = useCallback(() => {
    setSlideDirection('left');
    setThemeIndex((prev) => (prev - 1 + CLOCK_THEMES.length) % CLOCK_THEMES.length);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setSlideDirection(null), 500);
  }, []);

  const onThemeTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    setSwipeOffset(0);
  };

  const onThemeTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current !== null) {
      const currentTouch = e.targetTouches[0].clientX;
      const diff = currentTouch - touchStart.current;
      setSwipeOffset(diff * 0.6);
    }
  };

  const onThemeTouchEnd = () => {
    if (touchStart.current === null) return;
    const minSwipeDistance = 60;
    if (Math.abs(swipeOffset) > minSwipeDistance / 2) {
      if (swipeOffset < 0) nextTheme();
      else prevTheme();
    }
    setSwipeOffset(0);
    touchStart.current = null;
  };

  const formatTimeMain = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}.${mins}`;
  };

  const formatAMPM = (date: Date) => date.getHours() >= 12 ? 'PM' : 'AM';
  const formatDate = (date: Date) => date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  const progress = time.getSeconds() / 60;
  const secondDegrees = (time.getSeconds() / 60) * 360;
  const minuteDegrees = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hourDegrees = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  const removeLocation = async (id: string) => {
    try {
      await db.collection('users').doc(user.uid).collection('clocks').doc(id).delete();
      if (window.navigator.vibrate) window.navigator.vibrate(15);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className={`h-full flex flex-col items-center pt-8 pb-32 transition-all duration-1000 bg-gradient-to-b ${currentTheme.bgGradient} ${currentTheme.textColor} overflow-hidden`}
    >
      {/* THEME SWIPE GESTURE PAD - EXCLUSIVE THEME SWITCHING SOURCE */}
      <div 
        className="w-full flex flex-col items-center shrink-0 pt-8 cursor-grab active:cursor-grabbing"
        onTouchStart={onThemeTouchStart}
        onTouchMove={onThemeTouchMove}
        onTouchEnd={onThemeTouchEnd}
      >
        <header 
          className="w-full flex justify-between items-center mb-6 px-10 animate-in fade-in slide-in-from-top-2 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${swipeOffset * 0.3}px)` }}
        >
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-xl">World</h1>
            <p className="text-[9px] uppercase tracking-[0.4em] opacity-30 font-black mt-1" style={{ color: currentTheme.dotColor.replace('bg-', 'text-') }}>{currentTheme.name}</p>
          </div>
        </header>

        {/* Analog Clock */}
        <div 
          className={`relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mb-10 transition-transform duration-500 ease-out ${
            slideDirection === 'right' ? 'animate-in slide-in-from-right-12' : 
            slideDirection === 'left' ? 'animate-in slide-in-from-left-12' : ''
          }`}
          style={{ transform: `translateX(${swipeOffset}px)` }}
        >
          <svg className="absolute w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" className={`${currentTheme.ringColor} fill-transparent transition-all duration-700`} strokeWidth="0.5" />
            <circle 
              cx="100" cy="100" r="90" 
              stroke="currentColor" strokeWidth="1.5" 
              strokeDasharray="1" strokeDashoffset={1 - progress} 
              pathLength="1" 
              className={`fill-transparent transition-all duration-300 linear ${currentTheme.accentColor}`} 
              strokeLinecap="round" 
              style={{ filter: `drop-shadow(0 0 10px currentColor)` }}
            />
          </svg>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[1px] h-3 transition-colors duration-700 ${currentTheme.markerColor}`} 
              style={{ transform: `rotate(${i * 30}deg) translateY(-85px)` }} 
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`absolute bottom-1/2 w-[2px] h-14 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor}`} style={{ transform: `rotate(${hourDegrees}deg)` }} />
            <div className={`absolute bottom-1/2 w-[1.5px] h-20 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor} opacity-60`} style={{ transform: `rotate(${minuteDegrees}deg)` }} />
            <div className={`absolute bottom-1/2 w-[1px] h-24 rounded-full origin-bottom shadow-sm transition-all duration-500 ${currentTheme.secondHandColor}`} style={{ transform: `rotate(${secondDegrees}deg)` }} />
            <div className={`absolute w-2 h-2 rounded-full z-10 transition-colors duration-500 ${currentTheme.handColor}`} />
          </div>
        </div>

        {/* Digital Time Display */}
        <div 
          className="text-center mb-8 animate-in fade-in zoom-in-95 duration-1000 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${swipeOffset * 0.7}px)` }}
        >
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-6xl font-light tracking-tighter tabular-nums drop-shadow-lg">{formatTimeMain(time)}</span>
            <span className="text-2xl font-light opacity-60">{formatAMPM(time)}</span>
          </div>
          <div className="mt-2 font-black tracking-[0.2em] text-[9px] uppercase opacity-30">{formatDate(time)}</div>
        </div>

        {/* Pagination Dots - Indicators only, non-interactive per user request */}
        <div 
          className="flex items-center space-x-6 mb-10 px-2 transition-transform duration-500 ease-out pointer-events-none"
          style={{ transform: `translateX(${swipeOffset * 0.5}px)` }}
        >
          {CLOCK_THEMES.map((theme, idx) => (
            <div 
              key={theme.id} 
              className={`w-2.5 h-2.5 rounded-full transition-all duration-700 transform ${themeIndex === idx ? `${theme.dotColor} scale-[1.5] ring-4 ring-white/10 shadow-[0_0_15px_currentColor]` : 'bg-white/10 scale-100'}`} 
            />
          ))}
        </div>
      </div>

      {/* LOCATIONS LIST */}
      <div className="w-full flex-1 overflow-y-auto hide-scrollbar px-10">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin opacity-20" size={24} />
          </div>
        ) : (
          <div className="pb-10">
            {locations.length > 0 ? (
              locations.map((loc) => (
                <SwipeableLocationItem 
                  key={loc.id} 
                  loc={loc} 
                  time={time} 
                  theme={currentTheme} 
                  onDelete={removeLocation} 
                />
              ))
            ) : (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">No world clocks added</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-6 text-[9px] font-black uppercase tracking-widest text-orange-500/50 hover:text-orange-500 transition-colors"
                >
                  + Add City
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clock;
