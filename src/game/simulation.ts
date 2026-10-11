import {
  DayFinancials,
  GameState,
  WeatherInfo,
  WeatherType,
  SuppliesInventory,
  RecipeConfig,
  GhostRival,
  BusinessRubroId
} from '../types';
import { LOCATIONS, UPGRADES, STAFF_LIST, BUSINESS_RUBROS } from './constants';

export function generateWeather(currentDay: number): WeatherInfo {
  const roll = Math.random();
  let type: WeatherType = 'sunny';
  let tempC = 25;

  // Day pattern / seasonal variations
  if (roll < 0.35) {
    type = 'sunny';
    tempC = 26 + Math.floor(Math.random() * 6); // 26 - 31°C
  } else if (roll < 0.55) {
    type = 'heatwave';
    tempC = 34 + Math.floor(Math.random() * 6); // 34 - 39°C
  } else if (roll < 0.75) {
    type = 'partly_cloudy';
    tempC = 21 + Math.floor(Math.random() * 5); // 21 - 25°C
  } else if (roll < 0.90) {
    type = 'rain';
    tempC = 16 + Math.floor(Math.random() * 4); // 16 - 19°C
  } else {
    type = 'thunderstorm';
    tempC = 14 + Math.floor(Math.random() * 4); // 14 - 17°C
  }

  const tempF = Math.round((tempC * 9) / 5 + 32);
  const icons: Record<WeatherType, string> = {
    sunny: '☀️',
    heatwave: '🔥',
    partly_cloudy: '⛅',
    rain: '🌧️',
    thunderstorm: '⛈️',
  };

  return {
    type,
    tempC,
    tempF,
    descriptionKey: type,
    icon: icons[type],
  };
}

export interface CustomerEvaluationResult {
  buys: boolean;
  thoughtType: 'happy' | 'bought' | 'too_expensive' | 'too_sour' | 'too_sweet' | 'too_warm' | 'no_stock' | 'slow';
  thoughtKey: string;
  thoughtIcon: string;
  satisfactionDelta: number; // 0 to 100
}

