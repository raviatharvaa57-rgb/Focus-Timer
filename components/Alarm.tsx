
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, ChevronUp, ChevronDown, Loader2, Pencil, X, Bell, BellRing } from 'lucide-react';
import { AlarmItem } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FULL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ZEN_BOWL_URL = 'https://www.orangefreesounds.com/wp-content/uploads/2020/02/Morning-alarm-ringtone.mp3';

interface AlarmProps {
  user: firebase.User;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}

const Alarm: React.FC<AlarmProps> = ({ user, isAdding, setIsAdding }) => {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  
  const [pickerHour, setPickerHour] = useState(7);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);
  
  // Firing state
  const [firingAlarm, setFiringAlarm] = useState<AlarmItem | null>(null);
  const lastTriggeredRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(ZEN_BOWL_URL);
    audio.volume = 0.6;
    audio.loop = true; // Set to loop indefinitely until stopped
    audioRef.current = audio;

    const unsubscribe = db.collection('users')
      .doc(user.uid)
      .collection('alarms')
      .orderBy('time', 'asc')
      .onSnapshot((snapshot) => {
        const fetchedAlarms = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as AlarmItem[];
        setAlarms(fetchedAlarms);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Alarm Error:", error);
        setLoading(false);
      });

    return () => {
      unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user.uid]);

  const playAlarmSound = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.error("Audio play failed:", e));
  }, []);

  // Time check effect to trigger alarm
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Mon"

      if (lastTriggeredRef.current === currentTimeStr) return;

      const matchedAlarm = alarms.find(alarm => {
        if (!alarm.active) return false;
        if (alarm.time !== currentTimeStr) return false;

        // Recurrence logic
        if (alarm.days.includes('Every day')) return true;
        if (alarm.days.includes('Once')) return true;
        if (alarm.days.includes(currentDay)) return true;
        
        return false;
      });

      if (matchedAlarm) {
        setFiringAlarm(matchedAlarm);
        playAlarmSound();
        lastTriggeredRef.current = currentTimeStr;
        if (window.navigator.vibrate) window.navigator.vibrate([500, 200, 500, 200, 500]);
        
        // If it was a "Once" alarm, deactivate it
        if (matchedAlarm.days.includes('Once')) {
          db.collection('users').doc(user.uid).collection('alarms').doc(matchedAlarm.id).update({
            active: false
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, user.uid, playAlarmSound]);

  const toggleAlarm = async (id: string, currentStatus: boolean) => {
    try {
      await db.collection('users').doc(user.uid).collection('alarms').doc(id).update({
        active: !currentStatus
      });
      if (window.navigator.vibrate) window.navigator.vibrate(10);
    } catch (e) {
      console.error("Toggle alarm failed", e);
    }
  };

  const removeAlarm = async (id: string) => {
    try {
      await db.collection('users').doc(user.uid).collection('alarms').doc(id).delete();
      if (window.navigator.vibrate) window.navigator.vibrate(5);
    } catch (e) {
      console.error("Delete alarm failed", e);
    }
  };

  const startEditing = (alarm: AlarmItem) => {
    setEditingAlarm(alarm);
    setNewLabel(alarm.label);
    
    const [h24, m] = alarm.time.split(':').map(Number);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    
    setPickerHour(h12);
    setPickerMinute(m);
    setPickerPeriod(period);
    
    const days = alarm.days.includes('Every day') ? FULL_DAYS : alarm.days.includes('Once') ? [] : alarm.days;
    setSelectedDays(days);
    
    if (window.navigator.vibrate) window.navigator.vibrate(15);
  };

  const closeDialog = () => {
    setIsAdding(false);
    setEditingAlarm(null);
    setNewLabel('');
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const saveAlarm = async () => {
    let h = pickerHour;
    if (pickerPeriod === 'PM' && h < 12) h += 12;
    if (pickerPeriod === 'AM' && h === 12) h = 0;
    
    const timeStr = `${h.toString().padStart(2, '0')}:${pickerMinute.toString().padStart(2, '0')}`;

    const alarmData = {
      time: timeStr,
      label: newLabel || 'Wake up',
      active: true,
      days: selectedDays.length === 7 ? ['Every day'] : selectedDays.length === 0 ? ['Once'] : selectedDays,
      sound: 'zen_bowl', 
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (editingAlarm) {
        await db.collection('users').doc(user.uid).collection('alarms').doc(editingAlarm.id).update(alarmData);
      } else {
        await db.collection('users').doc(user.uid).collection('alarms').add({
          ...alarmData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      closeDialog();
    } catch (e) {
      console.error("Save alarm failed", e);
    }
  };

  const formatDisplayTime = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { h12, m: m.toString().padStart(2, '0'), period };
  };

  const formatDaysDisplay = (days: string[]) => {
    if (days.includes('Every day')) return 'EVERY DAY';
    if (days.includes('Once')) return 'ONCE';
    return days.map(d => d.slice(0, 3).toUpperCase()).join(', ');
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
          <div onClick={togglePeriod} className="text-2xl font-bold py-2 px-3 bg-white/10 rounded-xl transition-all w-16 text-center cursor-pointer">{pickerPeriod}</div>
          <button onClick={togglePeriod} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronDown size={20}/></button>
          <span className="text-[8px] uppercase tracking-widest opacity-20 font-black">Period</span>
        </div>
      </div>
    );
  };

  const showModal = isAdding || !!editingAlarm;

  return (
    <div className="h-full flex flex-col bg-black px-6 overflow-hidden">
      <header className="flex justify-between items-center pt-16 pb-6 shrink-0 relative">
        <h1 className="text-4xl font-bold tracking-tight">Alarm</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-48 px-2">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-white/10" size={32} />
          </div>
        ) : (
          <>
            {alarms.map((alarm) => {
              const display = formatDisplayTime(alarm.time);
              return (
                <div 
                  key={alarm.id} 
                  className={`apple-blur p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between transition-all duration-500 hover:border-white/10 ${alarm.active ? 'opacity-100' : 'opacity-40 scale-[0.98]'}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-baseline mb-1">
                      <span className="text-5xl font-extralight tracking-tighter tabular-nums text-white">
                        {display.h12}:{display.m}
                      </span>
                      <span className="text-base font-bold tracking-widest text-zinc-500 uppercase ml-2">{display.period}</span>
                    </div>
                    <div className="flex flex-col mt-2">
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">{alarm.label}</span>
                       <span className="text-[9px] text-orange-500 font-black uppercase tracking-[0.15em]">
                         {formatDaysDisplay(alarm.days)}
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-3">
                      <button 
                        onClick={() => toggleAlarm(alarm.id, alarm.active)}
                        className={`w-14 h-8 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner ${alarm.active ? 'bg-orange-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${alarm.active ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                      <div className="flex justify-around items-center pt-1">
                        <button onClick={() => startEditing(alarm)} className="text-[#A52A2A] hover:brightness-125 transition-all p-1 active:scale-90">
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button onClick={() => removeAlarm(alarm.id)} className="text-[#A52A2A] hover:brightness-125 transition-all p-1 active:scale-90">
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {alarms.length === 0 && (
              <div className="py-24 text-center">
                <div className="opacity-10 uppercase tracking-[0.6em] text-[11px] font-black mb-6">Your list is empty</div>
                <button 
                  onClick={() => setIsAdding(true)} 
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/60 hover:text-orange-500 transition-all active:scale-95"
                >
                  + Create your first alarm
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-in fade-in duration-300 px-4 pb-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeDialog} />
          <div className="relative w-full max-w-lg apple-blur rounded-[3.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out pb-12">
            <h3 className="text-[11px] font-black mb-8 text-center opacity-40 uppercase tracking-[0.5em]">
              {editingAlarm ? 'Edit Alarm' : 'Add New Alarm'}
            </h3>
            <div className="space-y-8">
              <WheelPicker />
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] opacity-30 font-black ml-4">Label</p>
                <input 
                  type="text"
                  placeholder="e.g. GYM"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full bg-white/5 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none border border-white/5 text-white placeholder:text-white/10"
                />
              </div>
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] opacity-30 font-black ml-4">Repeat</p>
                <div className="flex justify-between gap-1.5 px-1">
                  {DAYS.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDay(FULL_DAYS[idx])}
                      className={`flex-1 aspect-square rounded-xl text-[10px] font-black transition-all active:scale-90 ${
                        selectedDays.includes(FULL_DAYS[idx]) 
                          ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
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
                  onClick={closeDialog} 
                  className="flex-1 py-5 rounded-[2rem] bg-white/5 font-black uppercase tracking-widest text-[10px] text-white/30 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveAlarm} 
                  className="flex-1 py-5 rounded-[2rem] bg-white text-black font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl"
                >
                  {editingAlarm ? 'Update' : 'Save'} Alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIRING ALARM OVERLAY - Enhanced pulsing atmosphere and looping audio */}
      {firingAlarm && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700 overflow-hidden">
          {/* Enhanced Animated Fullscreen Background */}
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-black to-orange-950/40 animate-pulse duration-[3s]" />
          
          {/* Immersive Breathing Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-orange-500/20 rounded-full blur-[140px] animate-[pulse_2s_infinite_ease-in-out]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-600/10 rounded-full blur-[80px] animate-[pulse_1.5s_infinite_ease-in-out]" />

          <div className="relative z-10 text-center animate-in zoom-in-95 slide-in-from-bottom-24 duration-1000 ease-out">
             <div className="w-36 h-36 rounded-[4rem] bg-orange-500/30 border border-orange-500/40 flex items-center justify-center mx-auto mb-12 shadow-[0_0_100px_rgba(249,115,22,0.4)] animate-bounce">
                <BellRing size={56} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
             </div>
             
             <h2 className="text-7xl font-extralight tracking-tighter tabular-nums mb-6 text-white drop-shadow-2xl">
               {formatDisplayTime(firingAlarm.time).h12}:{formatDisplayTime(firingAlarm.time).m}
             </h2>
             
             <p className="text-[14px] uppercase tracking-[0.6em] text-orange-500 font-black mb-20 animate-pulse drop-shadow-sm">
               {firingAlarm.label || 'Alarm'}
             </p>
             
             <button 
               onClick={() => {
                 setFiringAlarm(null);
                 if (audioRef.current) {
                   audioRef.current.pause();
                   audioRef.current.currentTime = 0;
                 }
               }}
               className="group relative px-20 py-7 rounded-[3rem] bg-white text-black font-black uppercase tracking-[0.4em] text-[12px] shadow-[0_0_60px_rgba(255,255,255,0.3)] active:scale-90 hover:scale-105 transition-all overflow-hidden"
             >
               <span className="relative z-10">Stop Alarm</span>
               <div className="absolute inset-0 bg-zinc-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
             </button>
          </div>
          
          {/* Secondary pulsating ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-orange-500/20 rounded-full animate-ping duration-[2s]" />
        </div>
      )}
    </div>
  );
};

export default Alarm;
