
export type AppTab = 'timer' | 'alarm' | 'stopwatch' | 'clock';

export interface FocusTheme {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgGradient: string;
  soundUrl?: string;
}

export interface AlarmItem {
  id: string;
  time: string;
  label: string;
  active: boolean;
  days: string[];
  sound: string;
}

export interface LapTime {
  id: number;
  time: number;
  diff: number;
}

export interface WorldLocation {
  id: string;
  name: string;
  offset: number; // UTC offset in hours
  country?: string;
  mood?: string;
}
