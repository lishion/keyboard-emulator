import * as THREE from 'three';
import { ASSEMBLY_STEPS, HERO_STEP_INDEX, TOTAL_STEPS, type AssemblyStep, type SoundName } from '../data/steps';
import { HERO_PARTS, PART_BY_ID, type PartDefinition } from '../data/parts';
import { KEY_BY_CODE } from '../data/layout';
import { audioEngine } from '../audio/AudioEngine';
import { speechService } from '../audio/speech';
import { useAppStore } from './store';

export interface RegistryEntry {
  object: THREE.Object3D;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  pressCode?: string;
}

const registry = new Map<string, RegistryEntry>();

export function registerPart(id: string, object: THREE.Object3D, pressCode?: string): () => void {
  registry.set(id, {
    object,
    basePosition: object.position.clone(),
    baseRotation: object.rotation.clone(),
    pressCode,
  });
  return () => {
    const current = registry.get(id);
    if (current?.object === object) registry.delete(id);
  };
}

interface KeyPhysics {
  depth: number;
  velocity: number;
  target: number;
  pressed: boolean;
  autoRelease: number | null;
}

interface MoveDelta {
  dx: number;
  dy: number;
  dz: number;
  rx: number;
  ry: number;
  rz: number;
  delay: number;
}

interface Offset {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

const HERO_IDS = new Set(HERO_PARTS.map((part) => part.id));
const STEP_DURATIONS = [2200, 2400, 3300, 2300, 3400, 2300, 2800, 2400, 2800, 2200, 2600, 3000];

const ZERO_OFFSET: Offset = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function deg(value: number): number {
  return (value * Math.PI) / 180;
}

function buildStepDeltas(step: AssemblyStep): Map<string, MoveDelta> {
  const map = new Map<string, MoveDelta>();
  for (const move of step.moves) {
    const count = move.ids.length;
    move.ids.forEach((id, index) => {
      const delay = move.stagger && count > 1 ? (index / (count - 1)) * 0.55 : 0;
      const current = map.get(id);
      if (current) {
        current.dx += move.delta[0];
        current.dy += move.delta[1];
        current.dz += move.delta[2];
        current.rx += move.rotation?.[0] ?? 0;
        current.ry += move.rotation?.[1] ?? 0;
        current.rz += move.rotation?.[2] ?? 0;
        current.delay = Math.min(current.delay, delay);
      } else {
        map.set(id, {
          dx: move.delta[0],
          dy: move.delta[1],
          dz: move.delta[2],
          rx: move.rotation?.[0] ?? 0,
          ry: move.rotation?.[1] ?? 0,
          rz: move.rotation?.[2] ?? 0,
          delay,
        });
      }
    });
  }
  return map;
}

const STEP_DELTAS = ASSEMBLY_STEPS.map(buildStepDeltas);

type MotionDirection = 1 | -1;

interface TeachState {
  completedThrough: number;
  active: number | null;
  progress: number;
  motion: MotionDirection;
  direction: 1 | -1;
  playing: boolean;
  speed: number;
  autoPlay: boolean;
  fired: Set<string>;
  autoNextTimer: number;
}

class Director {
  explode = 0;
  explodeTarget = 0;
  axisExplode = 0;
  axisExplodeTarget = 0;
  axisPress = 0;
  axisPressTarget = 0;

  private keys = new Map<string, KeyPhysics>();
  private cumulative: Map<string, Offset> = new Map();
  private activeDeltas: Map<string, MoveDelta> | null = null;
  private cumulativeFor = -2;
  private activeFor = -2;

  private teach: TeachState = {
    completedThrough: -1,
    active: null,
    progress: 0,
    motion: 1,
    direction: 1,
    playing: false,
    speed: 1,
    autoPlay: true,
    fired: new Set(),
    autoNextTimer: 0,
  };

  private lastExplodeSync = 0;
  private lastProgressSync = 0;
  private wasHeroStep = false;
  private tmpEuler = new THREE.Euler();
  private tmpQuaternion = new THREE.Quaternion();

