import { create } from 'zustand';
import { PART_BY_ID, type VisibilityCategory } from '../data/parts';
import type { ThemeKey } from '../config/themes';
import type { AppearanceRecord, AppearanceValues } from '../customization/types';
import { loadAppearance, sanitizeAppearance, scheduleAppearanceSave } from '../customization/persist';
import type { ViewPreset } from '../config/constants';
import { audioEngine } from '../audio/AudioEngine';
import { speechService } from '../audio/speech';
import { director } from './director';

export type Mode = 'preview' | 'explode' | 'teach' | 'axis';
export type Quality = 'high' | 'low';
export type PanelTab = 'detail' | 'custom' | 'bom' | 'spec';

export interface TeachingView {
  stepIndex: number;
  completedThrough: number;
  activeStep: number | null;
  progress: number;
  playing: boolean;
  speed: number;
  autoPlay: boolean;
  direction: 1 | -1;
}

export interface CameraRequest {
  kind: ViewPreset | 'explode' | 'axis' | 'teach';
  nonce: number;
  position?: [number, number, number];
  target?: [number, number, number];
}

interface AppState {
  mode: Mode;
  themeKey: ThemeKey;
  quality: Quality;
  explode: number;
  explodeTarget: number;
  axisExplode: number;
  axisPress: number;
  teaching: TeachingView;
  cameraRequest: CameraRequest | null;
  viewPreset: ViewPreset;
  selectedId: string | null;
  hoveredId: string | null;
  isolateId: string | null;
  categoryVisibility: Record<VisibilityCategory, boolean>;
  showLabels: boolean;
  panelTab: PanelTab;
  appearance: AppearanceRecord;
  leftOpen: boolean;
  rightOpen: boolean;
  soundEnabled: boolean;
  soundReady: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  masterVolume: number;
  keyVolume: number;
  assemblyVolume: number;
  uiVolume: number;
  speechAvailable: boolean;
  pressedCodes: Record<string, boolean>;
  axisPressHeld: boolean;
  loading: boolean;
  setMode: (mode: Mode) => void;
  setTheme: (theme: ThemeKey) => void;
  setQuality: (quality: Quality) => void;
  setExplode: (value: number) => void;
  setAxisExplode: (value: number) => void;
  setAxisPress: (value: number) => void;
  setAxisPressHeld: (held: boolean) => void;
  setTeaching: (patch: Partial<TeachingView>) => void;
  requestCamera: (
    kind: CameraRequest['kind'],
    options?: { position?: [number, number, number]; target?: [number, number, number]; preset?: ViewPreset },
  ) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  toggleCategory: (category: VisibilityCategory) => void;
  setAllCategories: (visible: boolean) => void;
  isolateSelected: () => void;
  clearIsolate: () => void;
  setShowLabels: (visible: boolean) => void;
  setPanelTab: (tab: PanelTab) => void;
  applyAppearance: (ids: string[], patch: AppearanceValues) => void;
  resetAppearance: (ids: string[]) => void;
  resetAllAppearance: () => void;
  replaceAppearance: (record: AppearanceRecord) => void;
  setDrawer: (side: 'left' | 'right', open: boolean) => void;
  enableSound: () => Promise<void>;
  setSoundEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVolume: (channel: 'master' | 'keys' | 'assembly' | 'ui', value: number) => void;
  setPressed: (code: string, pressed: boolean) => void;
  releaseAllPressed: () => void;
  setLoading: (loading: boolean) => void;
}

