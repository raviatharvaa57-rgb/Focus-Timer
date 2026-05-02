
export type AppTab = 'timer' | 'alarm' | 'stopwatch' | 'clock' | 'tasks' | 'appUsage';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  isEditing?: boolean;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  unlockedAt: string;
  category: 'dailyGoal' | 'timer';
}

export interface AchievementPreferences {
  showGoalPrompt: boolean;
  showDailyGoalCompletePopup: boolean;
  showTimerCompletionPopup: boolean;
  showNotificationPermissionPrompt: boolean;
  notificationsEnabled: boolean;
}

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
