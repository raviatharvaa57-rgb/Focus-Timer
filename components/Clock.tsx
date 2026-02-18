
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Loader2, Trash2, Search, X, MapPin } from 'lucide-react';
import { CLOCK_THEMES } from '../constants';
import { WorldLocation } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

// Static database of major world cities to replace AI search
const WORLD_CITIES: WorldLocation[] = [
  { id: '1', name: 'Tokyo', country: 'Japan', offset: 9, mood: 'Neon' },
  { id: '2', name: 'New York', country: 'USA', offset: -5, mood: 'Busy' },
  { id: '3', name: 'London', country: 'UK', offset: 0, mood: 'Classic' },
  { id: '4', name: 'Paris', country: 'France', offset: 1, mood: 'Romantic' },
  { id: '5', name: 'Dubai', country: 'UAE', offset: 4, mood: 'Luxury' },
  { id: '6', name: 'Singapore', country: 'Singapore', offset: 8, mood: 'Clean' },
  { id: '7', name: 'Sydney', country: 'Australia', offset: 11, mood: 'Sunny' },
  { id: '8', name: 'Berlin', country: 'Germany', offset: 1, mood: 'Creative' },
  { id: '9', name: 'Seoul', country: 'South Korea', offset: 9, mood: 'Tech' },
  { id: '10', name: 'Los Angeles', country: 'USA', offset: -8, mood: 'Cinematic' },
  { id: '11', name: 'Mumbai', country: 'India', offset: 5.5, mood: 'Bustling' },
  { id: '12', name: 'Cairo', country: 'Egypt', offset: 2, mood: 'Ancient' },
  { id: '13', name: 'Rio de Janeiro', country: 'Brazil', offset: -3, mood: 'Festive' },
  { id: '14', name: 'Reykjavik', country: 'Iceland', offset: 0, mood: 'Ethereal' },
  { id: '15', name: 'Bangkok', country: 'Thailand', offset: 7, mood: 'Exotic' },
  { id: '16', name: 'Rome', country: 'Italy', offset: 1, mood: 'Historic' },
  { id: '17', name: 'Hong Kong', country: 'China', offset: 8, mood: 'Vibrant' },
  { id: '18', name: 'Toronto', country: 'Canada', offset: -5, mood: 'Diverse' },
  { id: '19', name: 'Cape Town', country: 'South Africa', offset: 2, mood: 'Scenic' },
  { id: '20', name: 'Moscow', country: 'Russia', offset: 3, mood: 'Grand' },
];

interface ClockProps {
  user: firebase.User;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}

