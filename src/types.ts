export type GamePhase = 'prep' | 'day_simulation' | 'night_summary';

export type WeatherType = 'sunny' | 'heatwave' | 'partly_cloudy' | 'rain' | 'thunderstorm';

export type BusinessRubroId = 'lemonade' | 'coffee' | 'icecream' | 'smoothies' | 'pizza';

export interface WeatherInfo {
  type: WeatherType;
  tempC: number;
  tempF: number;
  descriptionKey: string;
  icon: string;
}

export interface SuppliesInventory {
  lemons: number;
  sugar: number; // in cups
  ice: number;   // in cubes
  cups: number;
  [key: string]: number;
}

export interface RecipeConfig {
  lemonsPerPitcher: number; // 1 - 8
  sugarPerPitcher: number;  // 1 - 8
  icePerCup: number;        // 0 - 6
  pricePerCup: number;      // e.g. 0.50 to 5.00
  [key: string]: number;
}

export interface RubroSupplyTier {
  amount: number;
  price: number;
  discountPercent?: number;
}

export interface RubroSupplyItem {
  id: string;
  nameKey: string;
  unitKey: string;
  icon: string;
  tiers: RubroSupplyTier[];
}

export interface RubroSliderDef {
  key: string;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  costPerUnit: number;
}

export interface BusinessRubroConfig {
  id: BusinessRubroId;
  name: string;
  tagline: string;
  icon: string;
  unlockLevel: number;
  unlockCost: number;
  standColor: string;
  itemUnitName: string;
  containerIcon: string;
  supplies: RubroSupplyItem[];
  recipeSliders: RubroSliderDef[];
  defaultRecipe: Record<string, number>;
  managerCost: number;
  managerDailyWage: number;
  managerEfficiency: number;
}

export interface SupplyItemCatalog {
  id: keyof SuppliesInventory;
  nameKey: string;
  unitKey: string;
  icon: string;
  tiers: {
    amount: number;
    price: number;
    discountPercent?: number;
  }[];
}

export interface LocationData {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  rentDaily: number;
  unlockCost: number;
  trafficMultiplier: number;
  spendingPower: number; // multiplier for price tolerance
  weatherSensitivity: number;
  requiredLevel: number;
}

export interface UpgradeItem {
  id: string;
  category: 'stand' | 'juicer' | 'cooler' | 'service' | 'marketing';
  tier: number;
  maxTier: number;
  nameKey: string;
  descKey: string;
  cost: number;
  icon: string;
  rubroId?: BusinessRubroId;
  perks: {
    meltReduction?: number; // e.g. 0.5 = 50% less ice melt
    lemonPreservation?: number; // reduces spoilage
    pitcherSpeed?: number;  // increases prep speed
    customerAttraction?: number; // % more customers
    priceTolerance?: number; // +$ tolerance
    capacityBoost?: number;
  };
}

export interface StaffMember {
  id: string;
  nameKey: string;
  roleKey: string;
  dailyWage: number;
  hired: boolean;
  icon: string;
  benefitKey: string;
  benefitType: 'speed' | 'sales' | 'spoilage';
  multiplier: number;
}

export interface MarketingCampaign {
  id: string;
  nameKey: string;
  descKey: string;
  cost: number;
  durationDays: number;
  daysRemaining: number;
  boostMultiplier: number;
  icon: string;
}

export interface DayFinancials {
  day: number;
  locationId: string;
  rubroId: BusinessRubroId;
  weather: WeatherInfo;
  revenue: number;
  cupsSold: number;
  potentialCustomers: number;
  customersServed: number;
  customersTurnedAwayPrice: number;
  customersTurnedAwayStock: number;
  customersTurnedAwayQuality: number;
  supplyCost: number;
  rentCost: number;
  staffCost: number;
  marketingCost: number;
  iceMeltedCost: number;
  lemonsSpoiledCost: number;
  passiveFranchiseEarnings: number;
  netProfit: number;
  satisfactionScore: number; // 0 - 100%
  feedbackTags: string[];
}

export interface CustomerThought {
  type: 'happy' | 'bought' | 'too_expensive' | 'too_sour' | 'too_sweet' | 'too_warm' | 'no_stock' | 'slow';
  textKey: string;
  icon: string;
}

export interface CustomerSim {
  id: number;
  x: number;
  y: number;
  targetX: number;
  speed: number;
  spriteIndex: number;
  state: 'walking_in' | 'in_line' | 'buying' | 'drinking' | 'walking_out';
  tastePreference: {
    sweetnessBias: number;
    sournessBias: number;
    iceNeed: number;
    budgetLimit: number;
  };
  patience: number;
  thought?: CustomerThought;
  thoughtTimer?: number;
}

export interface Achievement {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rewardCash?: number;
}

export interface GameSettings {
  palette: 'clean_minimalism' | 'dmg_green' | 'pocket_gray' | 'color_lemon' | 'cyber_dark' | 'high_contrast';
  frameMode: 'gameboy' | 'modern_compact';
  scanlines: boolean;
  sfxVolume: number;
  bgmVolume: number;
  language: 'es' | 'en';
  notifications: {
    lowStock: boolean;
    weatherAlert: boolean;
    spoilage: boolean;
    dailyProfit: boolean;
    achievements: boolean;
  };
  pinLockEnabled: boolean;
  pinCode?: string;
}

export interface GhostRival {
  id: string;
  name: string;
  standName: string;
  locationId: string;
  cupsSold: number;
  dailyRevenue: number;
  netProfit: number;
  avatarSeed: number;
}

export interface GameState {
  version: string;
  saveSlot: number;
  createdAt: number;
  lastSavedAt: number;
  
  // Player & Stand info
  player: {
    name: string;
    standName: string;
    level: number;
    experience: number;
    cash: number;
    reputation: number; // 0 - 100
  };

  // Day & Game Flow
  day: number;
  currentPhase: GamePhase;
  currentLocationId: string;
  weatherToday: WeatherInfo;
  weatherTomorrow: WeatherInfo;
  
  // Business Rubros & Empire Expansion
  activeRubroId: BusinessRubroId;
  unlockedRubros: BusinessRubroId[];
  rubroInventories: Record<string, Record<string, number>>;
  rubroRecipes: Record<string, Record<string, number>>;
  rubroManagers: Record<string, boolean>; // rubroId -> manager hired
  passiveRoyaltiesToday: number;
  totalPassiveRoyalties: number;

  // Inventory & Recipe (for active stand)
  inventory: SuppliesInventory;
  recipe: RecipeConfig;
  currentPitcherCupsRemaining: number;
  
  // Progression
  unlockedLocations: string[];
  upgrades: Record<string, number>; // upgradeId -> tier
  staff: Record<string, boolean>; // staffId -> hired
  activeMarketing: MarketingCampaign[];
  achievements: Achievement[];
  
  // History & Stats
  history: DayFinancials[];
  totalCupsSold: number;
  totalRevenue: number;
  totalProfit: number;
  bestDayProfit: number;
  
  // Multiplayer & Cloud
  cloudSyncId: string;
  lastCloudSync: number | null;
  rivals: GhostRival[];
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: number;
}