const allVisible = (): Record<VisibilityCategory, boolean> => ({
  keycaps: true,
  switches: true,
  stabilizers: true,
  plates: true,
  pcb: true,
  case: true,
  usb: true,
  fasteners: true,
});

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'preview',
  themeKey: 'graphite',
  quality: 'high',
  explode: 0,
  explodeTarget: 0,
  axisExplode: 0,
  axisPress: 0,
  teaching: {
    stepIndex: 0,
    completedThrough: -1,
    activeStep: null,
    progress: 0,
    playing: false,
    speed: 1,
    autoPlay: true,
    direction: 1,
  },
  cameraRequest: null,
  viewPreset: 'perspective',
  selectedId: null,
  hoveredId: null,
  isolateId: null,
  categoryVisibility: allVisible(),
  showLabels: true,
  panelTab: 'detail',
  appearance: loadAppearance(),
  leftOpen: false,
  rightOpen: false,
  soundEnabled: false,
  soundReady: false,
  sfxEnabled: true,
  voiceEnabled: true,
  masterVolume: 0.7,
  keyVolume: 0.85,
  assemblyVolume: 0.8,
  uiVolume: 0.55,
  speechAvailable: speechService.available,
  pressedCodes: {},
  axisPressHeld: false,
  loading: true,

  setMode: (mode) => {
    if (get().mode === 'teach' && mode !== 'teach') director.pause();
    director.releaseAllKeys();
    audioEngine.cancelTimeline();
    speechService.cancel();
    set({
      mode,
      selectedId: null,
      hoveredId: null,
      leftOpen: false,
      rightOpen: false,
      axisExplode: 0,
      axisPress: 0,
    });
    if (mode === 'preview') {
      director.snapExplode(0);
      director.snapAxisExplode(0);
      get().requestCamera('perspective', { preset: 'perspective' });
    } else if (mode === 'explode') {
      director.snapAxisExplode(0);
      director.setExplodeTarget(0.82);
      get().requestCamera('explode');
    } else if (mode === 'teach') {
      director.snapExplode(0);
      director.snapAxisExplode(0);
      director.prepareTeaching();
      const step = director.getCurrentStepCamera();
      if (step) get().requestCamera('teach', step);
    } else {
      director.snapExplode(0);
      director.snapAxisExplode(0);
      get().requestCamera('axis');
    }
  },

  setTheme: (themeKey) => set({ themeKey }),
  setQuality: (quality) => set({ quality }),

  setExplode: (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    set({ explode: clamped, explodeTarget: clamped });
    director.setExplodeTarget(clamped);
  },

  setAxisExplode: (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    set({ axisExplode: clamped });
    director.setAxisExplodeTarget(clamped);
  },

  setAxisPress: (value) => {
    const clamped = Math.max(0, Math.min(4, value));
    set({ axisPress: clamped });
    director.setAxisPress(clamped);
  },

  setAxisPressHeld: (held) => set({ axisPressHeld: held }),

  setTeaching: (patch) => set((state) => ({ teaching: { ...state.teaching, ...patch } })),

  requestCamera: (kind, options = {}) =>
    set((state) => ({
      cameraRequest: {
        kind,
        nonce: (state.cameraRequest?.nonce ?? 0) + 1,
        position: options.position,
        target: options.target,
      },
      viewPreset: options.preset ?? state.viewPreset,
    })),

  select: (id) => {
    const isolateId = get().isolateId;
    set({
      selectedId: id,
      panelTab: get().panelTab === 'custom' ? 'custom' : 'detail',
      rightOpen: true,
      leftOpen: false,
      isolateId: isolateId && isolateId !== id ? null : isolateId,
    });
  },
  hover: (id) => set({ hoveredId: id }),

  toggleCategory: (category) =>
    set((state) => ({
      categoryVisibility: {
        ...state.categoryVisibility,
        [category]: !state.categoryVisibility[category],
      },
    })),

  setAllCategories: (visible) =>
    set({
      categoryVisibility: Object.fromEntries(
        (Object.keys(get().categoryVisibility) as VisibilityCategory[]).map((key) => [key, visible]),
      ) as Record<VisibilityCategory, boolean>,
    }),

  isolateSelected: () => {
    const selected = get().selectedId;
    const isolateId = selected?.startsWith('pcb-') ? 'pcb' : selected;
    set({ isolateId });
  },
  clearIsolate: () => set({ isolateId: null }),

  setShowLabels: (showLabels) => set({ showLabels }),
  setPanelTab: (panelTab) => set({ panelTab, rightOpen: true }),

  applyAppearance: (ids, patch) => {
    const next: AppearanceRecord = { ...get().appearance };
    for (const id of ids) {
      if (!PART_BY_ID[id]) continue;
      const merged: AppearanceValues = { ...(next[id] ?? {}) };
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) delete (merged as Record<string, unknown>)[key];
        else (merged as Record<string, unknown>)[key] = value;
      }
      if (Object.keys(merged).length > 0) next[id] = merged;
      else delete next[id];
    }
    set({ appearance: next });
    scheduleAppearanceSave(next);
  },

  resetAppearance: (ids) => {
    const next: AppearanceRecord = { ...get().appearance };
    for (const id of ids) delete next[id];
    set({ appearance: next });
    scheduleAppearanceSave(next);
  },

  resetAllAppearance: () => {
    set({ appearance: {} });
    scheduleAppearanceSave({});
  },

  replaceAppearance: (record) => {
    const next = sanitizeAppearance(record);
    set({ appearance: next });
    scheduleAppearanceSave(next);
  },
  setDrawer: (side, open) =>
    set(
      side === 'left'
        ? { leftOpen: open, rightOpen: open ? false : get().rightOpen }
        : { rightOpen: open, leftOpen: open ? false : get().leftOpen },
    ),

  enableSound: async () => {
    await audioEngine.init();
    audioEngine.setVolumes({
      master: get().masterVolume,
      keys: get().keyVolume,
      assembly: get().assemblyVolume,
      ui: get().uiVolume,
    });
    audioEngine.setOutputEnabled(get().sfxEnabled);
    set({ soundEnabled: true, soundReady: audioEngine.ready });
    audioEngine.playUi();
  },

  setSoundEnabled: (enabled) => {
    if (enabled) {
      void get().enableSound();
    } else {
      set({ soundEnabled: false });
      audioEngine.setOutputEnabled(false);
      speechService.cancel();
    }
  },

  setSfxEnabled: (enabled) => {
    if (!enabled) {
      audioEngine.setOutputEnabled(false);
      audioEngine.cancelTimeline();
    }
    set({ sfxEnabled: enabled });
    if (enabled) {
      if (!get().soundEnabled) void get().enableSound();
      else audioEngine.setOutputEnabled(true);
    }
  },

  setVoiceEnabled: (enabled) => {
    if (!enabled) speechService.cancel();
    set({ voiceEnabled: enabled });
  },

  setVolume: (channel, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    if (channel === 'master') set({ masterVolume: clamped });
    if (channel === 'keys') set({ keyVolume: clamped });
    if (channel === 'assembly') set({ assemblyVolume: clamped });
    if (channel === 'ui') set({ uiVolume: clamped });
    const s = get();
    audioEngine.setVolumes({
      master: s.masterVolume,
      keys: s.keyVolume,
      assembly: s.assemblyVolume,
      ui: s.uiVolume,
    });
  },

  setPressed: (code, pressed) =>
    set((state) => {
      const current = state.pressedCodes[code];
      if (Boolean(current) === pressed) return state;
      const next = { ...state.pressedCodes };
      if (pressed) next[code] = true;
      else delete next[code];
      return { pressedCodes: next };
    }),

  releaseAllPressed: () => set({ pressedCodes: {} }),
  setLoading: (loading) => set({ loading }),
}));

export const selectTeaching = (state: AppState) => state.teaching;
export const selectSoundOn = (state: AppState) => state.soundEnabled && state.sfxEnabled;
