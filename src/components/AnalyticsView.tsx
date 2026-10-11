import React, { useState } from 'react';
import { GameState } from '../types';
import { LOCATIONS } from '../game/constants';
import { sound } from '../audio/chiptune';
import { t, Language } from '../utils/i18n';

interface AnalyticsViewProps {
  gameState: GameState;
  onClose: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ gameState, onClose }) => {
  const lang: Language = 'es';
  const [activeSubTab, setActiveSubTab] = useState<'charts' | 'history' | 'achievements'>('charts');

  const history = gameState.history.slice(0, 14); // last 14 days
  const maxProfit = Math.max(1, ...history.map((h) => Math.max(0, h.netProfit)));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] text-[#9bbc0f] font-mono p-3 sm:p-4 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#8bac0f]">
        <div className="flex items-center gap-2">
          <span className="text-[#8bac0f] text-sm">📊</span>
          <span className="text-xs font-bold text-[#9bbc0f] uppercase">{t(lang, 'analytics_title')}</span>
        </div>
        <button
          onClick={() => {
            sound.playButtonTone();
            onClose();
          }}
          className="p-1 px-2.5 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] rounded border border-[#8bac0f] text-[10px] text-[#9bbc0f] font-bold uppercase cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Top 4 Key Career Metrics Bento Grid */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-2.5 rounded">
          <div className="text-[9px] text-[#8bac0f] mb-0.5 uppercase">{t(lang, 'stat_total_revenue')}</div>
          <div className="text-xs font-bold text-[#9bbc0f] font-mono">
            ${gameState.totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-2.5 rounded">
          <div className="text-[9px] text-[#8bac0f] mb-0.5 uppercase">{t(lang, 'stat_total_profit')}</div>
          <div className="text-xs font-bold text-[#9bbc0f] font-mono">
            ${gameState.totalProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-2.5 rounded">
          <div className="text-[9px] text-[#8bac0f] mb-0.5 uppercase">{t(lang, 'stat_total_cups')}</div>
          <div className="text-xs font-bold text-[#9bbc0f] font-mono">
            {gameState.totalCupsSold}
          </div>
        </div>
        <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-2.5 rounded">
          <div className="text-[9px] text-[#8bac0f] mb-0.5 uppercase">{t(lang, 'stat_best_day')}</div>
          <div className="text-xs font-bold text-[#9bbc0f] font-mono">
            ${gameState.bestDayProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b-2 border-[#8bac0f] mb-3 text-[10px]">
        <button
          onClick={() => {
            sound.playButtonTone();
            setActiveSubTab('charts');
          }}
          className={`flex-1 py-1.5 text-center uppercase font-bold transition-colors ${
            activeSubTab === 'charts'
              ? 'bg-[#8bac0f] text-[#0f380f]'
              : 'text-[#8bac0f] hover:bg-[#1a1c1a]'
          }`}
        >
          📈 Gráfico
        </button>
        <button
          onClick={() => {
            sound.playButtonTone();
            setActiveSubTab('history');
          }}
          className={`flex-1 py-1.5 text-center uppercase font-bold transition-colors ${
            activeSubTab === 'history'
              ? 'bg-[#8bac0f] text-[#0f380f]'
              : 'text-[#8bac0f] hover:bg-[#1a1c1a]'
          }`}
        >
          📋 Historial
        </button>
        <button
          onClick={() => {
            sound.playButtonTone();
            setActiveSubTab('achievements');
          }}
          className={`flex-1 py-1.5 text-center uppercase font-bold transition-colors ${
            activeSubTab === 'achievements'
              ? 'bg-[#8bac0f] text-[#0f380f]'
              : 'text-[#8bac0f] hover:bg-[#1a1c1a]'
          }`}
        >
          🏆 Logros ({gameState.achievements.filter((a) => a.unlocked).length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* SUBTAB 1: CHARTS */}
        {activeSubTab === 'charts' && (
          <div className="space-y-3">
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded">
              <div className="text-[10px] font-bold text-[#9bbc0f] mb-2 uppercase">
                {t(lang, 'chart_profit')} (Últimos {history.length} días)
              </div>

              {history.length === 0 ? (
                <div className="text-[9px] text-[#8bac0f] py-6 text-center italic">
                  {t(lang, 'no_history')}
                </div>
              ) : (
                <div className="h-32 flex items-end gap-1.5 pt-4 pb-1 px-1 bg-[#0f0f0f] border border-[#8bac0f]/40 rounded">
                  {history.slice().reverse().map((dayData, idx) => {
                    const heightPercent = Math.max(8, Math.round((Math.max(0, dayData.netProfit) / maxProfit) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-7 bg-[#1a1c1a] border border-[#8bac0f] px-1.5 py-0.5 rounded text-[8px] text-[#9bbc0f] hidden group-hover:block whitespace-nowrap z-20 font-mono font-bold">
                          Día {dayData.day}: ${dayData.netProfit.toFixed(1)}
                        </div>
                        <div
                          className={`w-full rounded-t-xs transition-all ${
                            dayData.netProfit >= 0 ? 'bg-[#8bac0f] hover:bg-[#9bbc0f]' : 'bg-[#306230]'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[7px] text-[#8bac0f]">D{dayData.day}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: HISTORY TABLE */}
        {activeSubTab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-[9px] text-[#8bac0f] py-6 text-center italic">
                {t(lang, 'no_history')}
              </div>
            ) : (
              history.map((dayData) => {
                const loc = LOCATIONS.find((l) => l.id === dayData.locationId) || LOCATIONS[0];
                return (
                  <div
                    key={dayData.day}
                    className="bg-[#1a1c1a] border border-[#8bac0f] p-2 rounded flex items-center justify-between text-[9px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#9bbc0f]">Día {dayData.day}</span>
                      <span className="text-[#8bac0f]">{loc.icon} {t(lang, loc.nameKey)}</span>
                      <span>{dayData.weather.icon}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[#8bac0f]">{dayData.cupsSold} 🥤</span>
                      <span
                        className="font-bold font-mono text-[#9bbc0f]"
                      >
                        {dayData.netProfit >= 0 ? `+$${dayData.netProfit.toFixed(2)}` : `-$${Math.abs(dayData.netProfit).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUBTAB 3: ACHIEVEMENTS */}
        {activeSubTab === 'achievements' && (
          <div className="space-y-2">
            {gameState.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-2.5 rounded border-2 flex items-center gap-2.5 ${
                  ach.unlocked
                    ? 'bg-[#1a1c1a] border-[#8bac0f] text-[#9bbc0f]'
                    : 'bg-[#121212] border-zinc-800 text-[#8bac0f]/40 opacity-60'
                }`}
              >
                <div className={`text-xl ${ach.unlocked ? 'animate-pulse' : 'opacity-30'}`}>
                  {ach.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold flex items-center justify-between uppercase">
                    <span className={ach.unlocked ? 'text-[#9bbc0f]' : 'text-[#8bac0f]/50'}>
                      {t(lang, ach.nameKey)}
                    </span>
                    {ach.rewardCash && (
                      <span className="text-[8px] bg-[#0f380f] text-[#9bbc0f] border border-[#8bac0f] px-1 rounded">
                        +${ach.rewardCash}
                      </span>
                    )}
                  </div>
                  <div className="text-[8px] text-[#8bac0f] leading-tight mt-0.5">
                    {t(lang, ach.descKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
