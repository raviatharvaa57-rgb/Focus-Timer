import React, { useState, useEffect } from 'react';
import { X, Clock, History, RefreshCcw } from 'lucide-react';

interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in milliseconds
  date: string;
}

interface AppUsageProps {
  onClose: () => void;
  currentSessionTime: number; // in milliseconds
}

const AppUsageActivity: React.FC<AppUsageProps> = ({ onClose, currentSessionTime }) => {
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    // Load session history from localStorage
    const savedHistory = localStorage.getItem('appUsageSessions');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSessionHistory(parsed);
      } catch (error) {
        console.error('Error loading session history:', error);
      }
    }
  }, []);

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatCurrentTime = (milliseconds: number): { hours: number; minutes: number; seconds: number } => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearHistory = () => {
    setSessionHistory([]);
    localStorage.removeItem('appUsageSessions');
  };

  const { hours, minutes, seconds } = formatCurrentTime(currentSessionTime);

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">App Usage Session History</h2>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white">
          <X size={14} className="inline mr-1" /> Close
        </button>
      </div>
      <div className="mb-3">
        <p className="text-white/70 text-sm">View your current session and past app usage sessions.</p>
      </div>

      {/* Live Current Session Timer */}
      <div className="border border-white/10 rounded-xl p-6 bg-black/30 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Clock size={24} className="text-green-400" />
          <span className="text-white font-semibold text-lg">Current Session</span>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-green-300">
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-white/60 text-sm">
            {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''} `}
            {minutes > 0 && `${minutes} minute${minutes !== 1 ? 's' : ''} `}
            {seconds > 0 && `${seconds} second${seconds !== 1 ? 's' : ''}`}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <RefreshCcw size={14} className="text-white/50" />
          <span className="text-white/50 text-xs">Live timer - saves when you close the app</span>
        </div>
      </div>

      {/* Session History */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={16} className="text-white/50" />
          <span className="text-white/70 text-sm">{sessionHistory.length} past sessions</span>
        </div>
        {sessionHistory.length > 0 && (
          <button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs">
            Clear History
          </button>
        )}
      </div>

      {sessionHistory.length === 0 ? (
        <div className="text-center py-8">
          <History size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 text-sm">No past sessions yet.</p>
          <p className="text-white/40 text-xs mt-1">Past sessions appear here after you close the app.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionHistory.slice().reverse().map((session, index) => (
            <div key={session.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <span className="text-blue-300 text-xs font-bold">{sessionHistory.length - index}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Session {sessionHistory.length - index}</div>
                    <div className="text-white/60 text-xs">{formatDate(session.startTime)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-300 font-bold text-lg">{formatDuration(session.duration)}</div>
                  <div className="text-white/50 text-xs">Duration</div>
                </div>
              </div>
              <div className="text-white/40 text-xs">
                Started: {formatDate(session.startTime)} • Ended: {formatDate(session.endTime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppUsageActivity;
