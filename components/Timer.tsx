
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Sparkles } from 'lucide-react';
import { FOCUS_THEMES } from '../constants';
import ThemeAnimator from './ThemeAnimator';
import { GoogleGenAI } from "@google/genai";

const ThemeBackgroundFX: React.FC<{ themeId: string; isActive: boolean }> = ({ themeId, isActive }) => {
  switch (themeId) {
    case 'night':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                opacity: Math.random() * 0.5
              }}
            />
          ))}
        </div>
      );
    case 'forest':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="absolute text-green-900/20 text-4xl animate-[bounce_10s_infinite]"
              style={{
                top: '-10%',
                left: Math.random() * 100 + '%',
                animationDelay: i * 2 + 's',
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >🍃</div>
          ))}
        </div>
      );
    case 'aquarium':
    case 'ocean':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-white/10 rounded-full animate-[bounce_5s_infinite]"
              style={{
                width: Math.random() * 10 + 5 + 'px',
                height: Math.random() * 10 + 5 + 'px',
                bottom: '-5%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
              }}
            />
          ))}
        </div>
      );
    case 'campfire':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-orange-500 rounded-full w-1 h-1 animate-ping"
              style={{
                bottom: '20%',
                left: (40 + Math.random() * 20) + '%',
                animationDelay: Math.random() * 3 + 's',
                opacity: 0.6
              }}
            />
          ))}
        </div>
      );
    case 'sun':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 bg-yellow-400/5 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-yellow-200/20 blur-3xl rounded-full animate-pulse"
              style={{
                width: '300px',
                height: '300px',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 1.5}s`
              }}
            />
          ))}
        </div>
      );
    case 'candle':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 bg-orange-500/5 transition-opacity duration-1000 ${isActive ? 'animate-[pulse_4s_infinite]' : 'opacity-0'}`} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(255,150,0,0.1)_0%,transparent_70%)]" />
        </div>
      );
    case 'snow':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-white rounded-full animate-[bounce_8s_infinite_linear]"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                top: '-10%',
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                opacity: Math.random() * 0.6 + 0.2
              }}
            />
          ))}
        </div>
      );
    case 'chocolate':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-amber-900/10" />
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-amber-950/20 blur-xl rounded-full animate-pulse"
              style={{
                width: '200px',
                height: '200px',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 1.2}s`
              }}
            />
          ))}
        </div>
      );
    case 'art':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute rounded-full mix-blend-screen animate-float"
              style={{
                width: `${Math.random() * 150 + 50}px`,
                height: `${Math.random() * 150 + 50}px`,
                backgroundColor: ['#CE93D8', '#4FC3F7', '#FFD54F', '#81C784'][i % 4] + '11',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${-Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      );
    case 'sakura':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="absolute text-pink-300/40 text-2xl animate-[bounce_12s_infinite_linear]"
              style={{
                top: '-10%',
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 12}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >🌸</div>
          ))}
        </div>
      );
    default:
      return <div className="absolute inset-0 bg-black/20 pointer-events-none" />;
  }
};

const Timer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customMins, setCustomMins] = useState(25);
  const [mantra, setMantra] = useState<string>('');
  const [isFetchingMantra, setIsFetchingMantra] = useState(false);

  const currentTheme = FOCUS_THEMES[themeIndex];

  useEffect(() => {
    const savedState = localStorage.getItem('focus_timer_state');
    if (savedState) {
      const { time, active, lastTimestamp, themeIdx } = JSON.parse(savedState);
      setThemeIndex(themeIdx || 0);
      if (active) {
        const elapsed = Math.floor((Date.now() - lastTimestamp) / 1000);
        const remaining = Math.max(0, time - elapsed);
        setTimeLeft(remaining);
        setIsActive(remaining > 0);
      } else {
        setTimeLeft(time);
      }
    }
    fetchMantra();
  }, []);

  const fetchMantra = async () => {
    setIsFetchingMantra(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Give me a short, inspiring 5-10 word productivity mantra or zen tip for a "${currentTheme.name}" theme. Don't use quotes.`,
      });
      setMantra(response.text || 'Focus on the present moment.');
    } catch (error) {
      console.error('Gemini error:', error);
      setMantra('Deep breaths, deep work.');
    } finally {
      setIsFetchingMantra(false);
    }
  };

  useEffect(() => {
    fetchMantra();
  }, [themeIndex]);

  useEffect(() => {
    localStorage.setItem('focus_timer_state', JSON.stringify({
      time: timeLeft,
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
            if (window.navigator.vibrate) window.navigator.vibrate([400, 100, 400]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, themeIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(customMins * 60);
  };

  const handleApplyCustomTime = () => {
    setTimeLeft(customMins * 60);
    setIsCustomizing(false);
    setIsActive(false);
  };

  return (
    <div className={`relative flex flex-col items-center h-full w-full transition-all duration-1000 bg-gradient-to-b ${currentTheme.bgGradient}`}>
      
      <ThemeBackgroundFX themeId={currentTheme.id} isActive={isActive} />

      <header className="w-full flex justify-between items-center pt-14 pb-2 px-8 z-50">
        <h1 
          className="text-2xl font-semibold tracking-tight transition-colors duration-1000"
          style={{ color: currentTheme.color + 'CC' }}
        >
          Focus
        </h1>
        <button 
          onClick={() => setIsCustomizing(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all border border-white/5 apple-blur shadow-lg"
          style={{ color: currentTheme.color }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </header>

      <div className="w-full flex-1 flex flex-col items-center justify-center relative -translate-y-4 z-10">
        <div className={`mb-4 transition-all duration-1000 ${isActive ? 'scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'scale-100'}`}>
           <ThemeAnimator themeId={currentTheme.id} />
        </div>
        
        <div className="text-center w-full px-10">
          <h2 
            className="text-[9px] font-black mb-3 uppercase tracking-[0.4em] transition-colors duration-1000 opacity-60"
            style={{ color: currentTheme.color }}
          >
            {currentTheme.name}
          </h2>
          <div 
            className="text-[4.5rem] font-extralight tracking-tight leading-none tabular-nums mb-4 transition-all duration-1000"
            style={{ 
              color: '#ffffff',
              textShadow: isActive ? `0 0 20px ${currentTheme.color}33` : 'none'
            }}
          >
            {formatTime(timeLeft)}
          </div>

          <div className="h-12 flex items-center justify-center mb-6">
            <p className={`text-xs font-medium italic opacity-40 max-w-[200px] text-center transition-all duration-500 ${isFetchingMantra ? 'blur-sm' : 'blur-0'}`}>
              {mantra}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {FOCUS_THEMES.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setThemeIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                themeIndex === idx ? 'scale-125' : 'opacity-20 hover:opacity-50'
              }`}
              style={{ backgroundColor: themeIndex === idx ? currentTheme.color : '#fff' }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-10 mb-8">
          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all hover:text-white/80 shadow-lg"
          >
            <RotateCcw size={18} strokeWidth={2} />
          </button>

          <button 
            onClick={toggleTimer}
            className="w-22 h-22 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl relative overflow-hidden group border border-white/10"
            style={{ backgroundColor: '#ffffff' }}
          >
             <div 
               className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
               style={{ backgroundColor: currentTheme.color }}
             />
            {isActive ? <Pause size={34} fill="black" /> : <Play size={34} className="ml-1.5" fill="black" />}
          </button>
          
          <button 
            onClick={fetchMantra}
            className={`w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all hover:text-white/80 shadow-lg ${isFetchingMantra ? 'animate-spin' : ''}`}
          >
            <Sparkles size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {isCustomizing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCustomizing(false)} />
          <div 
            className="relative w-full max-w-xs bg-[#1c1c1e] rounded-[2.5rem] p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
          >
            <h3 className="text-xl font-semibold mb-8 text-center text-white/90">Session Duration</h3>
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <input 
                  type="number"
                  value={customMins}
                  onChange={(e) => setCustomMins(parseInt(e.target.value) || 1)}
                  className="bg-transparent text-7xl font-thin w-full text-center focus:outline-none text-white tabular-nums"
                  autoFocus
                  min="1"
                  max="999"
                />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-4">Minutes</span>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCustomizing(false)}
                  className="flex-1 py-5 rounded-[1.5rem] bg-white/5 text-sm font-bold text-white/40 active:scale-95 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleApplyCustomTime}
                  className="flex-1 py-5 rounded-[1.5rem] text-black text-sm font-bold active:scale-95 transition-all"
                  style={{ backgroundColor: currentTheme.color }}
                >
                  START
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
