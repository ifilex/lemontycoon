import React, { useState } from 'react';
import { GameState, SuppliesInventory, RecipeConfig, BusinessRubroId } from '../types';
import {
  LOCATIONS,
  UPGRADES,
  STAFF_LIST,
  MARKETING_OPTIONS,
  BUSINESS_RUBROS
} from '../game/constants';
import { sound } from '../audio/chiptune';
import { t, Language } from '../utils/i18n';
import { MinecraftWorld3D } from './MinecraftWorld3D';

interface PrepDashboardProps {
  gameState: GameState;
  onUpdateInventory: (newInv: SuppliesInventory, cost: number) => void;
  onUpdateRecipe: (newRecipe: RecipeConfig) => void;
  onPurchaseUpgrade: (upgradeId: string, cost: number) => void;
  onSelectLocation: (locationId: string) => void;
  onUnlockLocation: (locationId: string, cost: number) => void;
  onToggleStaff: (staffId: string) => void;
  onStartMarketing: (campaignId: string, cost: number) => void;
  onSwitchRubro: (rubroId: BusinessRubroId) => void;
  onUnlockRubro: (rubroId: BusinessRubroId, cost: number) => void;
  onToggleRubroManager: (rubroId: BusinessRubroId) => void;
  onOpenStand: () => void;
  onOpenAnalytics: () => void;
  onOpenMultiplayer: () => void;
  onOpenSettings: () => void;
}

