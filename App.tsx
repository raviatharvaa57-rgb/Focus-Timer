
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Hourglass as TimerIcon, 
  AlarmClock, 
  Timer as StopwatchIcon, 
  Globe as ClockIcon,
  User as UserIcon,
  ListChecks as TasksIcon,
  Plus,
  LogOut
} from 'lucide-react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebase';
import { AchievementBadge, AchievementPreferences, AppTab, TaskItem } from './types';
import Timer from './components/Timer';
import Alarm from './components/Alarm';
import Stopwatch from './components/Stopwatch';
import Clock from './components/Clock';
import Tasks from './components/Tasks';
import AppUsageActivity from './components/AppUsageActivity';
import Auth from './components/Auth';
import Profile from './components/Profile';
import FoxMascot, { FOX_GREETING_ROTATION, FoxPoseKey } from './components/FoxMascot';
import { FOCUS_THEMES } from './constants';

interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  date: string;
}

const SESSION_HISTORY_KEY = 'appUsageSessions';
const MIN_SESSION_DURATION_MS = 10000;
const DAILY_GOAL_STORAGE_KEY = 'focusTimerDailyGoal';
const ACHIEVEMENT_PREFS_STORAGE_KEY = 'focusTimerAchievementPreferences';
const ACHIEVEMENT_BADGES_STORAGE_KEY = 'focusTimerAchievementBadges';
const TASKS_STORAGE_KEY = 'focusTimerTasks';
const THEME_SETTINGS_STORAGE_KEY = 'focusTimerThemeSettings';
const NOTIFICATION_SOUND_URL = 'https://www.orangefreesounds.com/wp-content/uploads/2020/02/Morning-alarm-ringtone.mp3';
const FOX_GREETINGS = [
  'Hi',
  'Hello',
  'Welcome back',
  'Hey there',
  'Good to see you',
  'Ready to focus',
];
type FoxMoment =
  | 'greeting'
  | 'start'
  | 'pause'
  | 'reset'
  | 'milestone'
  | 'complete'
  | 'achievement'
  | 'tap'
  | 'hold'
  | 'assist'
  | 'darkMode'
  | 'lightMode'
  | 'clockPage'
  | 'alarmPage'
  | 'stopwatchPage'
  | 'timerPage';

const defaultAchievementPreferences: AchievementPreferences = {
  showGoalPrompt: true,
  showDailyGoalCompletePopup: true,
  showTimerCompletionPopup: true,
  showNotificationPermissionPrompt: true,
  notificationsEnabled: false,
};

type ThemeMode = 'dark' | 'light';

interface ThemeSettings {
  mode: ThemeMode;
  autoSwitch: boolean;
  promptSeen: boolean;
  promptEnabled: boolean;
}

const defaultThemeSettings: ThemeSettings = {
  mode: 'dark',
  autoSwitch: false,
  promptSeen: false,
  promptEnabled: true,
};

