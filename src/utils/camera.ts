import * as THREE from 'three';
import { MM } from '../config/constants';
import { PART_BY_ID } from '../data/parts';
import { KEY_BY_CODE } from '../data/layout';
import { director } from '../state/director';
import { useAppStore } from '../state/store';

const tmp = new THREE.Vector3();

export function focusPart(id: string): void {
  const focusId = id.startsWith('pcb-') && id !== 'pcb' ? 'pcb' : id;
  const part = PART_BY_ID[focusId];
  if (!part) return;
  id = focusId;
  director.getPartLocalPosition(id, tmp);
  const target: [number, number, number] = [
    tmp.x * MM,
    tmp.y * MM + (part.type === 'keycap' ? 0.45 : 0.25),
    tmp.z * MM,
  ];
  const key = part.keyCode ? KEY_BY_CODE[part.keyCode] : undefined;
  let offset: [number, number, number] = [4.2, 5.4, 8.2];
  if (part.type === 'keycap') {
    const spread = Math.max(1, (key?.widthU ?? 1) * 0.55);
    offset = [4.4 * spread, 4.0 * spread, 7.2 * spread];
  } else if (part.type === 'switch' || part.type === 'hero') {
    offset = [4.4, 4.0, 7.2];
  } else if (part.type === 'stabilizer') {
    offset = [9, 8, 16];
  } else if (part.type === 'screw' || part.type === 'foot') {
    offset = [2.6, 3.2, 5.2];
  } else if (part.type === 'case') {
    offset = [12, 16, 26];
  } else if (part.type === 'pcb' || part.type === 'plate') {
    offset = [7, 10, 16];
  }
  const position: [number, number, number] = [
    target[0] + offset[0],
    target[1] + offset[1],
    target[2] + offset[2],
  ];
  useAppStore.getState().requestCamera('teach', { position, target });
}

export function focusHero(): void {
  const target: [number, number, number] = [0, 1.0, 0];
  useAppStore.getState().requestCamera('axis', { position: [5.9, 4.5, 8.5], target });
}

export function applyViewPreset(preset: 'perspective' | 'top' | 'bottom' | 'side' | 'close'): void {
  const store = useAppStore.getState();
  if (store.mode === 'axis') {
    const targets: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
      perspective: { position: [5.9, 4.5, 8.5], target: [0, 1.0, 0] },
      top: { position: [0.01, 9.6, 0.01], target: [0, 1.0, 0] },
      bottom: { position: [0.01, -2.6, 0.01], target: [0, 1.0, 0] },
      side: { position: [9.6, 2.8, 0.01], target: [0, 1.1, 0] },
      close: { position: [3.2, 2.8, 4.8], target: [0, 1.3, 0] },
    };
    const config = targets[preset];
    store.requestCamera(preset === 'bottom' ? 'close' : 'axis', {
      position: config.position,
      target: config.target,
      preset,
    });
    return;
  }
  store.requestCamera(preset, { preset });
}
