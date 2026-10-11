import React, { useState } from 'react';
import { GameSettings, GameState } from '../types';
import { PALETTES } from '../game/constants';
import { sound } from '../audio/chiptune';
import { t, Language } from '../utils/i18n';
import {
  getSavedSlotsInfo,
  saveGameStateToSlot,
  loadGameStateFromSlot,
  deleteSaveSlot,
  exportEncryptedSaveToken,
  importEncryptedSaveToken,
} from '../utils/storage';

interface SettingsModalProps {
  settings: GameSettings;
  gameState: GameState;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onLoadState: (newState: GameState) => void;
  onClose: () => void;
  onShowToast: (title: string, msg: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  gameState,
  onUpdateSettings,
  onLoadState,
  onClose,
  onShowToast,
}) => {
  const lang = settings.language;
  const [activeTab, setActiveTab] = useState<'visuals' | 'audio' | 'saves' | 'security' | 'notifs'>('visuals');
  const [savedSlots, setSavedSlots] = useState(getSavedSlotsInfo());
  const [importTokenInput, setImportTokenInput] = useState('');
  const [pinInput, setPinInput] = useState(settings.pinCode || '');

  const handlePaletteChange = (paletteKey: keyof typeof PALETTES) => {
    sound.playButtonTone();
    onUpdateSettings({ ...settings, palette: paletteKey });
  };

  const handleFrameModeChange = (mode: 'gameboy' | 'modern_compact') => {
    sound.playButtonTone();
    onUpdateSettings({ ...settings, frameMode: mode });
  };

  const handleVolumeChange = (type: 'sfx' | 'bgm', val: number) => {
    const newSettings = { ...settings, [type === 'sfx' ? 'sfxVolume' : 'bgmVolume']: val };
    sound.setVolumes(newSettings.sfxVolume, newSettings.bgmVolume);
    if (type === 'sfx') sound.playCoin();
    onUpdateSettings(newSettings);
  };

  const handleSaveSlot = (slot: number) => {
    sound.playCoin();
    saveGameStateToSlot(gameState, slot);
    setSavedSlots(getSavedSlotsInfo());
    onShowToast('PARTIDA GUARDADA', `Guardado con éxito en Ranura ${slot}`, 'success');
  };

  const handleLoadSlot = (slot: number) => {
    const loaded = loadGameStateFromSlot(slot);
    if (loaded) {
      sound.playFanfare();
      onLoadState(loaded);
      onShowToast('PARTIDA CARGADA', `Cargada Ranura ${slot} (Día ${loaded.day})`, 'info');
      onClose();
    }
  };

  const handleDeleteSlot = (slot: number) => {
    sound.playBuzzer();
    deleteSaveSlot(slot);
    setSavedSlots(getSavedSlotsInfo());
  };

  const handleExportToken = () => {
    sound.playCoin();
    const token = exportEncryptedSaveToken(gameState);
    navigator.clipboard.writeText(token);
    onShowToast('CLAVE COPIADA', 'Token cifrado copiado al portapapeles.', 'success');
  };

  const handleImportToken = () => {
    if (!importTokenInput.trim()) return;
    const imported = importEncryptedSaveToken(importTokenInput.trim());
    if (imported) {
      sound.playFanfare();
      onLoadState(imported);
      onShowToast('NUBE SINCRONIZADA', 'Datos cifrados importados con éxito.', 'success');
      onClose();
    } else {
      sound.playBuzzer();
      onShowToast('ERROR', 'Clave cifrada no válida o corrupta.', 'alert');
    }
  };

  const handleSavePin = () => {
    sound.playButtonTone();
    onUpdateSettings({
      ...settings,
      pinLockEnabled: Boolean(pinInput.trim()),
      pinCode: pinInput.trim(),
    });
    onShowToast('SEGURIDAD', 'Ajustes de PIN 2FA actualizados.', 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] text-[#9bbc0f] font-mono p-3 sm:p-4 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#8bac0f]">
        <div className="flex items-center gap-2">
          <span className="text-[#8bac0f] text-sm">⚙️</span>
          <span className="text-xs font-bold text-[#9bbc0f] uppercase">{t(lang, 'settings_title')}</span>
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

      {/* Sub Tabs */}
      <div className="flex border-b-2 border-[#8bac0f] my-2 text-[9px] overflow-x-auto no-scrollbar">
        {[
          { id: 'visuals', label: '🎨 Gráficos' },
          { id: 'audio', label: '🔊 Sonido' },
          { id: 'saves', label: '💾 Guardado' },
          { id: 'notifs', label: '🔔 Alertas' },
          { id: 'security', label: '🔒 PIN 2FA' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.playButtonTone();
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`flex-1 py-1.5 px-2 text-center whitespace-nowrap uppercase font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#8bac0f] text-[#0f380f]'
                : 'text-[#8bac0f] hover:bg-[#1a1c1a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 text-[10px]">
        {/* TAB 1: VISUALS */}
        {activeTab === 'visuals' && (
          <div className="space-y-3">
            {/* Screen Format */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-2">
              <div className="font-bold text-[#9bbc0f] uppercase">{t(lang, 'frame_mode')}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFrameModeChange('gameboy')}
                  className={`p-2 rounded border flex flex-col items-center gap-1 uppercase font-bold ${
                    settings.frameMode === 'gameboy'
                      ? 'bg-[#8bac0f] text-[#0f380f] border-b-2 border-[#306230]'
                      : 'bg-[#0f380f] text-[#9bbc0f] border-[#8bac0f]'
                  }`}
                >
                  <span className="text-sm">🎮</span>
                  <span className="text-[9px]">{t(lang, 'frame_gameboy')}</span>
                </button>
                <button
                  onClick={() => handleFrameModeChange('modern_compact')}
                  className={`p-2 rounded border flex flex-col items-center gap-1 uppercase font-bold ${
                    settings.frameMode === 'modern_compact'
                      ? 'bg-[#8bac0f] text-[#0f380f] border-b-2 border-[#306230]'
                      : 'bg-[#0f380f] text-[#9bbc0f] border-[#8bac0f]'
                  }`}
                >
                  <span className="text-sm">📱</span>
                  <span className="text-[9px]">{t(lang, 'frame_modern')}</span>
                </button>
              </div>
            </div>

            {/* 8-Bit Color Palette */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-2">
              <div className="font-bold text-[#9bbc0f] uppercase">{t(lang, 'palette_theme')}</div>
              <div className="space-y-1.5">
                {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((key) => {
                  const pal = PALETTES[key];
                  const isSelected = settings.palette === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePaletteChange(key)}
                      className={`w-full p-2 rounded border flex items-center justify-between uppercase text-[9px] font-bold ${
                        isSelected
                          ? 'border-[#8bac0f] bg-[#8bac0f] text-[#0f380f]'
                          : 'border-[#8bac0f]/40 bg-[#0f0f0f] text-[#9bbc0f] hover:bg-[#1a1c1a]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-[#8bac0f]"
                          style={{ backgroundColor: pal.surface }}
                        />
                        <span>{t(lang, pal.nameKey)}</span>
                      </div>
                      {isSelected && <span className="text-[#0f380f] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CRT Scanlines Toggle */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded flex items-center justify-between">
              <div>
                <div className="font-bold text-[#9bbc0f] uppercase">{t(lang, 'scanlines')}</div>
                <div className="text-[8px] text-[#8bac0f]">Efecto retro de tubo catódico</div>
              </div>
              <input
                type="checkbox"
                checked={settings.scanlines}
                onChange={(e) => {
                  sound.playButtonTone();
                  onUpdateSettings({ ...settings, scanlines: e.target.checked });
                }}
                className="w-4 h-4 accent-[#8bac0f] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            {/* SFX Volume */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between font-bold text-[#9bbc0f] uppercase">
                <span>{t(lang, 'sfx_vol')}</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-[#8bac0f] cursor-pointer"
              />
            </div>

            {/* BGM Volume */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between font-bold text-[#9bbc0f] uppercase">
                <span>{t(lang, 'bgm_vol')}</span>
                <span>{Math.round(settings.bgmVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.bgmVolume}
                onChange={(e) => handleVolumeChange('bgm', parseFloat(e.target.value))}
                className="w-full accent-[#8bac0f] cursor-pointer"
              />
            </div>

            {/* Mute toggle button */}
            <button
              onClick={() => {
                const muted = sound.toggleMute();
                onShowToast('AUDIO', muted ? 'Audio silenciado' : 'Audio activado', 'info');
              }}
              className="w-full py-2.5 bg-[#0f380f] hover:bg-[#1a4a1a] border border-[#8bac0f] rounded text-[#9bbc0f] font-bold uppercase cursor-pointer"
            >
              🔈 {t(lang, 'mute_all')}
            </button>
          </div>
        )}

        {/* TAB 3: SAVES & CLOUD */}
        {activeTab === 'saves' && (
          <div className="space-y-3">
            {/* Local Slots */}
            <div className="space-y-2">
              <div className="font-bold text-[#8bac0f] uppercase">{t(lang, 'save_management')}</div>
              {savedSlots.map((slotInfo) => (
                <div
                  key={slotInfo.slot}
                  className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#9bbc0f]">Ranura {slotInfo.slot}</div>
                    <div className="text-[9px] text-[#8bac0f]">
                      {slotInfo.exists
                        ? `Día ${slotInfo.day} - $${slotInfo.cash?.toFixed(2)}`
                        : t(lang, 'slot_empty')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSaveSlot(slotInfo.slot)}
                      className="px-2.5 py-1 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold rounded text-[9px] border-b-2 border-[#306230] uppercase cursor-pointer"
                    >
                      Guardar
                    </button>
                    {slotInfo.exists && (
                      <>
                        <button
                          onClick={() => handleLoadSlot(slotInfo.slot)}
                          className="px-2.5 py-1 bg-[#0f380f] hover:bg-[#1a4a1a] text-[#9bbc0f] border border-[#8bac0f] font-bold rounded text-[9px] uppercase cursor-pointer"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slotInfo.slot)}
                          className="px-2 py-1 bg-[#000000] hover:bg-zinc-800 text-[#8bac0f] border border-[#8bac0f]/40 rounded text-[9px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cloud Sync Tokens */}
            <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-2">
              <div className="font-bold text-[#9bbc0f] uppercase">{t(lang, 'cloud_sync_title')}</div>
              <div className="text-[8px] text-[#8bac0f]">ID de Nube: {gameState.cloudSyncId}</div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportToken}
                  className="flex-1 py-2 bg-[#0f380f] hover:bg-[#1a4a1a] border border-[#8bac0f] rounded text-[9px] font-bold text-[#9bbc0f] uppercase cursor-pointer"
                >
                  📤 {t(lang, 'export_save')}
                </button>
              </div>

              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Pegar clave cifrada..."
                  value={importTokenInput}
                  onChange={(e) => setImportTokenInput(e.target.value)}
                  className="flex-1 bg-[#0f0f0f] border border-[#8bac0f] rounded px-2 py-1 text-[9px] font-mono text-[#9bbc0f] placeholder:text-[#8bac0f]/40"
                />
                <button
                  onClick={handleImportToken}
                  className="px-3 py-1 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold rounded text-[9px] border-b-2 border-[#306230] uppercase cursor-pointer"
                >
                  Importar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifs' && (
          <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-2.5">
            <div className="font-bold text-[#9bbc0f] uppercase">{t(lang, 'push_title')}</div>
            {[
              { key: 'lowStock', label: t(lang, 'notif_stock') },
              { key: 'weatherAlert', label: t(lang, 'notif_weather') },
              { key: 'spoilage', label: t(lang, 'notif_spoilage') },
              { key: 'dailyProfit', label: t(lang, 'notif_profit') },
              { key: 'achievements', label: t(lang, 'notif_achieve') },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <span className="text-[#8bac0f]">{n.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.notifications[n.key as keyof typeof settings.notifications])}
                  onChange={(e) => {
                    sound.playButtonTone();
                    onUpdateSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        [n.key]: e.target.checked,
                      },
                    });
                  }}
                  className="w-4 h-4 accent-[#8bac0f] cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: SECURITY / PIN 2FA */}
        {activeTab === 'security' && (
          <div className="bg-[#1a1c1a] border-2 border-[#8bac0f] p-3 rounded space-y-2.5">
            <div className="font-bold text-[#9bbc0f] uppercase">{t(lang, 'security_pin_title')}</div>
            <div className="text-[9px] text-[#8bac0f] leading-tight">
              Protege el acceso a tu partida con un código PIN de seguridad de 4 dígitos.
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="password"
                maxLength={4}
                placeholder="4 dígitos..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-28 bg-[#0f0f0f] border border-[#8bac0f] rounded px-2 py-1 text-center text-sm font-mono tracking-widest text-[#9bbc0f]"
              />
              <button
                onClick={handleSavePin}
                className="flex-1 py-1.5 bg-[#8bac0f] hover:bg-[#9bbc0f] text-[#0f380f] font-bold rounded text-[9px] border-b-2 border-[#306230] uppercase cursor-pointer"
              >
                Guardar PIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
