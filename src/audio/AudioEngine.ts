import type { SoundName } from '../data/steps';

type VolumeState = { master: number; keys: number; assembly: number; ui: number };

const MAX_VOICES = 16;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Fully synthesised Web Audio sound design.
 * No remote samples or services are used. All sounds are deliberately described
 * as simulations rather than recordings of a specific keyboard.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private keysBus: GainNode | null = null;
  private assemblyBus: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private timelineBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  private timelineSources = new Set<AudioScheduledSourceNode>();
  private outputEnabled = false;
  private volumes: VolumeState = { master: 0.7, keys: 0.85, assembly: 0.8, ui: 0.55 };

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  get contextState(): string {
    return this.ctx?.state ?? 'closed';
  }

  async init(): Promise<void> {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor({ latencyHint: 'interactive' });
      const master = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      master.gain.value = this.volumes.master;
      master.connect(compressor);
      compressor.connect(ctx.destination);
      const keysBus = ctx.createGain();
      const assemblyBus = ctx.createGain();
      const uiBus = ctx.createGain();
      const timelineBus = ctx.createGain();
      keysBus.gain.value = this.volumes.keys;
      assemblyBus.gain.value = this.volumes.assembly;
      uiBus.gain.value = this.volumes.ui;
      timelineBus.gain.value = 1;
      keysBus.connect(master);
      assemblyBus.connect(master);
      uiBus.connect(master);
      timelineBus.connect(assemblyBus);
      this.ctx = ctx;
      this.master = master;
      this.keysBus = keysBus;
      this.assemblyBus = assemblyBus;
      this.uiBus = uiBus;
      this.timelineBus = timelineBus;
      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // A later user gesture will retry.
      }
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  setOutputEnabled(enabled: boolean): void {
    this.outputEnabled = enabled;
    if (!enabled) this.cancelTimeline();
  }

  setVolumes(volumes: Partial<VolumeState>): void {
    this.volumes = { ...this.volumes, ...volumes };
    if (this.master) this.master.gain.value = this.volumes.master;
    if (this.keysBus) this.keysBus.gain.value = this.volumes.keys;
    if (this.assemblyBus) this.assemblyBus.gain.value = this.volumes.assembly;
    if (this.uiBus) this.uiBus.gain.value = this.volumes.ui;
  }

  setMuted(muted: boolean): void {
    this.outputEnabled = !muted;
    if (muted) this.cancelTimeline();
  }

  private get usable(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running' && this.outputEnabled);
  }

  private register(source: AudioScheduledSourceNode, timeline = false): boolean {
    if (this.voices.size >= MAX_VOICES) return false;
    this.voices.add(source);
    if (timeline) this.timelineSources.add(source);
    source.addEventListener('ended', () => {
      this.voices.delete(source);
      this.timelineSources.delete(source);
      try {
        source.disconnect();
      } catch {
        // already disconnected
      }
    });
    return true;
  }

  cancelTimeline(): void {
    for (const source of this.timelineSources) {
      try {
        source.stop();
      } catch {
        // source already stopped
      }
    }
    this.timelineSources.clear();
  }

  /* ------------------------------------------------------------------ */
  /* Primitive voices                                                   */
  /* ------------------------------------------------------------------ */

  private noise(
    when: number,
    duration: number,
    gain: number,
    options: {
      type?: BiquadFilterType;
      frequency?: number;
      q?: number;
      destination?: AudioNode | null;
      playbackRate?: number;
      timeline?: boolean;
    } = {},
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.playbackRate.value = options.playbackRate ?? 1;
    const filter = ctx.createBiquadFilter();
    filter.type = options.type ?? 'bandpass';
    filter.frequency.value = options.frequency ?? 1800;
    filter.Q.value = options.q ?? 0.9;
    const amp = ctx.createGain();
    const peak = Math.max(0.0001, gain);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(peak, when + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(options.destination ?? this.assemblyBus ?? ctx.destination);
    if (!this.register(source, options.timeline)) return;
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  private tone(
    when: number,
    duration: number,
    gain: number,
    startFrequency: number,
    endFrequency: number,
    options: {
      type?: OscillatorType;
      destination?: AudioNode | null;
      attack?: number;
      timeline?: boolean;
      detune?: number;
    } = {},
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(startFrequency, when);
    if (endFrequency !== startFrequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), when + duration);
    }
    if (options.detune) osc.detune.value = options.detune;
    const amp = ctx.createGain();
    const attack = options.attack ?? 0.002;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), when + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(amp);
    amp.connect(options.destination ?? this.assemblyBus ?? ctx.destination);
    if (!this.register(osc, options.timeline)) return;
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  /* ------------------------------------------------------------------ */
  /* Keyboard sounds                                                    */
  /* ------------------------------------------------------------------ */

  keyDown(isLong: boolean, code: string): void {
    if (!this.usable) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.001;
    const seed = code.charCodeAt(0) % 7;
    const pitch = 1 + (seed - 3) * 0.018 + rand(-0.01, 0.01);
    const volume = rand(0.85, 1);
    if (isLong) {
      this.tone(t, rand(0.19, 0.25), 0.18 * volume, 118 * pitch, 66, {
        destination: this.keysBus,
        type: 'sine',
      });
      this.tone(t, 0.09, 0.06 * volume, 230 * pitch, 140, {
        destination: this.keysBus,
        type: 'triangle',
      });
      this.noise(t, rand(0.09, 0.13), 0.11 * volume, {
        type: 'bandpass',
        frequency: rand(700, 1050),
        q: 0.7,
        destination: this.keysBus,
      });
      this.noise(t + 0.008, 0.06, 0.05 * volume, {
        type: 'lowpass',
        frequency: 480,
        destination: this.keysBus,
      });
    } else {
      this.tone(t, rand(0.07, 0.1), 0.095 * volume, 190 * pitch, 130, {
        destination: this.keysBus,
        type: 'triangle',
      });
      this.noise(t, rand(0.025, 0.045), 0.075 * volume, {
        type: 'bandpass',
        frequency: rand(1900, 3300),
        q: 1.1,
        destination: this.keysBus,
      });
      this.tone(t + 0.002, 0.045, 0.028 * volume, 560 * pitch, 420, {
        destination: this.keysBus,
        type: 'sine',
      });
    }
  }

  keyUp(isLong: boolean, code: string): void {
    if (!this.usable) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.001;
    const seed = code.charCodeAt(0) % 5;
    const pitch = 1 + (seed - 2) * 0.02;
    if (isLong) {
      this.tone(t, 0.11, 0.1, 128 * pitch, 88, { destination: this.keysBus });
      this.noise(t, 0.05, 0.05, {
        type: 'bandpass',
        frequency: 900,
        q: 0.8,
        destination: this.keysBus,
      });
    } else {
      this.noise(t, 0.02, 0.04, {
        type: 'highpass',
        frequency: 2400,
        destination: this.keysBus,
      });
      this.tone(t, 0.04, 0.035, 330 * pitch, 250, {
        destination: this.keysBus,
        type: 'triangle',
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Timeline / assembly sounds                                         */
  /* ------------------------------------------------------------------ */

  playTimeline(sound: SoundName, gain = 1): void {
    if (!this.usable) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.005;
    const g = gain;
    const timeline = true;
    switch (sound) {
      case 'keycap-pull':
        this.noise(t, 0.045, 0.11 * g, {
          type: 'bandpass',
          frequency: rand(1600, 2400),
          q: 1.4,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.08, 0.075 * g, rand(420, 520), 240, {
          destination: this.timelineBus,
          type: 'triangle',
          timeline,
        });
        break;
      case 'keycap-pull-long':
        this.noise(t, 0.09, 0.09 * g, {
          type: 'bandpass',
          frequency: 1200,
          q: 0.8,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.16, 0.1 * g, 330, 160, {
          destination: this.timelineBus,
          type: 'sine',
          timeline,
        });
        this.tone(t + 0.045, 0.06, 0.04 * g, 740, 520, {
          destination: this.timelineBus,
          type: 'triangle',
          timeline,
        });
        break;
      case 'switch-pull':
      case 'switch-insert': {
        const insert = sound === 'switch-insert';
        this.noise(t, 0.03, 0.12 * g, {
          type: 'bandpass',
          frequency: insert ? 2600 : 1800,
          q: 1.2,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.05, 0.08 * g, insert ? 520 : 380, insert ? 300 : 200, {
          destination: this.timelineBus,
          type: 'square',
          timeline,
        });
        if (insert) {
          this.tone(t + 0.022, 0.12, 0.035 * g, 2650, 2500, {
            destination: this.timelineBus,
            type: 'sine',
            timeline,
          });
        }
        break;
      }
      case 'screw':
        for (let i = 0; i < 5; i += 1) {
          const at = t + i * 0.052;
          this.noise(at, 0.022, 0.055 * g, {
            type: 'bandpass',
            frequency: 1900 + i * 90,
            q: 2.2,
            destination: this.timelineBus,
            timeline,
          });
          this.tone(at, 0.026, 0.028 * g, 900 + i * 40, 780 + i * 30, {
            destination: this.timelineBus,
            type: 'square',
            timeline,
          });
        }
        break;
      case 'screw-lock':
        this.noise(t, 0.025, 0.1 * g, {
          type: 'bandpass',
          frequency: 2200,
          q: 1.8,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.12, 0.09 * g, 240, 130, {
          destination: this.timelineBus,
          type: 'sine',
          timeline,
        });
        break;
      case 'aluminum-tap':
        this.tone(t, 0.28, 0.075 * g, 1380, 1290, {
          destination: this.timelineBus,
          type: 'sine',
          timeline,
        });
        this.tone(t, 0.16, 0.04 * g, 2090, 2010, {
          destination: this.timelineBus,
          type: 'sine',
          timeline,
        });
        this.noise(t, 0.03, 0.05 * g, {
          type: 'highpass',
          frequency: 3000,
          destination: this.timelineBus,
          timeline,
        });
        break;
      case 'plastic-tap':
        this.noise(t, 0.025, 0.08 * g, {
          type: 'bandpass',
          frequency: 1700,
          q: 1.1,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.06, 0.06 * g, 760, 480, {
          destination: this.timelineBus,
          type: 'triangle',
          timeline,
        });
        break;
      case 'plate-tap':
        this.noise(t, 0.035, 0.09 * g, {
          type: 'bandpass',
          frequency: 1250,
          q: 1.5,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.1, 0.07 * g, 590, 300, {
          destination: this.timelineBus,
          type: 'triangle',
          timeline,
        });
        break;
      case 'foam-tap':
        this.noise(t, 0.1, 0.08 * g, {
          type: 'lowpass',
          frequency: 420,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.09, 0.04 * g, 190, 110, {
          destination: this.timelineBus,
          timeline,
        });
        break;
      case 'connector-out':
        this.noise(t, 0.025, 0.09 * g, {
          type: 'bandpass',
          frequency: 2400,
          q: 1.4,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.05, 0.05 * g, 700, 400, {
          destination: this.timelineBus,
          type: 'square',
          timeline,
        });
        this.noise(t + 0.07, 0.05, 0.05 * g, {
          type: 'bandpass',
          frequency: 1400,
          destination: this.timelineBus,
          timeline,
        });
        break;
      case 'connector-in':
        this.noise(t, 0.02, 0.08 * g, {
          type: 'bandpass',
          frequency: 2800,
          q: 1.6,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t + 0.015, 0.06, 0.05 * g, 480, 320, {
          destination: this.timelineBus,
          type: 'triangle',
          timeline,
        });
        break;
      case 'stab-pull':
        this.noise(t, 0.04, 0.06 * g, {
          type: 'bandpass',
          frequency: 3200,
          q: 2.4,
          destination: this.timelineBus,
          timeline,
        });
        this.tone(t, 0.14, 0.045 * g, 1900, 1750, {
          destination: this.timelineBus,
          type: 'sine',
          timeline,
        });
        this.noise(t + 0.05, 0.03, 0.05 * g, {
          type: 'bandpass',
          frequency: 1500,
          destination: this.timelineBus,
          timeline,
        });
        break;
      case 'spring':
        this.tone(t, 0.24, 0.05 * g, 240, 320, {
          destination: this.timelineBus,
          type: 'sine',
          timeline,
        });
        this.tone(t + 0.02, 0.22, 0.025 * g, 480, 640, {
          destination: this.timelineBus,
          type: 'triangle',
          timeline,
        });
        break;
      case 'complete':
        this.tone(t, 0.16, 0.05 * g, 1046.5, 1046.5, {
          destination: this.uiBus,
          timeline,
        });
        this.tone(t + 0.11, 0.3, 0.045 * g, 1568, 1568, {
          destination: this.uiBus,
          timeline,
        });
        break;
      case 'ui':
        this.tone(t, 0.05, 0.03, 880, 1040, { destination: this.uiBus, timeline });
        break;
      default:
        break;
    }
  }

  playUi(): void {
    if (!this.usable) return;
    this.playTimeline('ui', 0.6);
  }

  dispose(): void {
    this.cancelTimeline();
    for (const source of this.voices) {
      try {
        source.stop();
      } catch {
        // noop
      }
    }
    this.voices.clear();
    this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.keysBus = null;
    this.assemblyBus = null;
    this.uiBus = null;
    this.timelineBus = null;
  }
}

export const audioEngine = new AudioEngine();
