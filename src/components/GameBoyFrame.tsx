import React from 'react';
import { GameSettings } from '../types';
import { PALETTES } from '../game/constants';
import { sound } from '../audio/chiptune';

interface GameBoyFrameProps {
  settings: GameSettings;
  children: React.ReactNode;
  onDpad?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onButtonA?: () => void;
  onButtonB?: () => void;
  onSelect?: () => void;
  onStart?: () => void;
}

export const GameBoyFrame: React.FC<GameBoyFrameProps> = ({
  settings,
  children,
  onDpad,
  onButtonA,
  onButtonB,
  onSelect,
  onStart,
}) => {
  const currentPalette = PALETTES[settings.palette] || PALETTES.clean_minimalism;

  if (settings.frameMode === 'modern_compact') {
    return (
      <div 
        className="min-h-screen w-full flex flex-col items-center justify-start p-2 sm:p-6 transition-colors duration-300 font-mono select-none"
        style={{ backgroundColor: '#0f0f0f' }}
      >
        <div 
          className="w-full max-w-5xl border-4 overflow-hidden shadow-2xl relative flex flex-col min-h-[92vh] p-3 sm:p-6"
          style={{ 
            borderColor: '#8bac0f',
            backgroundColor: '#0f0f0f',
            color: '#9bbc0f'
          }}
        >
          {settings.scanlines && <div className="absolute inset-0 scanlines z-40 pointer-events-none" />}
          
          {/* Clean Minimalism Top App Banner */}
          <header className="flex flex-wrap justify-between items-end border-b-4 border-[#8bac0f] pb-3 mb-3 gap-2">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-[#9bbc0f] flex items-center gap-2">
                <span>🍋</span>
                <span>Lemon Tycoon</span>
                <span className="text-xs sm:text-sm text-[#8bac0f] font-normal align-top border border-[#8bac0f] px-1 py-0.5 rounded">v2.0</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#8bac0f]/75 tracking-wider uppercase mt-0.5">
                RETRO EDITION // CLOUD SYNC: ACTIVE
              </p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div className="flex items-center gap-1.5 bg-[#1a1c1a] border border-[#8bac0f] px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-[#9bbc0f] animate-pulse" />
                <span className="text-[9px] uppercase tracking-wider text-[#9bbc0f]">ONLINE 8-BIT</span>
              </div>
            </div>
          </header>

          {/* Main App Content Area */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {children}
          </div>

          {/* Clean Minimalism Bottom Status Bar */}
          <footer className="mt-3 pt-3 border-t-2 border-[#8bac0f] flex flex-wrap justify-between items-center text-[9px] sm:text-[10px] uppercase tracking-widest text-[#8bac0f] gap-2">
            <div className="flex gap-4">
              <button onClick={() => onButtonA?.()} className="hover:text-[#9bbc0f] transition-colors cursor-pointer font-bold">[A] ACCIÓN</button>
              <button onClick={() => onButtonB?.()} className="hover:text-[#9bbc0f] transition-colors cursor-pointer font-bold">[B] VOLVER</button>
              <button onClick={() => onSelect?.()} className="hover:text-[#9bbc0f] transition-colors cursor-pointer font-bold">[S] AJUSTES</button>
            </div>
            <div className="flex gap-3 sm:gap-4 items-center text-[#8bac0f]/80">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9bbc0f]" />
                <span>2FA SECURE</span>
              </div>
              <span className="opacity-40">|</span>
              <span>HOST: US-WEST-01</span>
              <span className="opacity-40">|</span>
              <span className="hidden sm:inline">© 1989 BIT-JUICE INC.</span>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-6 bg-[#0f0f0f] font-mono select-none">
      {/* Game Boy Handheld Shell with Clean Minimalist Styling */}
      <div className="w-full max-w-[440px] bg-[#1a1c1a] rounded-t-3xl rounded-b-[40px] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(139,172,15,0.2)] border-4 border-[#8bac0f] relative flex flex-col text-[#9bbc0f]">
        {/* Top curves & grooves */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex gap-1">
            <div className="w-10 h-1 bg-[#0f380f] rounded-full border border-[#8bac0f]/50" />
            <div className="w-6 h-1 bg-[#0f380f] rounded-full border border-[#8bac0f]/50" />
          </div>
          <div className="text-[8px] sm:text-[9px] text-[#8bac0f] tracking-widest uppercase font-bold">
            DOT MATRIX WITH STEREO SOUND
          </div>
        </div>

        {/* Screen Bezel */}
        <div className="bg-[#0f0f0f] rounded-2xl p-4 sm:p-5 pt-3 pb-4 shadow-inner border-2 border-[#8bac0f] relative">
          {/* Bezel header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Power LED Indicator */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#9bbc0f] shadow-[0_0_8px_rgba(155,188,15,0.9)] animate-pulse" />
              <span className="text-[7px] text-[#8bac0f] uppercase font-bold">BATTERY</span>
            </div>
            <div className="text-[8px] text-[#9bbc0f] font-bold tracking-wider">LEMON BOY 8-BIT</div>
          </div>

          {/* Actual LCD Game Screen */}
          <div 
            className="w-full h-[540px] sm:h-[580px] rounded-lg border-2 overflow-hidden relative shadow-inner flex flex-col"
            style={{
              borderColor: '#8bac0f',
              backgroundColor: '#0f0f0f',
              color: '#9bbc0f'
            }}
          >
            {settings.scanlines && <div className="absolute inset-0 scanlines z-40 pointer-events-none" />}
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>

        {/* Brand logo below screen */}
        <div className="my-4 flex items-center justify-between px-3">
          <div className="text-xs text-[#9bbc0f] tracking-wider flex items-center gap-1.5 font-bold">
            <span>🍋</span>
            <span className="text-[#9bbc0f]">Nintendo</span>
            <span className="text-[8px] italic text-[#8bac0f]">LEMON BOY</span>
          </div>
          <div className="text-[8px] text-[#8bac0f] font-bold">COLOR TM</div>
        </div>

        {/* Game Boy Controls Area (D-Pad & Buttons) */}
        <div className="mt-2 flex items-center justify-between px-2">
          {/* D-PAD */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Cross Base */}
            <div className="absolute w-9 h-28 bg-[#0f380f] border border-[#8bac0f] rounded-sm shadow-md" />
            <div className="absolute w-28 h-9 bg-[#0f380f] border border-[#8bac0f] rounded-sm shadow-md" />

            {/* UP */}
            <button
              id="dpad-up-btn"
              onClick={() => {
                sound.playButtonTone();
                onDpad?.('up');
              }}
              className="absolute top-0 w-9 h-9 active:bg-[#1a4a1a] flex items-center justify-center text-[#9bbc0f] active:text-white transition-colors"
            >
              ▲
            </button>
            {/* DOWN */}
            <button
              id="dpad-down-btn"
              onClick={() => {
                sound.playButtonTone();
                onDpad?.('down');
              }}
              className="absolute bottom-0 w-9 h-9 active:bg-[#1a4a1a] flex items-center justify-center text-[#9bbc0f] active:text-white transition-colors"
            >
              ▼
            </button>
            {/* LEFT */}
            <button
              id="dpad-left-btn"
              onClick={() => {
                sound.playButtonTone();
                onDpad?.('left');
              }}
              className="absolute left-0 w-9 h-9 active:bg-[#1a4a1a] flex items-center justify-center text-[#9bbc0f] active:text-white transition-colors"
            >
              ◀
            </button>
            {/* RIGHT */}
            <button
              id="dpad-right-btn"
              onClick={() => {
                sound.playButtonTone();
                onDpad?.('right');
              }}
              className="absolute right-0 w-9 h-9 active:bg-[#1a4a1a] flex items-center justify-center text-[#9bbc0f] active:text-white transition-colors"
            >
              ▶
            </button>
            {/* Center indent */}
            <div className="w-5 h-5 rounded-full bg-[#1a1c1a] border border-[#8bac0f] shadow-inner z-10" />
          </div>

          {/* Action Buttons (A & B) */}
          <div className="flex gap-4 transform -rotate-25 origin-center">
            {/* B Button */}
            <div className="flex flex-col items-center">
              <button
                id="gb-btn-b"
                onClick={() => {
                  sound.playButtonTone();
                  onButtonB?.();
                }}
                className="w-11 h-11 rounded-full bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#081808] border-2 border-[#8bac0f] shadow-[0_4px_0_#000000] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#9bbc0f] font-bold text-xs transition-all"
              >
                B
              </button>
            </div>
            {/* A Button */}
            <div className="flex flex-col items-center -mt-4">
              <button
                id="gb-btn-a"
                onClick={() => {
                  sound.playButtonTone();
                  onButtonA?.();
                }}
                className="w-11 h-11 rounded-full bg-[#8bac0f] hover:bg-[#9bbc0f] active:bg-[#306230] border-2 border-[#306230] shadow-[0_4px_0_#000000] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#0f380f] font-bold text-xs transition-all"
              >
                A
              </button>
            </div>
          </div>
        </div>

        {/* Select / Start & Speaker Grille */}
        <div className="mt-6 flex items-center justify-between px-6 pb-2">
          {/* Select & Start Pill Buttons */}
          <div className="flex gap-5 transform -rotate-25">
            <div className="flex flex-col items-center gap-1">
              <button
                id="gb-btn-select"
                onClick={() => {
                  sound.playButtonTone();
                  onSelect?.();
                }}
                className="w-11 h-3.5 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] rounded-full shadow-inner border border-[#8bac0f]"
              />
              <span className="text-[7px] text-[#8bac0f] uppercase font-bold">SELECT</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                id="gb-btn-start"
                onClick={() => {
                  sound.playButtonTone();
                  onStart?.();
                }}
                className="w-11 h-3.5 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] rounded-full shadow-inner border border-[#8bac0f]"
              />
              <span className="text-[7px] text-[#8bac0f] uppercase font-bold">START</span>
            </div>
          </div>

          {/* Speaker Slits */}
          <div className="flex gap-1.5 transform rotate-25 opacity-70">
            <div className="w-1.5 h-10 bg-[#0f380f] border border-[#8bac0f]/40 rounded-full" />
            <div className="w-1.5 h-10 bg-[#0f380f] border border-[#8bac0f]/40 rounded-full" />
            <div className="w-1.5 h-10 bg-[#0f380f] border border-[#8bac0f]/40 rounded-full" />
            <div className="w-1.5 h-10 bg-[#0f380f] border border-[#8bac0f]/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
