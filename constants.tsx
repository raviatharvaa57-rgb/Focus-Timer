
import { FocusTheme } from './types';

export interface ClockTheme {
  id: string;
  name: string;
  bgGradient: string;
  handColor: string;
  secondHandColor: string;
  accentColor: string;
  markerColor: string;
  textColor: string;
  ringColor: string;
  dotColor: string;
}

export const CLOCK_THEMES: ClockTheme[] = [
  { 
    id: 'midnight', 
    name: 'Midnight', 
    bgGradient: 'from-[#000000] via-[#0a0a0c] to-[#121214]', 
    handColor: 'bg-white', 
    secondHandColor: 'bg-blue-500',
    accentColor: 'text-blue-500', 
    markerColor: 'bg-zinc-800',
    textColor: 'text-zinc-100',
    ringColor: 'stroke-white/5',
    dotColor: 'bg-blue-500'
  },
  { 
    id: 'calm', 
    name: 'Calm', 
    bgGradient: 'from-[#1c1c1e] to-[#000000]', 
    handColor: 'bg-zinc-300', 
    secondHandColor: 'bg-orange-500',
    accentColor: 'text-orange-500', 
    markerColor: 'bg-zinc-700',
    textColor: 'text-zinc-200',
    ringColor: 'stroke-orange-500/20',
    dotColor: 'bg-orange-500'
  },
  { 
    id: 'oceanic', 
    name: 'Oceanic', 
    bgGradient: 'from-[#001219] to-[#000000]', 
    handColor: 'bg-cyan-200', 
    secondHandColor: 'bg-cyan-400',
    accentColor: 'text-cyan-400', 
    markerColor: 'bg-cyan-900',
    textColor: 'text-cyan-50',
    ringColor: 'stroke-cyan-500/20',
    dotColor: 'bg-cyan-400'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    bgGradient: 'from-[#2d1b22] to-[#000000]',
    handColor: 'bg-pink-100',
    secondHandColor: 'bg-pink-400',
    accentColor: 'text-pink-400',
    markerColor: 'bg-pink-900/40',
    textColor: 'text-pink-50',
    ringColor: 'stroke-pink-500/10',
    dotColor: 'bg-pink-400'
  },
  {
    id: 'nordic',
    name: 'Nordic',
    bgGradient: 'from-[#1a2a33] to-[#000000]',
    handColor: 'bg-slate-100',
    secondHandColor: 'bg-slate-400',
    accentColor: 'text-slate-400',
    markerColor: 'bg-slate-800',
    textColor: 'text-slate-100',
    ringColor: 'stroke-slate-500/10',
    dotColor: 'bg-slate-400'
  },
  {
    id: 'solar',
    name: 'Solar',
    bgGradient: 'from-[#2d1c00] to-[#000000]',
    handColor: 'bg-amber-100',
    secondHandColor: 'bg-amber-500',
    accentColor: 'text-amber-500',
    markerColor: 'bg-amber-900/40',
    textColor: 'text-amber-50',
    ringColor: 'stroke-amber-500/10',
    dotColor: 'bg-amber-500'
  }
];

export const FOCUS_THEMES: FocusTheme[] = [
  { id: 'coffee', name: 'Coffee Brewing', icon: '☕', color: '#8D6E63', bgGradient: 'from-[#1a120b] to-[#000000]' },
  { id: 'campfire', name: 'Campfire', icon: '🔥', color: '#FF7043', bgGradient: 'from-[#1b0a00] to-[#000000]' },
  { id: 'dog', name: 'Dog', icon: '🐶', color: '#FFCC80', bgGradient: 'from-[#14110f] to-[#000000]' },
  { id: 'cat', name: 'Cat', icon: '🐱', color: '#F48FB1', bgGradient: 'from-[#130f14] to-[#000000]' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', color: '#4FC3F7', bgGradient: 'from-[#000b14] to-[#000000]' },
  { id: 'forest', name: 'Forest', icon: '🌳', color: '#81C784', bgGradient: 'from-[#081408] to-[#000000]' },
  { id: 'night', name: 'Night Sky', icon: '🌌', color: '#9575CD', bgGradient: 'from-[#050514] to-[#000000]' },
  { id: 'sun', name: 'Sunrise', icon: '🌅', color: '#FFD54F', bgGradient: 'from-[#140f00] to-[#000000]' },
  { id: 'candle', name: 'Meditation', icon: '🕯️', color: '#FFB74D', bgGradient: 'from-[#0f0a00] to-[#000000]' },
  { id: 'snow', name: 'Snowfall', icon: '❄️', color: '#E1F5FE', bgGradient: 'from-[#0d101a] to-[#000000]' },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫', color: '#A1887F', bgGradient: 'from-[#0f0900] to-[#000000]' },
  { id: 'study', name: 'Study Desk', icon: '📚', color: '#90A4AE', bgGradient: 'from-[#0f1112] to-[#000000]' },
  { id: 'art', name: 'Art Focus', icon: '🎨', color: '#CE93D8', bgGradient: 'from-[#120f14] to-[#000000]' },
  { id: 'aquarium', name: 'Aquarium', icon: '🐠', color: '#4DD0E1', bgGradient: 'from-[#001214] to-[#000000]' },
  { id: 'sakura', name: 'Cherry Blossom', icon: '🌸', color: '#F8BBD0', bgGradient: 'from-[#140d0f] to-[#000000]' },
];

export const PRESETS = [
  { label: 'Work', minutes: 25 },
  { label: 'Study', minutes: 50 },
  { label: 'Meditation', minutes: 10 },
  { label: 'Nap', minutes: 20 },
];
