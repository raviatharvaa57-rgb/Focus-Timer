import { supabase } from './supabase';
import type { AchievementBadge, AchievementPreferences, TaskItem } from '../../types';

export interface ThemeSettingsRecord {
  mode: 'dark' | 'light';
  autoSwitch: boolean;
  promptSeen: boolean;
  promptEnabled: boolean;
}

export interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  date: string;
}

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

export const loadUserData = async (userId: string) => {
  const db = client();
  const [settingsResult, tasksResult, sessionsResult, badgesResult] = await Promise.all([
    db.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    db.from('tasks').select('*').eq('user_id', userId).order('position'),
    db.from('focus_sessions').select('*').eq('user_id', userId).order('end_time'),
    db.from('achievements').select('*').eq('user_id', userId).order('unlocked_at'),
  ]);

  const error = settingsResult.error || tasksResult.error || sessionsResult.error || badgesResult.error;
  if (error) throw error;

  return {
    settings: settingsResult.data,
    tasks: (tasksResult.data ?? []).map((task) => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
    })) as TaskItem[],
    sessions: (sessionsResult.data ?? []).map((session) => ({
      id: session.id,
      startTime: new Date(session.start_time).getTime(),
      endTime: new Date(session.end_time).getTime(),
      duration: Number(session.duration_ms),
      date: session.created_at,
    })) as SessionRecord[],
    badges: (badgesResult.data ?? []).map((badge) => ({
      id: badge.id,
      title: badge.title,
      description: badge.description,
      category: badge.category,
      unlockedAt: badge.unlocked_at,
    })) as AchievementBadge[],
  };
};

export const saveUserSettings = async (
  userId: string,
  settings: {
    dailyGoal?: string;
    achievementPreferences?: AchievementPreferences;
    themeSettings?: ThemeSettingsRecord;
    foxSettings?: Record<string, unknown>;
    notificationSettings?: Record<string, unknown>;
    floatingNote?: Record<string, unknown>;
  },
) => {
  const payload: Record<string, unknown> = { user_id: userId };
  if (settings.dailyGoal !== undefined) payload.daily_goal = settings.dailyGoal;
  if (settings.achievementPreferences !== undefined) payload.achievement_preferences = settings.achievementPreferences;
  if (settings.themeSettings !== undefined) payload.theme_settings = settings.themeSettings;
  if (settings.foxSettings !== undefined) payload.fox_settings = settings.foxSettings;
  if (settings.notificationSettings !== undefined) payload.notification_settings = settings.notificationSettings;
  if (settings.floatingNote !== undefined) payload.floating_note = settings.floatingNote;
  const { error } = await client().from('user_settings').upsert(payload);
  if (error) throw error;
};

export const replaceTasks = async (userId: string, tasks: TaskItem[]) => {
  const db = client();
  const { error: deleteError } = await db.from('tasks').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  if (tasks.length === 0) return;
  const { error } = await db.from('tasks').insert(tasks.map((task, position) => ({
    id: task.id,
    user_id: userId,
    text: task.text,
    completed: task.completed,
    position,
  })));
  if (error) throw error;
};

export const saveFocusSession = async (userId: string, session: SessionRecord) => {
  const { error } = await client().from('focus_sessions').insert({
    user_id: userId,
    start_time: new Date(session.startTime).toISOString(),
    end_time: new Date(session.endTime).toISOString(),
    duration_ms: session.duration,
  });
  if (error) throw error;
};

export const clearFocusSessions = async (userId: string) => {
  const { error } = await client().from('focus_sessions').delete().eq('user_id', userId);
  if (error) throw error;
};

export const saveAchievement = async (userId: string, badge: AchievementBadge) => {
  const { error } = await client().from('achievements').upsert({
    id: badge.id,
    user_id: userId,
    title: badge.title,
    description: badge.description,
    category: badge.category,
    unlocked_at: badge.unlockedAt,
  });
  if (error) throw error;
};

export const loadTasks = async (userId: string) => {
  const { data, error } = await client().from('tasks').select('*').eq('user_id', userId).order('position');
  if (error) throw error;
  return (data ?? []).map((task) => ({ id: task.id, text: task.text, completed: task.completed })) as TaskItem[];
};
