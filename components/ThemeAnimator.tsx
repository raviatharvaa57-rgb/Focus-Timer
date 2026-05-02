
import React from 'react';

interface ThemeAnimatorProps {
  themeId: string;
}

const ThemeAnimator: React.FC<ThemeAnimatorProps> = ({ themeId }) => {
  const renderAnimation = () => {
    switch (themeId) {
      case 'coffee':
        return (
          <div className="relative flex flex-col items-center justify-center h-48 w-48">
            <div className="absolute -top-8 flex space-x-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-2 bg-gradient-to-t from-white/10 via-white/40 to-transparent rounded-full animate-[steam_3s_infinite_ease-in-out]"
                  style={{ animationDelay: `${i * 0.7}s`, height: '60px', filter: 'blur(4px)' }}
                />
              ))}
            </div>
            <div className="relative">
              <div className="w-24 h-20 bg-white rounded-b-[3.5rem] rounded-t-lg shadow-2xl relative z-10 border-t border-white/40">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-200/50 rounded-full" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-amber-900/10 rounded-full blur-md" />
              </div>
              <div className="absolute -right-6 top-5 w-10 h-10 border-[8px] border-white rounded-full"></div>
            </div>
            <style>{`@keyframes steam { 0% { transform: translateY(10px) scaleX(1); opacity: 0; } 50% { transform: translateY(-30px) scaleX(1.4); opacity: 0.6; } 100% { transform: translateY(-60px) scaleX(2); opacity: 0; } }`}</style>
          </div>
        );
      case 'campfire':
        return (
          <div className="relative h-48 w-48 flex items-center justify-center">
            <div className="absolute inset-0 bg-orange-600 rounded-full blur-[60px] opacity-20 animate-pulse" />
            <div className="text-8xl animate-[flicker_0.15s_infinite_alternate] z-10 drop-shadow-[0_0_40px_rgba(255,100,0,0.8)]">🔥</div>
            <div className="absolute bottom-6 flex space-x-1 scale-110">
              <div className="w-16 h-5 bg-orange-950 rounded-full rotate-[15deg] shadow-lg border-b border-black/20"></div>
              <div className="w-16 h-5 bg-orange-900 rounded-full -rotate-[10deg] shadow-lg border-b border-black/20"></div>
            </div>
            <style>{`@keyframes flicker { 0% { transform: scale(1) rotate(-1deg) skewX(-1deg); } 100% { transform: scale(1.08) rotate(1deg) skewX(1deg); } }`}</style>
          </div>
        );
      case 'dog':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center">
            <div className="text-8xl animate-[breathe_3s_infinite_ease-in-out] drop-shadow-2xl">🐶</div>
            <div className="absolute -bottom-2 text-2xl animate-[wag_0.4s_infinite_ease-in-out] origin-top">🦴</div>
            <style>{`
              @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
              @keyframes wag { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } }
            `}</style>
          </div>
        );
      case 'cat':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center">
            <div className="text-8xl animate-[purr_2s_infinite_ease-in-out] drop-shadow-2xl">🐱</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/5 rounded-full animate-[spin_12s_linear_infinite]" />
            <style>{`@keyframes purr { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
          </div>
        );
      case 'ocean':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center overflow-hidden rounded-full border border-white/10 shadow-inner bg-blue-900/10">
            <div className="text-7xl animate-[float_4s_infinite_ease-in-out] z-10">🌊</div>
            <div className="absolute top-8 w-full flex justify-around opacity-40">
              <div className="animate-[seagull_8s_infinite_linear]">🕊️</div>
              <div className="animate-[seagull_10s_infinite_linear_reverse] mt-4">🕊️</div>
            </div>
            <style>{`@keyframes seagull { 0% { transform: translateX(-100px) translateY(0); } 50% { transform: translateX(0) translateY(-15px); } 100% { transform: translateX(100px) translateY(0); } }`}</style>
          </div>
        );
      case 'forest':
        return (
          <div className="relative h-48 w-56 flex items-end justify-center space-x-1 pb-4">
            <div className="text-6xl opacity-30 animate-[sway_7s_infinite_ease-in-out]">🌲</div>
            <div className="text-9xl animate-[sway_5s_infinite_ease-in-out] drop-shadow-2xl z-10">🌲</div>
            <div className="text-7xl opacity-40 animate-[sway_6s_infinite_ease-in-out]">🌲</div>
            <div className="absolute top-0 right-8 text-3xl animate-bounce">🐦</div>
            <style>{`@keyframes sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }`}</style>
          </div>
        );
      case 'night':
        return (
          <div className="relative h-48 w-48 flex items-center justify-center">
            <div className="text-9xl animate-[glow_4s_infinite_ease-in-out] drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">🌙</div>
            <style>{`@keyframes glow { 0%, 100% { filter: drop-shadow(0 0 20px white); opacity: 0.9; } 50% { filter: drop-shadow(0 0 60px white); opacity: 1; } }`}</style>
          </div>
        );
      case 'sun':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center">
            <div className="text-9xl animate-[rise_8s_infinite_alternate_ease-in-out] drop-shadow-[0_0_60px_rgba(255,200,0,0.6)]">🌅</div>
            <style>{`@keyframes rise { 0% { transform: translateY(30px); filter: brightness(0.8); } 100% { transform: translateY(-30px); filter: brightness(1.2); } }`}</style>
          </div>
        );
      case 'candle':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center">
            <div className="w-10 h-28 bg-gradient-to-b from-orange-100 to-orange-200 rounded-md shadow-xl relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-12 bg-orange-500 rounded-full blur-[3px] animate-[candle_0.2s_infinite_alternate]" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-8 bg-yellow-200 rounded-full animate-pulse" />
            </div>
            <style>{`@keyframes candle { 0% { transform: translateX(-50%) scale(1) skewX(-2deg); } 100% { transform: translateX(-50%) scale(1.1) skewX(2deg); } }`}</style>
          </div>
        );
      case 'snow':
        return (
          <div className="relative h-48 w-48 flex items-center justify-center">
            <div className="text-9xl animate-[spin_15s_linear_infinite] drop-shadow-[0_0_30px_white]">❄️</div>
          </div>
        );
      case 'chocolate':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center">
            <div className="text-9xl animate-[melt_4s_infinite_ease-in-out]">🍫</div>
            <style>{`@keyframes melt { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.85) scaleX(1.1); filter: contrast(1.2); } }`}</style>
          </div>
        );
      case 'study':
        return (
          <div className="relative h-48 w-48 flex flex-col items-center justify-center">
            <div className="text-8xl animate-float relative z-10 drop-shadow-2xl">📚</div>
            <div className="absolute -top-4 right-0 text-5xl animate-pulse text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,0.4)]">💡</div>
          </div>
        );
      case 'art':
        return (
          <div className="relative h-48 w-48 flex items-center justify-center">
            <div className="text-9xl animate-[paint_5s_infinite_ease-in-out]">🎨</div>
            <style>{`@keyframes paint { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } }`}</style>
          </div>
        );
      case 'aquarium':
        return (
          <div className="relative h-48 w-48 flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full border border-white/20 backdrop-blur-sm" />
            <div className="text-8xl animate-[swim_8s_infinite_ease-in-out]">🐠</div>
            <style>{`@keyframes swim { 0%, 100% { transform: translateX(-40px) rotateY(0deg); } 50% { transform: translateX(40px) rotateY(180deg); } }`}</style>
          </div>
        );
      case 'sakura':
        return (
          <div className="relative h-48 w-48 flex items-center justify-center">
            <div className="text-9xl animate-[pulse_4s_infinite] drop-shadow-[0_0_30px_pink]">🌸</div>
          </div>
        );
      default:
        return <div className="text-8xl animate-float">⏳</div>;
    }
  };

  return (
    <div className="w-full flex items-center justify-center pointer-events-none select-none">
      {renderAnimation()}
    </div>
  );
};

export default ThemeAnimator;
