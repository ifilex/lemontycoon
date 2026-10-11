import React, { useState, useEffect } from 'react';
import {
  GameState,
  GameSettings,
  SuppliesInventory,
  RecipeConfig,
  NotificationItem,
} from './types';
import { createInitialGameState, INITIAL_SETTINGS, LOCATIONS, UPGRADES } from './game/constants';
import { loadGameStateFromSlot, saveGameStateToSlot, loadSettings, saveSettings } from './utils/storage';
import { sound } from './audio/chiptune';
import { GameBoyFrame } from './components/GameBoyFrame';
import { PrepDashboard } from './components/PrepDashboard';
import { DaySimulation } from './components/DaySimulation';
import { NightSummary } from './components/NightSummary';
import { AnalyticsView } from './components/AnalyticsView';
import { MultiplayerView } from './components/MultiplayerView';
import { SettingsModal } from './components/SettingsModal';
import { NotificationToast } from './components/NotificationToast';
import { t } from './utils/i18n';

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGameStateFromSlot(1);
    return saved || createInitialGameState(1);
  });

  // Modal Overlays
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPinLocked, setIsPinLocked] = useState(() => Boolean(settings.pinLockEnabled && settings.pinCode));
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState(false);

  // In-Game Push Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Sound volumes on load
  useEffect(() => {
    sound.setVolumes(settings.sfxVolume, settings.bgmVolume);
  }, [settings.sfxVolume, settings.bgmVolume]);

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const id = 'notif_' + Math.random().toString(36).substring(2, 9);
    const item: NotificationItem = {
      id,
      title,
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [item, ...prev].slice(0, 3));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // State update handlers
  const handleUpdateInventory = (newInv: SuppliesInventory, cost: number) => {
    if (gameState.player.cash >= cost) {
      const activeRubro = gameState.activeRubroId || 'lemonade';
      setGameState((prev) => ({
        ...prev,
        inventory: newInv,
        rubroInventories: {
          ...prev.rubroInventories,
          [activeRubro]: newInv,
        },
        player: {
          ...prev.player,
          cash: Math.round((prev.player.cash - cost) * 100) / 100,
        },
      }));
    }
  };

  const handleUpdateRecipe = (newRecipe: RecipeConfig) => {
    const activeRubro = gameState.activeRubroId || 'lemonade';
    setGameState((prev) => ({
      ...prev,
      recipe: newRecipe,
      rubroRecipes: {
        ...prev.rubroRecipes,
        [activeRubro]: newRecipe,
      },
    }));
  };

  const handleSwitchRubro = (rubroId: any) => {
    setGameState((prev) => ({
      ...prev,
      activeRubroId: rubroId,
      inventory: prev.rubroInventories?.[rubroId] || prev.inventory,
      recipe: prev.rubroRecipes?.[rubroId] || prev.recipe,
    }));
    showToast('CAMBIO DE RUBRO', `Has cambiado la operación activa al nuevo rubro.`, 'info');
  };

  const handleUnlockRubro = (rubroId: any, cost: number) => {
    if (gameState.player.cash >= cost && !gameState.unlockedRubros.includes(rubroId)) {
      setGameState((prev) => ({
        ...prev,
        unlockedRubros: [...prev.unlockedRubros, rubroId],
        activeRubroId: rubroId,
        player: {
          ...prev.player,
          cash: Math.round((prev.player.cash - cost) * 100) / 100,
        },
      }));
      showToast('FRANQUICIA EXPANDIDA', `¡Nuevo rubro gastronómico inaugurado!`, 'success');
    }
  };

  const handleToggleRubroManager = (rubroId: any) => {
    setGameState((prev) => {
      const current = Boolean(prev.rubroManagers?.[rubroId]);
      showToast('GERENTE DE SUCURSAL', current ? 'Gerente relevado.' : 'Gerente contratado para operar la franquicia.', 'info');
      return {
        ...prev,
        rubroManagers: {
          ...prev.rubroManagers,
          [rubroId]: !current,
        },
      };
    });
  };

  const handlePurchaseUpgrade = (upgradeId: string, cost: number) => {
    if (gameState.player.cash >= cost) {
      setGameState((prev) => ({
        ...prev,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: (prev.upgrades[upgradeId] || 0) + 1,
        },
        player: {
          ...prev.player,
          cash: Math.round((prev.player.cash - cost) * 100) / 100,
        },
      }));
      showToast('MEJORA ADQUIRIDA', `Has mejorado ${upgradeId} con éxito!`, 'success');
    }
  };

  const handleSelectLocation = (locationId: string) => {
    setGameState((prev) => ({
      ...prev,
      currentLocationId: locationId,
    }));
    const loc = LOCATIONS.find((l) => l.id === locationId);
    showToast('NUEVA UBICACIÓN', `Te has trasladado a ${loc?.nameKey ? t('es', loc.nameKey) : locationId}`, 'info');
  };

  const handleUnlockLocation = (locationId: string, cost: number) => {
    if (gameState.player.cash >= cost && !gameState.unlockedLocations.includes(locationId)) {
      setGameState((prev) => ({
        ...prev,
        unlockedLocations: [...prev.unlockedLocations, locationId],
        currentLocationId: locationId,
        player: {
          ...prev.player,
          cash: Math.round((prev.player.cash - cost) * 100) / 100,
        },
      }));
      showToast('UBICACIÓN DESBLOQUEADA', '¡Nuevo puesto comercial abierto!', 'success');
    }
  };

  const handleToggleStaff = (staffId: string) => {
    setGameState((prev) => {
      const isHired = Boolean(prev.staff[staffId]);
      showToast('PERSONAL', isHired ? 'Empleado despedido.' : 'Empleado contratado con éxito.', 'info');
      return {
        ...prev,
        staff: {
          ...prev.staff,
          [staffId]: !isHired,
        },
      };
    });
  };

  const handleStartMarketing = (campaignId: string, cost: number) => {
    if (gameState.player.cash >= cost) {
      const camp = gameState.activeMarketing.find((m) => m.id === campaignId);
      if (!camp) {
        setGameState((prev) => ({
          ...prev,
          player: {
            ...prev.player,
            cash: Math.round((prev.player.cash - cost) * 100) / 100,
          },
          activeMarketing: [
            ...prev.activeMarketing,
            {
              id: campaignId,
              nameKey: campaignId,
              cost,
              durationDays: 3,
              daysRemaining: 3,
              boostMultiplier: 1.4,
              icon: '📢',
            },
          ],
        }));
        showToast('PUBLICIDAD ACTIVA', 'Campaña publicitaria lanzada con éxito.', 'success');
      }
    }
  };

  const handleOpenStand = () => {
    const activeRubro = gameState.activeRubroId || 'lemonade';
    const activeRecipe = gameState.rubroRecipes?.[activeRubro] || gameState.recipe;
    const inv = gameState.inventory;

    if (activeRubro === 'lemonade') {
      if ((inv.cups || 0) <= 0 || (inv.lemons || 0) < (activeRecipe.lemonsPerPitcher || 4)) {
        sound.playBuzzer();
        showToast('SIN INGREDIENTES', 'Necesitas comprar más limones y vasos antes de abrir.', 'alert');
        return;
      }
    } else if (activeRubro === 'coffee') {
      if ((inv.coffee_cups || 0) <= 0 || (inv.coffee_beans || 0) < (activeRecipe.beansPerServing || 3)) {
        sound.playBuzzer();
        showToast('SIN SUMINISTROS', 'Necesitas comprar más granos de café y vasos de barista.', 'alert');
        return;
      }
    } else if (activeRubro === 'icecream') {
      if ((inv.waffle_cones || 0) <= 0 || (inv.cream_base || 0) < (activeRecipe.creamPerServing || 2)) {
        sound.playBuzzer();
        showToast('SIN SUMINISTROS', 'Necesitas comprar conos y base de crema gelato.', 'alert');
        return;
      }
    } else if (activeRubro === 'smoothies') {
      if ((inv.crystal_glasses || 0) <= 0 || (inv.tropical_fruits || 0) < (activeRecipe.fruitsPerServing || 2)) {
        sound.playBuzzer();
        showToast('SIN SUMINISTROS', 'Necesitas más fruta tropical y vasos de cóctel.', 'alert');
        return;
      }
    } else if (activeRubro === 'pizza') {
      if ((inv.pizza_boxes || 0) <= 0 || (inv.pizza_dough || 0) < (activeRecipe.doughPerServing || 2)) {
        sound.playBuzzer();
        showToast('SIN SUMINISTROS', 'Necesitas más masa madre y cajas para pizza.', 'alert');
        return;
      }
    }

    sound.startBgm();
    setGameState((prev) => ({ ...prev, currentPhase: 'day_simulation' }));
  };

  const handleFinishDay = (updatedState: GameState, alerts: string[]) => {
    sound.stopBgm();
    setGameState(updatedState);
    saveGameStateToSlot(updatedState, updatedState.saveSlot || 1);

    // Trigger alert toasts
    alerts.forEach((alt) => {
      const [type, val] = alt.split(':');
      if (type === 'alert_new_level' && settings.notifications.achievements) {
        showToast('¡SUBISTE DE NIVEL!', `Alcanzaste el Nivel ${val}. ¡Prestigio comercial aumentado!`, 'success');
      } else if (type === 'alert_achievement' && settings.notifications.achievements) {
        showToast('¡LOGRO DESBLOQUEADO!', `Has conseguido: ${val}`, 'success');
      } else if (type === 'alert_ice_melted' && settings.notifications.spoilage) {
        showToast('HIELO DERRETIDO', `Se derritieron ${val} cubos de hielo al anochecer.`, 'warning');
      } else if (type === 'alert_lemons_spoiled' && settings.notifications.spoilage) {
        showToast('MERMA DE LIMONES', `Se descartaron ${val} limones pasados.`, 'warning');
      }
    });

    // Weather warning for tomorrow if heatwave
    if (updatedState.weatherToday.type === 'heatwave' && settings.notifications.weatherAlert) {
      setTimeout(() => {
        showToast('PRONÓSTICO', '¡Se avecina una ola de calor hoy! Prepara hielo.', 'warning');
      }, 1500);
    }
  };

  const handleNextDay = () => {
    setGameState((prev) => ({
      ...prev,
      day: prev.day + 1,
      currentPhase: 'prep',
    }));
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLoadFriendChallenge = (code: string) => {
    showToast('DESAFÍO AMIGO', `Cargado desafío: ${code}. ¡Compite hoy!`, 'success');
    setShowMultiplayer(false);
  };

  const handleUnlockPin = () => {
    if (pinEntry === settings.pinCode) {
      sound.playFanfare();
      setIsPinLocked(false);
      setPinError(false);
    } else {
      sound.playBuzzer();
      setPinError(true);
    }
  };

  // Hardware D-pad and Game Boy buttons mapping
  const handleDpad = (dir: 'up' | 'down' | 'left' | 'right') => {
    // Responsive navigation
  };

  const handleButtonA = () => {
    if (gameState.currentPhase === 'prep') {
      handleOpenStand();
    } else if (gameState.currentPhase === 'night_summary') {
      handleNextDay();
    }
  };

  const handleButtonB = () => {
    if (showAnalytics || showMultiplayer || showSettings) {
      setShowAnalytics(false);
      setShowMultiplayer(false);
      setShowSettings(false);
    }
  };

  const handleSelect = () => {
    setShowSettings((prev) => !prev);
  };

  const handleStart = () => {
    if (gameState.currentPhase === 'prep') {
      handleOpenStand();
    }
  };

  return (
    <GameBoyFrame
      settings={settings}
      onDpad={handleDpad}
      onButtonA={handleButtonA}
      onButtonB={handleButtonB}
      onSelect={handleSelect}
      onStart={handleStart}
    >
      {/* Toast Notifications Overlay */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* PIN Security Gate if locked */}
      {isPinLocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0f0f0f] font-mono text-[#9bbc0f] text-center space-y-4">
          <div className="text-3xl">🔒</div>
          <div className="text-xs font-bold text-[#9bbc0f] uppercase">PARTIDA PROTEGIDA POR PIN</div>
          <div className="text-[9px] text-[#8bac0f]">Introduce el PIN de 4 dígitos para acceder</div>

          <input
            type="password"
            maxLength={4}
            value={pinEntry}
            onChange={(e) => {
              setPinEntry(e.target.value.replace(/\D/g, ''));
              setPinError(false);
            }}
            placeholder="••••"
            className="w-32 py-2 bg-[#1a1c1a] border-2 border-[#8bac0f] focus:border-[#9bbc0f] rounded text-center text-lg font-mono tracking-widest text-[#9bbc0f]"
          />

          {pinError && <div className="text-[9px] text-[#306230] bg-[#8bac0f] px-2 py-0.5 rounded font-bold uppercase">PIN INCORRECTO</div>}

          <button
            onClick={handleUnlockPin}
            className="px-6 py-2 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold text-xs rounded border-b-2 border-[#306230] uppercase cursor-pointer"
          >
            DESBLOQUEAR
          </button>
        </div>
      ) : showAnalytics ? (
        <AnalyticsView
          gameState={gameState}
          onClose={() => setShowAnalytics(false)}
        />
      ) : showMultiplayer ? (
        <MultiplayerView
          gameState={gameState}
          onClose={() => setShowMultiplayer(false)}
          onLoadFriendChallenge={handleLoadFriendChallenge}
        />
      ) : showSettings ? (
        <SettingsModal
          settings={settings}
          gameState={gameState}
          onUpdateSettings={handleUpdateSettings}
          onLoadState={(st) => setGameState(st)}
          onClose={() => setShowSettings(false)}
          onShowToast={showToast}
        />
      ) : gameState.currentPhase === 'day_simulation' ? (
        <DaySimulation
          gameState={gameState}
          onFinishDay={handleFinishDay}
        />
      ) : gameState.currentPhase === 'night_summary' ? (
        <NightSummary
          gameState={gameState}
          onNextDay={handleNextDay}
        />
      ) : (
        <PrepDashboard
          gameState={gameState}
          onUpdateInventory={handleUpdateInventory}
          onUpdateRecipe={handleUpdateRecipe}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onSelectLocation={handleSelectLocation}
          onUnlockLocation={handleUnlockLocation}
          onToggleStaff={handleToggleStaff}
          onStartMarketing={handleStartMarketing}
          onSwitchRubro={handleSwitchRubro}
          onUnlockRubro={handleUnlockRubro}
          onToggleRubroManager={handleToggleRubroManager}
          onOpenStand={handleOpenStand}
          onOpenAnalytics={() => setShowAnalytics(true)}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
    </GameBoyFrame>
  );
}
