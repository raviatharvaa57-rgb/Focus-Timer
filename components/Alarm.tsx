
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Bell, BellRing, Trash2, Check, Volume2, Play } from 'lucide-react';
import { AlarmItem } from '../types';

const ALARM_SOUNDS = [
  { id: 'minimal', name: 'Minimal Pulse', url: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3' },
  { id: 'birds', name: 'Morning Birds', url: 'https://cdn.freesound.org/previews/411/411420_5121236-lq.mp3' },
  { id: 'zen', name: 'Zen Bowl', url: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' },
  { id: 'digital', name: 'Digital Wake', url: 'https://cdn.freesound.org/previews/219/219244_4082831-lq.mp3' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Alarm: React.FC = () => {
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    const saved = localStorage.getItem('focus_alarms');
    return saved ? JSON.parse(saved) : [
      { id: '1', time: '07:00', label: 'Wake up', active: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], sound: 'birds' },
      { id: '2', time: '08:30', label: 'Gym', active: false, days: ['Mon', 'Wed', 'Fri'], sound: 'minimal' }
    ];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newLabel, setNewLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [selectedSoundId, setSelectedSoundId] = useState('minimal');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('focus_alarms', JSON.stringify(alarms));
  }, [alarms]);

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const removeAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addAlarm = () => {
    const alarm: AlarmItem = {
      id: Date.now().toString(),
      time: newTime,
      label: newLabel || 'Alarm',
      active: true,
      days: selectedDays.length === 7 ? ['Every day'] : selectedDays.length === 0 ? ['Once'] : selectedDays,
      sound: selectedSoundId
    };
    setAlarms([...alarms, alarm].sort((a, b) => a.time.localeCompare(b.time)));
    setIsAdding(false);
    setNewLabel('');
    stopPreview();
  };

  const playPreview = (url: string, id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(url);
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    setSelectedSoundId(id);
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-black safe-top px-6">
      <header className="flex justify-between items-center pt-12 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Alarm</h1>
        <button 
          onClick={() => { setIsAdding(true); setSelectedSoundId('minimal'); setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']); }}
          className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-orange-500 active:scale-95 transition-all shadow-lg"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-40">
        {alarms.map((alarm) => {
          const soundName = ALARM_SOUNDS.find(s => s.id === alarm.sound)?.name || 'Default';
          return (
            <div 
              key={alarm.id} 
              className={`apple-blur p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between transition-all duration-300 ${alarm.active ? 'opacity-100' : 'opacity-40'}`}
            >
              <div className="flex flex-col">
                <span className="text-5xl font-light tracking-tight tabular-nums mb-1">{alarm.time}</span>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{alarm.label}</span>
                   <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                   <span className="text-[10px] text-orange-500/70 font-bold uppercase tracking-widest">
                     {alarm.days.join(', ')}
                   </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => toggleAlarm(alarm.id)}
                  className={`w-14 h-8 rounded-full relative transition-colors duration-300 flex items-center px-1 ${alarm.active ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${alarm.active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <button onClick={() => removeAlarm(alarm.id)} className="text-red-500/40 hover:text-red-500 transition-colors p-2 active:scale-90">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {alarms.length === 0 && (
          <div className="py-20 text-center opacity-20 uppercase tracking-widest text-[10px] font-bold">No Alarms</div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setIsAdding(false); stopPreview(); }} />
          <div className="relative w-full max-w-sm apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh] hide-scrollbar">
            <h3 className="text-xl font-bold mb-6 text-center">New Alarm</h3>
            <div className="space-y-6">
              <input 
                type="time" 
                value={newTime} 
                onChange={e => setNewTime(e.target.value)}
                className="w-full bg-white/5 rounded-2xl py-6 px-4 text-4xl text-center focus:outline-none border border-white/10 text-white"
              />
              <input 
                type="text" 
                placeholder="Label (e.g. Gym)" 
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="w-full bg-white/5 rounded-2xl py-4 px-4 focus:outline-none border border-white/10 text-white placeholder:text-white/20"
              />
              
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-black ml-1">Repeat</p>
                <div className="flex justify-between">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-9 rounded-full text-[10px] font-bold transition-all ${
                        selectedDays.includes(day) 
                          ? 'bg-orange-500 text-black' 
                          : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-black ml-1">Sound Selection</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALARM_SOUNDS.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => playPreview(sound.url, sound.id)}
                      className={`flex items-center space-x-2 p-3 rounded-xl border transition-all active:scale-95 ${
                        selectedSoundId === sound.id 
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                          : 'bg-white/5 border-transparent text-white/40'
                      }`}
                    >
                      <Volume2 size={14} className={selectedSoundId === sound.id ? 'animate-pulse' : ''} />
                      <span className="text-[10px] font-bold truncate">{sound.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button onClick={() => { setIsAdding(false); stopPreview(); }} className="flex-1 py-4 rounded-2xl bg-zinc-800 font-bold uppercase tracking-widest text-[10px] opacity-60 active:scale-95 transition-all">Cancel</button>
                <button onClick={addAlarm} className="flex-1 py-4 rounded-2xl bg-white text-black font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alarm;
