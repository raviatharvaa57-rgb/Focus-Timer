
import React from 'react';

interface ThemeAnimatorProps {
  themeId: string;
}

const ThemeAnimator: React.FC<ThemeAnimatorProps> = ({ themeId }) => {
  const renderAnimation = () => {
    switch (themeId) {
      case 'coffee':
        return (
          <div className="relative flex flex-col items-center justify-center h-40 w-40">
             <div className="flex space-x-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 h-10 bg-gradient-to-t from-white/20 to-transparent rounded-full animate-[pulse_3s_infinite_ease-in-out]"
                    style={{ animationDelay: `${i * 0.7}s`, height: `${30 + i * 10}px` }}
                  />
                ))}
             </div>
             <div className="relative">
                <div className="w-20 h-16 bg-white rounded-b-[3rem] rounded-t-md shadow-xl relative z-10 border-t border-white/20">
                   <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-zinc-100/50 rounded-full" />
                </div>
                <div className="absolute -right-6 top-4 w-9 h-9 border-[6px] border-white rounded-full"></div>
             </div>
          </div>
        );
      case 'campfire':
        return (
          <div className="relative flex flex-col items-center justify-center h-40 w-40">
            <div className="relative w-28 h-28 flex items-center justify-center">
               <div className="absolute inset-0 bg-orange-600 rounded-full blur-[40px] opacity-25 animate-pulse"></div>
               <div className="text-7xl animate-bounce drop-shadow-[0_0_15px_rgba(255,100,0,0.5)]">🔥</div>
               <div className="absolute bottom-4 flex space-x-1">
                  <div className="w-12 h-3 bg-orange-950 rounded-full rotate-[15deg]"></div>
                  <div className="w-12 h-3 bg-orange-900 rounded-full -rotate-[10deg]"></div>
               </div>
            </div>
          </div>
        );
      case 'ocean':
        return (
          <div className="relative h-40 w-48 flex flex-col items-center justify-center">
            <div className="text-6xl animate-float drop-shadow-[0_0_20px_rgba(0,200,255,0.4)]">🌊</div>
            <div className="mt-4 flex space-x-3">
               <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
               <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping delay-75"></div>
               <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping delay-150"></div>
            </div>
          </div>
        );
      case 'dog':
        return (
          <div className="flex flex-col items-center justify-center h-40 w-40 group">
            <div className="text-7xl animate-[bounce_2s_infinite] drop-shadow-lg">🐶</div>
            <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity mt-1">🦴</div>
          </div>
        );
      case 'cat':
        return (
          <div className="relative flex flex-col items-center justify-center h-40 w-40">
            <div className="text-7xl animate-[pulse_3s_infinite] drop-shadow-xl">🐱</div>
            <div className="absolute bottom-2 right-2 text-2xl animate-spin-slow opacity-40">🧶</div>
          </div>
        );
      case 'night':
        return (
          <div className="relative h-40 w-40 flex items-center justify-center">
             <div className="text-6xl animate-float z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">🌙</div>
             <div className="absolute inset-2 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]">
                <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
             </div>
          </div>
        );
      case 'forest':
        return (
          <div className="relative flex items-end justify-center h-40 w-48 space-x-3">
            <div className="text-4xl opacity-40 -mb-2">🌲</div>
            <div className="text-7xl animate-float drop-shadow-md">🌲</div>
            <div className="text-5xl opacity-40 -mb-1">🌲</div>
          </div>
        );
      case 'aquarium':
        return (
          <div className="relative h-40 w-40 flex items-center justify-center">
             <div className="absolute inset-0 bg-cyan-500/10 rounded-full border border-cyan-500/20"></div>
             <div className="text-6xl animate-[bounce_4s_infinite_ease-in-out] z-10">🐠</div>
             <div className="absolute top-1/4 right-1/4 text-xl animate-ping opacity-30">🫧</div>
          </div>
        );
      case 'study':
        return (
          <div className="relative flex flex-col items-center justify-center h-40 w-40">
             <div className="text-7xl animate-float relative z-10 drop-shadow-xl">📚</div>
             <div className="absolute -top-4 -right-1 text-4xl animate-pulse text-yellow-400">💡</div>
          </div>
        );
      case 'sun':
        return (
          <div className="relative h-40 w-40 flex flex-col items-center justify-center">
            <div className="absolute bottom-1/2 w-32 h-[1px] bg-white/20 rounded-full" />
            <div className="text-7xl animate-[bounce_5s_infinite_ease-in-out] drop-shadow-[0_0_30px_rgba(255,200,0,0.6)]">🌅</div>
          </div>
        );
      case 'candle':
        return (
          <div className="relative flex flex-col items-center justify-center h-40 w-40">
            <div className="absolute -top-10 text-5xl animate-[pulse_2s_infinite] drop-shadow-[0_0_15px_rgba(255,160,0,0.8)]">🔥</div>
            <div className="w-10 h-28 bg-white rounded-t-sm shadow-xl relative">
              <div className="absolute top-0 w-full h-3 bg-zinc-200 rounded-t-sm" />
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-black/40 rounded-full" />
            </div>
          </div>
        );
      case 'snow':
        return (
          <div className="relative h-40 w-40 flex items-center justify-center">
            <div className="text-7xl animate-[spin_10s_linear_infinite] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">❄️</div>
          </div>
        );
      case 'chocolate':
        return (
          <div className="relative h-40 w-40 flex items-center justify-center group">
            <div className="text-7xl animate-pulse group-hover:scale-110 transition-transform">🍫</div>
            <div className="absolute bottom-4 text-2xl animate-bounce">🤎</div>
          </div>
        );
      case 'art':
        return (
          <div className="relative h-40 w-40 flex items-center justify-center">
            <div className="text-7xl animate-float">🎨</div>
            <div className="absolute -top-2 -right-2 text-3xl animate-pulse">✨</div>
          </div>
        );
      case 'sakura':
        return (
          <div className="relative h-40 w-40 flex items-center justify-center">
            <div className="text-7xl animate-[pulse_4s_infinite_ease-in-out] z-10">🌸</div>
            <div className="absolute top-4 text-2xl animate-float opacity-60">🌸</div>
          </div>
        );
      default:
        return <div className="text-7xl animate-float opacity-80">⏳</div>;
    }
  };

  return (
    <div className="w-full flex items-center justify-center pointer-events-none select-none">
      {renderAnimation()}
    </div>
  );
};

export default ThemeAnimator;
