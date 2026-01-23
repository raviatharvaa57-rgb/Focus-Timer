
import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, MapPin } from 'lucide-react';
import { CLOCK_THEMES } from '../constants';

interface WorldLocation {
  id: string;
  name: string;
  offset: number; // UTC offset in hours
}

const CITY_OFFSETS: Record<string, number> = {
  'london': 0, 'paris': 1, 'berlin': 1, 'rome': 1, 'madrid': 1, 'amsterdam': 1,
  'athens': 2, 'cairo': 2, 'jerusalem': 2, 'moscow': 3, 'dubai': 4,
  'mumbai': 5.5, 'delhi': 5.5, 'bangkok': 7, 'jakarta': 7,
  'beijing': 8, 'singapore': 8, 'perth': 8, 'hong kong': 8, 'tokyo': 9, 'seoul': 9,
  'sydney': 11, 'melbourne': 11, 'auckland': 13,
  'new york': -5, 'miami': -5, 'toronto': -5, 'dc': -5, 'boston': -5,
  'chicago': -6, 'mexico city': -6, 'denver': -7,
  'los angeles': -8, 'vancouver': -8, 'san francisco': -8, 'seattle': -8,
  'honolulu': -10
};

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [themeIndex, setThemeIndex] = useState(0);
  const [locations, setLocations] = useState<WorldLocation[]>(() => {
    const saved = localStorage.getItem('focus_clocks');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Tokyo', offset: 9 },
      { id: '2', name: 'London', offset: 0 },
      { id: '3', name: 'New York', offset: -5 },
    ];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const currentTheme = CLOCK_THEMES[themeIndex];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('focus_clocks', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    // Attempt to add local city if empty or on first run
    if (navigator.geolocation && !localStorage.getItem('focus_geo_done')) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const offset = -new Date().getTimezoneOffset() / 60;
        const localCity: WorldLocation = {
          id: 'local',
          name: 'Current Location',
          offset: offset
        };
        setLocations(prev => [localCity, ...prev.filter(l => l.id !== 'local')]);
        localStorage.setItem('focus_geo_done', 'true');
      });
    }
  }, []);

  const formatTimeMain = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}.${mins}`;
  };

  const formatAMPM = (date: Date) => {
    return date.getHours() >= 12 ? 'PM' : 'AM';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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

  const secondDegrees = (time.getSeconds() / 60) * 360;
  const minuteDegrees = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hourDegrees = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  const progress = time.getSeconds() / 60;

  const handleAddLocation = () => {
    if (!newName.trim()) return;
    
    const normalizedCity = newName.toLowerCase().trim();
    const detectedOffset = CITY_OFFSETS[normalizedCity] ?? 0;

    const newLoc: WorldLocation = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      offset: detectedOffset,
    };
    
    setLocations([newLoc, ...locations]);
    setIsAdding(false);
    setNewName('');
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  return (
    <div className={`h-full flex flex-col items-center pt-8 pb-32 px-10 transition-all duration-1000 bg-gradient-to-b ${currentTheme.bgGradient} ${currentTheme.textColor} overflow-hidden`}>
      
      <header className="w-full flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">World Clock</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-orange-500 active:scale-90 transition-all border border-white/5 apple-blur shadow-lg"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      </header>

      <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mb-10 shrink-0">
        <svg className="absolute w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" className={`${currentTheme.ringColor} fill-transparent`} strokeWidth="0.5" />
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1" strokeDashoffset={1 - progress} pathLength="1" className={`fill-transparent transition-all duration-1000 linear ${currentTheme.accentColor}`} strokeLinecap="round" />
        </svg>

        {[...Array(12)].map((_, i) => (
          <div key={i} className={`absolute w-[1px] h-3 transition-colors duration-700 ${currentTheme.markerColor}`} style={{ transform: `rotate(${i * 30}deg) translateY(-85px)` }} />
        ))}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute bottom-1/2 w-[1.5px] h-14 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor}`} style={{ transform: `rotate(${hourDegrees}deg)` }} />
          <div className={`absolute bottom-1/2 w-[1px] h-20 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor} opacity-60`} style={{ transform: `rotate(${minuteDegrees}deg)` }} />
          <div className="absolute bottom-1/2 w-[0.5px] h-24 bg-orange-500 rounded-full origin-bottom shadow-sm" style={{ transform: `rotate(${secondDegrees}deg)`, transition: 'transform 0.1s linear' }} />
          <div className={`absolute w-1.5 h-1.5 rounded-full z-10 transition-colors duration-500 ${currentTheme.handColor}`} />
        </div>
      </div>

      <div className="text-center mb-8 shrink-0">
        <div className="flex items-baseline justify-center space-x-2">
          <span className="text-6xl font-light tracking-tight tabular-nums">{formatTimeMain(time)}</span>
          <span className="text-2xl font-light opacity-60">{formatAMPM(time)}</span>
        </div>
        <div className="mt-2 font-normal tracking-[0.1em] text-[10px] uppercase opacity-40 transition-colors duration-500">{formatDate(time)}</div>
      </div>

      <div className="flex items-center space-x-6 mb-8 px-2 shrink-0">
        {CLOCK_THEMES.map((theme, idx) => (
          <button 
            key={theme.id} 
            onClick={() => setThemeIndex(idx)} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 transform ${themeIndex === idx ? `${theme.dotColor} scale-[1.8] ring-4 ring-white/10` : 'bg-white/10 hover:bg-white/20'}`} 
          />
        ))}
      </div>

      <div className="w-full flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-10">
        {locations.map((loc) => (
          <div key={loc.id} className="group relative apple-blur py-5 px-6 rounded-[2rem] border border-white/5 transition-all hover:bg-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1">
                {loc.id === 'local' ? <MapPin size={10} className="text-orange-500" /> : <Globe size={10} className="text-white/20" />}
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">{loc.name}</p>
              </div>
              <p className="text-[9px] text-white/20 font-medium uppercase tracking-wider">
                {getTimeDifferenceLabel(loc.offset)}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <p className={`text-3xl font-light tracking-tight tabular-nums ${currentTheme.textColor}`}>
                {getFormattedLocalTime(time, loc.offset)}
              </p>
              <button 
                onClick={() => removeLocation(loc.id)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="py-12 text-center text-white/10 text-[10px] uppercase tracking-[0.4em] font-bold">
            No Cities Added
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-xs apple-blur rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-6 text-center text-white">Choose City</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-black ml-1">City / Region</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Paris, Tokyo, New York"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500/50 transition-all text-white placeholder:text-white/10"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 rounded-2xl bg-zinc-800 text-xs font-bold uppercase tracking-widest active:scale-95 transition-all text-white/60"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddLocation}
                  className="flex-1 py-4 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clock;