const normalizeAchievementPreferences = (
  rawPreferences: Partial<AchievementPreferences> & {
    hideGoalPrompt?: boolean;
    hideDailyGoalCompletePopup?: boolean;
    hideTimerCompletionPopup?: boolean;
  },
): AchievementPreferences => ({
  showGoalPrompt:
    typeof rawPreferences.showGoalPrompt === 'boolean'
      ? rawPreferences.showGoalPrompt
      : !Boolean(rawPreferences.hideGoalPrompt),
  showDailyGoalCompletePopup:
    typeof rawPreferences.showDailyGoalCompletePopup === 'boolean'
      ? rawPreferences.showDailyGoalCompletePopup
      : !Boolean(rawPreferences.hideDailyGoalCompletePopup),
  showTimerCompletionPopup:
    typeof rawPreferences.showTimerCompletionPopup === 'boolean'
      ? rawPreferences.showTimerCompletionPopup
      : !Boolean(rawPreferences.hideTimerCompletionPopup),
  showNotificationPermissionPrompt:
    typeof rawPreferences.showNotificationPermissionPrompt === 'boolean'
      ? rawPreferences.showNotificationPermissionPrompt
      : true,
  notificationsEnabled:
    typeof rawPreferences.notificationsEnabled === 'boolean'
      ? rawPreferences.notificationsEnabled
      : typeof Notification !== 'undefined' && Notification.permission === 'granted',
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const [previousTab, setPreviousTab] = useState<AppTab>('timer');
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isActionActive, setIsActionActive] = useState(false);
  const [isImmersiveLandscape, setIsImmersiveLandscape] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [currentSessionTime, setCurrentSessionTime] = useState<number>(0);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [tasksSnapshot, setTasksSnapshot] = useState<TaskItem[]>([]);
  const [dailyGoal, setDailyGoal] = useState('');
  const [achievementPreferences, setAchievementPreferences] = useState<AchievementPreferences>(defaultAchievementPreferences);
  const [achievementBadges, setAchievementBadges] = useState<AchievementBadge[]>([]);
  const [hasLoadedAchievementPreferences, setHasLoadedAchievementPreferences] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalPromptDontShowAgain, setGoalPromptDontShowAgain] = useState(false);
  const [dailyGoalPopupDontShowAgain, setDailyGoalPopupDontShowAgain] = useState(false);
  const [timerPopupDontShowAgain, setTimerPopupDontShowAgain] = useState(false);
  const [notificationPromptDontShowAgain, setNotificationPromptDontShowAgain] = useState(false);
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const [showDailyGoalEditor, setShowDailyGoalEditor] = useState(false);
  const [showDailyGoalCompletePopup, setShowDailyGoalCompletePopup] = useState(false);
  const [showNotificationPermissionPrompt, setShowNotificationPermissionPrompt] = useState(false);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<'unsupported' | 'default' | 'granted' | 'denied'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const [latestDailyGoalBadge, setLatestDailyGoalBadge] = useState<AchievementBadge | null>(null);
  const [latestTimerBadge, setLatestTimerBadge] = useState<AchievementBadge | null>(null);
  const sessionHistoryRef = useRef<SessionRecord[]>([]);
  const hasHandledGoalPromptThisSessionRef = useRef(false);
  const hasHandledNotificationPromptThisSessionRef = useRef(false);
  const previousNotificationPromptSettingRef = useRef(defaultAchievementPreferences.showNotificationPermissionPrompt);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const foxHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [foxMessage, setFoxMessage] = useState('');
  const [isFoxVisible, setIsFoxVisible] = useState(false);
  const [foxPose, setFoxPose] = useState<FoxPoseKey>('greetingSign');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [hasLoadedThemeSettings, setHasLoadedThemeSettings] = useState(false);
  const [showThemePrompt, setShowThemePrompt] = useState(false);
  const [themePromptDontShowAgain, setThemePromptDontShowAgain] = useState(false);
  const hasHandledThemePromptThisSessionRef = useRef(false);
  const foxGreetingIndexRef = useRef(0);

  const isDarkMode = themeSettings.mode === 'dark';

  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.6;
    notificationAudioRef.current = audio;

    return () => {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const savedThemeSettings = localStorage.getItem(THEME_SETTINGS_STORAGE_KEY);
    if (savedThemeSettings) {
      try {
        const parsedSettings = JSON.parse(savedThemeSettings) as Partial<ThemeSettings>;
        setThemeSettings({
          mode: parsedSettings.mode === 'light' ? 'light' : 'dark',
          autoSwitch: Boolean(parsedSettings.autoSwitch),
          promptSeen: Boolean(parsedSettings.promptSeen),
          promptEnabled: parsedSettings.promptEnabled !== false,
        });
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    }
    setHasLoadedThemeSettings(true);
  }, []);

  useEffect(() => {
    return () => {
      if (foxHideTimeoutRef.current) {
        clearTimeout(foxHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
    if (!savedHistory) {
      return;
    }

    try {
      const parsedHistory = JSON.parse(savedHistory);
      setSessionHistory(parsedHistory);
      sessionHistoryRef.current = parsedHistory;
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  }, []);

  useEffect(() => {
    const savedGoal = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
    if (savedGoal) {
      setDailyGoal(savedGoal);
      setGoalInput(savedGoal);
    }

    const savedPrefs = localStorage.getItem(ACHIEVEMENT_PREFS_STORAGE_KEY);
    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs) as Partial<AchievementPreferences> & {
          hideGoalPrompt?: boolean;
          hideDailyGoalCompletePopup?: boolean;
          hideTimerCompletionPopup?: boolean;
        };
        const normalizedPreferences = normalizeAchievementPreferences(parsedPrefs);
        setAchievementPreferences(normalizedPreferences);
        setGoalPromptDontShowAgain(!normalizedPreferences.showGoalPrompt);
        setDailyGoalPopupDontShowAgain(!normalizedPreferences.showDailyGoalCompletePopup);
        setTimerPopupDontShowAgain(!normalizedPreferences.showTimerCompletionPopup);
        setNotificationPromptDontShowAgain(!normalizedPreferences.showNotificationPermissionPrompt);
      } catch (error) {
        console.error('Error loading achievement preferences:', error);
      }
    } else {
      setGoalPromptDontShowAgain(!defaultAchievementPreferences.showGoalPrompt);
      setDailyGoalPopupDontShowAgain(!defaultAchievementPreferences.showDailyGoalCompletePopup);
      setTimerPopupDontShowAgain(!defaultAchievementPreferences.showTimerCompletionPopup);
      setNotificationPromptDontShowAgain(!defaultAchievementPreferences.showNotificationPermissionPrompt);
    }
    setHasLoadedAchievementPreferences(true);

    const savedBadges = localStorage.getItem(ACHIEVEMENT_BADGES_STORAGE_KEY);
    if (savedBadges) {
      try {
        setAchievementBadges(JSON.parse(savedBadges));
      } catch (error) {
        console.error('Error loading achievement badges:', error);
      }
    }

    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (savedTasks) {
      try {
        setTasksSnapshot(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks snapshot:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DAILY_GOAL_STORAGE_KEY, dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    if (!hasLoadedThemeSettings) {
      return;
    }
    localStorage.setItem(THEME_SETTINGS_STORAGE_KEY, JSON.stringify(themeSettings));
  }, [themeSettings, hasLoadedThemeSettings]);

  useEffect(() => {
    if (!hasLoadedAchievementPreferences) {
      return;
    }
    localStorage.setItem(ACHIEVEMENT_PREFS_STORAGE_KEY, JSON.stringify(achievementPreferences));
  }, [achievementPreferences, hasLoadedAchievementPreferences]);

  useEffect(() => {
    localStorage.setItem(ACHIEVEMENT_BADGES_STORAGE_KEY, JSON.stringify(achievementBadges));
  }, [achievementBadges]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      hasLoadedAchievementPreferences &&
      achievementPreferences.showGoalPrompt &&
      !hasHandledGoalPromptThisSessionRef.current
    ) {
      hasHandledGoalPromptThisSessionRef.current = true;
      setGoalInput(dailyGoal);
      setGoalPromptDontShowAgain(!achievementPreferences.showGoalPrompt);
      setShowGoalPrompt(true);
    }
  }, [loading, user, hasLoadedAchievementPreferences, achievementPreferences.showGoalPrompt, dailyGoal]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      hasLoadedThemeSettings &&
      themeSettings.promptEnabled &&
      !themeSettings.promptSeen &&
      !hasHandledThemePromptThisSessionRef.current
    ) {
      hasHandledThemePromptThisSessionRef.current = true;
      setThemePromptDontShowAgain(!themeSettings.promptEnabled);
      setShowThemePrompt(true);
    }
  }, [loading, user, hasLoadedThemeSettings, themeSettings.promptEnabled, themeSettings.promptSeen]);

  useEffect(() => {
    if (!hasLoadedAchievementPreferences) {
      return;
    }

    if (typeof Notification === 'undefined') {
      if (notificationPermissionStatus !== 'unsupported') {
        setNotificationPermissionStatus('unsupported');
      }
      return;
    }

    const browserPermission = Notification.permission;

    if (browserPermission !== notificationPermissionStatus) {
      setNotificationPermissionStatus(browserPermission);
    }

    if (browserPermission === 'granted') {
      if (!achievementPreferences.notificationsEnabled || achievementPreferences.showNotificationPermissionPrompt) {
        applyAchievementPreferences({
          ...achievementPreferences,
          showNotificationPermissionPrompt: false,
          notificationsEnabled: true,
        });
      }
      hasHandledNotificationPromptThisSessionRef.current = true;
      if (showNotificationPermissionPrompt) {
        setShowNotificationPermissionPrompt(false);
      }
      return;
    }

    if (browserPermission === 'denied' && achievementPreferences.notificationsEnabled) {
      applyAchievementPreferences({
        ...achievementPreferences,
        showNotificationPermissionPrompt: true,
        notificationsEnabled: false,
      });
      hasHandledNotificationPromptThisSessionRef.current = false;
    }
  }, [
    hasLoadedAchievementPreferences,
    notificationPermissionStatus,
    achievementPreferences.notificationsEnabled,
    achievementPreferences.showNotificationPermissionPrompt,
    showNotificationPermissionPrompt,
  ]);

  useEffect(() => {
    if (!hasLoadedAchievementPreferences) {
      return;
    }

    const previousSetting = previousNotificationPromptSettingRef.current;
    const currentSetting = achievementPreferences.showNotificationPermissionPrompt;

    if (
      currentSetting &&
      !previousSetting &&
      !achievementPreferences.notificationsEnabled &&
      notificationPermissionStatus !== 'granted' &&
      notificationPermissionStatus !== 'unsupported'
    ) {
      hasHandledNotificationPromptThisSessionRef.current = true;
      setNotificationPromptDontShowAgain(false);
      setShowNotificationPermissionPrompt(true);
    }

    previousNotificationPromptSettingRef.current = currentSetting;
  }, [
    hasLoadedAchievementPreferences,
    achievementPreferences.showNotificationPermissionPrompt,
    achievementPreferences.notificationsEnabled,
    notificationPermissionStatus,
  ]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      hasLoadedAchievementPreferences &&
      achievementPreferences.showNotificationPermissionPrompt &&
      !achievementPreferences.notificationsEnabled &&
      notificationPermissionStatus !== 'granted' &&
      notificationPermissionStatus !== 'unsupported' &&
      !hasHandledNotificationPromptThisSessionRef.current
    ) {
      hasHandledNotificationPromptThisSessionRef.current = true;
      setNotificationPromptDontShowAgain(!achievementPreferences.showNotificationPermissionPrompt);
      setShowNotificationPermissionPrompt(true);
    }
  }, [
    loading,
    user,
    hasLoadedAchievementPreferences,
    achievementPreferences.showNotificationPermissionPrompt,
    achievementPreferences.notificationsEnabled,
    notificationPermissionStatus,
  ]);

  const getFriendlyUsername = useCallback(() => {
    const fallback = 'friend';
    if (!user) {
      return fallback;
    }

    const displayName = user.displayName?.trim();
    if (displayName) {
      return displayName.split(' ')[0];
    }

    const emailName = user.email?.split('@')[0]?.trim();
    return emailName || fallback;
  }, [user]);

  const getNextGreetingPose = useCallback((): FoxPoseKey => {
    const pose = FOX_GREETING_ROTATION[foxGreetingIndexRef.current % FOX_GREETING_ROTATION.length];
    foxGreetingIndexRef.current += 1;
    return pose;
  }, []);

  const resolveFoxPose = useCallback((moment: FoxMoment): FoxPoseKey => {
    switch (moment) {
      case 'greeting':
        return getNextGreetingPose();
      case 'start':
        return 'focusMode';
      case 'pause':
        return 'pauseRefresh';
      case 'reset':
        return 'resetReady';
      case 'milestone':
        return 'levelUp';
      case 'complete':
        return 'victoryDance';
      case 'achievement':
        return 'achievementCelebration';
      case 'tap':
        return 'buttonStar';
      case 'hold':
        return 'nightFocus';
      case 'assist':
        return 'buttonConfirm';
      case 'darkMode':
        return 'darkMode';
      case 'lightMode':
        return 'lightMode';
      case 'clockPage':
        return 'localTimePage';
      case 'alarmPage':
        return 'alarmPage';
      case 'stopwatchPage':
        return 'stopwatchPage';
      case 'timerPage':
        return 'focusTimerPage';
      default:
        return 'greetingSign';
    }
  }, [getNextGreetingPose]);

  const showFoxMascot = useCallback((message: string, moment: FoxMoment = 'greeting') => {
    if (foxHideTimeoutRef.current) {
      clearTimeout(foxHideTimeoutRef.current);
    }

    setFoxMessage(message);
    setFoxPose(resolveFoxPose(moment));
    setIsFoxVisible(true);
    foxHideTimeoutRef.current = setTimeout(() => {
      setIsFoxVisible(false);
    }, 2600);
  }, [resolveFoxPose]);

  const showFoxForTab = useCallback((tab: AppTab) => {
    const username = getFriendlyUsername();

    if (tab === 'clock') {
      showFoxMascot(`Local time is ready, ${username}!`, 'clockPage');
      return;
    }

    if (tab === 'alarm') {
      showFoxMascot(`Alarm page is ready, ${username}!`, 'alarmPage');
      return;
    }

    if (tab === 'stopwatch') {
      showFoxMascot(`Stopwatch is set, ${username}!`, 'stopwatchPage');
      return;
    }

    if (tab === 'timer') {
      showFoxMascot(`Focus time, ${username}!`, 'timerPage');
    }
  }, [getFriendlyUsername, showFoxMascot]);

  const applyThemeSettings = useCallback((next: ThemeSettings, notifyReason?: 'dark' | 'light') => {
    localStorage.setItem(THEME_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    setThemeSettings(next);
    setThemePromptDontShowAgain(!next.promptEnabled);

    if (notifyReason === 'dark') {
      showFoxMascot('Night time!', 'darkMode');
    }

    if (notifyReason === 'light') {
      showFoxMascot('Good morning!', 'lightMode');
    }
  }, [showFoxMascot]);

  useEffect(() => {
    const handleButtonAssist = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');

      if (!button) {
        return;
      }

      if (button.getAttribute('aria-label') === 'Tap the fox mascot') {
        return;
      }

      const buttonLabel = button.textContent?.trim();
      if (!buttonLabel) {
        showFoxMascot(`${getFriendlyUsername()}, I’ve got this button with you!`, 'assist');
        return;
      }

      showFoxMascot(`${buttonLabel} activated, ${getFriendlyUsername()}!`, 'assist');
    };

    document.addEventListener('click', handleButtonAssist, true);
    return () => {
      document.removeEventListener('click', handleButtonAssist, true);
    };
  }, [getFriendlyUsername, showFoxMascot]);

  useEffect(() => {
    if (!loading && user) {
      const greeting = FOX_GREETINGS[Math.floor(Math.random() * FOX_GREETINGS.length)];
      showFoxMascot(`${greeting}, ${getFriendlyUsername()}`, 'greeting');
    }
  }, [loading, user, getFriendlyUsername, showFoxMascot]);

  useEffect(() => {
    if (!hasLoadedThemeSettings || !themeSettings.autoSwitch) {
      return;
    }

    const syncThemeWithTime = () => {
      const hour = new Date().getHours();
      const nextMode: ThemeMode = hour >= 18 || hour < 6 ? 'dark' : 'light';

      if (nextMode !== themeSettings.mode) {
        applyThemeSettings({
          ...themeSettings,
          mode: nextMode,
        }, nextMode);
      }
    };

    syncThemeWithTime();
    const interval = setInterval(syncThemeWithTime, 60000);
    return () => clearInterval(interval);
  }, [themeSettings, hasLoadedThemeSettings, applyThemeSettings]);

  useEffect(() => {
    sessionHistoryRef.current = sessionHistory;
  }, [sessionHistory]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const metadata = currentUser.metadata;
        const isNewUser = metadata?.creationTime === metadata?.lastSignInTime;
        if (isNewUser && !currentUser.emailVerified) {
          setUser(null);
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const checkRes = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsImmersiveLandscape(isLandscape && window.innerWidth < 1000);
    };
    window.addEventListener('resize', checkRes);
    checkRes();
    return () => unsubscribe();
  }, []);

  // Session timer effect
  useEffect(() => {
    const startTime = Date.now();
    let hasSavedSession = false;

    setSessionStartTime(startTime);
    setCurrentSessionTime(0);

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentSessionTime(now - startTime);
    }, 1000);

    const persistSession = () => {
      if (hasSavedSession) {
        return;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration <= MIN_SESSION_DURATION_MS) {
        return;
      }

      const sessionRecord: SessionRecord = {
        id: `session_${startTime}`,
        startTime,
        endTime,
        duration,
        date: new Date(endTime).toISOString(),
      };

      const previousHistory = sessionHistoryRef.current;
      if (previousHistory.some((session) => session.id === sessionRecord.id)) {
        hasSavedSession = true;
        return;
      }

      const nextHistory = [...previousHistory, sessionRecord];
      sessionHistoryRef.current = nextHistory;
      localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(nextHistory));
      setSessionHistory(nextHistory);

      hasSavedSession = true;
    };

    const handlePageHide = () => {
      persistSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistSession();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      persistSession();
    };
  }, []);

  const handleTabChange = useCallback((tab: AppTab) => {
    if (activeTab === tab) return;
    setPreviousTab(activeTab);
    setActiveTab(tab);
    setIsActionActive(false);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    showFoxForTab(tab);
  }, [activeTab, showFoxForTab]);

  const openTasksTab = () => {
    if (activeTab !== 'tasks') {
      setPreviousTab(activeTab);
      setActiveTab('tasks');
      setShowProfile(false);
    }
  };

  const exitTasks = () => {
    setActiveTab(previousTab || 'timer');
    setPreviousTab('timer');
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  const applyAchievementPreferences = (next: AchievementPreferences) => {
    localStorage.setItem(ACHIEVEMENT_PREFS_STORAGE_KEY, JSON.stringify(next));
    setAchievementPreferences(next);
    setGoalPromptDontShowAgain(!next.showGoalPrompt);
    setDailyGoalPopupDontShowAgain(!next.showDailyGoalCompletePopup);
    setTimerPopupDontShowAgain(!next.showTimerCompletionPopup);
    setNotificationPromptDontShowAgain(!next.showNotificationPermissionPrompt);
    if (!next.showNotificationPermissionPrompt) {
      setShowNotificationPermissionPrompt(false);
    }
  };

  const updateAchievementPreferences = (updater: (previous: AchievementPreferences) => AchievementPreferences) => {
    setAchievementPreferences((previous) => {
      const next = updater(previous);
      localStorage.setItem(ACHIEVEMENT_PREFS_STORAGE_KEY, JSON.stringify(next));
      setGoalPromptDontShowAgain(!next.showGoalPrompt);
      setDailyGoalPopupDontShowAgain(!next.showDailyGoalCompletePopup);
      setTimerPopupDontShowAgain(!next.showTimerCompletionPopup);
      setNotificationPromptDontShowAgain(!next.showNotificationPermissionPrompt);
      if (!next.showNotificationPermissionPrompt) {
        setShowNotificationPermissionPrompt(false);
      }
      return next;
    });
  };

  const playNotificationSound = useCallback(() => {
    if (!notificationAudioRef.current || !achievementPreferences.notificationsEnabled) {
      return;
    }

    try {
      notificationAudioRef.current.pause();
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current.play().catch((error) => {
        console.error('Notification sound play failed:', error);
      });
    } catch (error) {
      console.error('Notification sound setup failed:', error);
    }
  }, [achievementPreferences.notificationsEnabled]);

  const sendSystemNotification = useCallback((title: string, body: string, playSound = true) => {
    if (!achievementPreferences.notificationsEnabled) {
      return;
    }

    if (playSound) {
      playNotificationSound();
    }

    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    try {
      new Notification(title, {
        body,
        tag: title,
      });
    } catch (error) {
      console.error('Notification send failed:', error);
    }
  }, [achievementPreferences.notificationsEnabled, playNotificationSound]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setNotificationPermissionStatus('unsupported');
      return 'unsupported' as const;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      applyAchievementPreferences({
        ...achievementPreferences,
        showNotificationPermissionPrompt: permission === 'granted' ? false : achievementPreferences.showNotificationPermissionPrompt,
        notificationsEnabled: permission === 'granted',
      });
      return permission;
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return notificationPermissionStatus;
    }
  }, [achievementPreferences, notificationPermissionStatus]);

  const unlockBadge = useCallback((badge: AchievementBadge) => {
    setAchievementBadges((previous) => {
      if (previous.some((existingBadge) => existingBadge.id === badge.id)) {
        return previous;
      }
      return [badge, ...previous];
    });
  }, []);

  useEffect(() => {
    const completedTasks = tasksSnapshot.filter((task) => task.completed);
    const hasPendingTasks = tasksSnapshot.some((task) => !task.completed);
    const hasGoal = dailyGoal.trim().length > 0;

    if (!hasGoal || completedTasks.length === 0 || hasPendingTasks) {
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const badgeId = `daily-goal-${todayKey}`;
    if (achievementBadges.some((badge) => badge.id === badgeId)) {
      return;
    }

    const badge: AchievementBadge = {
      id: badgeId,
      title: 'Daily Goal Badge',
      description: `Completed every task for: ${dailyGoal}`,
      unlockedAt: new Date().toISOString(),
      category: 'dailyGoal',
    };

    unlockBadge(badge);
    setLatestDailyGoalBadge(badge);
    showFoxMascot(`Daily goal completed, ${getFriendlyUsername()}!`, 'achievement');

    if (achievementPreferences.showDailyGoalCompletePopup) {
      setDailyGoalPopupDontShowAgain(!achievementPreferences.showDailyGoalCompletePopup);
      setShowDailyGoalCompletePopup(true);
    }
  }, [tasksSnapshot, dailyGoal, achievementBadges, unlockBadge, achievementPreferences.showDailyGoalCompletePopup, getFriendlyUsername, showFoxMascot]);

  const handleGoalPromptSave = () => {
    const trimmedGoal = goalInput.trim();
    setDailyGoal(trimmedGoal);
    updateAchievementPreferences((previous) => ({
      ...previous,
      showGoalPrompt: !goalPromptDontShowAgain,
    }));
    setShowGoalPrompt(false);
  };

  const handleGoalPromptDismiss = () => {
    setGoalPromptDontShowAgain(!achievementPreferences.showGoalPrompt);
    setShowGoalPrompt(false);
  };

  const handleDailyGoalPopupClose = () => {
    updateAchievementPreferences((previous) => ({
      ...previous,
      showDailyGoalCompletePopup: !dailyGoalPopupDontShowAgain,
    }));
    setShowDailyGoalCompletePopup(false);
  };

  const handleTimerPopupClose = () => {
    updateAchievementPreferences((previous) => ({
      ...previous,
      showTimerCompletionPopup: !timerPopupDontShowAgain,
    }));
    setLatestTimerBadge(null);
  };

  const handleTimerSessionComplete = (minutes: number) => {
    const badge: AchievementBadge = {
      id: `timer-session-${Date.now()}`,
      title: 'Timer Completion Badge',
      description: `Completed a ${Math.round(minutes)}-minute focus session.`,
      unlockedAt: new Date().toISOString(),
      category: 'timer',
    };

    unlockBadge(badge);
    if (achievementPreferences.showTimerCompletionPopup) {
      setTimerPopupDontShowAgain(!achievementPreferences.showTimerCompletionPopup);
      setLatestTimerBadge(badge);
    }
    sendSystemNotification('Focus session complete', `Your ${Math.round(minutes)}-minute session has finished.`);
    showFoxMascot(`Amazing work, ${getFriendlyUsername()}!`, 'complete');
  };

  const handleMascotAction = useCallback((action: 'start' | 'pause' | 'reset' | 'milestone') => {
    const username = getFriendlyUsername();

    if (action === 'start') {
      showFoxMascot(`Let’s go, ${username}!`, 'start');
      return;
    }

    if (action === 'pause') {
      showFoxMascot(`Taking a breather, ${username}?`, 'pause');
      return;
    }

    if (action === 'milestone') {
      showFoxMascot(`Halfway there, ${username}!`, 'milestone');
      return;
    }

    showFoxMascot(`Fresh start, ${username}!`, 'reset');
  }, [getFriendlyUsername, showFoxMascot]);

  const handleFoxTap = useCallback(() => {
    showFoxMascot(`Boop back, ${getFriendlyUsername()}!`, 'tap');
  }, [getFriendlyUsername, showFoxMascot]);

  const handleFoxHold = useCallback(() => {
    showFoxMascot(`Aww, I felt that, ${getFriendlyUsername()}!`, 'hold');
  }, [getFriendlyUsername, showFoxMascot]);

  const handleSetThemeMode = useCallback((mode: ThemeMode) => {
    applyThemeSettings({
      ...themeSettings,
      mode,
    }, mode);
  }, [themeSettings, applyThemeSettings]);

  const handleSetAutoSwitchTheme = useCallback((enabled: boolean) => {
    applyThemeSettings({
      ...themeSettings,
      autoSwitch: enabled,
    });
  }, [themeSettings, applyThemeSettings]);

  const handleThemePromptConfirm = () => {
    applyThemeSettings({
      ...themeSettings,
      mode: themePromptTargetMode,
      promptSeen: true,
      promptEnabled: !themePromptDontShowAgain,
    }, themePromptTargetMode);
    setShowThemePrompt(false);
  };

  const handleThemePromptLater = () => {
    applyThemeSettings({
      ...themeSettings,
      mode: themePromptDontShowAgain ? 'dark' : themeSettings.mode,
      promptSeen: true,
      promptEnabled: !themePromptDontShowAgain,
    }, themePromptDontShowAgain ? 'dark' : undefined);
    setShowThemePrompt(false);
  };

  const themePromptTargetMode: ThemeMode = isDarkMode ? 'light' : 'dark';
  const themePromptTitle = isDarkMode ? 'Enable Light Mode?' : 'Enable Dark Mode?';
  const themePromptDescription = isDarkMode
    ? 'Light Mode switches to a bright, clean workspace with crisp dark text for daytime focus.'
    : 'Dark Mode uses a deep slate background with lighter cards for late-night focus sessions.';
  const themePromptConfirmLabel = isDarkMode ? 'Enable Light' : 'Enable Dark';

  const handleNotificationPromptAllow = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted' || permission === 'denied') {
      setShowNotificationPermissionPrompt(false);
    }
  };

  const handleNotificationPromptDismiss = () => {
    setNotificationPromptDontShowAgain(!achievementPreferences.showNotificationPermissionPrompt);
    setShowNotificationPermissionPrompt(false);
  };

  if (loading) return null;
  if (!user) return <Auth />;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden select-none transition-[background-color,color,opacity] duration-700"
      style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#111827' }}
    >
      {/* Background Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[180%] h-[500px] blur-[140px] opacity-[0.1] pointer-events-none transition-all duration-1000 z-0"
        style={{ background: `radial-gradient(circle, #8D6E63 0%, transparent 70%)`, transform: 'translateX(-50%) translateY(-40%)' }}
      />

      {/* MATCHED TOP-RIGHT ACTIONS */}
      {!isImmersiveLandscape && activeTab !== 'tasks' && activeTab !== 'appUsage' && (
        <div className="fixed z-[100] top-12 right-8 flex items-center gap-3">
          {activeTab === 'timer' && (
            <button
              onClick={() => {
                setGoalInput(dailyGoal);
                setShowDailyGoalEditor(true);
              }}
              className={`max-w-[180px] rounded-full px-4 py-2 text-left backdrop-blur-md transition-all active:scale-95 ${
                isDarkMode ? 'border border-white/5 bg-white/5' : 'border border-slate-200 bg-white/90 shadow-sm'
              }`}
            >
              <div className={`text-[7px] font-black uppercase tracking-[0.35em] ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>Daily Goal</div>
              <div className={`mt-1 truncate text-[11px] font-semibold ${isDarkMode ? 'text-white/75' : 'text-slate-700'}`}>{dailyGoal || 'Set goal'}</div>
            </button>
          )}
          <button onClick={() => setShowProfile(true)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 backdrop-blur-md ${isDarkMode ? 'text-white/40 bg-white/5 border border-white/5' : 'text-slate-500 bg-white/90 border border-slate-200 shadow-sm'}`}>
            <UserIcon size={16} />
          </button>
          <button onClick={openTasksTab} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 backdrop-blur-md ${isDarkMode ? 'text-white/40 bg-white/5 border border-white/5' : 'text-slate-500 bg-white/90 border border-slate-200 shadow-sm'}`}>
            <TasksIcon size={16} />
          </button>
          {activeTab !== 'clock' && activeTab !== 'stopwatch' && (
            <button onClick={() => setIsActionActive(true)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 backdrop-blur-md ${isDarkMode ? 'text-white/40 bg-white/5 border border-white/5' : 'text-slate-500 bg-white/90 border border-slate-200 shadow-sm'}`}>
              <Plus size={18} strokeWidth={2} />
            </button>
          )}
          <button onClick={handleSignOut} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 backdrop-blur-md ${isDarkMode ? 'text-white/20 bg-white/5 border border-white/5' : 'text-slate-400 bg-white/90 border border-slate-200 shadow-sm'}`}>
            <LogOut size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden">
        {/* Render all tabs simultaneously but hide inactive ones to keep background processes running */}
        <div className={`absolute inset-0 ${activeTab === 'timer' ? 'block' : 'hidden'}`}>
          <Timer
            isCustomizing={isActionActive}
            setIsCustomizing={setIsActionActive}
            onFocusSessionComplete={handleTimerSessionComplete}
            onMascotAction={handleMascotAction}
            isDarkMode={isDarkMode}
          />
        </div>
        
        <div className={`absolute inset-0 ${activeTab === 'alarm' ? 'block' : 'hidden'}`}>
          <Alarm
            user={user}
            isAdding={isActionActive}
            setIsAdding={setIsActionActive}
            canSendNotifications={achievementPreferences.notificationsEnabled}
            onSendNotification={sendSystemNotification}
            isDarkMode={isDarkMode}
          />
        </div>
        
        <div className={`absolute inset-0 ${activeTab === 'stopwatch' ? 'block' : 'hidden'}`}>
          <Stopwatch isDarkMode={isDarkMode} />
        </div>
        
        <div className={`absolute inset-0 ${activeTab === 'clock' ? 'block' : 'hidden'}`}>
          <Clock user={user} isAdding={isActionActive} setIsAdding={setIsActionActive} isDarkMode={isDarkMode} />
        </div>

        <div className={`absolute inset-0 ${activeTab === 'tasks' ? 'block' : 'hidden'}`}>
          <Tasks
            onExit={exitTasks}
            onTasksChange={setTasksSnapshot}
          />
        </div>

        <div className={`absolute inset-0 ${activeTab === 'appUsage' ? 'block' : 'hidden'}`}>
          <AppUsageActivity
            onClose={exitTasks}
            currentSessionTime={currentSessionTime}
            sessionHistory={sessionHistory}
            onClearHistory={() => {
              localStorage.removeItem(SESSION_HISTORY_KEY);
              sessionHistoryRef.current = [];
              setSessionHistory([]);
            }}
          />
        </div>
      </main>

      {showProfile && (
        <Profile
          onClose={() => setShowProfile(false)}
          onOpenStock={() => { setShowProfile(false); setPreviousTab(activeTab); setActiveTab('appUsage'); }}
          dailyGoal={dailyGoal}
          achievementPreferences={achievementPreferences}
          achievementBadges={achievementBadges}
          onUpdateAchievementPreferences={updateAchievementPreferences}
          notificationPermissionStatus={notificationPermissionStatus}
          isDarkMode={isDarkMode}
          currentThemeMode={themeSettings.mode}
          autoSwitchTheme={themeSettings.autoSwitch}
          onSetThemeMode={handleSetThemeMode}
          onSetAutoSwitchTheme={handleSetAutoSwitchTheme}
        />
      )}

      {showThemePrompt && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className={`${isDarkMode ? 'bg-black/85' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-xl`} />
          <div className={`relative w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl transition-colors duration-700 ${
            isDarkMode ? 'border-white/10 bg-[#111827]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'
          }`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>Appearance</p>
            <h2 className="mt-3 text-2xl font-semibold">{themePromptTitle}</h2>
            <p className={`mt-3 text-sm leading-6 ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
              {themePromptDescription}
            </p>
            <label className={`mt-5 flex items-center gap-3 text-sm ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}>
              <input
                type="checkbox"
                checked={themePromptDontShowAgain}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setThemePromptDontShowAgain(checked);
                  if (checked) {
                    applyThemeSettings({
                      ...themeSettings,
                      mode: 'dark',
                      promptEnabled: false,
                    });
                  } else {
                    applyThemeSettings({
                      ...themeSettings,
                      promptEnabled: true,
                    });
                  }
                }}
              />
              {themePromptDontShowAgain ? 'Done' : "Don't show me again"}
            </label>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleThemePromptLater}
                className={`flex-1 rounded-[1.5rem] px-5 py-4 text-[11px] font-black uppercase tracking-widest ${
                  isDarkMode ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                Not Now
              </button>
              <button
                onClick={handleThemePromptConfirm}
                className="flex-1 rounded-[1.5rem] bg-slate-900 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-white"
              >
                {themePromptConfirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotificationPermissionPrompt && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className={`${isDarkMode ? 'bg-black/85' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-xl`} />
          <div className={`relative w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl ${isDarkMode ? 'border-white/10 bg-zinc-950/95' : 'border-slate-200 bg-white/95'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>Notifications</p>
            <h2 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Do you want to turn on notifications?</h2>
            <p className={`mt-3 text-sm leading-6 ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
              Enable system notifications for timers, alarms, and reminders across supported web, desktop, and mobile browsers.
            </p>
            <label className={`mt-5 flex items-center gap-3 text-sm ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}>
              <input
                type="checkbox"
                checked={notificationPromptDontShowAgain}
                onChange={(event) => {
                  const checked = event.target.checked;
                  applyAchievementPreferences({
                    ...achievementPreferences,
                    showNotificationPermissionPrompt: !checked,
                    notificationsEnabled: checked ? achievementPreferences.notificationsEnabled : false,
                  });
                }}
              />
              {notificationPromptDontShowAgain ? 'Done' : "Don't show this again"}
            </label>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleNotificationPromptDismiss}
                className={`flex-1 rounded-[1.5rem] px-5 py-4 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                Not Now
              </button>
              <button
                onClick={handleNotificationPromptAllow}
                className="flex-1 rounded-[1.5rem] bg-white px-5 py-4 text-[11px] font-black uppercase tracking-widest text-black"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {showDailyGoalEditor && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className={`${isDarkMode ? 'bg-black/85' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-xl`} onClick={() => setShowDailyGoalEditor(false)} />
          <div className={`relative w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl ${isDarkMode ? 'border-white/10 bg-zinc-950/95' : 'border-slate-200 bg-white/95'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>Daily Goal</p>
            <h2 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Update today&apos;s goal</h2>
            <input
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              placeholder="Finish my main project milestone..."
              className={`mt-6 w-full rounded-[1.5rem] px-5 py-4 text-sm outline-none ${isDarkMode ? 'border border-white/10 bg-white/5 text-white placeholder:text-white/25' : 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDailyGoalEditor(false)}
                className={`flex-1 rounded-[1.5rem] px-5 py-4 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDailyGoal(goalInput.trim());
                  setShowDailyGoalEditor(false);
                }}
                className="flex-1 rounded-[1.5rem] bg-white px-5 py-4 text-[11px] font-black uppercase tracking-widest text-black"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoalPrompt && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className={`${isDarkMode ? 'bg-black/85' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-xl`} />
          <div className={`relative w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl ${isDarkMode ? 'border-white/10 bg-zinc-950/95' : 'border-slate-200 bg-white/95'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>Daily Goal</p>
            <h2 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>What is your goal to finish today?</h2>
            <input
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              placeholder="Finish my main project milestone..."
              className={`mt-6 w-full rounded-[1.5rem] px-5 py-4 text-sm outline-none ${isDarkMode ? 'border border-white/10 bg-white/5 text-white placeholder:text-white/25' : 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
            />
            <label className={`mt-4 flex items-center gap-3 text-sm ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}>
              <input
                type="checkbox"
                checked={goalPromptDontShowAgain}
                onChange={(event) => {
                  const checked = event.target.checked;
                  applyAchievementPreferences({
                    ...achievementPreferences,
                    showGoalPrompt: !checked,
                    showDailyGoalCompletePopup: achievementPreferences.showDailyGoalCompletePopup,
                    showTimerCompletionPopup: achievementPreferences.showTimerCompletionPopup,
                  });
                }}
              />
              {goalPromptDontShowAgain ? 'Done' : "Don't show this again"}
            </label>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleGoalPromptDismiss}
                className={`flex-1 rounded-[1.5rem] px-5 py-4 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                Maybe Later
              </button>
              <button
                onClick={handleGoalPromptSave}
                className="flex-1 rounded-[1.5rem] bg-white px-5 py-4 text-[11px] font-black uppercase tracking-widest text-black"
              >
                {goalPromptDontShowAgain ? 'Done' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDailyGoalCompletePopup && latestDailyGoalBadge && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className={`${isDarkMode ? 'bg-black/85' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-xl`} />
          <div className={`relative w-full max-w-md rounded-[2.5rem] border border-emerald-400/20 p-8 shadow-2xl ${isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300/55">Badge Unlocked</p>
            <h2 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Daily Goal Completed</h2>
            <p className={`mt-3 text-sm leading-6 ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>{latestDailyGoalBadge.description}</p>
            <label className={`mt-5 flex items-center gap-3 text-sm ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}>
              <input
                type="checkbox"
                checked={dailyGoalPopupDontShowAgain}
                onChange={(event) => {
                  const checked = event.target.checked;
                  applyAchievementPreferences({
                    ...achievementPreferences,
                    showGoalPrompt: achievementPreferences.showGoalPrompt,
                    showDailyGoalCompletePopup: !checked,
                    showTimerCompletionPopup: achievementPreferences.showTimerCompletionPopup,
                  });
                }}
              />
              {dailyGoalPopupDontShowAgain ? 'Done' : "Don't show this again"}
            </label>
            <button
              onClick={handleDailyGoalPopupClose}
              className="mt-6 w-full rounded-[1.5rem] bg-emerald-300 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-black"
            >
              Awesome
            </button>
          </div>
        </div>
      )}

      {latestTimerBadge && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className={`${isDarkMode ? 'bg-black/75' : 'bg-slate-200/70'} absolute inset-0 backdrop-blur-xl`} />
          <div className={`relative w-full max-w-sm rounded-[2.5rem] border border-amber-300/20 p-8 shadow-2xl ${isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-200/55">Timer Complete</p>
            <h2 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Timer Completion Badge</h2>
            <p className={`mt-3 text-sm leading-6 ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>{latestTimerBadge.description}</p>
            <label className={`mt-5 flex items-center gap-3 text-sm ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}>
              <input
                type="checkbox"
                checked={timerPopupDontShowAgain}
                onChange={(event) => {
                  const checked = event.target.checked;
                  applyAchievementPreferences({
                    ...achievementPreferences,
                    showGoalPrompt: achievementPreferences.showGoalPrompt,
                    showDailyGoalCompletePopup: achievementPreferences.showDailyGoalCompletePopup,
                    showTimerCompletionPopup: !checked,
                  });
                }}
              />
              {timerPopupDontShowAgain ? 'Done' : "Don't show this again"}
            </label>
            <button
              onClick={handleTimerPopupClose}
              className="mt-6 w-full rounded-[1.5rem] bg-amber-200 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-black"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <FoxMascot
        isVisible={isFoxVisible}
        message={foxMessage}
        pose={foxPose}
        onTap={handleFoxTap}
        onHold={handleFoxHold}
      />

      {/* MATCHED BOTTOM NAVIGATION - Moved lower by reducing bottom padding and height */}
      {!isImmersiveLandscape && activeTab !== 'appUsage' && (
        <div className="w-full px-6 pb-3 safe-bottom z-[1000]">
          <nav className={`mx-auto max-w-lg h-18 backdrop-blur-[60px] rounded-[3rem] px-3 flex justify-around items-center shadow-2xl ${isDarkMode ? 'bg-black/40 border border-white/[0.05]' : 'bg-white/90 border border-slate-200'}`}>
            <TabButton active={activeTab === 'clock'} onClick={() => handleTabChange('clock')} icon={<ClockIcon size={20} strokeWidth={1.5} />} label="LOCAL" isDarkMode={isDarkMode} />
            <TabButton active={activeTab === 'alarm'} onClick={() => handleTabChange('alarm')} icon={<AlarmClock size={20} strokeWidth={1.5} />} label="ALARM" isDarkMode={isDarkMode} />
            <TabButton active={activeTab === 'stopwatch'} onClick={() => handleTabChange('stopwatch')} icon={<StopwatchIcon size={20} strokeWidth={1.5} />} label="STOP" isDarkMode={isDarkMode} />
            <TabButton active={activeTab === 'timer'} onClick={() => handleTabChange('timer')} icon={<TimerIcon size={20} strokeWidth={1.5} />} label="FOCUS" isDarkMode={isDarkMode} />
          </nav>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; isDarkMode: boolean }> = ({ active, onClick, icon, label, isDarkMode }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 flex-1 h-12 rounded-2xl transition-all duration-500 active:scale-95 ${
      active
        ? isDarkMode
          ? 'bg-white/5 text-white'
          : 'bg-slate-900 text-white'
        : isDarkMode
          ? 'text-zinc-600'
          : 'text-slate-500'
    }`}
  >
    <div
      className={`flex items-center justify-center transition-all ${
        active
          ? 'scale-110 opacity-100'
          : isDarkMode
            ? 'opacity-60'
            : 'opacity-85'
      }`}
    >
      {icon}
    </div>
    <span
      className={`text-[7px] font-black tracking-widest transition-all ${
        active
          ? 'opacity-100'
          : isDarkMode
            ? 'opacity-30'
            : 'opacity-80'
      }`}
    >
      {label}
    </span>
  </button>
);

export default App;
