import React, { useState, useEffect, useRef } from 'react';
import { GameState, CustomerSim, SuppliesInventory, RecipeConfig } from '../types';
import { evaluateCustomerPurchase, calculateNightSummary } from '../game/simulation';
import { LOCATIONS, UPGRADES, BUSINESS_RUBROS } from '../game/constants';
import { sound } from '../audio/chiptune';
import { t } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { MinecraftWorld3D } from './MinecraftWorld3D';

interface DaySimulationProps {
  gameState: GameState;
  onFinishDay: (updatedState: GameState, alerts: string[]) => void;
}

export const DaySimulation: React.FC<DaySimulationProps> = ({ gameState, onFinishDay }) => {
  const lang = 'es';
  const loc = LOCATIONS.find((l) => l.id === gameState.currentLocationId) || LOCATIONS[0];
  const activeRubroId = gameState.activeRubroId || 'lemonade';
  const currentRubro = BUSINESS_RUBROS.find((r) => r.id === activeRubroId) || BUSINESS_RUBROS[0];
  const activeRecipe = gameState.rubroRecipes?.[activeRubroId] || gameState.recipe;
  
  // View mode (3D Minecraft vs 2D Retro)
  const [viewMode, setViewMode] = useState<'3d_minecraft' | '2d_retro'>('3d_minecraft');

  // Simulation speed (1x = ~20s day, 2x = ~10s, 5x = ~4s)
  const [speed, setSpeed] = useState<number>(1);
  const [timeMinutes, setTimeMinutes] = useState<number>(8 * 60); // 08:00 (480) to 19:00 (1140)
  
  // Real-time Day metrics
  const [cupsSold, setCupsSold] = useState<number>(0);
  const [customersServed, setCustomersServed] = useState<number>(0);
  const [lostPrice, setLostPrice] = useState<number>(0);
  const [lostStock, setLostStock] = useState<number>(0);
  const [lostQuality, setLostQuality] = useState<number>(0);
  const [totalSatisfaction, setTotalSatisfaction] = useState<number>(0);
  
  // Live local inventory during day
  const [inventory, setInventory] = useState<SuppliesInventory>({ ...gameState.inventory });
  const [pitcherCups, setPitcherCups] = useState<number>(0);
  
  // Customers on stage
  const [customers, setCustomers] = useState<CustomerSim[]>([]);
  const customerIdCounter = useRef(1);
  const isFinishedRef = useRef(false);

  // Initial sound
  useEffect(() => {
    sound.playDayStart();
  }, []);

  // Pitcher preparation helper (for lemonade)
  const tryBrewPitcher = (currentInv: SuppliesInventory): { success: boolean; newInv: SuppliesInventory; newPitcher: number } => {
    const lemonsNeeded = activeRecipe.lemonsPerPitcher || 4;
    const sugarNeeded = activeRecipe.sugarPerPitcher || 4;
    const cupsYield = gameState.staff.squeezer ? 12 : 10;

    if ((currentInv.lemons || 0) >= lemonsNeeded && (currentInv.sugar || 0) >= sugarNeeded) {
      sound.playSqueeze();
      return {
        success: true,
        newInv: {
          ...currentInv,
          lemons: (currentInv.lemons || 0) - lemonsNeeded,
          sugar: (currentInv.sugar || 0) - sugarNeeded,
        },
        newPitcher: cupsYield,
      };
    }
    return { success: false, newInv: currentInv, newPitcher: 0 };
  };

  // Main Simulation Loop
  useEffect(() => {
    const intervalMs = 250 / speed;
    const timer = setInterval(() => {
      setTimeMinutes((prevTime) => {
        const nextTime = prevTime + 4; // 4 minutes per tick

        if (nextTime >= 19 * 60 && !isFinishedRef.current) {
          isFinishedRef.current = true;
          clearInterval(timer);
          // Complete day
          setTimeout(() => {
            const summary = calculateNightSummary(gameState, {
              cupsSold,
              customersServed,
              lostPrice,
              lostStock,
              lostQuality,
              totalSatisfactionScore: totalSatisfaction || 85,
            });
            onFinishDay(summary.updatedState, summary.alerts);
          }, 300);
          return 19 * 60;
        }

        // Spawn Customer Logic based on location traffic, weather, mascot, marketing
        const weatherMultiplier =
          gameState.weatherToday.type === 'heatwave'
            ? 1.6
            : gameState.weatherToday.type === 'sunny'
            ? 1.2
            : gameState.weatherToday.type === 'rain'
            ? 0.55
            : gameState.weatherToday.type === 'thunderstorm'
            ? 0.35
            : 0.9;

        const marketingBoost = gameState.activeMarketing.reduce((acc, m) => acc * m.boostMultiplier, 1);
        const mascotBoost = gameState.staff.mascot ? 1.25 : 1.0;
        const baseSpawnChance = 0.30 * loc.trafficMultiplier * weatherMultiplier * marketingBoost * mascotBoost;

        if (Math.random() < baseSpawnChance && customers.length < 5) {
          const newCust: CustomerSim = {
            id: customerIdCounter.current++,
            x: Math.random() < 0.5 ? -10 : 105,
            y: 0,
            targetX: 50 + (Math.random() * 16 - 8),
            speed: 1.2 + Math.random() * 0.8,
            spriteIndex: Math.floor(Math.random() * 5),
            state: 'walking_in',
            tastePreference: {
              sweetnessBias: Math.random(),
              sournessBias: Math.random(),
              iceNeed: gameState.weatherToday.tempC > 28 ? 4 : 2,
              budgetLimit: 5.0,
            },
            patience: 100,
          };
          setCustomers((prev) => [...prev, newCust]);
        }

        // Update Customers on Stage
        setCustomers((prevCustomers) => {
          return prevCustomers
            .map((cust) => {
              if (cust.state === 'walking_in') {
                const atStand = Math.abs(cust.x - cust.targetX) < 3;
                if (atStand) {
                  // Customer is at the stand! Perform sale evaluation
                  const evaluation = evaluateCustomerPurchase(
                    activeRecipe,
                    inventory,
                    pitcherCups,
                    gameState.weatherToday,
                    gameState.currentLocationId,
                    gameState.upgrades,
                    Boolean(gameState.upgrades.jukebox),
                    activeRubroId
                  );

                  if (evaluation.buys) {
                    let currentInv = inventory;
                    let canServeItem = false;

                    if (activeRubroId === 'lemonade') {
                      let currentPitcher = pitcherCups;
                      if (currentPitcher <= 0) {
                        const brew = tryBrewPitcher(currentInv);
                        if (brew.success) {
                          currentPitcher = brew.newPitcher;
                          currentInv = brew.newInv;
                        }
                      }

                      if (currentPitcher > 0 && (currentInv.cups || 0) > 0 && (currentInv.ice || 0) >= (activeRecipe.icePerCup || 0)) {
                        canServeItem = true;
                        currentPitcher -= 1;
                        currentInv = {
                          ...currentInv,
                          cups: (currentInv.cups || 0) - 1,
                          ice: (currentInv.ice || 0) - (activeRecipe.icePerCup || 0),
                        };
                        setPitcherCups(currentPitcher);
                      }
                    } else if (activeRubroId === 'coffee') {
                      const beansReq = activeRecipe.beansPerServing || 3;
                      const milkReq = activeRecipe.milkPerServing || 2;
                      if ((currentInv.coffee_cups || 0) > 0 && (currentInv.coffee_beans || 0) >= beansReq && (currentInv.milk || 0) >= milkReq) {
                        canServeItem = true;
                        currentInv = {
                          ...currentInv,
                          coffee_cups: (currentInv.coffee_cups || 0) - 1,
                          coffee_beans: (currentInv.coffee_beans || 0) - beansReq,
                          milk: (currentInv.milk || 0) - milkReq,
                        };
                      }
                    } else if (activeRubroId === 'icecream') {
                      const creamReq = activeRecipe.creamPerServing || 2;
                      if ((currentInv.waffle_cones || 0) > 0 && (currentInv.cream_base || 0) >= creamReq) {
                        canServeItem = true;
                        currentInv = {
                          ...currentInv,
                          waffle_cones: (currentInv.waffle_cones || 0) - 1,
                          cream_base: (currentInv.cream_base || 0) - creamReq,
                        };
                      }
                    } else if (activeRubroId === 'smoothies') {
                      const fruitReq = activeRecipe.fruitsPerServing || 2;
                      if ((currentInv.crystal_glasses || 0) > 0 && (currentInv.tropical_fruits || 0) >= fruitReq) {
                        canServeItem = true;
                        currentInv = {
                          ...currentInv,
                          crystal_glasses: (currentInv.crystal_glasses || 0) - 1,
                          tropical_fruits: (currentInv.tropical_fruits || 0) - fruitReq,
                        };
                      }
                    } else if (activeRubroId === 'pizza') {
                      const doughReq = activeRecipe.doughPerServing || 2;
                      const cheeseReq = activeRecipe.cheesePerServing || 2;
                      if ((currentInv.pizza_boxes || 0) > 0 && (currentInv.pizza_dough || 0) >= doughReq && (currentInv.mozzarella || 0) >= cheeseReq) {
                        canServeItem = true;
                        currentInv = {
                          ...currentInv,
                          pizza_boxes: (currentInv.pizza_boxes || 0) - 1,
                          pizza_dough: (currentInv.pizza_dough || 0) - doughReq,
                          mozzarella: (currentInv.mozzarella || 0) - cheeseReq,
                        };
                      }
                    }

                    if (canServeItem) {
                      sound.playCoin();
                      setInventory(currentInv);
                      setCupsSold((c) => c + 1);
                      setCustomersServed((cs) => cs + 1);
                      setTotalSatisfaction((ts) => ts + evaluation.satisfactionDelta);

                      return {
                        ...cust,
                        state: 'drinking',
                        thought: {
                          type: evaluation.thoughtType,
                          textKey: evaluation.thoughtKey,
                          icon: evaluation.thoughtIcon,
                        },
                        thoughtTimer: 12,
                      };
                    } else {
                      // Out of stock right as serving
                      sound.playBuzzer();
                      setLostStock((ls) => ls + 1);
                      return {
                        ...cust,
                        state: 'walking_out',
                        targetX: cust.x > 50 ? 110 : -15,
                        thought: {
                          type: 'no_stock',
                          textKey: 'thought_no_stock',
                          icon: '❌',
                        },
                        thoughtTimer: 10,
                      };
                    }
                  } else {
                    // Rejected
                    sound.playBuzzer();
                    if (evaluation.thoughtType === 'too_expensive') {
                      setLostPrice((lp) => lp + 1);
                    } else if (evaluation.thoughtType === 'no_stock') {
                      setLostStock((ls) => ls + 1);
                    } else {
                      setLostQuality((lq) => lq + 1);
                    }

                    return {
                      ...cust,
                      state: 'walking_out',
                      targetX: cust.x > 50 ? 110 : -15,
                      thought: {
                        type: evaluation.thoughtType,
                        textKey: evaluation.thoughtKey,
                        icon: evaluation.thoughtIcon,
                      },
                      thoughtTimer: 10,
                    };
                  }
                } else {
                  // Walking towards stand
                  const dir = cust.x < cust.targetX ? 1 : -1;
                  return { ...cust, x: cust.x + dir * cust.speed };
                }
              }

              if (cust.state === 'drinking') {
                if ((cust.thoughtTimer || 0) > 0) {
                  return { ...cust, thoughtTimer: (cust.thoughtTimer || 0) - 1 };
                }
                return {
                  ...cust,
                  state: 'walking_out',
                  targetX: cust.x > 50 ? 115 : -20,
                };
              }

              if (cust.state === 'walking_out') {
                const dir = cust.x < cust.targetX ? 1 : -1;
                const newX = cust.x + dir * cust.speed * 1.2;
                return {
                  ...cust,
                  x: newX,
                  thoughtTimer: Math.max(0, (cust.thoughtTimer || 0) - 1),
                };
              }

              return cust;
            })
            .filter((c) => c.x >= -25 && c.x <= 125);
        });

        return nextTime;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [speed, gameState, inventory, pitcherCups, cupsSold, customersServed, lostPrice, lostStock, lostQuality, totalSatisfaction, customers.length, activeRubroId]);

  // Fast skip day
  const handleInstantSkip = () => {
    sound.playButtonTone();
    const remainingHours = Math.max(0, (19 * 60 - timeMinutes) / 60);
    const avgCupsPerHour = Math.max(1, Math.floor(loc.trafficMultiplier * 3.5));
    const extraCups = Math.min(
      Math.floor(remainingHours * avgCupsPerHour),
      15
    );

    const finalCupsSold = cupsSold + extraCups;
    const finalCustomersServed = customersServed + extraCups;
    const finalSatisfaction = totalSatisfaction + extraCups * 85;

    const summary = calculateNightSummary(gameState, {
      cupsSold: finalCupsSold,
      customersServed: finalCustomersServed,
      lostPrice: lostPrice + 2,
      lostStock: lostStock + (extraCups === 0 && remainingHours > 2 ? 5 : 0),
      lostQuality,
      totalSatisfactionScore: finalSatisfaction || 85,
    });
    onFinishDay(summary.updatedState, summary.alerts);
  };

  // Clock format
  const hours = Math.floor(timeMinutes / 60);
  const mins = Math.floor(timeMinutes % 60);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

  // Current price
  const activePrice = activeRecipe.pricePerServing || activeRecipe.pricePerCup || 1.0;
  const currentStandLevel = gameState.upgrades.stand || 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] text-[#9bbc0f] font-mono select-none overflow-hidden relative">
      {/* Top HUD Display */}
      <div className="bg-[#1a1c1a] border-b-2 border-[#8bac0f] p-2 sm:p-3 flex items-center justify-between gap-2 text-xs shadow-md z-30">
        <div className="flex items-center gap-2">
          <span className="bg-[#8bac0f] text-[#0f380f] font-bold px-2 py-0.5 rounded text-[10px] uppercase">
            {t(lang, 'day')} {gameState.day}
          </span>
          <span className="font-bold text-[#9bbc0f] text-[11px] bg-[#0f380f] border border-[#8bac0f] px-2 py-0.5 rounded">
            🕒 {formattedTime}
          </span>
        </div>

        {/* Sales & Revenue Ticker */}
        <div className="flex items-center gap-3">
          <div className="text-[#9bbc0f] font-bold text-xs">
            <span>{currentRubro.icon} {cupsSold}</span>
            <span className="text-[#8bac0f] text-[10px] ml-1">(${ (cupsSold * activePrice).toFixed(2) })</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[#8bac0f] text-[10px]">
            <span>{loc.icon} {t(lang, loc.nameKey)}</span>
          </div>
        </div>

        {/* Speed Controls, View Toggle & Skip */}
        <div className="flex items-center gap-1.5">
          {/* 3D Minecraft / 2D Retro Toggle */}
          <div className="bg-[#0f380f] border border-[#8bac0f] rounded p-0.5 flex items-center text-[9px] font-bold">
            <button
              id="viewmode-3d-btn"
              onClick={() => {
                sound.playButtonTone();
                setViewMode('3d_minecraft');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === '3d_minecraft'
                  ? 'bg-[#8bac0f] text-[#0f380f]'
                  : 'text-[#9bbc0f] hover:bg-[#1a4a1a]'
              }`}
              title="Vista 3D Minecraft Interactiva"
            >
              🧊 3D
            </button>
            <button
              id="viewmode-2d-btn"
              onClick={() => {
                sound.playButtonTone();
                setViewMode('2d_retro');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === '2d_retro'
                  ? 'bg-[#8bac0f] text-[#0f380f]'
                  : 'text-[#9bbc0f] hover:bg-[#1a4a1a]'
              }`}
              title="Vista 2D Retro Clásica"
            >
              📟 2D
            </button>
          </div>

          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              id={`sim-speed-${spd}x-btn`}
              onClick={() => {
                sound.playButtonTone();
                setSpeed(spd);
              }}
              className={`px-1.5 sm:px-2 py-1 rounded text-[9px] font-bold border transition-colors ${
                speed === spd
                  ? 'bg-[#8bac0f] text-[#0f380f] border-[#8bac0f]'
                  : 'bg-[#0f380f] text-[#9bbc0f] border-[#8bac0f]/40 hover:bg-[#1a4a1a]'
              }`}
            >
              {spd}x
            </button>
          ))}
          <button
            id="sim-skip-day-btn"
            onClick={handleInstantSkip}
            className="px-2 py-1 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] rounded text-[9px] font-bold border border-[#306230] uppercase"
            title={t(lang, 'skip_day')}
          >
            ⏩
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport (3D Minecraft or 2D Retro Canvas) */}
      {viewMode === '3d_minecraft' ? (
        <div className="flex-1 relative overflow-hidden">
          <MinecraftWorld3D
            gameState={gameState}
            customers={customers}
            timeMinutes={timeMinutes}
            interactive={true}
          />
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden flex flex-col justify-end bg-gradient-to-b from-[#121c12] via-[#0f280f] to-[#1a1c1a]">
          {/* Weather & Ambience Overlay */}
          <div className="absolute top-3 left-3 text-xs bg-[#1a1c1a]/90 border border-[#8bac0f] px-2.5 py-1 rounded z-20 flex items-center gap-1.5 shadow-md">
            <span>{gameState.weatherToday.icon}</span>
            <span className="text-[#9bbc0f] font-bold text-[10px]">{gameState.weatherToday.tempC}°C ({t(lang, gameState.weatherToday.descriptionKey)})</span>
          </div>

          {/* Active Rubro Badge */}
          <div className="absolute top-3 right-3 text-xs bg-[#0f380f] border border-[#8bac0f] px-2.5 py-1 rounded z-20 flex items-center gap-1 shadow-md text-[10px] text-[#9bbc0f] font-bold">
            <span>{currentRubro.icon}</span>
            <span>{currentRubro.name}</span>
          </div>

          {/* Location Backdrop details */}
          <div className="absolute bottom-16 w-full flex justify-around opacity-40 pointer-events-none text-2xl">
            {loc.id === 'beach' ? (
              <><span>🌊</span><span>🌴</span><span>🏖️</span><span>🌴</span><span>🌊</span></>
            ) : loc.id === 'downtown' ? (
              <><span>🏢</span><span>🏬</span><span>🏙️</span><span>🏢</span><span>🏦</span></>
            ) : loc.id === 'park' ? (
              <><span>🌳</span><span>🌺</span><span>🌲</span><span>🌸</span><span>🌳</span></>
            ) : loc.id === 'stadium' ? (
              <><span>🏟️</span><span>🚩</span><span>🏆</span><span>🚩</span><span>🏟️</span></>
            ) : (
              <><span>🏡</span><span>🌳</span><span>🏠</span><span>🌳</span><span>🏡</span></>
            )}
          </div>

          {/* Ground Sidewalk */}
          <div className="absolute bottom-0 w-full h-16 bg-[#1a1c1a] border-t-4 border-[#8bac0f] flex flex-col justify-end">
            <div className="w-full h-2 bg-[#0f380f]" />
          </div>

          {/* Mascot dancing if hired! */}
          {gameState.staff.mascot && (
            <div className="absolute bottom-14 left-8 text-2xl animate-bounce z-15" title="Mascota Comercial">
              {currentRubro.icon}
            </div>
          )}

          {/* Business Stand in Center */}
          <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
            {/* Stand Sign */}
            <div className="bg-[#8bac0f] text-[#0f380f] px-2.5 py-0.5 rounded text-[9px] font-bold border-2 border-[#306230] shadow-md mb-0.5 whitespace-nowrap uppercase flex items-center gap-1">
              <span>{currentRubro.icon}</span>
              <span>{gameState.player.standName || currentRubro.name}</span>
            </div>

            {/* Stand Graphics depending on tier */}
            <div className="relative w-32 h-20 bg-[#0f380f] border-4 border-[#8bac0f] rounded-t-sm shadow-xl flex flex-col items-center justify-between p-1 text-[#9bbc0f]">
              {/* Awning */}
              <div className="w-full h-4 bg-[#8bac0f] border-b-2 border-[#306230] flex justify-around">
                <div className="w-2 h-full bg-[#0f380f]" />
                <div className="w-2 h-full bg-[#0f380f]" />
                <div className="w-2 h-full bg-[#0f380f]" />
                <div className="w-2 h-full bg-[#0f380f]" />
              </div>

              {/* Counter contents */}
              <div className="w-full flex items-center justify-around text-xs mt-1">
                <span className="text-base">{currentRubro.icon}</span>
                <span className="text-sm font-bold">${activePrice.toFixed(2)}</span>
              </div>

              <div className="text-[7px] text-[#9bbc0f] font-mono tracking-wider font-bold uppercase">
                LV.{currentStandLevel} {currentRubro.name}
              </div>
            </div>
          </div>

          {/* Customer Sprites Walking and Interacting */}
          {customers.map((cust) => {
            const spriteIcons = ['🏃‍♂️', '🚶‍♀️', '🧑‍💼', '👧', '🧔'];
            const currentIcon = spriteIcons[cust.spriteIndex % spriteIcons.length];

            return (
              <div
                key={cust.id}
                className="absolute bottom-12 transition-transform duration-200 z-25 flex flex-col items-center pointer-events-none"
                style={{
                  left: `${cust.x}%`,
                  transform: cust.state === 'walking_out' && cust.targetX < cust.x ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              >
                {/* Thought Bubble */}
                {cust.thought && (
                  <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] text-[#9bbc0f] text-[9px] px-1.5 py-0.5 rounded shadow-lg mb-1 flex items-center gap-1 animate-bounce transform -scale-x-100 font-mono">
                    <span>{cust.thought.icon}</span>
                    <span className="text-[8px] whitespace-nowrap">{t(lang, cust.thought.textKey)}</span>
                  </div>
                )}

                {/* Character Pixel Icon */}
                <div className="text-2xl drop-shadow-md">{currentIcon}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-time Status Badges */}
      <div className="bg-[#1a1c1a] border-t border-[#8bac0f] p-2 flex items-center justify-between text-[10px] px-3 text-[#9bbc0f]">
        <div className="flex items-center gap-3">
          <span>Servidos: {customersServed}</span>
          <span className="text-[#8bac0f]">Perdidos: {lostPrice + lostStock + lostQuality}</span>
        </div>
        <div className="text-[#8bac0f] text-[9px]">
          Sat: {customersServed > 0 ? Math.round(totalSatisfaction / customersServed) : 100}%
        </div>
      </div>
    </div>
  );
};