export function evaluateCustomerPurchase(
  recipe: RecipeConfig,
  inventory: SuppliesInventory,
  pitcherCupsRemaining: number,
  weather: WeatherInfo,
  locationId: string,
  upgrades: Record<string, number>,
  hasJukebox: boolean,
  rubroId: BusinessRubroId = 'lemonade'
): CustomerEvaluationResult {
  const loc = LOCATIONS.find((l) => l.id === locationId) || LOCATIONS[0];
  const rubroConfig = BUSINESS_RUBROS.find((r) => r.id === rubroId) || BUSINESS_RUBROS[0];
  
  // 1. Stock Evaluation based on active rubro
  if (rubroId === 'lemonade') {
    const canServeFromPitcher = pitcherCupsRemaining > 0 && inventory.cups > 0 && inventory.ice >= (recipe.icePerCup || 0);
    const canMakeNewPitcher =
      inventory.lemons >= (recipe.lemonsPerPitcher || 4) &&
      inventory.sugar >= (recipe.sugarPerPitcher || 4) &&
      inventory.cups > 0 &&
      inventory.ice >= (recipe.icePerCup || 0);

    if (!canServeFromPitcher && !canMakeNewPitcher) {
      return {
        buys: false,
        thoughtType: 'no_stock',
        thoughtKey: 'thought_no_stock',
        thoughtIcon: '❌',
        satisfactionDelta: 0,
      };
    }
  } else if (rubroId === 'coffee') {
    const beansReq = recipe.beansPerServing || 3;
    const milkReq = recipe.milkPerServing || 2;
    const hasCups = (inventory.coffee_cups || 0) > 0;
    const hasIngredients = (inventory.coffee_beans || 0) >= beansReq && (inventory.milk || 0) >= milkReq;
    if (!hasCups || !hasIngredients) {
      return {
        buys: false,
        thoughtType: 'no_stock',
        thoughtKey: 'thought_no_stock',
        thoughtIcon: '❌',
        satisfactionDelta: 0,
      };
    }
  } else if (rubroId === 'icecream') {
    const creamReq = recipe.creamPerServing || 2;
    const hasCones = (inventory.waffle_cones || 0) > 0;
    const hasCream = (inventory.cream_base || 0) >= creamReq;
    if (!hasCones || !hasCream) {
      return {
        buys: false,
        thoughtType: 'no_stock',
        thoughtKey: 'thought_no_stock',
        thoughtIcon: '❌',
        satisfactionDelta: 0,
      };
    }
  } else if (rubroId === 'smoothies') {
    const fruitReq = recipe.fruitsPerServing || 2;
    const hasGlasses = (inventory.crystal_glasses || 0) > 0;
    const hasFruit = (inventory.tropical_fruits || 0) >= fruitReq;
    if (!hasGlasses || !hasFruit) {
      return {
        buys: false,
        thoughtType: 'no_stock',
        thoughtKey: 'thought_no_stock',
        thoughtIcon: '❌',
        satisfactionDelta: 0,
      };
    }
  } else if (rubroId === 'pizza') {
    const doughReq = recipe.doughPerServing || 2;
    const cheeseReq = recipe.cheesePerServing || 2;
    const hasBoxes = (inventory.pizza_boxes || 0) > 0;
    const hasIngredients = (inventory.pizza_dough || 0) >= doughReq && (inventory.mozzarella || 0) >= cheeseReq;
    if (!hasBoxes || !hasIngredients) {
      return {
        buys: false,
        thoughtType: 'no_stock',
        thoughtKey: 'thought_no_stock',
        thoughtIcon: '❌',
        satisfactionDelta: 0,
      };
    }
  }

  // 2. Price Tolerance and Weather Affinity
  const currentPrice = recipe.pricePerServing || recipe.pricePerCup || 1.0;
  let basePriceTolerance = (rubroId === 'pizza' ? 6.5 : rubroId === 'smoothies' ? 5.0 : rubroId === 'icecream' ? 4.0 : rubroId === 'coffee' ? 3.0 : 1.25) * loc.spendingPower;
  
  // Weather affinity per rubro
  if (rubroId === 'coffee') {
    // Coffee thrives in rain, clouds, colder temperatures
    if (weather.type === 'rain' || weather.type === 'thunderstorm') basePriceTolerance *= 1.45;
    if (weather.tempC <= 20) basePriceTolerance *= 1.3;
    if (weather.type === 'heatwave') basePriceTolerance *= 0.85;
  } else if (rubroId === 'icecream' || rubroId === 'smoothies' || rubroId === 'lemonade') {
    // Cold refreshments thrive in heatwave and sunshine
    if (weather.type === 'heatwave') basePriceTolerance *= 1.4;
    if (weather.type === 'sunny') basePriceTolerance *= 1.2;
    if (weather.type === 'rain' || weather.type === 'thunderstorm') basePriceTolerance *= 0.65;
  } else if (rubroId === 'pizza') {
    // Pizza is popular all weather, especially downtown/stadium
    if (locationId === 'downtown' || locationId === 'stadium') basePriceTolerance *= 1.35;
    if (weather.type === 'rain') basePriceTolerance *= 1.1; // comfort food
  }

  if (hasJukebox) basePriceTolerance *= 1.15;
  if (upgrades.stand > 1) basePriceTolerance *= 1 + upgrades.stand * 0.08;

  const customerBudget = basePriceTolerance * (0.8 + Math.random() * 0.5);

  if (currentPrice > customerBudget) {
    return {
      buys: false,
      thoughtType: 'too_expensive',
      thoughtKey: 'thought_expensive',
      thoughtIcon: '💸',
      satisfactionDelta: 20,
    };
  }

  // 3. Quality & Recipe Taste Feedback
  if (rubroId === 'lemonade') {
    const sugarToLemonRatio = (recipe.sugarPerPitcher || 4) / Math.max(1, recipe.lemonsPerPitcher || 4);
    if (weather.tempC >= 28 && (recipe.icePerCup || 0) === 0) {
      return {
        buys: false,
        thoughtType: 'too_warm',
        thoughtKey: 'thought_warm',
        thoughtIcon: '🌡️',
        satisfactionDelta: 25,
      };
    }
    if (sugarToLemonRatio < 0.6) {
      if (Math.random() < 0.65) {
        return {
          buys: true,
          thoughtType: 'too_sour',
          thoughtKey: 'thought_sour',
          thoughtIcon: '😖',
          satisfactionDelta: 40,
        };
      }
    } else if (sugarToLemonRatio > 1.8) {
      if (Math.random() < 0.6) {
        return {
          buys: true,
          thoughtType: 'too_sweet',
          thoughtKey: 'thought_sweet',
          thoughtIcon: '🍬',
          satisfactionDelta: 45,
        };
      }
    }
  }

  // Perfect / Great sale!
  return {
    buys: true,
    thoughtType: 'happy',
    thoughtKey: 'thought_happy',
    thoughtIcon: '😋',
    satisfactionDelta: 95,
  };
}