  get isHeroStage(): boolean {
    const mode = useAppStore.getState().mode;
    if (mode === 'axis') return true;
    if (mode !== 'teach') return false;
    return this.currentStepIndex() >= HERO_STEP_INDEX;
  }

  /* ------------------------------------------------------------------ */
  /* Explosion                                                          */
  /* ------------------------------------------------------------------ */

  setExplodeTarget(value: number): void {
    this.explodeTarget = clamp(value, 0, 1);
    this.syncExplode(true);
  }

  setAxisExplodeTarget(value: number): void {
    this.axisExplodeTarget = clamp(value, 0, 1);
  }

  setAxisPress(value: number): void {
    this.axisPressTarget = clamp(value, 0, 4);
  }

  snapExplode(value: number): void {
    this.explode = clamp(value, 0, 1);
    this.explodeTarget = this.explode;
    this.syncExplode(true);
  }

  snapAxisExplode(value: number): void {
    this.axisExplode = clamp(value, 0, 1);
    this.axisExplodeTarget = this.axisExplode;
  }

  getExplode(): number {
    return this.explode;
  }

  getAxisExplode(): number {
    return this.axisExplode;
  }

  getAxisPress(): number {
    return this.axisPress;
  }

  private updateExplosion(dt: number): void {
    const blend = 1 - Math.exp(-dt * 5.5);
    this.explode += (this.explodeTarget - this.explode) * blend;
    if (Math.abs(this.explodeTarget - this.explode) < 0.0005) this.explode = this.explodeTarget;
    this.axisExplode += (this.axisExplodeTarget - this.axisExplode) * blend;
    if (Math.abs(this.axisExplodeTarget - this.axisExplode) < 0.0005) {
      this.axisExplode = this.axisExplodeTarget;
    }
    const store = useAppStore.getState();
    const held = store.axisPressHeld;
    const target = held ? 3.9 : this.axisPressTarget;
    const springBlend = 1 - Math.exp(-dt * 16);
    this.axisPress += (target - this.axisPress) * springBlend;
    if (Math.abs(target - this.axisPress) < 0.001) this.axisPress = target;
  }

  /* ------------------------------------------------------------------ */
  /* Key physics & interaction                                          */
  /* ------------------------------------------------------------------ */

  private keyState(code: string): KeyPhysics {
    let state = this.keys.get(code);
    if (!state) {
      state = { depth: 0, velocity: 0, target: 0, pressed: false, autoRelease: null };
      this.keys.set(code, state);
    }
    return state;
  }

  private canPress(code: string): boolean {
    const store = useAppStore.getState();
    if (store.mode !== 'preview') return false;
    if (this.explode > 0.06) return false;
    if (!store.categoryVisibility.keycaps) return false;
    const key = KEY_BY_CODE[code];
    if (!key) return false;
    if (store.isolateId && store.isolateId !== key.id) return false;
    return true;
  }

  pressKey(code: string, source: 'keyboard' | 'pointer' = 'keyboard'): void {
    if (!this.canPress(code)) return;
    const key = KEY_BY_CODE[code];
    if (!key) return;
    const state = this.keyState(code);
    if (state.pressed && source === 'keyboard') return;
    state.pressed = true;
    state.target = key.stabSpacing !== undefined ? 3.85 : 3.55;
    state.autoRelease = source === 'pointer' ? performance.now() / 1000 + 0.14 : null;
    useAppStore.getState().setPressed(code, true);
    audioEngine.keyDown(key.widthU > 1.5, code);
  }

  releaseKey(code: string, silent = false): void {
    const state = this.keys.get(code);
    if (!state) return;
    const wasPressed = state.pressed;
    state.pressed = false;
    state.target = 0;
    state.autoRelease = null;
    if (wasPressed && !silent) {
      const key = KEY_BY_CODE[code];
      audioEngine.keyUp(key?.widthU !== undefined && key.widthU > 1.5, code);
    }
    useAppStore.getState().setPressed(code, false);
  }

