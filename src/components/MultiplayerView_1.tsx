import React, { useState } from 'react';
import { GameState, GhostRival } from '../types';
import { sound } from '../audio/chiptune';
import { t, Language } from '../utils/i18n';
import confetti from 'canvas-confetti';

interface MultiplayerViewProps {
  gameState: GameState;
  onClose: () => void;
  onLoadFriendChallenge: (challengeCode: string) => void;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({
  gameState,
  onClose,
  onLoadFriendChallenge,
}) => {
  const lang: Language = 'es';
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Combine Player + Rivals for Leaderboard
  const latestProfit = gameState.history[0]?.netProfit ?? (gameState.player.cash - 30);
  const playerEntry: GhostRival = {
    id: 'player',
    name: gameState.player.name + ' (Tú)',
    standName: gameState.player.standName,
    locationId: gameState.currentLocationId,
    cupsSold: gameState.history[0]?.cupsSold ?? gameState.totalCupsSold,
    dailyRevenue: gameState.history[0]?.revenue ?? gameState.totalRevenue,
    netProfit: latestProfit,
    avatarSeed: 0,
  };

  const allCompetitors = [playerEntry, ...gameState.rivals].sort((a, b) => b.netProfit - a.netProfit);
  const playerRank = allCompetitors.findIndex((c) => c.id === 'player') + 1;

  // Generate shareable friend code
  const myChallengeCode = `LEMON_GHOST_D${gameState.day}_LOC_${gameState.currentLocationId}_SCORE_${Math.round(latestProfit)}`;

  const handleCopyCode = () => {
    sound.playCoin();
    navigator.clipboard.writeText(myChallengeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLoadChallenge = () => {
    if (!friendCodeInput.trim()) return;
    sound.playFanfare();
    confetti({ particleCount: 30, spread: 50 });
    onLoadFriendChallenge(friendCodeInput.trim());
    setFriendCodeInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] text-[#9bbc0f] font-mono p-3 sm:p-4 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#8bac0f]">
        <div className="flex items-center gap-2">
          <span className="text-[#8bac0f] text-sm">🏆</span>
          <div>
            <div className="text-xs font-bold text-[#9bbc0f] uppercase">{t(lang, 'multiplayer_title')}</div>
            <div className="text-[9px] text-[#8bac0f]">{t(lang, 'league_division')}</div>
          </div>
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

      {/* Player Standing Highlight */}
      <div className="my-3 p-3 bg-[#1a1c1a] border-2 border-[#8bac0f] rounded flex items-center justify-between">
        <div>
          <div className="text-[9px] text-[#8bac0f] uppercase">{t(lang, 'franchise_rank')}</div>
          <div className="text-sm font-bold text-[#9bbc0f] flex items-center gap-1.5 mt-0.5 uppercase">
            <span>{playerRank === 1 ? '🥇' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '🎖️'}</span>
            <span>Puesto #{playerRank} de {allCompetitors.length}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-[#8bac0f] uppercase">{t(lang, 'score_profit')}</div>
          <div className="text-xs font-bold text-[#9bbc0f] font-mono">
            ${latestProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2 mb-4">
        <div className="text-[10px] font-bold text-[#8bac0f] uppercase tracking-wider mb-1">
          Tabla de Clasificación Diaria
        </div>

        {allCompetitors.map((comp, idx) => {
          const isPlayer = comp.id === 'player';
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

          return (
            <div
              key={comp.id}
              className={`p-2.5 rounded border-2 flex items-center justify-between text-[9px] ${
                isPlayer
                  ? 'bg-[#0f380f] border-[#8bac0f] text-[#9bbc0f]'
                  : 'bg-[#1a1c1a] border-[#8bac0f]/50 text-[#8bac0f]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold w-5 text-center text-[#8bac0f]">{medal}</span>
                <div>
                  <div className="font-bold flex items-center gap-1 text-[#9bbc0f] uppercase">
                    {comp.name}
                    {isPlayer && <span className="text-[8px] bg-[#8bac0f] text-[#0f380f] px-1 rounded font-bold">TÚ</span>}
                  </div>
                  <div className="text-[8px] text-[#8bac0f]">{comp.standName}</div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="font-bold text-[#9bbc0f]">${comp.netProfit.toFixed(2)}</div>
                <div className="text-[8px] text-[#8bac0f]">{comp.cupsSold} 🥤</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Friend Asynchronous Challenge Code Section */}
      <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] rounded p-3 space-y-2 mt-auto text-[10px]">
        <div className="font-bold text-[#9bbc0f] flex items-center gap-1 uppercase">
          <span>⚔️</span>
          <span>{t(lang, 'friend_code_title')}</span>
        </div>
        <div className="text-[9px] text-[#8bac0f] leading-tight">
          {t(lang, 'friend_code_desc')}
        </div>

        {/* Share My Code */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleCopyCode}
            className="flex-1 py-2 px-2 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] border border-[#8bac0f] rounded text-[9px] font-bold text-[#9bbc0f] flex items-center justify-center gap-1 uppercase cursor-pointer"
          >
            <span>📋</span>
            <span>{copied ? t(lang, 'copied') : t(lang, 'share_my_code')}</span>
          </button>
        </div>

        {/* Enter Code */}
        <div className="flex gap-1.5 pt-1">
          <input
            type="text"
            placeholder={t(lang, 'enter_code')}
            value={friendCodeInput}
            onChange={(e) => setFriendCodeInput(e.target.value)}
            className="flex-1 bg-[#0f0f0f] border border-[#8bac0f] rounded px-2 py-1 text-[9px] font-mono text-[#9bbc0f] placeholder:text-[#8bac0f]/40 focus:outline-none focus:border-[#9bbc0f]"
          />
          <button
            onClick={handleLoadChallenge}
            disabled={!friendCodeInput.trim()}
            className="px-3 py-1 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold rounded text-[9px] border-b-2 border-[#306230] disabled:opacity-50 uppercase cursor-pointer"
          >
            {t(lang, 'load_challenge')}
          </button>
        </div>
      </div>
    </div>
  );
};