export function simulateGhostRivals(day: number, playerLocationId: string, playerNetProfit: number): GhostRival[] {
  const baseRivals: GhostRival[] = [
    {
      id: 'rival_1',
      name: 'NeoCitrus',
      standName: 'Cyber Lemon Inc.',
      locationId: 'downtown',
      cupsSold: Math.floor(40 + day * 4.5 + Math.random() * 15),
      dailyRevenue: 0,
      netProfit: 0,
      avatarSeed: 1,
    },
    {
      id: 'rival_2',
      name: 'RetroGirl',
      standName: 'Sweet & Chill',
      locationId: 'beach',
      cupsSold: Math.floor(35 + day * 4 + Math.random() * 12),
      dailyRevenue: 0,
      netProfit: 0,
      avatarSeed: 2,
    },
    {
      id: 'rival_3',
      name: 'PixelKing',
      standName: '8-Bit Lemonade Co',
      locationId: 'park',
      cupsSold: Math.floor(28 + day * 3.5 + Math.random() * 10),
      dailyRevenue: 0,
      netProfit: 0,
      avatarSeed: 3,
    },
    {
      id: 'rival_4',
      name: 'GigaLemon',
      standName: 'Lemon Protocol',
      locationId: 'stadium',
      cupsSold: Math.floor(55 + day * 5 + Math.random() * 20),
      dailyRevenue: 0,
      netProfit: 0,
      avatarSeed: 4,
    },
  ];

  return baseRivals.map((r) => {
    const loc = LOCATIONS.find((l) => l.id === r.locationId) || LOCATIONS[0];
    const avgPrice = 1.25 * loc.spendingPower;
    const revenue = Math.round(r.cupsSold * avgPrice * 10) / 10;
    const expenses = loc.rentDaily + r.cupsSold * 0.35;
    const profit = Math.round((revenue - expenses) * 10) / 10;
    return {
      ...r,
      dailyRevenue: revenue,
      netProfit: profit,
    };
  });
}

