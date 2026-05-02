
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Settings2 } from 'lucide-react';
import { FOCUS_THEMES, PRESETS } from '../constants';
import ThemeAnimator from './ThemeAnimator';

const ZEN_BOWL_URL = 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3';
const NOTE_STORAGE_KEY = 'focusTimerFloatingNote';
const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 190;
const createNoteLine = () => ({
  id: crypto.randomUUID(),
  text: '',
  completed: false,
});

type FloatingNoteState = {
  lines: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  collapsed: boolean;
};

interface TimerProps {
  isCustomizing: boolean;
  setIsCustomizing: (val: boolean) => void;
  onFocusSessionComplete: (minutes: number) => void;
  onMascotAction: (action: 'start' | 'pause' | 'reset' | 'milestone') => void;
  isDarkMode: boolean;
}

const Timer: React.FC<TimerProps> = ({ isCustomizing, setIsCustomizing, onFocusSessionComplete, onMascotAction, isDarkMode }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);
  const [alarmVolume, setAlarmVolume] = useState(0.5);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [floatingNote, setFloatingNote] = useState<FloatingNoteState>({ lines: [], collapsed: false });
  const [hasHydratedFloatingNote, setHasHydratedFloatingNote] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusEndTimeRef = useRef<number | null>(null);
  const breakEndTimeRef = useRef<number | null>(null);
  const hasTriggeredMilestoneRef = useRef(false);

  const currentTheme = FOCUS_THEMES[themeIndex];

  useEffect(() => {
    const savedNote = localStorage.getItem(NOTE_STORAGE_KEY);
    if (!savedNote) {
      setFloatingNote({
        lines: [createNoteLine()],
        collapsed: false,
      });
      setHasHydratedFloatingNote(true);
      return;
    }

    try {
      const parsedNote = JSON.parse(savedNote) as Partial<FloatingNoteState>;
      setFloatingNote({
        lines: Array.isArray(parsedNote.lines)
          ? parsedNote.lines
              .filter((line): line is { id?: string; text?: string; completed?: boolean } => Boolean(line))
              .map((line) => ({
                id: typeof line.id === 'string' ? line.id : crypto.randomUUID(),
                text: typeof line.text === 'string' ? line.text : '',
                completed: Boolean(line.completed),
              }))
          : [createNoteLine()],
        collapsed: Boolean(parsedNote.collapsed),
      });
    } catch (error) {
      console.error('Error loading floating note:', error);
      setFloatingNote({
        lines: [createNoteLine()],
        collapsed: false,
      });
    }
    setHasHydratedFloatingNote(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedFloatingNote) {
      return;
    }

    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(floatingNote));
  }, [floatingNote, hasHydratedFloatingNote]);

  useEffect(() => {
    const alarm = new Audio(ZEN_BOWL_URL);
    alarm.volume = alarmVolume;
    alarmAudioRef.current = alarm;
  }, [alarmVolume]);

  const playAlarmThrice = useCallback(() => {
    if (!alarmAudioRef.current || !isAlarmEnabled) return;
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
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      if (!focusEndTimeRef.current) {
        focusEndTimeRef.current = Date.now() + (timeLeft * 1000);
      }

      interval = setInterval(() => {
        const remainingSeconds = Math.max(0, Math.ceil((focusEndTimeRef.current! - Date.now()) / 1000));

        if (remainingSeconds <= 0) {
          setIsActive(false);
          focusEndTimeRef.current = null;
          hasTriggeredMilestoneRef.current = false;
          setTimeLeft(totalTime);

          if (totalBreakTime > 0) {
            breakEndTimeRef.current = Date.now() + (totalBreakTime * 1000);
            setIsBreakActive(true);
            setBreakTimeLeft(totalBreakTime);
          }

          onFocusSessionComplete(Math.round(totalTime / 60));
          playAlarmThrice();
          if (window.navigator.vibrate) window.navigator.vibrate([400, 100, 400]);
          return;
        }

        const elapsedSeconds = totalTime - remainingSeconds;
        if (
          totalTime >= 10 * 60 &&
          !hasTriggeredMilestoneRef.current &&
          elapsedSeconds >= Math.ceil(totalTime / 2)
        ) {
          hasTriggeredMilestoneRef.current = true;
          onMascotAction('milestone');
        }

        setTimeLeft(remainingSeconds);
      }, 250);
    } else if (isBreakActive && breakTimeLeft > 0) {
      if (!breakEndTimeRef.current) {
        breakEndTimeRef.current = Date.now() + (breakTimeLeft * 1000);
      }

      interval = setInterval(() => {
        const remainingSeconds = Math.max(0, Math.ceil((breakEndTimeRef.current! - Date.now()) / 1000));

        if (remainingSeconds <= 0) {
          setIsBreakActive(false);
          breakEndTimeRef.current = null;
          setBreakTimeLeft(0);
          playAlarmThrice();
          if (window.navigator.vibrate) window.navigator.vibrate([400, 100, 400]);
          return;
        }

        setBreakTimeLeft(remainingSeconds);
      }, 250);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, totalTime, isBreakActive, breakTimeLeft, totalBreakTime, onFocusSessionComplete, playAlarmThrice]);

  const toggleTimer = () => { 
    const nextAction = isActive || isBreakActive ? 'pause' : 'start';
    if (isBreakActive) {
      if (isBreakActive) {
        breakEndTimeRef.current = null;
      }
      setIsBreakActive(!isBreakActive);
    } else {
      if (isActive) {
        focusEndTimeRef.current = null;
      }
      setIsActive(!isActive);
    }
    onMascotAction(nextAction);
    if (window.navigator.vibrate) window.navigator.vibrate(10); 
  };
  const resetTimer = () => { 
    focusEndTimeRef.current = null;
    breakEndTimeRef.current = null;
    hasTriggeredMilestoneRef.current = false;
    setIsActive(false); 
    setTimeLeft(totalTime); 
    setIsBreakActive(false);
    setBreakTimeLeft(0); // Reset break timer to 0 since break hasn't started
    onMascotAction('reset');
    if (window.navigator.vibrate) window.navigator.vibrate(5); 
  };

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
    focusEndTimeRef.current = null;
    breakEndTimeRef.current = null;
    hasTriggeredMilestoneRef.current = false;
    setIsActive(false);
    setIsBreakActive(false);
    setIsCustomizing(true);
    if (window.navigator.vibrate) window.navigator.vibrate(12);
  };

  const updateNoteLines = (updater: (lines: FloatingNoteState['lines']) => FloatingNoteState['lines']) => {
    setFloatingNote((previous) => ({
      ...previous,
      lines: updater(previous.lines),
    }));
  };

  const addNoteLine = () => {
    updateNoteLines((previous) => [
      ...previous,
      createNoteLine(),
    ]);
  };

  const updateNoteLine = (id: string, text: string) => {
    updateNoteLines((previous) => {
      const nextLines = previous.map((line) => (
        line.id === id ? { ...line, text } : line
      ));

      const isLastLine = nextLines[nextLines.length - 1]?.id === id;
      if (isLastLine && text.trim() && nextLines[nextLines.length - 1].text.trim()) {
        nextLines.push(createNoteLine());
      }

      return nextLines;
    });
  };

  const toggleNoteLine = (id: string) => {
    updateNoteLines((previous) => previous.map((line) => (
      line.id === id ? { ...line, completed: !line.completed } : line
    )));
  };

  const deleteNoteLine = (id: string) => {
    let nextFocusLineId = '';

    updateNoteLines((previous) => {
      const lineIndex = previous.findIndex((line) => line.id === id);
      const nextLines = previous.filter((line) => line.id !== id);

      if (nextLines.length === 0) {
        const replacementLine = createNoteLine();
        nextFocusLineId = replacementLine.id;
        return [replacementLine];
      }

      const fallbackLine = nextLines[Math.min(lineIndex, nextLines.length - 1)];
      nextFocusLineId = fallbackLine.id;
      return nextLines;
    });

    window.requestAnimationFrame(() => {
      if (nextFocusLineId) {
        lineInputRefs.current[nextFocusLineId]?.focus();
      }
    });
  };

  const handleNoteLineEnter = (id: string) => {
    let nextLineId = '';

    updateNoteLines((previous) => {
      const lineIndex = previous.findIndex((line) => line.id === id);
      if (lineIndex === -1) {
        return previous;
      }

      const nextLines = [...previous];
      const followingLine = nextLines[lineIndex + 1];

      if (followingLine) {
        nextLineId = followingLine.id;
        return nextLines;
      }

      const newLine = createNoteLine();
      nextLineId = newLine.id;
      nextLines.push(newLine);
      return nextLines;
    });

    window.requestAnimationFrame(() => {
      if (nextLineId) {
        lineInputRefs.current[nextLineId]?.focus();
      }
    });
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col h-full w-full overflow-hidden transition-all duration-1000 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
      {/* Background with Theme Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.bgGradient} opacity-30 transition-all duration-1000`} />
      
      {/* HEADER */}
      <header className="w-full flex flex-col items-start pt-16 lg:pt-14 pb-2 px-10 z-50 relative pointer-events-none">
        <h1 className={`text-4xl lg:text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white/90' : 'text-slate-900'}`}>Focus</h1>
        <p className={`text-[10px] uppercase tracking-[0.4em] font-black mt-1 opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
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
              className={`absolute inset-0 rounded-full backdrop-blur-md transition-all duration-700 group-hover:scale-105 group-active:scale-95 shadow-2xl ${
                isDarkMode ? 'border border-white/5 bg-white/[0.02]' : 'border border-slate-200 bg-white/60'
              }`} 
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
              className={`text-[6.5rem] lg:text-[6rem] font-bold tracking-tighter leading-none tabular-nums mb-2 active:scale-95 transition-transform focus:outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {isBreakActive ? formatTime(breakTimeLeft) : formatTime(timeLeft)}
            </button>

            {/* Break Indicator */}
            {isBreakActive && (
              <div className={`text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                Break Time
              </div>
            )}

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2">
              {FOCUS_THEMES.map((t, idx) => (
                <div 
                  key={idx} 
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${themeIndex === idx ? 'opacity-100 scale-125' : 'opacity-10'}`}
                  style={{ backgroundColor: themeIndex === idx ? currentTheme.color : (isDarkMode ? '#fff' : '#334155') }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Group: The Control Pill - Moved down by reducing mb from 4/8 to 2/4 */}
        <div className={`flex items-center justify-center gap-6 lg:gap-10 backdrop-blur-3xl py-4 lg:py-5 px-7 lg:px-10 rounded-[2.5rem] shadow-2xl mt-8 lg:mt-0 mb-2 lg:mb-4 ${
          isDarkMode ? 'bg-zinc-900/60 border border-white/5' : 'bg-slate-100/90 border border-slate-200'
        }`}>
          <button 
            onClick={resetTimer} 
            className={`w-12 h-12 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isDarkMode ? 'bg-white/[0.05] border border-white/5 text-white/40 hover:text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw size={18} strokeWidth={2} />
          </button>
          
          <button 
            onClick={toggleTimer} 
            className={`w-16 h-16 lg:w-16 lg:h-16 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-2xl ${
              isDarkMode ? 'bg-white text-black shadow-white/10' : 'bg-slate-900 text-white shadow-slate-300/40'
            }`}
          >
            {(isActive || isBreakActive) ? (
                <Pause size={24} fill="currentColor" />
            ) : (
                <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button 
            onClick={openPicker} 
            className={`w-12 h-12 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isDarkMode ? 'bg-white/[0.05] border border-white/5 text-white/40 hover:text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings2 size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className={`absolute z-[120] w-[220px] rounded-[1.75rem] shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md transition-colors duration-700 ${
          isDarkMode
            ? 'border border-white/10 bg-[#1e293b]/92 text-white'
            : 'border border-slate-200 bg-white/95 text-slate-900'
        }`}
        style={{ right: 20, top: 120 }}
      >
        <div
          className={`flex items-center justify-between rounded-t-[1.75rem] px-4 py-3 ${
            isDarkMode ? 'border-b border-white/10' : 'border-b border-slate-200'
          }`}
        >
          <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-white/65' : 'text-slate-500'}`}>Task Note</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFloatingNote((previous) => ({ ...previous, collapsed: !previous.collapsed }))}
              className={`rounded-full px-2 py-0.5 text-sm font-black leading-none transition ${
                isDarkMode
                  ? 'border border-white/10 text-white/55 hover:bg-white/5'
                  : 'border border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              aria-label={floatingNote.collapsed ? 'Expand note' : 'Collapse note'}
            >
              {floatingNote.collapsed ? 'v' : '^'}
            </button>
            <span className={`text-lg leading-none ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>⋮⋮</span>
          </div>
        </div>
        {!floatingNote.collapsed && (
          <div className="px-4 pb-4 pt-3">
            <div className="max-h-[118px] space-y-2 overflow-y-auto pr-1">
              {floatingNote.lines.map((line) => (
                <div key={line.id} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => toggleNoteLine(line.id)}
                    className={`mt-1 h-4 w-4 rounded-full transition ${
                      isDarkMode
                        ? `${line.completed ? 'bg-white/80 border border-white/30' : 'bg-transparent border border-white/25'}`
                        : `${line.completed ? 'bg-slate-900 border border-slate-900' : 'bg-transparent border border-slate-300'}`
                    }`}
                    aria-label={line.completed ? 'Unmark line' : 'Mark line complete'}
                  />
                  <input
                    ref={(element) => {
                      lineInputRefs.current[line.id] = element;
                    }}
                    value={line.text}
                    onChange={(event) => updateNoteLine(line.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleNoteLineEnter(line.id);
                      }
                    }}
                    placeholder="Write the next step here..."
                    className={`min-w-0 flex-1 bg-transparent text-sm leading-6 outline-none ${
                      isDarkMode
                        ? `placeholder:text-white/25 ${line.completed ? 'text-white/35 line-through' : 'text-white/85'}`
                        : `placeholder:text-slate-400 ${line.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`
                    }`}
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => deleteNoteLine(line.id)}
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-black transition ${
                      isDarkMode
                        ? 'text-white/40 hover:bg-white/5 hover:text-white/70'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    aria-label="Delete line"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
              Stays pinned on the right
            </p>
          </div>
        )}
      </div>

      {/* TIMER SETUP OVERLAY */}
      {isCustomizing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className={`${isDarkMode ? 'bg-black/95' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-3xl`} onClick={() => setIsCustomizing(false)} />
          <div className={`relative w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'apple-blur border border-white/10' : 'bg-white border border-slate-200'
          }`}>
            <h3 className={`text-[10px] font-black mb-8 text-center opacity-30 uppercase tracking-[0.5em] ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Timer Setup</h3>

            {/* TOTAL SESSION SECTION */}
            <div className="mb-8">
              <h4 className={`text-[9px] font-bold mb-4 text-center opacity-60 uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Total Session</h4>
              <div className="flex items-center justify-center space-x-10 mb-6">
                <button onClick={() => setCustomMinutes(m => Math.max(1, m - 1))} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}><Minus size={20} /></button>
                <div className="text-center min-w-[80px]">
                  <div className={`text-6xl font-light tabular-nums leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{customMinutes}</div>
                  <div className="text-[9px] uppercase tracking-widest font-bold opacity-20 mt-2">Mins</div>
                </div>
                <button onClick={() => setCustomMinutes(m => Math.min(180, m + 1))} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}><Plus size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[15, 25, 45, 60].map(min => (
                  <button
                    key={min}
                    onClick={() => setCustomMinutes(min)}
                    className={`py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                      customMinutes === min
                        ? 'bg-white text-black'
                        : isDarkMode
                          ? 'bg-white/5 text-white/40 border border-white/5'
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {min} MINS
                  </button>
                ))}
              </div>

              <p className={`text-center text-[10px] ${isDarkMode ? 'text-white/35' : 'text-slate-500'}`}>
                Break time is taken out of this total.
              </p>
            </div>

            {/* BREAK TIME SECTION */}
            <div className="mb-8">
              <h4 className={`text-[9px] font-bold mb-4 text-center opacity-60 uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Break Time</h4>
              <div className="flex items-center justify-center space-x-10 mb-6">
                <button onClick={() => setCustomBreakMinutes(m => Math.max(0, m - 1))} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}><Minus size={20} /></button>
                <div className="text-center min-w-[80px]">
                  <div className={`text-6xl font-light tabular-nums leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{customBreakMinutes}</div>
                  <div className="text-[9px] uppercase tracking-widest font-bold opacity-20 mt-2">Mins</div>
                </div>
                <button onClick={() => setCustomBreakMinutes(m => Math.min(60, m + 1))} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}><Plus size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[0, 5, 10, 15].map(min => (
                  <button
                    key={min}
                    onClick={() => setCustomBreakMinutes(min)}
                    className={`py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                      customBreakMinutes === min
                        ? 'bg-white text-black'
                        : isDarkMode
                          ? 'bg-white/5 text-white/40 border border-white/5'
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {min === 0 ? 'No Break' : `${min} MINS`}
                  </button>
                ))}
              </div>
            </div>

            {/* ALARM SETTINGS SECTION */}
            <div className="mb-8">
              <h4 className={`text-[9px] font-bold mb-4 text-center opacity-60 uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Alarm Settings</h4>

              <div className="flex items-center justify-between mb-6">
                <span className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Enable Alarm</span>
                <button
                  onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${isAlarmEnabled ? 'bg-green-500' : isDarkMode ? 'bg-white/20' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${isAlarmEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {isAlarmEnabled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Volume</span>
                    <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>{Math.round(alarmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={alarmVolume}
                    onChange={(e) => setAlarmVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${currentTheme.color} 0%, ${currentTheme.color} ${alarmVolume * 100}%, rgba(255,255,255,0.1) ${alarmVolume * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>
              )}

              <div className="text-center">
                <div className={`text-xs mb-2 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Alarm Sound</div>
                <div className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-700'}`}>Zen Bowl</div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsCustomizing(false)}
                className={`flex-1 py-5 rounded-[2rem] text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
                  isDarkMode ? 'bg-white/5 border border-white/5 text-white/60' : 'bg-slate-100 border border-slate-200 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const effectiveBreakMinutes = Math.min(customBreakMinutes, Math.max(0, customMinutes - 1));
                  const focusMinutes = Math.max(1, customMinutes - effectiveBreakMinutes);

                  focusEndTimeRef.current = null;
                  breakEndTimeRef.current = null;
                  hasTriggeredMilestoneRef.current = false;
                  setIsBreakActive(false);
                  setTotalTime(focusMinutes * 60);
                  setTimeLeft(focusMinutes * 60);
                  setTotalBreakTime(effectiveBreakMinutes * 60);
                  setBreakTimeLeft(0);
                  setIsActive(true);
                  if (alarmAudioRef.current) {
                    alarmAudioRef.current.volume = alarmVolume;
                  }
                  setIsCustomizing(false);
                }}
                className="flex-1 py-5 rounded-[2rem] text-black text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                style={{ backgroundColor: currentTheme.color }}
              >
                Start Timer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Timer;

// Custom styles for the volume slider
const style = document.createElement('style');
style.textContent = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
`;
document.head.appendChild(style);