export const PrepDashboard: React.FC<PrepDashboardProps> = ({
  gameState,
  onUpdateInventory,
  onUpdateRecipe,
  onPurchaseUpgrade,
  onSelectLocation,
  onUnlockLocation,
  onToggleStaff,
  onStartMarketing,
  onSwitchRubro,
  onUnlockRubro,
  onToggleRubroManager,
  onOpenStand,
  onOpenAnalytics,
  onOpenMultiplayer,
  onOpenSettings,
}) => {
  const lang: Language = 'es';
  const [activeTab, setActiveTab] = useState<'supplies' | 'recipe' | 'rubros' | 'upgrades' | 'location' | 'staff' | 'marketing' | 'stand3d'>('supplies');

  const {
    player,
    inventory,
    recipe,
    upgrades,
    staff,
    unlockedLocations,
    activeMarketing,
    weatherToday,
    weatherTomorrow,
    activeRubroId = 'lemonade',
    unlockedRubros = ['lemonade'],
    rubroManagers = {},
    rubroRecipes = {},
    rubroInventories = {},
  } = gameState;

  const currentLocation = LOCATIONS.find((l) => l.id === gameState.currentLocationId) || LOCATIONS[0];
  const currentRubro = BUSINESS_RUBROS.find((r) => r.id === activeRubroId) || BUSINESS_RUBROS[0];
  const activeRecipe = rubroRecipes[activeRubroId] || recipe;
  const activeCatalog = currentRubro.supplies || [];

  // Recipe cost calculation for active rubro
  let costPerServing = 0;
  let currentPrice = activeRecipe.pricePerServing || activeRecipe.pricePerCup || 1.0;

  if (activeRubroId === 'lemonade') {
    const cupsPerPitcher = staff.squeezer ? 12 : 10;
    const costPerPitcher = ((activeRecipe.lemonsPerPitcher || 4) * 0.25) + ((activeRecipe.sugarPerPitcher || 4) * 0.15);
    costPerServing = (costPerPitcher / cupsPerPitcher) + ((activeRecipe.icePerCup || 3) * 0.04) + 0.05;
  } else if (activeRubroId === 'coffee') {
    costPerServing = ((activeRecipe.beansPerServing || 3) * 0.30) + ((activeRecipe.milkPerServing || 2) * 0.25) + ((activeRecipe.syrupPerServing || 1) * 0.20) + 0.08;
  } else if (activeRubroId === 'icecream') {
    costPerServing = ((activeRecipe.creamPerServing || 2) * 0.35) + ((activeRecipe.toppingsPerServing || 1) * 0.20) + ((activeRecipe.berriesPerServing || 1) * 0.28) + 0.15;
  } else if (activeRubroId === 'smoothies') {
    costPerServing = ((activeRecipe.fruitsPerServing || 2) * 0.40) + ((activeRecipe.mintPerServing || 1) * 0.20) + ((activeRecipe.sodaPerServing || 2) * 0.25) + 0.12;
  } else if (activeRubroId === 'pizza') {
    costPerServing = ((activeRecipe.doughPerServing || 2) * 0.45) + ((activeRecipe.saucePerServing || 2) * 0.30) + ((activeRecipe.cheesePerServing || 2) * 0.40) + 0.15;
  }

  const profitMargin = Math.max(0, currentPrice - costPerServing);

  // Active passive royalties calculation
  const totalDailyPassiveRoyalties = unlockedRubros.reduce((acc, rubId) => {
    if (rubId !== activeRubroId && rubroManagers[rubId]) {
      const rubDef = BUSINESS_RUBROS.find((r) => r.id === rubId);
      if (rubDef) {
        const est = Math.round((25 + player.level * 8) * rubDef.managerEfficiency - rubDef.managerDailyWage);
        return acc + Math.max(5, est);
      }
    }
    return acc;
  }, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] text-[#9bbc0f] font-mono overflow-hidden select-none">
      {/* Top Header Status Bar */}
      <div className="bg-[#1a1c1a] border-b-2 border-[#8bac0f] p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
        {/* Left: Day & Active Business Rubro */}
        <div className="flex items-center gap-2">
          <span className="bg-[#8bac0f] text-[#0f380f] font-bold px-2 py-0.5 rounded text-[10px] uppercase">
            {t(lang, 'day')} {gameState.day}
          </span>
          <div className="flex items-center gap-1 bg-[#0f380f] border border-[#8bac0f] px-2 py-0.5 rounded text-[10px]">
            <span>{currentRubro.icon}</span>
            <span className="font-bold text-[#9bbc0f]">{currentRubro.name}</span>
          </div>
          <span className="text-[#8bac0f] text-[10px] hidden sm:inline">{currentLocation.icon} {t(lang, currentLocation.nameKey)}</span>
        </div>

        {/* Center: Funds, Passive Royalties, Level */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#9bbc0f] font-bold">
            <span>💵</span>
            <span>${player.cash.toFixed(2)}</span>
          </div>
          {totalDailyPassiveRoyalties > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[#8bac0f] text-[10px] bg-[#0f380f] border border-[#8bac0f]/60 px-1.5 py-0.5 rounded" title="Ingresos pasivos estimados por día">
              <span>🏢</span>
              <span>+${totalDailyPassiveRoyalties}/día</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[#8bac0f] text-[10px]" title="Reputation">
            <span>⭐</span>
            <span>{player.reputation}%</span>
          </div>
          <div className="flex items-center gap-1 text-[#8bac0f] text-[10px]">
            <span>LV.{player.level}</span>
          </div>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-1.5">
          <button
            id="open-multiplayer-btn"
            onClick={() => {
              sound.playButtonTone();
              onOpenMultiplayer();
            }}
            className="p-1.5 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] rounded border border-[#8bac0f] text-xs text-[#9bbc0f]"
            title={t(lang, 'tab_multiplayer')}
          >
            🏆
          </button>
          <button
            id="open-analytics-btn"
            onClick={() => {
              sound.playButtonTone();
              onOpenAnalytics();
            }}
            className="p-1.5 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] rounded border border-[#8bac0f] text-xs text-[#9bbc0f]"
            title={t(lang, 'tab_analytics')}
          >
            📊
          </button>
          <button
            id="open-settings-btn"
            onClick={() => {
              sound.playButtonTone();
              onOpenSettings();
            }}
            className="p-1.5 bg-[#0f380f] hover:bg-[#1a4a1a] active:bg-[#000000] rounded border border-[#8bac0f] text-xs text-[#9bbc0f]"
            title={t(lang, 'tab_settings')}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Weather Forecast Banner */}
      <div className="bg-[#1a1c1a]/80 border-b border-[#8bac0f]/50 px-3 py-1.5 flex items-center justify-between text-[10px] text-[#8bac0f]">
        <div className="flex items-center gap-2">
          <span className="text-[#8bac0f]/80 uppercase">{t(lang, 'today_weather')}:</span>
          <span className="flex items-center gap-1 text-[#9bbc0f] font-bold">
            {weatherToday.icon} {weatherToday.tempC}°C / {weatherToday.tempF}°F ({t(lang, weatherToday.descriptionKey)})
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[#8bac0f]">
          <span className="opacity-80">{t(lang, 'tomorrow_weather')}:</span>
          <span className="text-[#9bbc0f]">{weatherTomorrow.icon} {weatherTomorrow.tempC}°C</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#0f0f0f] border-b-2 border-[#8bac0f] flex overflow-x-auto no-scrollbar text-[10px]">
        {[
          { id: 'supplies', label: t(lang, 'tab_supplies'), icon: currentRubro.icon },
          { id: 'recipe', label: t(lang, 'tab_recipe'), icon: '🧪' },
          { id: 'stand3d', label: '3D Minecraft', icon: '🧊' },
          { id: 'rubros', label: t(lang, 'tab_rubros'), icon: '🏢' },
          { id: 'upgrades', label: t(lang, 'tab_upgrades'), icon: '⚙️' },
          { id: 'location', label: t(lang, 'tab_location'), icon: '📍' },
          { id: 'staff', label: t(lang, 'tab_staff'), icon: '👥' },
          { id: 'marketing', label: t(lang, 'tab_marketing'), icon: '📢' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`prep-tab-${tab.id}`}
            onClick={() => {
              sound.playButtonTone();
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`flex-1 min-w-[70px] py-2 px-1 text-center whitespace-nowrap border-r border-[#8bac0f]/40 transition-colors flex items-center justify-center gap-1 uppercase font-bold ${
              activeTab === tab.id
                ? 'bg-[#8bac0f] text-[#0f380f] shadow-inner'
                : 'text-[#8bac0f] hover:bg-[#1a1c1a] hover:text-[#9bbc0f]'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-[#0f0f0f] space-y-4">
        {/* TAB 1: SUPPLIES CATALOG (Dynamic for current rubro) */}
        {activeTab === 'supplies' && (
          <div className="space-y-4">
            {/* Rubro banner */}
            <div className="bg-[#1a1c1a] border border-[#8bac0f]/80 p-2.5 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentRubro.icon}</span>
                <div>
                  <div className="text-xs font-bold text-[#9bbc0f] uppercase">{currentRubro.name}</div>
                  <div className="text-[9px] text-[#8bac0f]">{currentRubro.tagline}</div>
                </div>
              </div>
              <button
                id="switch-rubro-quick-btn"
                onClick={() => {
                  sound.playButtonTone();
                  setActiveTab('rubros');
                }}
                className="px-2.5 py-1 bg-[#0f380f] hover:bg-[#1a4a1a] text-[#9bbc0f] text-[9px] font-bold rounded border border-[#8bac0f] uppercase"
              >
                Cambiar Rubro
              </button>
            </div>

            {/* Inventory Overview Widget */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded grid grid-cols-4 gap-2 text-center text-xs text-[#9bbc0f]">
              {activeCatalog.map((item) => (
                <div key={item.id} className="p-1">
                  <div className="text-[9px] text-[#8bac0f] mb-0.5 uppercase truncate">{item.icon} {t(lang, item.nameKey)}</div>
                  <div className="font-bold text-sm text-[#9bbc0f]">{inventory[item.id] || 0}</div>
                </div>
              ))}
            </div>

            {/* Catalog Items */}
            <div className="space-y-3">
              {activeCatalog.map((item) => (
                <div key={item.id} className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bbc0f] uppercase">
                      <span>{item.icon}</span>
                      <span>{t(lang, item.nameKey)}</span>
                    </div>
                    <span className="text-[9px] text-[#8bac0f]">
                      {inventory[item.id] || 0} {t(lang, item.unitKey)} {t(lang, 'current_stock')}
                    </span>
                  </div>

                  {/* Buy Tier Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {item.tiers.map((tier, idx) => {
                      const canAfford = player.cash >= tier.price;
                      return (
                        <button
                          key={idx}
                          id={`buy-${item.id}-${tier.amount}-btn`}
                          disabled={!canAfford}
                          onClick={() => {
                            if (canAfford) {
                              sound.playCoin();
                              onUpdateInventory(
                                {
                                  ...inventory,
                                  [item.id]: (inventory[item.id] || 0) + tier.amount,
                                },
                                tier.price
                              );
                            }
                          }}
                          className={`p-2 rounded border text-left flex flex-col justify-between transition-transform active:scale-95 ${
                            canAfford
                              ? 'bg-[#0f380f] border-[#8bac0f] hover:bg-[#1a4a1a] text-[#9bbc0f] border-b-4 border-b-black'
                              : 'bg-[#121212] border-zinc-800 text-[#8bac0f]/40 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] mb-1">
                            <span className="font-bold">+{tier.amount}</span>
                            {tier.discountPercent && (
                              <span className="text-[7px] bg-[#0f380f] text-[#9bbc0f] border border-[#8bac0f] px-0.5 rounded">
                                -{tier.discountPercent}%
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-[#9bbc0f]">
                            ${tier.price.toFixed(2)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {activeRubroId === 'lemonade' && (
              <div className="text-[9px] text-[#8bac0f] italic text-center">
                ⚠️ {t(lang, 'spoilage_warning')}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECIPE MIXER (Dynamic for active rubro) */}
        {activeTab === 'recipe' && (
          <div className="space-y-4">
            {/* Live Margin Card */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-2">
              <div className="text-xs font-bold text-[#9bbc0f] flex items-center justify-between uppercase">
                <span className="flex items-center gap-1.5">
                  <span>{currentRubro.icon}</span>
                  <span>RECETA: {currentRubro.name}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f380f] text-[#9bbc0f] border border-[#8bac0f]">
                  Costo: ${costPerServing.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-[#8bac0f]/40">
                <div>
                  <span className="text-[#8bac0f]">Precio de Venta:</span>
                  <span className="ml-1 text-[#9bbc0f] font-mono font-bold">${currentPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[#8bac0f]">Margen Estimado:</span>
                  <span className="ml-1 font-mono font-bold text-[#9bbc0f]">
                    +${profitMargin.toFixed(2)} / unidad
                  </span>
                </div>
              </div>
            </div>

            {/* Steppers based on active rubro */}
            <div className="space-y-3">
              {/* LEMONADE RECIPE CONTROLS */}
              {activeRubroId === 'lemonade' && (
                <>
                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🍋</span>
                        <span>{t(lang, 'lemons_per_pitcher')}</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">1 - 8 limones</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, lemonsPerPitcher: Math.max(1, (activeRecipe.lemonsPerPitcher || 4) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.lemonsPerPitcher || 4}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, lemonsPerPitcher: Math.min(8, (activeRecipe.lemonsPerPitcher || 4) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🍬</span>
                        <span>{t(lang, 'sugar_per_pitcher')}</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">1 - 8 tazas</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, sugarPerPitcher: Math.max(1, (activeRecipe.sugarPerPitcher || 4) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.sugarPerPitcher || 4}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, sugarPerPitcher: Math.min(8, (activeRecipe.sugarPerPitcher || 4) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🧊</span>
                        <span>{t(lang, 'ice_per_cup')}</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">0 - 6 cubos / vaso</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, icePerCup: Math.max(0, (activeRecipe.icePerCup || 3) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.icePerCup || 3}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, icePerCup: Math.min(6, (activeRecipe.icePerCup || 3) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* COFFEE RECIPE CONTROLS */}
              {activeRubroId === 'coffee' && (
                <>
                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>☕</span>
                        <span>Dosis de Café / Taza</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">1 - 6 dosis espresso</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, beansPerServing: Math.max(1, (activeRecipe.beansPerServing || 3) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.beansPerServing || 3}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, beansPerServing: Math.min(6, (activeRecipe.beansPerServing || 3) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🥛</span>
                        <span>Medidas de Leche Vaporizada</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">0 - 5 medidas</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, milkPerServing: Math.max(0, (activeRecipe.milkPerServing || 2) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.milkPerServing || 2}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, milkPerServing: Math.min(5, (activeRecipe.milkPerServing || 2) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ICE CREAM RECIPE CONTROLS */}
              {activeRubroId === 'icecream' && (
                <>
                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🍦</span>
                        <span>Bolas de Crema Gelato</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">1 - 4 bolas</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, creamPerServing: Math.max(1, (activeRecipe.creamPerServing || 2) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.creamPerServing || 2}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, creamPerServing: Math.min(4, (activeRecipe.creamPerServing || 2) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🍫</span>
                        <span>Toppings de Chocolate / Crunch</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">0 - 3 porciones</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, toppingsPerServing: Math.max(0, (activeRecipe.toppingsPerServing || 1) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.toppingsPerServing || 1}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, toppingsPerServing: Math.min(3, (activeRecipe.toppingsPerServing || 1) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SMOOTHIES CONTROLS */}
              {activeRubroId === 'smoothies' && (
                <>
                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🍹</span>
                        <span>Pulpa Frutal Tropical</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">1 - 5 medidas</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, fruitsPerServing: Math.max(1, (activeRecipe.fruitsPerServing || 2) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.fruitsPerServing || 2}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, fruitsPerServing: Math.min(5, (activeRecipe.fruitsPerServing || 2) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* PIZZA CONTROLS */}
              {activeRubroId === 'pizza' && (
                <>
                  <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                        <span>🍕</span>
                        <span>Masa Madre & Salsa San Marzano</span>
                      </div>
                      <div className="text-[9px] text-[#8bac0f]">1 - 4 dosis</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, doughPerServing: Math.max(1, (activeRecipe.doughPerServing || 2) - 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm text-[#9bbc0f]">{activeRecipe.doughPerServing || 2}</span>
                      <button
                        onClick={() => {
                          sound.playButtonTone();
                          onUpdateRecipe({ ...activeRecipe, doughPerServing: Math.min(4, (activeRecipe.doughPerServing || 2) + 1) });
                        }}
                        className="w-8 h-8 bg-[#0f380f] rounded border border-[#8bac0f] font-bold text-[#9bbc0f]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Common Price Setter for the active Rubro */}
              <div className="bg-[#1a1c1a] border border-[#8bac0f] p-2.5 rounded flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9bbc0f] flex items-center gap-1 font-bold">
                    <span>💵</span>
                    <span>Precio de Venta al Público</span>
                  </div>
                  <div className="text-[9px] text-[#8bac0f]">$0.50 a $15.00</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playButtonTone();
                      const step = activeRubroId === 'pizza' ? 0.50 : 0.25;
                      const nextP = Math.max(0.50, Math.round((currentPrice - step) * 100) / 100);
                      onUpdateRecipe({ ...activeRecipe, pricePerServing: nextP, pricePerCup: nextP });
                    }}
                    className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-bold text-sm text-[#9bbc0f] font-mono">
                    ${currentPrice.toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      sound.playButtonTone();
                      const step = activeRubroId === 'pizza' ? 0.50 : 0.25;
                      const nextP = Math.min(15.0, Math.round((currentPrice + step) * 100) / 100);
                      onUpdateRecipe({ ...activeRecipe, pricePerServing: nextP, pricePerCup: nextP });
                    }}
                    className="w-8 h-8 bg-[#0f380f] active:bg-[#000000] hover:bg-[#1a4a1a] rounded border border-[#8bac0f] text-xs flex items-center justify-center font-bold text-[#9bbc0f]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUSINESS EXPANSION & MULTI-RUBRO FRANCHISE EMPIRE */}
        {activeTab === 'rubros' && (
          <div className="space-y-4">
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded">
              <div className="text-xs font-bold text-[#9bbc0f] uppercase flex items-center gap-2">
                <span>🏢</span>
                <span>{t(lang, 'rubro_expand_title')}</span>
              </div>
              <div className="text-[9px] text-[#8bac0f] mt-1">
                {t(lang, 'rubro_expand_desc')}
              </div>
            </div>

            {/* List of all Business Rubros */}
            <div className="space-y-3">
              {BUSINESS_RUBROS.map((rub) => {
                const isUnlocked = unlockedRubros.includes(rub.id);
                const isOperating = activeRubroId === rub.id;
                const hasManager = Boolean(rubroManagers[rub.id]);
                const canUnlock = player.cash >= rub.unlockCost && player.level >= rub.unlockLevel;

                return (
                  <div
                    key={rub.id}
                    className={`border-2 p-3 rounded transition-all ${
                      isOperating
                        ? 'bg-[#0f380f] border-[#8bac0f]'
                        : isUnlocked
                        ? 'bg-[#1a1c1a] border-[#8bac0f]/80'
                        : 'bg-[#121212] border-zinc-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bbc0f] uppercase">
                        <span className="text-lg">{rub.icon}</span>
                        <div>
                          <div>{rub.name}</div>
                          <div className="text-[8px] text-[#8bac0f] font-normal lowercase">{rub.tagline}</div>
                        </div>
                      </div>
                      {isOperating ? (
                        <span className="text-[8px] bg-[#8bac0f] text-[#0f380f] font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap">
                          {t(lang, 'operating')}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          id={`operate-rubro-${rub.id}-btn`}
                          onClick={() => {
                            sound.playFanfare();
                            onSwitchRubro(rub.id);
                          }}
                          className="px-2.5 py-1 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold rounded text-[8px] border-b-2 border-[#306230] uppercase whitespace-nowrap"
                        >
                          {t(lang, 'operate_rubro')}
                        </button>
                      ) : (
                        <button
                          id={`unlock-rubro-${rub.id}-btn`}
                          disabled={!canUnlock}
                          onClick={() => {
                            if (canUnlock) {
                              sound.playFanfare();
                              onUnlockRubro(rub.id, rub.unlockCost);
                            }
                          }}
                          className={`px-3 py-1 rounded text-[8px] font-bold border uppercase whitespace-nowrap ${
                            canUnlock
                              ? 'bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] border-b-2 border-[#306230]'
                              : 'bg-[#121212] text-[#8bac0f]/40 border-zinc-800 cursor-not-allowed'
                          }`}
                        >
                          {player.level < rub.unlockLevel
                            ? `Req. Nivel ${rub.unlockLevel}`
                            : `Desbloquear ($${rub.unlockCost})`}
                        </button>
                      )}
                    </div>

                    {/* Manager Automation Section for Unlocked Rubros */}
                    {isUnlocked && (
                      <div className="mt-2.5 pt-2 border-t border-[#8bac0f]/40 flex items-center justify-between text-[9px]">
                        <div className="flex items-center gap-1.5">
                          <span>👔</span>
                          <div>
                            <span className="font-bold text-[#9bbc0f]">Gerente de Franquicia</span>
                            <span className="text-[#8bac0f] block text-[8px]">
                              Sueldo: ${rub.managerDailyWage}/día • Genera ingresos pasivos
                            </span>
                          </div>
                        </div>

                        <button
                          id={`toggle-manager-${rub.id}-btn`}
                          onClick={() => {
                            sound.playButtonTone();
                            onToggleRubroManager(rub.id);
                          }}
                          className={`px-2.5 py-1 rounded font-bold uppercase text-[8px] border ${
                            hasManager
                              ? 'bg-[#0f380f] text-[#9bbc0f] border-[#8bac0f]'
                              : 'bg-[#8bac0f] text-[#0f380f] hover:bg-[#9bbc0f] border-b-2 border-[#306230]'
                          }`}
                        >
                          {hasManager ? 'Gerente Activo' : 'Contratar'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: UPGRADES TECH TREE */}
        {activeTab === 'upgrades' && (
          <div className="space-y-3">
            {UPGRADES.map((upg) => {
              const currentTier = upgrades[upg.id] || 0;
              const isMax = currentTier >= upg.maxTier;
              const nextCost = Math.round(upg.cost * Math.pow(1.5, currentTier));
              const canAfford = player.cash >= nextCost && !isMax;

              return (
                <div key={upg.id} className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bbc0f] uppercase">
                      <span>{upg.icon}</span>
                      <span>{t(lang, upg.nameKey)}</span>
                      <span className="text-[8px] bg-[#0f380f] px-1 rounded text-[#9bbc0f] border border-[#8bac0f]">
                        {currentTier}/{upg.maxTier}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#8bac0f] leading-tight mt-1">
                      {t(lang, upg.descKey)}
                    </div>
                  </div>

                  <button
                    id={`upgrade-${upg.id}-btn`}
                    disabled={!canAfford || isMax}
                    onClick={() => {
                      if (canAfford) {
                        sound.playFanfare();
                        onPurchaseUpgrade(upg.id, nextCost);
                      }
                    }}
                    className={`px-3 py-2 rounded text-[9px] font-bold border whitespace-nowrap uppercase ${
                      isMax
                        ? 'bg-[#0f380f] text-[#8bac0f] border-[#8bac0f] cursor-default opacity-80'
                        : canAfford
                        ? 'bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] border-b-4 border-b-[#306230] active:scale-95'
                        : 'bg-[#121212] text-[#8bac0f]/40 border-zinc-800 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isMax ? t(lang, 'max_level') : `$${nextCost}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: LOCATIONS */}
        {activeTab === 'location' && (
          <div className="space-y-3">
            {LOCATIONS.map((loc) => {
              const isUnlocked = unlockedLocations.includes(loc.id);
              const isCurrent = gameState.currentLocationId === loc.id;
              const canUnlock = player.cash >= loc.unlockCost && player.level >= loc.requiredLevel;

              return (
                <div
                  key={loc.id}
                  className={`border-2 p-3 rounded transition-all ${
                    isCurrent
                      ? 'bg-[#0f380f] border-[#8bac0f]'
                      : 'bg-[#1a1c1a] border-[#8bac0f]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bbc0f] uppercase">
                      <span>{loc.icon}</span>
                      <span>{t(lang, loc.nameKey)}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[8px] bg-[#8bac0f] text-[#0f380f] font-bold px-1.5 py-0.5 rounded uppercase">
                        {t(lang, 'current_location')}
                      </span>
                    )}
                  </div>

                  <div className="text-[9px] text-[#8bac0f] mb-2 leading-tight">
                    {t(lang, loc.descKey)}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#8bac0f]/40 text-[9px]">
                    <div className="text-[#8bac0f]">
                      <span>{t(lang, 'rent_daily')}: </span>
                      <span className="text-[#9bbc0f] font-bold">${loc.rentDaily}</span>
                    </div>

                    {isUnlocked ? (
                      !isCurrent && (
                        <button
                          id={`select-loc-${loc.id}-btn`}
                          onClick={() => {
                            sound.playButtonTone();
                            onSelectLocation(loc.id);
                          }}
                          className="px-3 py-1 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold rounded text-[8px] border-b-2 border-[#306230] uppercase"
                        >
                          {t(lang, 'select_location')}
                        </button>
                      )
                    ) : (
                      <button
                        id={`unlock-loc-${loc.id}-btn`}
                        disabled={!canUnlock}
                        onClick={() => {
                          if (canUnlock) {
                            sound.playFanfare();
                            onUnlockLocation(loc.id, loc.unlockCost);
                          }
                        }}
                        className={`px-3 py-1 rounded text-[8px] font-bold border uppercase ${
                          canUnlock
                            ? 'bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] border-b-2 border-[#306230]'
                            : 'bg-[#121212] text-[#8bac0f]/40 border-zinc-800 cursor-not-allowed'
                        }`}
                      >
                        {player.level < loc.requiredLevel
                          ? `Req. Nivel ${loc.requiredLevel}`
                          : `Desbloquear ($${loc.unlockCost})`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 6: STAFF */}
        {activeTab === 'staff' && (
          <div className="space-y-3">
            {STAFF_LIST.map((st) => {
              const isHired = Boolean(staff[st.id]);

              return (
                <div key={st.id} className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bbc0f] uppercase">
                      <span>{st.icon}</span>
                      <span>{t(lang, st.nameKey)}</span>
                    </div>
                    <div className="text-[9px] text-[#8bac0f] leading-tight mt-1">
                      {t(lang, st.roleKey)}
                    </div>
                    <div className="text-[9px] text-[#9bbc0f] mt-1 font-bold">
                      {t(lang, 'daily_wage')}: ${st.dailyWage}/día
                    </div>
                  </div>

                  <button
                    id={`toggle-staff-${st.id}-btn`}
                    onClick={() => {
                      sound.playButtonTone();
                      onToggleStaff(st.id);
                    }}
                    className={`px-3 py-1.5 rounded text-[9px] font-bold border uppercase ${
                      isHired
                        ? 'bg-[#0f380f] text-[#9bbc0f] border-[#8bac0f] border-b-2 border-b-black'
                        : 'bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] border-b-2 border-b-[#306230]'
                    }`}
                  >
                    {isHired ? t(lang, 'fire') : t(lang, 'hire')}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 7: MARKETING */}
        {activeTab === 'marketing' && (
          <div className="space-y-3">
            {MARKETING_OPTIONS.map((mkt) => {
              const active = activeMarketing.find((m) => m.id === mkt.id);
              const canAfford = player.cash >= mkt.cost;

              return (
                <div key={mkt.id} className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bbc0f] uppercase">
                      <span>{mkt.icon}</span>
                      <span>{t(lang, mkt.nameKey)}</span>
                      {active && (
                        <span className="text-[7px] bg-[#0f380f] text-[#9bbc0f] border border-[#8bac0f] px-1 rounded">
                          {active.daysRemaining} {t(lang, 'days_left')}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-[#8bac0f] leading-tight mt-1">
                      {t(lang, mkt.descKey)}
                    </div>
                  </div>

                  <button
                    id={`start-mkt-${mkt.id}-btn`}
                    disabled={!canAfford || Boolean(active)}
                    onClick={() => {
                      if (canAfford && !active) {
                        sound.playFanfare();
                        onStartMarketing(mkt.id, mkt.cost);
                      }
                    }}
                    className={`px-3 py-1.5 rounded text-[9px] font-bold border uppercase ${
                      active
                        ? 'bg-[#0f380f] text-[#8bac0f] border-[#8bac0f] cursor-default'
                        : canAfford
                        ? 'bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] border-b-2 border-b-[#306230]'
                        : 'bg-[#121212] text-[#8bac0f]/40 border-zinc-800 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {active ? t(lang, 'active_campaign') : `$${mkt.cost}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 8: 3D MINECRAFT PREVIEW */}
        {activeTab === 'stand3d' && (
          <div className="space-y-3">
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧊</span>
                <div>
                  <div className="text-xs font-bold text-[#9bbc0f] uppercase">
                    Simulación & Entorno 3D Minecraft
                  </div>
                  <div className="text-[9px] text-[#8bac0f]">
                    Visualiza tu sucursal, mejoras y entorno voxel en tiempo real antes de abrir
                  </div>
                </div>
              </div>
              <div className="text-right text-[9px] text-[#8bac0f]">
                <div>Nivel Stand: <span className="text-[#9bbc0f] font-bold">LV.{upgrades.stand || 1}</span></div>
                <div>Locación: <span className="text-[#9bbc0f] font-bold">{currentLocation.icon} {t(lang, currentLocation.nameKey)}</span></div>
              </div>
            </div>

            {/* 3D Viewport Box */}
            <div className="w-full h-80 sm:h-96 rounded border-2 border-[#8bac0f] overflow-hidden relative shadow-2xl bg-[#0f0f0f]">
              <MinecraftWorld3D
                gameState={gameState}
                interactive={true}
              />
            </div>

            {/* Feature Information Tiles */}
            <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
              <div className="bg-[#1a1c1a] border border-[#8bac0f]/60 p-2 rounded">
                <div className="font-bold text-[#9bbc0f] mb-0.5">🎮 Controles Voxel</div>
                <div className="text-[#8bac0f]">Gira 360°, haz zoom y cambia a vista barista o isométrica</div>
              </div>
              <div className="bg-[#1a1c1a] border border-[#8bac0f]/60 p-2 rounded">
                <div className="font-bold text-[#9bbc0f] mb-0.5">🧑 Clientes Minecraft</div>
                <div className="text-[#8bac0f]">Steves, Alexes y Aldeanos animados consumiendo tus productos</div>
              </div>
              <div className="bg-[#1a1c1a] border border-[#8bac0f]/60 p-2 rounded">
                <div className="font-bold text-[#9bbc0f] mb-0.5">☀️ Clima Dinámico</div>
                <div className="text-[#8bac0f]">Sol cúbico en movimiento, nubes flotantes y lluvia voxel</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main OPEN STAND Launch Bar */}
      <div className="bg-[#1a1c1a] p-3 border-t-2 border-[#8bac0f] shadow-2xl flex items-center justify-between gap-3">
        <div className="text-[10px] text-[#8bac0f] hidden xs:block font-mono">
          <div className="font-bold text-[#9bbc0f]">{currentRubro.icon} {currentRubro.name}</div>
          <div>Margen: +${profitMargin.toFixed(2)} / unidad</div>
        </div>

        <button
          id="open-stand-main-btn"
          onClick={() => {
            sound.playButtonTone();
            onOpenStand();
          }}
          className="flex-1 xs:flex-initial xs:min-w-[200px] py-3 px-6 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-mono font-bold text-xs uppercase rounded border-b-4 border-[#306230] shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base animate-bounce">{currentRubro.icon}</span>
          <span>{t(lang, 'open_stand')}</span>
        </button>
      </div>
    </div>
  );
};
