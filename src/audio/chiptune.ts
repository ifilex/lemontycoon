/**
 * 8-Bit Chiptune Audio Synthesizer Engine using Web Audio API
 * Generates authentic Game Boy style square, triangle, and noise waveforms
 */

class ChiptuneEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVol: number = 0.7;
  private bgmVol: number = 0.5;
  private isBgmPlaying: boolean = false;
  private bgmTimeout: number | null = null;
  private currentStep: number = 0;

  // Melody notes in Hz (C Major / Pentatonic 8-bit Lemon Tycoon theme)
  private readonly melodyNotes: (number | null)[] = [
    261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, null,
    293.66, 349.23, 440.00, 587.33, 440.00, 349.23, 293.66, null,
    329.63, 392.00, 493.88, 659.25, 523.25, 392.00, 329.63, 293.66,
    261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, null
  ];

  private readonly bassNotes: (number | null)[] = [
    130.81, null, 130.81, null, 196.00, null, 196.00, null,
    146.83, null, 146.83, null, 220.00, null, 220.00, null,
    164.81, null, 164.81, null, 196.00, null, 196.00, null,
    130.81, null, 164.81, null, 196.00, null, 130.81, null
  ];

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(sfx: number, bgm: number) {
    this.sfxVol = Math.max(0, Math.min(1, sfx));
    this.bgmVol = Math.max(0, Math.min(1, bgm));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  public startBgm() {
    if (this.isMuted || this.bgmVol <= 0 || this.isBgmPlaying) return;
    this.initContext();
    this.isBgmPlaying = true;
    this.currentStep = 0;
    this.playBgmLoop();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimeout !== null) {
      window.clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
  }

  private playBgmLoop() {
    if (!this.isBgmPlaying || this.isMuted || !this.ctx) return;

    const note = this.melodyNotes[this.currentStep % this.melodyNotes.length];
    const bass = this.bassNotes[this.currentStep % this.bassNotes.length];
    const isSnare = (this.currentStep % 4 === 2);
    const isHiHat = (this.currentStep % 2 === 0);

    const now = this.ctx.currentTime;
    const stepDuration = 0.16; // Tempo ~94 BPM 16th notes

    // Lead Pulse Synth
    if (note !== null && this.bgmVol > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.08 * this.bgmVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + stepDuration);
    }

    // Bass Triangle Synth
    if (bass !== null && this.bgmVol > 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bass, now);

      bassGain.gain.setValueAtTime(0.12 * this.bgmVol, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);
    }

    // Retro Noise Percussion (Snare & HiHat)
    if ((isSnare || isHiHat) && this.bgmVol > 0) {
      this.playNoise(now, isSnare ? 0.08 : 0.03, isSnare ? 0.05 : 0.02);
    }

    this.currentStep = (this.currentStep + 1) % this.melodyNotes.length;

    this.bgmTimeout = window.setTimeout(() => {
      this.playBgmLoop();
    }, stepDuration * 1000);
  }

  private playNoise(startTime: number, duration: number, volume: number) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.bgmVol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(startTime);
  }

  // --- Retro Sound Effects ---

  public playButtonTone() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.1 * this.sfxVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playCoin() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.15 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playPour() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Splash noise + pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.12 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSqueeze() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.15 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playFanfare() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.12 * this.sfxVol, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.2);
    });
  }

  public playBuzzer() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(120, now + 0.1);

    gain.gain.setValueAtTime(0.15 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playDayStart() {
    if (this.isMuted || this.sfxVol <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12 * this.sfxVol, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.16);
    });
  }
}

export const sound = new ChiptuneEngine();