export function calculateNightSummary(
  gameState: GameState,
  dayStats: {
    cupsSold: number;
    customersServed: number;
    lostPrice: number;
    lostStock: number;
    lostQuality: number;
    totalSatisfactionScore: number;
  }
): {
  updatedState: GameState;
  financials: DayFinancials;
  alerts: string[];
} {
  const loc = LOCATIONS.find((l) => l.id === gameState.currentLocationId) || LOCATIONS[0];
  const coolerTier = gameState.upgrades.cooler || 1;
  const activeRubro = gameState.activeRubroId || 'lemonade';
  const currentRecipe = gameState.rubroRecipes?.[activeRubro] || gameState.recipe;
  const currentPrice = currentRecipe.pricePerServing || currentRecipe.pricePerCup || 1.0;

  // 1. Revenue
  const revenue = Math.round(dayStats.cupsSold * currentPrice * 100) / 100;

  // 2. Ingredients used cost calculation
  let supplyCost = 0;
  if (activeRubro === 'lemonade') {
    const cupsPerPitcher = gameState.staff.squeezer ? 12 : 10;
    const pitchersUsed = Math.ceil(dayStats.cupsSold / cupsPerPitcher);
    const lemonsUsed = pitchersUsed * (currentRecipe.lemonsPerPitcher || 4);
    const sugarUsed = pitchersUsed * (currentRecipe.sugarPerPitcher || 4);
    const iceUsed = dayStats.cupsSold * (currentRecipe.icePerCup || 3);
    const cupsUsed = dayStats.cupsSold;

    const lemonCost = lemonsUsed * 0.25;
    const sugarCost = sugarUsed * 0.15;
    const iceCost = iceUsed * 0.04;
    const cupCost = cupsUsed * 0.05;
    supplyCost = Math.round((lemonCost + sugarCost + iceCost + cupCost) * 100) / 100;
  } else if (activeRubro === 'coffee') {
    const beansCost = dayStats.cupsSold * (currentRecipe.beansPerServing || 3) * 0.30;
    const milkCost = dayStats.cupsSold * (currentRecipe.milkPerServing || 2) * 0.25;
    const syrupCost = dayStats.cupsSold * (currentRecipe.syrupPerServing || 1) * 0.20;
    const cupCost = dayStats.cupsSold * 0.08;
    supplyCost = Math.round((beansCost + milkCost + syrupCost + cupCost) * 100) / 100;
  } else if (activeRubro === 'icecream') {
    const creamCost = dayStats.cupsSold * (currentRecipe.creamPerServing || 2) * 0.35;
    const toppingCost = dayStats.cupsSold * (currentRecipe.toppingsPerServing || 1) * 0.20;
    const berryCost = dayStats.cupsSold * (currentRecipe.berriesPerServing || 1) * 0.28;
    const coneCost = dayStats.cupsSold * 0.15;
    supplyCost = Math.round((creamCost + toppingCost + berryCost + coneCost) * 100) / 100;
  } else if (activeRubro === 'smoothies') {
    const fruitCost = dayStats.cupsSold * (currentRecipe.fruitsPerServing || 2) * 0.40;
    const mintCost = dayStats.cupsSold * (currentRecipe.mintPerServing || 1) * 0.20;
    const sodaCost = dayStats.cupsSold * (currentRecipe.sodaPerServing || 2) * 0.25;
    const glassCost = dayStats.cupsSold * 0.12;
    supplyCost = Math.round((fruitCost + mintCost + sodaCost + glassCost) * 100) / 100;
  } else if (activeRubro === 'pizza') {
    const doughCost = dayStats.cupsSold * (currentRecipe.doughPerServing || 2) * 0.45;
    const sauceCost = dayStats.cupsSold * (currentRecipe.saucePerServing || 2) * 0.30;
    const cheeseCost = dayStats.cupsSold * (currentRecipe.cheesePerServing || 2) * 0.40;
    const boxCost = dayStats.cupsSold * 0.15;
    supplyCost = Math.round((doughCost + sauceCost + cheeseCost + boxCost) * 100) / 100;
  }

  // 3. Rent & Staff
  const rentCost = loc.rentDaily;
  let staffCost = 0;
  STAFF_LIST.forEach((st) => {
    if (gameState.staff[st.id]) {
      staffCost += st.dailyWage;
    }
  });

  // 4. Marketing
  let marketingCost = 0;
  const activeMarketing = gameState.activeMarketing
    .map((m) => ({ ...m, daysRemaining: m.daysRemaining - 1 }))
    .filter((m) => m.daysRemaining > 0);

  // 5. Spoilage & Ice Melting (for lemonade)
  const meltRates = [1.0, 0.5, 0.2, 0.0];
  const meltRate = meltRates[Math.min(coolerTier - 1, meltRates.length - 1)];
  const remainingIce = gameState.inventory.ice || 0;
  const meltedIce = activeRubro === 'lemonade' ? Math.floor(remainingIce * meltRate) : 0;
  const iceMeltedCost = Math.round(meltedIce * 0.04 * 100) / 100;

  let lemonsSpoiled = 0;
  if (activeRubro === 'lemonade' && coolerTier === 1 && (gameState.inventory.lemons || 0) > 15 && Math.random() < 0.4) {
    lemonsSpoiled = Math.min(gameState.inventory.lemons, Math.floor(3 + Math.random() * 4));
  }
  const lemonsSpoiledCost = Math.round(lemonsSpoiled * 0.25 * 100) / 100;

  // 6. CALCULATE PASSIVE FRANCHISE ROYALTIES FROM OTHER UNLOCKED & MANAGED RUBROS!
  let passiveFranchiseEarnings = 0;
  const unlockedRubros = gameState.unlockedRubros || ['lemonade'];
  const rubroManagers = gameState.rubroManagers || {};

  unlockedRubros.forEach((rubId) => {
    // If it is NOT the currently operated branch, and has a manager hired
    if (rubId !== activeRubro && rubroManagers[rubId]) {
      const rubroDef = BUSINESS_RUBROS.find((r) => r.id === rubId);
      if (rubroDef) {
        // Base profit generated by branch manager
        const baseEarnings = Math.round((25 + gameState.player.level * 8) * rubroDef.managerEfficiency * (0.85 + Math.random() * 0.3));
        const netBranchProfit = Math.max(5, baseEarnings - rubroDef.managerDailyWage);
        passiveFranchiseEarnings += netBranchProfit;
      }
    }
  });

  // Net Profit
  const directProfit =
    Math.round(
      (revenue - supplyCost - rentCost - staffCost - iceMeltedCost - lemonsSpoiledCost) * 100
    ) / 100;

  const netProfit = Math.round((directProfit + passiveFranchiseEarnings) * 100) / 100;

  // Customer satisfaction
  const totalAttempted = dayStats.customersServed + dayStats.lostPrice + dayStats.lostStock + dayStats.lostQuality;
  const satisfactionScore =
    totalAttempted > 0
      ? Math.round(dayStats.totalSatisfactionScore / totalAttempted)
      : 80;

  // Reputation shift
  const repDelta = Math.round((satisfactionScore - gameState.player.reputation) * 0.2);
  const newReputation = Math.max(10, Math.min(100, gameState.player.reputation + repDelta));

  // XP & Level
  const xpGained = Math.max(12, Math.floor(dayStats.cupsSold * 2.5 + (netProfit > 0 ? netProfit * 0.6 : 0)));
  let newExp = gameState.player.experience + xpGained;
  let newLevel = gameState.player.level;
  const xpToLevel = newLevel * 100;
  const alerts: string[] = [];

  if (newExp >= xpToLevel) {
    newLevel += 1;
    newExp -= xpToLevel;
    alerts.push(`alert_new_level:${newLevel}`);
  }

  if (passiveFranchiseEarnings > 0) {
    alerts.push(`alert_passive_royalties:${passiveFranchiseEarnings}`);
  }

  if (meltedIce > 0) {
    alerts.push(`alert_ice_melted:${meltedIce}`);
  }
  if (lemonsSpoiled > 0) {
    alerts.push(`alert_lemons_spoiled:${lemonsSpoiled}`);
  }

  // Check achievements
  const newAchievements = gameState.achievements.map((ach) => {
    if (ach.unlocked) return ach;
    if (ach.id === 'first_sale' && gameState.totalCupsSold + dayStats.cupsSold >= 1) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === 'expand_coffee' && unlockedRubros.includes('coffee')) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === 'expand_icecream' && unlockedRubros.includes('icecream')) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === 'expand_conglomerate' && unlockedRubros.length >= 3) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === '100_cups' && gameState.totalCupsSold + dayStats.cupsSold >= 100) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === '1000_cups' && gameState.totalCupsSold + dayStats.cupsSold >= 1000) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === '100_profit' && netProfit >= 100) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === '500_profit' && netProfit >= 500) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    if (ach.id === 'beach_unlocked' && gameState.unlockedLocations.includes('beach')) {
      alerts.push(`alert_achievement:${ach.nameKey}`);
      return { ...ach, unlocked: true };
    }
    return ach;
  });

  const financials: DayFinancials = {
    day: gameState.day,
    locationId: gameState.currentLocationId,
    rubroId: activeRubro,
    weather: gameState.weatherToday,
    revenue,
    cupsSold: dayStats.cupsSold,
    potentialCustomers: totalAttempted,
    customersServed: dayStats.customersServed,
    customersTurnedAwayPrice: dayStats.lostPrice,
    customersTurnedAwayStock: dayStats.lostStock,
    customersTurnedAwayQuality: dayStats.lostQuality,
    supplyCost,
    rentCost,
    staffCost,
    marketingCost,
    iceMeltedCost,
    lemonsSpoiledCost,
    passiveFranchiseEarnings,
    netProfit,
    satisfactionScore,
    feedbackTags: [],
  };

  // Next weather
  const nextWeather = generateWeather(gameState.day + 1);

  // New inventory after melting and spoilage
  const newInventory: SuppliesInventory = {
    ...gameState.inventory,
    lemons: Math.max(0, (gameState.inventory.lemons || 0) - lemonsSpoiled),
    ice: Math.max(0, (gameState.inventory.ice || 0) - meltedIce),
  };

  const newCash = Math.round((gameState.player.cash + netProfit) * 100) / 100;
  const newRivals = simulateGhostRivals(gameState.day, gameState.currentLocationId, netProfit);

  const updatedState: GameState = {
    ...gameState,
    player: {
      ...gameState.player,
      cash: newCash,
      level: newLevel,
      experience: newExp,
      reputation: newReputation,
    },
    inventory: newInventory,
    currentPitcherCupsRemaining: 0,
    activeMarketing,
    achievements: newAchievements,
    history: [financials, ...gameState.history].slice(0, 30), // keep last 30 days
    totalCupsSold: gameState.totalCupsSold + dayStats.cupsSold,
    totalRevenue: Math.round((gameState.totalRevenue + revenue) * 100) / 100,
    totalProfit: Math.round((gameState.totalProfit + netProfit) * 100) / 100,
    bestDayProfit: Math.max(gameState.bestDayProfit, netProfit),
    passiveRoyaltiesToday: passiveFranchiseEarnings,
    totalPassiveRoyalties: (gameState.totalPassiveRoyalties || 0) + passiveFranchiseEarnings,
    currentPhase: 'night_summary',
    weatherToday: gameState.weatherTomorrow,
    weatherTomorrow: nextWeather,
    rivals: newRivals,
    lastSavedAt: Date.now(),
  };

  return {
    updatedState,
    financials,
    alerts,
  };
}

