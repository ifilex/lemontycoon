import React, { useEffect } from 'react';
import { GameState, DayFinancials } from '../types';
import { LOCATIONS } from '../game/constants';
import { sound } from '../audio/chiptune';
import { t, Language } from '../utils/i18n';
import confetti from 'canvas-confetti';

interface NightSummaryProps {
  gameState: GameState;
  onNextDay: () => void;
}

export const NightSummary: React.FC<NightSummaryProps> = ({ gameState, onNextDay }) => {
  const lang: Language = 'es';
  const latestFinancials: DayFinancials = gameState.history[0] || {
    day: gameState.day,
    locationId: gameState.currentLocationId,
    weather: gameState.weatherToday,
    revenue: 0,
    cupsSold: 0,
    potentialCustomers: 0,
    customersServed: 0,
    customersTurnedAwayPrice: 0,
    customersTurnedAwayStock: 0,
    customersTurnedAwayQuality: 0,
    supplyCost: 0,
    rentCost: 0,
    staffCost: 0,
    marketingCost: 0,
    iceMeltedCost: 0,
    lemonsSpoiledCost: 0,
    netProfit: 0,
    satisfactionScore: 85,
    feedbackTags: [],
  };

  const loc = LOCATIONS.find((l) => l.id === latestFinancials.locationId) || LOCATIONS[0];
  const isProfitable = latestFinancials.netProfit >= 0;

  useEffect(() => {
    if (latestFinancials.netProfit > 20) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      sound.playFanfare();
    } else if (isProfitable) {
      sound.playCoin();
    } else {
      sound.playBuzzer();
    }
  }, [latestFinancials.netProfit, isProfitable]);

  const totalExpenses =
    latestFinancials.supplyCost +
    latestFinancials.rentCost +
    latestFinancials.staffCost +
    latestFinancials.iceMeltedCost +
    latestFinancials.lemonsSpoiledCost;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] text-[#9bbc0f] font-mono p-3 sm:p-4 overflow-y-auto select-none">
      {/* Summary Header */}
      <div className="text-center pb-3 border-b-2 border-[#8bac0f]">
        <div className="text-[10px] text-[#8bac0f] mb-1 uppercase tracking-wider">{t(lang, 'summary_title')}</div>
        <div className="text-base font-bold text-[#9bbc0f] uppercase">
          {t(lang, 'day')} {latestFinancials.day} - {loc.icon} {t(lang, loc.nameKey)}
        </div>
      </div>

      {/* Main Net Profit Spotlight Card */}
      <div className={`my-3 p-3.5 rounded border-2 text-center ${
        isProfitable
          ? 'bg-[#0f380f] border-[#8bac0f] text-[#9bbc0f]'
          : 'bg-[#1a1c1a] border-[#8bac0f] text-[#8bac0f]'
      }`}>
        <div className="text-[10px] uppercase tracking-wider mb-1 font-bold">
          {t(lang, 'net_profit')}
        </div>
        <div className="text-2xl font-bold font-mono">
          {isProfitable ? `+$${latestFinancials.netProfit.toFixed(2)}` : `-$${Math.abs(latestFinancials.netProfit).toFixed(2)}`}
        </div>
        <div className="text-[9px] text-[#8bac0f] mt-1">
          {t(lang, 'cups_sold')}: <span className="text-[#9bbc0f] font-bold">{latestFinancials.cupsSold}</span>
        </div>
      </div>

      {/* Financial Statement Breakdown */}
      <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] rounded p-3 space-y-2 text-[10px] mb-3">
        <div className="flex items-center justify-between text-[#9bbc0f] font-bold border-b border-[#8bac0f]/40 pb-1 uppercase">
          <span>(+) {t(lang, 'revenue')}</span>
          <span>${latestFinancials.revenue.toFixed(2)}</span>
        </div>

        {latestFinancials.passiveFranchiseEarnings && latestFinancials.passiveFranchiseEarnings > 0 ? (
          <div className="flex items-center justify-between text-[#8bac0f] font-bold">
            <span>• (+) {t(lang, 'passive_royalties')}</span>
            <span className="text-[#9bbc0f]">+${latestFinancials.passiveFranchiseEarnings.toFixed(2)}</span>
          </div>
        ) : null}

        <div className="space-y-1 text-[#8bac0f]">
          <div className="flex items-center justify-between">
            <span>• {t(lang, 'supplies_cost')}</span>
            <span className="text-[#9bbc0f]">-${latestFinancials.supplyCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>• {t(lang, 'rent_paid')}</span>
            <span className="text-[#9bbc0f]">-${latestFinancials.rentCost.toFixed(2)}</span>
          </div>
          {latestFinancials.staffCost > 0 && (
            <div className="flex items-center justify-between">
              <span>• {t(lang, 'staff_paid')}</span>
              <span className="text-[#9bbc0f]">-${latestFinancials.staffCost.toFixed(2)}</span>
            </div>
          )}
          {latestFinancials.iceMeltedCost > 0 && (
            <div className="flex items-center justify-between text-[#8bac0f]">
              <span>• {t(lang, 'ice_melted')}</span>
              <span className="text-[#9bbc0f]">-${latestFinancials.iceMeltedCost.toFixed(2)}</span>
            </div>
          )}
          {latestFinancials.lemonsSpoiledCost > 0 && (
            <div className="flex items-center justify-between text-[#8bac0f]">
              <span>• {t(lang, 'spoilage')}</span>
              <span className="text-[#9bbc0f]">-${latestFinancials.lemonsSpoiledCost.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[#8bac0f] font-bold border-t border-[#8bac0f]/40 pt-1 uppercase">
          <span>(-) {t(lang, 'expenses')}</span>
          <span className="text-[#9bbc0f]">-${totalExpenses.toFixed(2)}</span>
        </div>
      </div>

      {/* Customer Satisfaction & Feedback */}
      <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] rounded p-3 space-y-2 text-[10px] mb-4">
        <div className="flex items-center justify-between font-bold text-[#9bbc0f] uppercase">
          <span>{t(lang, 'satisfaction')}</span>
          <span>{latestFinancials.satisfactionScore}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[#0f0f0f] rounded overflow-hidden border border-[#8bac0f]">
          <div
            className="h-full bg-[#8bac0f]"
            style={{ width: `${latestFinancials.satisfactionScore}%` }}
          />
        </div>

        {/* Lost Customers Audit */}
        <div className="grid grid-cols-3 gap-1.5 text-[9px] text-[#8bac0f] pt-1 text-center">
          <div className="bg-[#0f0f0f] p-1.5 rounded border border-[#8bac0f]/40">
            <div>💸 {t(lang, 'customers_lost_price')}</div>
            <div className="text-[#9bbc0f] font-bold mt-0.5">{latestFinancials.customersTurnedAwayPrice}</div>
          </div>
          <div className="bg-[#0f0f0f] p-1.5 rounded border border-[#8bac0f]/40">
            <div>❌ {t(lang, 'customers_lost_stock')}</div>
            <div className="text-[#9bbc0f] font-bold mt-0.5">{latestFinancials.customersTurnedAwayStock}</div>
          </div>
          <div className="bg-[#0f0f0f] p-1.5 rounded border border-[#8bac0f]/40">
            <div>😖 {t(lang, 'customers_lost_wait')}</div>
            <div className="text-[#9bbc0f] font-bold mt-0.5">{latestFinancials.customersTurnedAwayQuality}</div>
          </div>
        </div>
      </div>

      {/* Action Next Day Button */}
      <div className="mt-auto pt-2">
        <button
          id="next-day-btn"
          onClick={() => {
            sound.playButtonTone();
            onNextDay();
          }}
          className="w-full py-3 bg-[#8bac0f] hover:bg-[#9bbc0f] active:bg-[#306230] text-[#0f380f] font-mono font-bold text-xs uppercase rounded border-b-4 border-[#306230] shadow-xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>☀️</span>
          <span>{t(lang, 'next_day')}</span>
          <span>▶</span>
        </button>
      </div>
    </div>
  );
};
