
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { AlarmItem } from '../types';

const ALARM_SOUNDS = [
  { id: 'minimal', name: 'Minimal Pulse', url: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3' },
  { id: 'birds', name: 'Morning Birds', url: 'https://cdn.freesound.org/previews/411/411420_5121236-lq.mp3' },
  { id: 'zen', name: 'Zen Bowl', url: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' },
  { id: 'digital', name: 'Digital Wake', url: 'https://cdn.freesound.org/previews/219/219244_4082831-lq.mp3' },
];

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FULL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface AlarmProps {
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}

const Alarm: React.FC<AlarmProps> = ({ isAdding, setIsAdding }) => {
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    const saved = localStorage.getItem('focus_alarms');
    return saved ? JSON.parse(saved) : [
      { id: '1', time: '07:00', label: 'Wake up', active: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], sound: 'birds' },
      { id: '2', time: '08:30', label: 'Gym', active: false, days: ['Mon', 'Wed', 'Fri'], sound: 'minimal' }
    ];
  });
  
  const [newLabel, setNewLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [selectedSoundId, setSelectedSoundId] = useState('minimal');
  
  const [pickerHour, setPickerHour] = useState(7);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('focus_alarms', JSON.stringify(alarms));
  }, [alarms]);

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
    if (window.navigator.vibrate) window.navigator.vibrate(10);
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
    let h = pickerHour;
    if (pickerPeriod === 'PM' && h < 12) h += 12;
    if (pickerPeriod === 'AM' && h === 12) h = 0;
    
    const timeStr = `${h.toString().padStart(2, '0')}:${pickerMinute.toString().padStart(2, '0')}`;

    const alarm: AlarmItem = {
      id: Date.now().toString(),
      time: timeStr,
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

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatDisplayTime = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { h12, m: m.toString().padStart(2, '0'), period };
  };

  const WheelPicker = () => {
    const incrementHour = () => setPickerHour(prev => prev === 12 ? 1 : prev + 1);
    const decrementHour = () => setPickerHour(prev => prev === 1 ? 12 : prev - 1);
    const incrementMin = () => setPickerMinute(prev => prev === 59 ? 0 : prev + 1);
    const decrementMin = () => setPickerMinute(prev => prev === 0 ? 59 : prev - 1);
    const togglePeriod = () => setPickerPeriod(prev => prev === 'AM' ? 'PM' : 'AM');

    return (
      <div className="flex items-center justify-center space-x-4 py-6 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner">
        <div className="flex flex-col items-center">
          <button onClick={incrementHour} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronUp size={20}/></button>
          <div className="text-5xl font-extralight tabular-nums py-2 w-16 text-center">{pickerHour}</div>
          <button onClick={decrementHour} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronDown size={20}/></button>
          <span className="text-[8px] uppercase tracking-widest opacity-20 font-black">Hour</span>
        </div>
        <div className="text-4xl font-thin opacity-20 pb-4">:</div>
        <div className="flex flex-col items-center">
          <button onClick={incrementMin} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronUp size={20}/></button>
          <div className="text-5xl font-extralight tabular-nums py-2 w-20 text-center">{pickerMinute.toString().padStart(2, '0')}</div>
          <button onClick={decrementMin} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronDown size={20}/></button>
          <span className="text-[8px] uppercase tracking-widest opacity-20 font-black">Min</span>
        </div>
        <div className="flex flex-col items-center ml-4">
          <button onClick={togglePeriod} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronUp size={20}/></button>
          <div className="text-2xl font-bold py-2 px-3 bg-white/10 rounded-xl transition-all w-16 text-center">{pickerPeriod}</div>
          <button onClick={togglePeriod} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronDown size={20}/></button>
          <span className="text-[8px] uppercase tracking-widest opacity-20 font-black">Period</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-black px-6 overflow-hidden">
      <header className="flex justify-between items-center pt-16 pb-6 shrink-0 relative">
        <h1 className="text-3xl font-bold tracking-tight">Alarm</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-48">
        {alarms.map((alarm) => {
          const display = formatDisplayTime(alarm.time);
          return (
            <div 
              key={alarm.id} 
              className={`apple-blur p-6 rounded-[2rem] border border-white/5 flex items-center justify-between transition-all duration-300 ${alarm.active ? 'opacity-100' : 'opacity-40 scale-[0.98]'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-extralight tracking-tighter tabular-nums mb-2">
                    {display.h12}:{display.m}
                  </span>
                  <span className="text-lg font-bold tracking-widest opacity-40 uppercase">{display.period}</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                   <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">{alarm.label}</span>
                   <span className="text-[9px] text-orange-500/80 font-bold uppercase tracking-widest truncate max-w-[150px]">
                     {alarm.days.join(', ')}
                   </span>
                </div>
              </div>
              <div className="flex items-center space-x-5">
                <button 
                  onClick={() => toggleAlarm(alarm.id)}
                  className={`w-14 h-8 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner ${alarm.active ? 'bg-orange-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${alarm.active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <button onClick={() => removeAlarm(alarm.id)} className="text-white/10 hover:text-red-500 transition-colors p-2 active:scale-90">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {alarms.length === 0 && (
          <div className="py-20 text-center opacity-10 uppercase tracking-[0.4em] text-[10px] font-black">No Alarms</div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-in fade-in duration-300 px-4 pb-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setIsAdding(false); stopPreview(); }} />
          <div className="relative w-full max-w-lg apple-blur rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out pb-10">
            <h3 className="text-lg font-bold mb-6 text-center opacity-40 uppercase tracking-widest">Add Alarm</h3>
            <div className="space-y-6">
              <WheelPicker />
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] opacity-20 font-black ml-1">Label</p>
                <input 
                  type="text"
                  placeholder="Wake up..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full bg-white/5 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none border border-white/5 text-white placeholder:text-white/10"
                />
              </div>
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] opacity-20 font-black ml-1">Repeat</p>
                <div className="flex justify-between gap-1.5">
                  {DAYS.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDay(FULL_DAYS[idx])}
                      className={`flex-1 aspect-square rounded-xl text-[10px] font-black transition-all active:scale-90 ${
                        selectedDays.includes(FULL_DAYS[idx]) 
                          ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                          : 'bg-white/5 text-white/20'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => { setIsAdding(false); stopPreview(); }} 
                  className="flex-1 py-5 rounded-[1.8rem] bg-white/5 font-black uppercase tracking-widest text-[10px] text-white/30 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={addAlarm} 
                  className="flex-1 py-5 rounded-[1.8rem] bg-white text-black font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alarm;
