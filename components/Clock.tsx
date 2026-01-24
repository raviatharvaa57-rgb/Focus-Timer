
import React, { useState, useEffect } from 'react';
import { X, Globe, Loader2 } from 'lucide-react';
import { CLOCK_THEMES } from '../constants';
import { WorldLocation } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

interface ClockProps {
  user: firebase.User;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}

const Clock: React.FC<ClockProps> = ({ user, isAdding, setIsAdding }) => {
  const [time, setTime] = useState(new Date());
  const [themeIndex, setThemeIndex] = useState(0);
  const [locations, setLocations] = useState<WorldLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  const formatTimeMain = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}.${mins}`;
  };

  const formatAMPM = (date: Date) => {
    return date.getHours() >= 12 ? 'PM' : 'AM';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getFormattedLocalTime = (baseTime: Date, offset: number) => {
    const utc = baseTime.getTime() + (baseTime.getTimezoneOffset() * 60000);
    const targetDate = new Date(utc + (3600000 * offset));
    const hours = targetDate.getHours().toString().padStart(2, '0');
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeDifferenceLabel = (offset: number) => {
    const localOffset = -new Date().getTimezoneOffset() / 60;
    const diff = offset - localOffset;
    const absDiff = Math.abs(diff);
    const hourStr = absDiff === 1 ? 'hr' : 'hrs';
    if (diff === 0) return 'Same time';
    return `${diff > 0 ? '+' : '-'}${absDiff}${hourStr}`;
  };

  const progress = time.getSeconds() / 60;
  const secondDegrees = (time.getSeconds() / 60) * 360;
  const minuteDegrees = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hourDegrees = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  const removeLocation = async (id: string) => {
    try {
      await db.collection('users').doc(user.uid).collection('clocks').doc(id).delete();
      if (window.navigator.vibrate) window.navigator.vibrate(5);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`h-full flex flex-col items-center pt-8 pb-32 px-10 transition-all duration-1000 bg-gradient-to-b ${currentTheme.bgGradient} ${currentTheme.textColor} overflow-hidden`}>
      <header className="w-full flex justify-between items-center mb-6 z-10 pt-8 px-0 relative animate-in fade-in slide-in-from-top-2">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-xl">World</h1>
      </header>

      <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mb-10 shrink-0">
        <svg className="absolute w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" className={`${currentTheme.ringColor} fill-transparent transition-all duration-700`} strokeWidth="0.5" />
          <circle 
            cx="100" cy="100" r="90" 
            stroke="currentColor" strokeWidth="1.5" 
            strokeDasharray="1" strokeDashoffset={1 - progress} 
            pathLength="1" 
            className={`fill-transparent transition-all duration-300 linear ${currentTheme.accentColor}`} 
            strokeLinecap="round" 
          />
        </svg>
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className={`absolute w-[1px] h-3 transition-colors duration-700 ${currentTheme.markerColor}`} 
            style={{ transform: `rotate(${i * 30}deg) translateY(-85px)` }} 
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute bottom-1/2 w-[2px] h-14 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor}`} style={{ transform: `rotate(${hourDegrees}deg)` }} />
          <div className={`absolute bottom-1/2 w-[1.5px] h-20 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor} opacity-60`} style={{ transform: `rotate(${minuteDegrees}deg)` }} />
          <div className="absolute bottom-1/2 w-[1px] h-24 bg-orange-500 rounded-full origin-bottom shadow-sm" style={{ transform: `rotate(${secondDegrees}deg)` }} />
          <div className={`absolute w-2 h-2 rounded-full z-10 transition-colors duration-500 ${currentTheme.handColor}`} />
        </div>
      </div>

      <div className="text-center mb-8 shrink-0 animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex items-baseline justify-center space-x-2">
          <span className="text-6xl font-light tracking-tighter tabular-nums drop-shadow-lg">{formatTimeMain(time)}</span>
          <span className="text-2xl font-light opacity-60">{formatAMPM(time)}</span>
        </div>
        <div className="mt-2 font-black tracking-[0.2em] text-[9px] uppercase opacity-30">{formatDate(time)}</div>
      </div>

      <div className="flex items-center space-x-6 mb-10 px-2 shrink-0">
        {CLOCK_THEMES.map((theme, idx) => (
          <button 
            key={theme.id} 
            onClick={() => setThemeIndex(idx)} 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-700 transform ${themeIndex === idx ? `${theme.dotColor} scale-[1.5] ring-4 ring-white/10` : 'bg-white/10 hover:bg-white/20 scale-100'}`} 
          />
        ))}
      </div>

      <div className="w-full flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin opacity-20" size={24} />
          </div>
        ) : (
          <>
            {locations.map((loc, idx) => (
              <div 
                key={loc.id} 
                className="group relative apple-blur py-6 px-7 rounded-[2.5rem] border border-white/5 transition-all hover:bg-white/5 flex items-center justify-between animate-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Globe size={10} className="text-white/20" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-black">{loc.name}</p>
                    {loc.mood && <span className="text-[8px] bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-500/50 uppercase tracking-widest font-black">{loc.mood}</span>}
                  </div>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                    {loc.country ? `${loc.country} • ` : ''}{getTimeDifferenceLabel(loc.offset)}
                  </p>
                </div>
                <div className="flex items-center space-x-5">
                  <p className={`text-3xl font-light tracking-tight tabular-nums ${currentTheme.textColor}`}>
                    {getFormattedLocalTime(time, loc.offset)}
                  </p>
                  <button 
                    onClick={() => removeLocation(loc.id)}
                    className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-full bg-white/5 text-zinc-600 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="text-center py-10 opacity-20 text-[10px] uppercase tracking-widest font-black">No locations set</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Clock;