const LocationItem: React.FC<{
  loc: WorldLocation;
  time: Date;
  theme: any;
  onDelete: (id: string) => void;
}> = ({ loc, time, theme, onDelete }) => {
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

  const { dayLabel, diffLabel } = getTimeInfo(loc.offset);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] mb-3 group">
      <div className="relative apple-blur py-6 px-7 border border-white/5 flex items-center justify-between transition-all duration-300">
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
          <button 
            onClick={() => onDelete(loc.id)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
          >
            <Trash2 size={16} />
          </button>
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WorldLocation[]>([]);

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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    
    // Simulate a snappy local search delay for smooth UI feel
    setTimeout(() => {
      const results = WORLD_CITIES.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        city.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 200);
  };

  // Trigger search on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addLocation = async (loc: WorldLocation) => {
    try {
      const { id, ...data } = loc;
      await db.collection('users').doc(user.uid).collection('clocks').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setIsAdding(false);
      setSearchQuery('');
      setSearchResults([]);
      if (window.navigator.vibrate) window.navigator.vibrate(15);
    } catch (e) {
      console.error("Add location failed", e);
    }
  };

  const setClockTheme = useCallback((idx: number) => {
    const direction = idx > themeIndex ? 'right' : 'left';
    setSlideDirection(direction);
    setThemeIndex(idx);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setSlideDirection(null), 500);
  }, [themeIndex]);

  const cycleTheme = useCallback(() => {
    const nextIdx = (themeIndex + 1) % CLOCK_THEMES.length;
    setClockTheme(nextIdx);
  }, [themeIndex, setClockTheme]);

  const formatTimeMain = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours} ${mins}`;
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
      <div className="w-full flex flex-col items-center shrink-0 pt-8">
        <header className="w-full flex justify-between items-center mb-6 px-10 animate-in fade-in slide-in-from-top-2 transition-transform duration-500 ease-out">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-xl">World</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30 font-black mt-1" style={{ color: currentTheme.dotColor.replace('bg-', 'text-') }}>{currentTheme.name}</p>
          </div>
        </header>

        {/* Analog Clock Face */}
        <div 
          onClick={cycleTheme}
          className={`relative w-72 h-72 flex items-center justify-center cursor-pointer active:scale-[0.98] transition-all duration-500 ease-out ${
            slideDirection === 'right' ? 'animate-in slide-in-from-right-12' : 
            slideDirection === 'left' ? 'animate-in slide-in-from-left-12' : ''
          }`}
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

        {/* Pagination Dots */}
        <div className="flex items-center space-x-6 mt-6 mb-8 px-2 transition-transform duration-500 ease-out">
          {CLOCK_THEMES.map((theme, idx) => (
            <button 
              key={theme.id} 
              onClick={() => setClockTheme(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-700 transform ${themeIndex === idx ? `${theme.dotColor} scale-[1.35] ring-4 ring-white/10 shadow-[0_0_15px_currentColor]` : 'bg-white/10 scale-100'}`} 
            />
          ))}
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000 transition-transform duration-500 ease-out pb-6">
        <div className="flex items-baseline justify-center space-x-3">
          <span className="text-5xl font-extralight tracking-tight tabular-nums drop-shadow-lg">{formatTimeMain(time)}</span>
          <span className="text-lg font-light opacity-60">{formatAMPM(time)}</span>
        </div>
        <div className="mt-2 font-black tracking-[0.3em] text-[9px] uppercase opacity-20">{formatDate(time)}</div>
      </div>

      <div className="w-full h-1/3 overflow-y-auto hide-scrollbar px-10 pb-10">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin opacity-20" size={24} />
          </div>
        ) : (
          <div className="pb-10">
            {locations.length > 0 ? (
              locations.map((loc) => (
                <LocationItem 
                  key={loc.id} 
                  loc={loc} 
                  time={time} 
                  theme={currentTheme} 
                  onDelete={removeLocation} 
                />
              ))
            ) : (
              <div className="py-10 text-center">
                <button 
                  onClick={() => setIsAdding(true)}
                  className="text-[9px] font-black uppercase tracking-widest text-orange-500/50 hover:text-orange-500 transition-colors"
                >
                  + Add City
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-in fade-in duration-300 px-4 pb-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-lg apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out pb-12">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-[11px] font-black opacity-40 uppercase tracking-[0.5em]">Add New City</h3>
               <button onClick={() => setIsAdding(false)} className="p-2 text-white/20 hover:text-white transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="space-y-6">
               <div className="relative">
                 <input 
                   type="text"
                   placeholder="Search City..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full bg-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm font-medium focus:outline-none border border-white/5 text-white placeholder:text-white/10"
                 />
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
               </div>

               <div className="space-y-3 max-h-60 overflow-y-auto hide-scrollbar">
                 {isSearching ? (
                   <div className="py-12 flex flex-col items-center justify-center space-y-4 opacity-30">
                     <Loader2 className="animate-spin" size={24} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Searching cities...</span>
                   </div>
                 ) : (
                   <>
                     {searchResults.length > 0 ? (
                       searchResults.map((loc) => (
                         <button
                           key={loc.id}
                           onClick={() => addLocation(loc)}
                           className="w-full text-left p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group active:scale-[0.98]"
                         >
                           <div className="flex items-center space-x-4">
                             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                               <MapPin size={18} />
                             </div>
                             <div>
                               <div className="text-sm font-bold text-white mb-0.5">{loc.name}</div>
                               <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{loc.country}</div>
                             </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{loc.mood}</div>
                              <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">UTC {loc.offset >= 0 ? '+' : ''}{loc.offset}</div>
                           </div>
                         </button>
                       ))
                     ) : searchQuery.length > 0 ? (
                       <div className="py-12 text-center opacity-20 text-[9px] font-black uppercase tracking-widest">
                         No matches found
                       </div>
                     ) : (
                       <div className="py-8 text-center opacity-10 text-[9px] font-black uppercase tracking-[0.5em]">
                         Start typing to find a city
                       </div>
                     )}
                   </>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clock;
