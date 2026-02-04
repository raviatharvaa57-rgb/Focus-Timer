
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
  { id: 'coffee', name: 'Coffee Brewing', icon: '☕', color: '#8D6E63', bgGradient: 'from-[#1a120b] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_27606368f5.mp3?filename=coffee-shop-ambience-loop-2-9659.mp3' },
  { id: 'campfire', name: 'Campfire', icon: '🔥', color: '#FF7043', bgGradient: 'from-[#1b0a00] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_82313653f5.mp3?filename=crackling-fireplace-nature-sounds-8012.mp3' },
  { id: 'dog', name: 'Dog', icon: '🐶', color: '#FFCC80', bgGradient: 'from-[#14110f] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2023/10/24/audio_9593f6c827.mp3?filename=birds-and-nature-174828.mp3' },
  { id: 'cat', name: 'Cat', icon: '🐱', color: '#F48FB1', bgGradient: 'from-[#130f14] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/10/01/audio_7314757c2a.mp3?filename=purring-cat-33240.mp3' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', color: '#4FC3F7', bgGradient: 'from-[#000b14] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_23395669b9.mp3?filename=ocean-waves-1129.mp3' },
  { id: 'forest', name: 'Forest', icon: '🌳', color: '#81C784', bgGradient: 'from-[#081408] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_51f0415a77.mp3?filename=forest-birds-ambience-1033.mp3' },
  { id: 'night', name: 'Night Sky', icon: '🌌', color: '#9575CD', bgGradient: 'from-[#050514] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_d086f69116.mp3?filename=summer-night-crickets-and-cicadas-8013.mp3' },
  { id: 'sun', name: 'Sunrise', icon: '🌅', color: '#FFD54F', bgGradient: 'from-[#140f00] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/02/13/audio_78494957f9.mp3?filename=morning-birds-24405.mp3' },
  { id: 'candle', name: 'Meditation', icon: '🕯️', color: '#FFB74D', bgGradient: 'from-[#0f0a00] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_82138b3484.mp3?filename=meditation-bowl-8041.mp3' },
  { id: 'snow', name: 'Snowfall', icon: '❄️', color: '#E1F5FE', bgGradient: 'from-[#0d101a] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_1e0066d214.mp3?filename=wind-howl-1-7663.mp3' },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫', color: '#A1887F', bgGradient: 'from-[#0f0900] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1802315b6d.mp3?filename=lofi-chill-medium-version-111556.mp3' },
  { id: 'study', name: 'Study Desk', icon: '📚', color: '#90A4AE', bgGradient: 'from-[#0f1112] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_039572c830.mp3?filename=rainy-night-9467.mp3' },
  { id: 'art', name: 'Art Focus', icon: '🎨', color: '#CE93D8', bgGradient: 'from-[#120f14] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_c0c806509a.mp3?filename=acoustic-guitar-loop-7848.mp3' },
  { id: 'aquarium', name: 'Aquarium', icon: '🐠', color: '#4DD0E1', bgGradient: 'from-[#001214] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_5f49f50e8a.mp3?filename=underwater-ambience-9430.mp3' },
  { id: 'sakura', name: 'Cherry Blossom', icon: '🌸', color: '#F8BBD0', bgGradient: 'from-[#140d0f] to-[#000000]', soundUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d086f69116.mp3?filename=birds-chirping-7661.mp3' },
];

export const PRESETS = [
  { label: 'Work', minutes: 25 },
  { label: 'Study', minutes: 50 },
  { label: 'Meditation', minutes: 10 },
  { label: 'Nap', minutes: 20 },
];