  releaseAllKeys(silent = true): void {
    for (const [code, state] of this.keys) {
      if (!state.pressed) continue;
      state.pressed = false;
      state.target = 0;
      state.autoRelease = null;
      if (!silent) audioEngine.keyUp(false, code);
      useAppStore.getState().setPressed(code, false);
    }
  }

  getKeyDepth(code: string): number {
    return this.keys.get(code)?.depth ?? 0;
  }

  isKeyPressed(code: string): boolean {
    return this.keys.get(code)?.pressed ?? false;
  }

  private updateKeys(dt: number): void {
    const now = performance.now() / 1000;
    // Fixed-step integration keeps the spring stable even when a frame is long
    // (background tab, slow GPU or a mobile device dropping frames).
    const stepSize = 1 / 120;
    const frameDt = Math.min(dt, 0.1);
    for (const [code, state] of this.keys) {
      if (state.autoRelease !== null && now >= state.autoRelease) {
        this.releaseKey(code);
      }
      const key = KEY_BY_CODE[code];
      const stiffness = key && key.widthU > 2 ? 1500 : 2300;
      const damping = key && key.widthU > 2 ? 62 : 78;
      let remaining = frameDt;
      while (remaining > 0.00001) {
        const step = Math.min(stepSize, remaining);
        const acceleration = (state.target - state.depth) * stiffness - state.velocity * damping;
        state.velocity += acceleration * step;
        state.velocity = Math.max(-30, Math.min(30, state.velocity));
        state.depth += state.velocity * step;
        state.depth = Math.max(0, Math.min(4.05, state.depth));
        remaining -= step;
      }
      if (state.target === 0 && state.depth < 0.002 && Math.abs(state.velocity) < 0.02) {
        state.depth = 0;
        state.velocity = 0;
      }
      if (Math.abs(state.target - state.depth) < 0.002 && Math.abs(state.velocity) < 0.02) {
        state.depth = state.target;
        state.velocity = 0;
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Teaching timeline                                                  */
  /* ------------------------------------------------------------------ */

  getTeaching() {
    return this.teach;
  }

  currentStepIndex(): number {
    if (this.teach.active !== null) return this.teach.active;
    return this.teach.direction === 1
      ? clamp(this.teach.completedThrough + 1, 0, TOTAL_STEPS)
      : clamp(this.teach.completedThrough, 0, TOTAL_STEPS);
  }

  getCurrentStepCamera(): { position: [number, number, number]; target: [number, number, number] } | null {
    const index = this.currentStepIndex();
    const step = ASSEMBLY_STEPS[clamp(index, 0, TOTAL_STEPS - 1)];
    if (!step) return null;
    return { position: [...step.camera.position], target: [...step.camera.target] };
  }

  prepareTeaching(): void {
    this.teach.playing = false;
    this.teach.autoNextTimer = 0;
    this.commitActive();
    this.syncTeaching(true);
  }

  setDirection(direction: 1 | -1): void {
    if (this.teach.direction === direction) return;
    this.teach.playing = false;
    this.teach.active = null;
    this.teach.progress = 0;
    this.teach.fired.clear();
    this.teach.direction = direction;
    this.teach.completedThrough = direction === 1 ? -1 : TOTAL_STEPS - 1;
    this.teach.motion = direction;
    this.teach.autoNextTimer = 0;
    audioEngine.cancelTimeline();
    speechService.cancel();
    const camera = this.getCurrentStepCamera();
    if (camera) useAppStore.getState().requestCamera('teach', camera);
    this.syncTeaching(true);
  }

  play(): void {
    if (this.teach.active !== null) {
      this.teach.playing = true;
      this.syncTeaching(true);
      return;
    }
    const next = this.nextPlayableIndex();
    if (next === null) {
      this.syncTeaching(true);
      return;
    }
    this.startStep(next);
  }

  pause(): void {
    this.teach.playing = false;
    this.teach.autoNextTimer = 0;
    audioEngine.cancelTimeline();
    speechService.cancel();
    this.syncTeaching(true);
  }

  next(): void {
    if (this.teach.active !== null) {
      this.commitActive();
    }
    const next = this.nextPlayableIndex();
    if (next === null) {
      this.syncTeaching(true);
      return;
    }
    this.startStep(next);
  }

  previous(): void {
    if (this.teach.active !== null) {
      this.commitActive();
    }
    if (this.teach.direction === 1) {
      const stepIndex = this.teach.completedThrough;
      if (stepIndex < 0) {
        this.syncTeaching(true);
        return;
      }
      this.startStep(stepIndex, -1);
    } else {
      const stepIndex = this.teach.completedThrough + 1;
      if (stepIndex >= TOTAL_STEPS) {
        this.syncTeaching(true);
        return;
      }
      this.startStep(stepIndex, 1);
    }
  }

  replay(): void {
    const index = this.teach.active ?? this.currentStepIndex();
    if (index < 0 || index >= TOTAL_STEPS) return;
    if (this.teach.direction === 1) {
      this.teach.completedThrough = index - 1;
      this.teach.active = index;
      this.teach.motion = 1;
      this.teach.progress = 0;
    } else {
      this.teach.completedThrough = index;
      this.teach.active = index;
      this.teach.motion = -1;
      this.teach.progress = 1;
    }
    this.beginActiveSequence();
    this.teach.playing = true;
    this.syncTeaching(true);
  }

  restart(): void {
    this.teach.playing = false;
    this.teach.active = null;
    this.teach.progress = 0;
    this.teach.fired.clear();
    this.teach.autoNextTimer = 0;
    this.teach.completedThrough = this.teach.direction === 1 ? -1 : TOTAL_STEPS - 1;
    this.teach.motion = this.teach.direction;
    audioEngine.cancelTimeline();
    speechService.cancel();
    const camera = this.getCurrentStepCamera();
    if (camera) useAppStore.getState().requestCamera('teach', camera);
    this.syncTeaching(true);
  }

  jumpToStep(index: number): void {
    const clamped = clamp(index, 0, TOTAL_STEPS - 1);
    this.teach.playing = false;
    this.teach.active = null;
    this.teach.progress = 0;
    this.teach.autoNextTimer = 0;
    this.teach.fired.clear();
    this.teach.completedThrough =
      this.teach.direction === 1 ? clamped - 1 : clamped;
    audioEngine.cancelTimeline();
    speechService.cancel();
    const camera = ASSEMBLY_STEPS[clamped]?.camera;
    if (camera) useAppStore.getState().requestCamera('teach', camera);
    this.syncTeaching(true);
  }

  setSpeed(speed: number): void {
    this.teach.speed = speed;
    this.syncTeaching(true);
  }

  setAutoPlay(autoPlay: boolean): void {
    this.teach.autoPlay = autoPlay;
    this.syncTeaching(true);
  }

  setTeachingStepFromUI(index: number): void {
    this.jumpToStep(index);
  }

  private nextPlayableIndex(): number | null {
    if (this.teach.direction === 1) {
      const index = this.teach.completedThrough + 1;
      return index < TOTAL_STEPS ? index : null;
    }
    const index = this.teach.completedThrough;
    return index >= 0 ? index : null;
  }

  private startStep(index: number, motion?: MotionDirection): void {
    const step = ASSEMBLY_STEPS[index];
    if (!step) return;
    const direction = this.teach.direction;
    const actualMotion = motion ?? direction;
    if (direction === 1) {
      if (actualMotion === 1) {
        this.teach.completedThrough = index - 1;
        this.teach.progress = 0;
      } else {
        this.teach.completedThrough = index;
        this.teach.progress = 1;
      }
    } else if (actualMotion === -1) {
      this.teach.completedThrough = index;
      this.teach.progress = 1;
    } else {
      this.teach.completedThrough = index - 1;
      this.teach.progress = 0;
    }
    this.teach.active = index;
    this.teach.motion = actualMotion;
    this.beginActiveSequence();
    this.teach.playing = true;
    useAppStore.getState().requestCamera('teach', {
      position: [...step.camera.position],
      target: [...step.camera.target],
    });
    this.syncTeaching(true);
  }

  private beginActiveSequence(): void {
    this.teach.fired.clear();
    this.teach.autoNextTimer = 0;
    const store = useAppStore.getState();
    const step = this.teach.active !== null ? ASSEMBLY_STEPS[this.teach.active] : null;
    if (!step) return;
    audioEngine.cancelTimeline();
    if (store.voiceEnabled && store.soundReady) {
      speechService.speak(`${step.title}。${step.narration}`);
    }
    if (this.teach.motion === 1) {
      for (const event of step.sound) {
        if (event.at <= 0.0001) this.fireSound(event.sound, event.gain);
      }
    } else {
      for (const event of step.sound) {
        if (event.at >= 0.9999) this.fireSound(event.sound, event.gain);
      }
    }
  }

  private commitActive(): void {
    if (this.teach.active === null) return;
    if (this.teach.motion === 1) {
      this.teach.completedThrough = Math.max(this.teach.completedThrough, this.teach.active);
    } else {
      this.teach.completedThrough = this.teach.active - 1;
    }
    this.teach.active = null;
    this.teach.progress = 0;
    this.teach.playing = false;
    this.teach.autoNextTimer = 0;
    this.teach.fired.clear();
    this.activeDeltas = null;
    this.activeFor = -2;
    audioEngine.cancelTimeline();
  }

  private advance(dt: number): void {
    if (this.teach.active === null) return;
    if (!this.teach.playing) return;
    const stepIndex = this.teach.active;
    const step = ASSEMBLY_STEPS[stepIndex];
    if (!step) return;
    const duration = (STEP_DURATIONS[stepIndex] ?? 2500) / 1000;
    const previous = this.teach.progress;
    const delta = (dt * this.teach.speed) / duration;
    const nextProgress = clamp(previous + delta * this.teach.motion, 0, 1);
    this.teach.progress = nextProgress;
    this.fireTimelineSounds(step, previous, nextProgress);
    if (nextProgress === 0 || nextProgress === 1) {
      if (nextProgress === 1 && this.teach.motion === 1) {
        this.teach.completedThrough = Math.max(this.teach.completedThrough, stepIndex);
      }
      if (nextProgress === 0 && this.teach.motion === -1) {
        this.teach.completedThrough = stepIndex - 1;
      }
      this.teach.active = null;
      this.teach.progress = 0;
      this.teach.playing = false;
      this.teach.autoNextTimer = this.teach.autoPlay ? 0.55 : 0;
      this.activeDeltas = null;
      this.activeFor = -2;
      audioEngine.cancelTimeline();
      this.fireSound('complete', 0.5);
      if (this.teach.autoPlay) {
        // The next step starts from the update loop after a short hold.
        this.teach.fired.clear();
      }
      this.syncTeaching(true);
    } else {
      const now = performance.now();
      if (now - this.lastProgressSync > 90) {
        this.lastProgressSync = now;
        this.syncTeaching(false);
      }
    }
  }

  private fireTimelineSounds(step: AssemblyStep, previous: number, next: number): void {
    step.sound.forEach((event, index) => {
      const key = `${step.id}:${index}`;
      if (this.teach.fired.has(key)) return;
      const crossed =
        this.teach.motion === 1
          ? previous < event.at && next >= event.at
          : previous > event.at && next <= event.at;
      if (crossed) {
        this.teach.fired.add(key);
        this.fireSound(event.sound, event.gain);
      }
    });
  }

  private fireSound(sound: SoundName, gain = 1): void {
    const store = useAppStore.getState();
    if (!store.soundEnabled || !store.sfxEnabled) return;
    audioEngine.playTimeline(sound, gain);
  }

  /* ------------------------------------------------------------------ */
  /* Offsets                                                            */
  /* ------------------------------------------------------------------ */

  private rebuildCumulative(): void {
    if (this.cumulativeFor === this.teach.completedThrough) return;
    const map = new Map<string, Offset>();
    const through = Math.min(this.teach.completedThrough, TOTAL_STEPS - 1);
    for (let i = 0; i <= through; i += 1) {
      const deltas = STEP_DELTAS[i];
      if (!deltas) continue;
      for (const [id, delta] of deltas) {
        const entry = map.get(id) ?? { ...ZERO_OFFSET };
        entry.x += delta.dx;
        entry.y += delta.dy;
        entry.z += delta.dz;
        entry.rx += delta.rx;
        entry.ry += delta.ry;
        entry.rz += delta.rz;
        map.set(id, entry);
      }
    }
    this.cumulative = map;
    this.cumulativeFor = this.teach.completedThrough;
  }

  private rebuildActive(): void {
    if (this.activeFor === this.teach.active) return;
    this.activeDeltas =
      this.teach.active !== null ? STEP_DELTAS[this.teach.active] ?? null : null;
    this.activeFor = this.teach.active ?? -2;
  }

  private activeFactor(delta: MoveDelta): number {
    const p = this.teach.progress;
    const local = delta.delay > 0 ? clamp((p - delta.delay) / (1 - delta.delay), 0, 1) : p;
    return smoothstep(local);
  }

  private writeOffset(id: string, out: Offset): void {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    out.rx = 0;
    out.ry = 0;
    out.rz = 0;
    const store = useAppStore.getState();
    const part = PART_BY_ID[id];
    const hero = HERO_IDS.has(id);

    if (store.mode === 'teach') {
      this.rebuildCumulative();
      this.rebuildActive();
      const base = this.cumulative.get(id);
      if (base) {
        out.x += base.x;
        out.y += base.y;
        out.z += base.z;
        out.rx += base.rx;
        out.ry += base.ry;
        out.rz += base.rz;
      }
      const active = this.activeDeltas?.get(id);
      if (active) {
        const factor = this.activeFactor(active);
        const sign = this.teach.motion === 1 ? factor : factor - 1;
        out.x += active.dx * sign;
        out.y += active.dy * sign;
        out.z += active.dz * sign;
        out.rx += active.rx * sign;
        out.ry += active.ry * sign;
        out.rz += active.rz * sign;
      }
    } else if (store.mode === 'axis') {
      if (part?.explode && hero) {
        out.x += part.explode.position[0] * this.axisExplode;
        out.y += part.explode.position[1] * this.axisExplode;
        out.z += part.explode.position[2] * this.axisExplode;
        const rotation = part.explode.rotation;
        if (rotation) {
          out.rx += rotation[0] * this.axisExplode;
          out.ry += rotation[1] * this.axisExplode;
          out.rz += rotation[2] * this.axisExplode;
        }
      }
    } else if (store.mode === 'explode' && part?.explode) {
      out.x += part.explode.position[0] * this.explode;
      out.y += part.explode.position[1] * this.explode;
      out.z += part.explode.position[2] * this.explode;
      const rotation = part.explode.rotation;
      if (rotation) {
        out.rx += rotation[0] * this.explode;
        out.ry += rotation[1] * this.explode;
        out.rz += rotation[2] * this.explode;
      }
    }
  }

  private offset: Offset = { ...ZERO_OFFSET };

  private applyTransforms(): void {
    for (const [id, entry] of registry) {
      this.writeOffset(id, this.offset);
      let press = 0;
      if (entry.pressCode) press = this.getKeyDepth(entry.pressCode);
      entry.object.position.set(
        entry.basePosition.x + this.offset.x,
        entry.basePosition.y + this.offset.y - press,
        entry.basePosition.z + this.offset.z,
      );
      entry.object.rotation.set(
        entry.baseRotation.x + deg(this.offset.rx),
        entry.baseRotation.y + deg(this.offset.ry),
        entry.baseRotation.z + deg(this.offset.rz),
      );
    }
  }

  /**
   * Matrix helper for instanced switches. Writes position/quaternion including
   * teaching, explosion and key press motion.
   */
  writeInstanceTransform(
    id: string,
    base: THREE.Vector3,
    outPosition: THREE.Vector3,
    outQuaternion: THREE.Quaternion,
    pressCode?: string,
  ): void {
    this.writeOffset(id, this.offset);
    outPosition.set(
      base.x + this.offset.x,
      base.y + this.offset.y - (pressCode ? this.getKeyDepth(pressCode) : 0),
      base.z + this.offset.z,
    );
    this.tmpEuler.set(deg(this.offset.rx), deg(this.offset.ry), deg(this.offset.rz));
    outQuaternion.setFromEuler(this.tmpEuler);
  }

  getPartLocalPosition(id: string, out: THREE.Vector3): THREE.Vector3 {
    this.writeOffset(id, this.offset);
    const part = PART_BY_ID[id];
    const assembly = part?.assembly?.position ?? [0, 0, 0];
    out.set(
      assembly[0] + this.offset.x,
      assembly[1] + this.offset.y,
      assembly[2] + this.offset.z,
    );
    return out;
  }

  getPartWorldPosition(id: string, out: THREE.Vector3): THREE.Vector3 {
    const entry = registry.get(id);
    const part = PART_BY_ID[id];
    this.writeOffset(id, this.offset);
    if (entry) {
      entry.object.getWorldPosition(out);
    } else if (part?.assembly) {
      out.set(
        part.assembly.position[0] + this.offset.x,
        part.assembly.position[1] + this.offset.y,
        part.assembly.position[2] + this.offset.z,
      );
    } else {
      out.set(this.offset.x, this.offset.y, this.offset.z);
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Frame update & store sync                                          */
  /* ------------------------------------------------------------------ */

  update(dt: number): void {
    const capped = Math.min(dt, 0.05);
    this.updateExplosion(capped);
    this.updateKeys(capped);
    if (this.teach.autoNextTimer > 0 && !this.teach.playing) {
      this.teach.autoNextTimer -= capped;
      if (this.teach.autoNextTimer <= 0) {
        const next = this.nextPlayableIndex();
        if (next !== null) this.startStep(next);
        else this.syncTeaching(true);
      }
    }
    this.advance(capped);
    this.applyTransforms();
    this.syncExplode(false);
    this.syncTeaching(false);

    const heroStep = this.isHeroStage;
    if (heroStep !== this.wasHeroStep) {
      this.wasHeroStep = heroStep;
      if (heroStep) {
        useAppStore.getState().requestCamera('teach', {
          position: [4.2, 3.6, 6.1],
          target: [0, 1.8, 0],
        });
      }
    }
  }

  private syncExplode(force: boolean): void {
    const now = performance.now();
    if (!force && now - this.lastExplodeSync < 90) return;
    this.lastExplodeSync = now;
    const store = useAppStore.getState();
    if (Math.abs(store.explode - this.explode) > 0.001) {
      useAppStore.setState({ explode: this.explode, explodeTarget: this.explodeTarget });
    }
  }

  private syncTeaching(force: boolean): void {
    const now = performance.now();
    if (!force && now - this.lastProgressSync < 90) return;
    this.lastProgressSync = now;
    useAppStore.getState().setTeaching({
      stepIndex: this.currentStepIndex(),
      completedThrough: this.teach.completedThrough,
      activeStep: this.teach.active,
      progress: this.teach.progress,
      playing: this.teach.playing,
      speed: this.teach.speed,
      autoPlay: this.teach.autoPlay,
      direction: this.teach.direction,
    });
  }

  getStepProgressFor(stepIndex: number): number {
    if (this.teach.active === stepIndex) {
      return this.teach.motion === 1 ? this.teach.progress : 1 - this.teach.progress;
    }
    return stepIndex <= this.teach.completedThrough ? 1 : 0;
  }

  getPartDefinition(id: string): PartDefinition | undefined {
    return PART_BY_ID[id];
  }

  getTempQuaternion(): THREE.Quaternion {
    return this.tmpQuaternion;
  }
}

export const director = new Director();
