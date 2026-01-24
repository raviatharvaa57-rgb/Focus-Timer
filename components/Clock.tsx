import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { CLOCK_THEMES } from '../constants';
import { WorldLocation } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [themeIndex, setThemeIndex] = useState(0);
  const [locations, setLocations] = useState<WorldLocation[]>(() => {
    const saved = localStorage.getItem('focus_clocks');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Tokyo', offset: 9, country: 'Japan', mood: 'Neon' },
      { id: '2', name: 'London', offset: 0, country: 'UK', mood: 'Foggy' },
      { id: '3', name: 'New York', offset: -5, country: 'USA', mood: 'Busy' },
    ];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTheme = CLOCK_THEMES[themeIndex];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('focus_clocks', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    if (navigator.geolocation && !localStorage.getItem('focus_geo_done')) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const offset = -new Date().getTimezoneOffset() / 60;
        const localCity: WorldLocation = {
          id: 'local',
          name: 'Current Location',
          offset: offset,
          mood: 'Home'
        };
        setLocations(prev => [localCity, ...prev.filter(l => l.id !== 'local')]);
        localStorage.setItem('focus_geo_done', 'true');
      }, (err) => console.log("Geo error:", err));
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

  const handleAddLocation = async () => {
    if (!newName.trim() || isSearching) return;
    
    setIsSearching(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the current UTC offset for "${newName}". Also identify the full name of the city and country. Return JSON only.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cityName: { type: Type.STRING },
              country: { type: Type.STRING },
              offset: { type: Type.NUMBER },
              mood: { type: Type.STRING, description: "A one word vibe of the city right now" }
            },
            required: ["cityName", "country", "offset"]
          }
        }
      });
      
      const rawText = response.text;
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      const newLoc: WorldLocation = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.cityName,
        country: data.country,
        offset: data.offset,
        mood: data.mood || 'Vibrant'
      };
      
      setLocations([newLoc, ...locations]);
      setIsAdding(false);
      setNewName('');
      if (window.navigator.vibrate) window.navigator.vibrate(10);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError("City not found. Try 'City, Country'.");
    } finally {
      setIsSearching(false);
    }
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  return (
    <div className={`h-full flex flex-col items-center pt-8 pb-32 px-10 transition-all duration-1000 bg-gradient-to-b ${currentTheme.bgGradient} ${currentTheme.textColor} overflow-hidden`}>
      
      <header className="w-full flex justify-between items-center mb-6 z-10 pt-8 px-0 relative">
        <h1 className="text-4xl font-bold tracking-tight text-white">World</h1>
      </header>

      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-32 right-8 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-orange-500 active:scale-90 transition-all border border-white/20 apple-blur shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-[100]"
      >
        <Plus size={26} strokeWidth={2} />
      </button>

      <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mb-10 shrink-0">
        <svg className="absolute w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" className={`${currentTheme.ringColor} fill-transparent`} strokeWidth="0.5" />
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1" strokeDashoffset={1 - progress} pathLength="1" className={`fill-transparent transition-all duration-1000 linear ${currentTheme.accentColor}`} strokeLinecap="round" />
        </svg>

        {[...Array(12)].map((_, i) => (
          <div key={i} className={`absolute w-[1px] h-3 transition-colors duration-700 ${currentTheme.markerColor}`} style={{ transform: `rotate(${i * 30}deg) translateY(-85px)` }} />
        ))}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute bottom-1/2 w-[2px] h-14 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor}`} style={{ transform: `rotate(${hourDegrees}deg)` }} />
          <div className={`absolute bottom-1/2 w-[1.5px] h-20 rounded-full origin-bottom transition-all duration-500 ${currentTheme.handColor} opacity-60`} style={{ transform: `rotate(${minuteDegrees}deg)` }} />
          <div className="absolute bottom-1/2 w-[1px] h-24 bg-orange-500 rounded-full origin-bottom shadow-sm" style={{ transform: `rotate(${secondDegrees}deg)`, transition: 'transform 0.1s linear' }} />
          <div className={`absolute w-2 h-2 rounded-full z-10 transition-colors duration-500 ${currentTheme.handColor}`} />
        </div>
      </div>

      <div className="text-center mb-8 shrink-0">
        <div className="flex items-baseline justify-center space-x-2">
          <span className="text-6xl font-light tracking-tight tabular-nums">{formatTimeMain(time)}</span>
          <span className="text-2xl font-light opacity-60">{formatAMPM(time)}</span>
        </div>
        <div className="mt-2 font-black tracking-[0.2em] text-[9px] uppercase opacity-30">{formatDate(time)}</div>
      </div>

      <div className="flex items-center space-x-6 mb-8 px-2 shrink-0">
        {CLOCK_THEMES.map((theme, idx) => (
          <button 
            key={theme.id} 
            onClick={() => setThemeIndex(idx)} 
            className={`w-2 h-2 rounded-full transition-all duration-500 transform ${themeIndex === idx ? `${theme.dotColor} scale-[1.5] ring-4 ring-white/10` : 'bg-white/10 hover:bg-white/20'}`} 
          />
        ))}
      </div>

      <div className="w-full flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-10">
        {locations.map((loc) => (
          <div key={loc.id} className="group relative apple-blur py-6 px-7 rounded-[2.5rem] border border-white/5 transition-all hover:bg-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1.5">
                {loc.id === 'local' ? <MapPin size={10} className="text-orange-500" /> : <Globe size={10} className="text-white/20" />}
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-black">{loc.name}</p>
                {loc.mood && <span className="text-[8px] bg-orange-500/10 px-2 py-0.5 rounded-full text-orange-500/50 uppercase tracking-widest font-black">{loc.mood}</span>}
              </div>
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                {loc.country ? `${loc.country} • ` : ''}{getTimeDifferenceLabel(loc.offset)}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <p className={`text-3xl font-light tracking-tight tabular-nums ${currentTheme.textColor}`}>
                {getFormattedLocalTime(time, loc.offset)}
              </p>
              <button 
                onClick={() => removeLocation(loc.id)}
                className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-full bg-white/5 text-zinc-600 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="py-12 text-center text-white/10 text-[10px] uppercase tracking-[0.5em] font-black">
            Empty Horizon
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-8 justify-center">
              <Sparkles size={20} className="text-orange-400" />
              <h3 className="text-2xl font-bold text-white tracking-tight">Smart Search</h3>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-black ml-1">Destination</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="E.g. Paris, Tokyo, Mars..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 pr-12 focus:outline-none focus:border-orange-500/50 transition-all text-white placeholder:text-white/10"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-orange-500" size={22} />
                    </div>
                  )}
                </div>
                {error && <p className="text-[10px] text-red-400 font-bold ml-1">{error}</p>}
                <p className="text-[8px] text-white/10 mt-2 ml-1 uppercase tracking-[0.3em] font-black">Powered by Gemini 3</p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-5 rounded-[1.8rem] bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all text-white/40"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddLocation}
                  disabled={isSearching || !newName.trim()}
                  className={`flex-1 py-5 rounded-[1.8rem] text-black text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all ${isSearching || !newName.trim() ? 'bg-white/10 text-white/20' : 'bg-white'}`}
                >
                  {isSearching ? '...' : 'Search'}
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