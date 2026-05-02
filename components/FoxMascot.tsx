import React, { useRef } from 'react';

export const FOX_POSE_LIBRARY = {
  achievementCelebration: '/fox-poses/achievement-celebration.png',
  greetingSign: '/fox-poses/greeting-sign.png',
  pauseRefresh: '/fox-poses/pause-refresh.png',
  lightMode: '/fox-poses/light-mode.png',
  focusMode: '/fox-poses/focus-mode.png',
  resetReady: '/fox-poses/reset-ready.png',
  sessionRefresh: '/fox-poses/session-refresh.png',
  buttonStar: '/fox-poses/button-star.png',
  thinking: '/fox-poses/thinking.png',
  focusTimerPage: '/fox-poses/focus-timer-page.png',
  buttonConfirm: '/fox-poses/button-confirm.png',
  localTimePage: '/fox-poses/local-time-page.png',
  victoryDance: '/fox-poses/victory-dance.png',
  levelUp: '/fox-poses/level-up.png',
  alarmPage: '/fox-poses/alarm-page.png',
  stopwatchPage: '/fox-poses/stopwatch-page.png',
  buttonDance: '/fox-poses/button-dance.png',
  darkMode: '/fox-poses/dark-mode.png',
  nightFocus: '/fox-poses/night-focus.png',
} as const;

export type FoxPoseKey = keyof typeof FOX_POSE_LIBRARY;

export const FOX_GREETING_ROTATION: FoxPoseKey[] = [
  'greetingSign',
  'focusTimerPage',
  'buttonConfirm',
  'localTimePage',
  'buttonStar',
  'buttonDance',
];

interface FoxMascotProps {
  isVisible: boolean;
  message: string;
  pose: FoxPoseKey;
  onTap: () => void;
  onHold: () => void;
}

const FoxMascot: React.FC<FoxMascotProps> = ({ isVisible, message, pose, onTap, onHold }) => {
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    holdTimeoutRef.current = setTimeout(() => {
      onHold();
    }, 450);
  };

  const clearHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const shellClassName = pose === 'stopwatchPage'
    ? (isVisible ? 'translate-x-0 translate-y-0 opacity-100' : '-translate-x-[38vw] translate-y-28 opacity-0')
    : (isVisible ? 'translate-y-0 opacity-100' : 'translate-y-28 opacity-0');

  return (
    <div
      className={`pointer-events-none fixed bottom-20 left-1/2 z-[1200] flex w-[280px] -translate-x-1/2 flex-col items-center transition-all duration-700 ${shellClassName}`}
    >
      <div className="mb-3 max-w-[248px] rounded-[1.5rem] border border-white/10 bg-[#1a130d]/90 px-4 py-3 text-center shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="text-sm font-semibold text-white">{message}</p>
      </div>
      <div className="relative">
        <div className="absolute inset-x-6 bottom-0 h-8 rounded-full bg-[#ffb25b]/25 blur-2xl" />
        <button
          type="button"
          onClick={onTap}
          onMouseDown={startHold}
          onMouseUp={clearHold}
          onMouseLeave={clearHold}
          onTouchStart={startHold}
          onTouchEnd={clearHold}
          onTouchCancel={clearHold}
          className="pointer-events-auto relative cursor-pointer rounded-full focus:outline-none"
          aria-label="Tap the fox mascot"
        >
          <img
            src={FOX_POSE_LIBRARY[pose]}
            alt="Friendly fox mascot"
            className="relative h-[156px] w-auto drop-shadow-[0_18px_38px_rgba(0,0,0,0.35)]"
          />
        </button>
      </div>
    </div>
  );
};

export default FoxMascot;
