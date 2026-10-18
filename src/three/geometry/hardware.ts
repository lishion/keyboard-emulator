import * as THREE from 'three';
import { mergeAll, boxAt, cylinderAt } from './shapes';

export interface ScrewGeometry {
  shaft: THREE.BufferGeometry;
  recess: THREE.BufferGeometry;
}

/** Case screw geometry: head at y = 0..1.3, shaft upwards to `length`. */
export function createScrewGeometries(length = 23): ScrewGeometry {
  const head = new THREE.CylinderGeometry(2.45, 2.55, 1.25, 22);
  head.translate(0, 0.625, 0);
  const skirt = new THREE.CylinderGeometry(2.2, 2.45, 0.35, 22);
  skirt.translate(0, 1.42, 0);
  const shaft = new THREE.CylinderGeometry(0.95, 0.95, length, 14);
  shaft.translate(0, 1.5 + length / 2, 0);
  const bits: THREE.BufferGeometry[] = [head, skirt, shaft];
  for (let i = 0; i < 9; i += 1) {
    bits.push(cylinderAt(1.08, 1.08, 0.16, 0, 2.4 + i * 2.1, 0, 12));
  }
  const merged = mergeAll(bits);
  const recess = new THREE.CylinderGeometry(1.25, 1.25, 0.32, 6);
  recess.translate(0, 0.06, 0);
  return { shaft: merged, recess };
}

/** Small screw used for stabilizer and daughterboard fasteners. */
export function createSmallScrewGeometry(length = 4.2): ScrewGeometry {
  const head = new THREE.CylinderGeometry(1.65, 1.72, 0.9, 16);
  head.translate(0, 0.45, 0);
  const shaft = new THREE.CylinderGeometry(0.62, 0.62, length, 10);
  shaft.translate(0, 0.9 + length / 2, 0);
  const bits: THREE.BufferGeometry[] = [head, shaft];
  for (let i = 0; i < 3; i += 1) {
    bits.push(cylinderAt(0.7, 0.7, 0.12, 0, 1.4 + i * 1.05, 0, 8));
  }
  const merged = mergeAll(bits);
  const recess = new THREE.CylinderGeometry(0.78, 0.78, 0.24, 6);
  recess.translate(0, 0.04, 0);
  return { shaft: merged, recess };
}

export const caseScrew = createScrewGeometries(22.2);
export const usbScrew = createSmallScrewGeometry(4.4);
export const stabScrew = createSmallScrewGeometry(2.6);

export const screwRecessMaterial = new THREE.MeshStandardMaterial({
  color: '#151515',
  roughness: 0.8,
  metalness: 0.4,
});

export function screwHeadBottomGeometry(diameter = 2.5): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(diameter, diameter, 0.1, 12);
  geometry.translate(0, 0.04, 0);
  return geometry;
}

export function shiftGeometry(
  geometry: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
): THREE.BufferGeometry {
  geometry.translate(x, y, z);
  return geometry;
}

export function mergeStabHousing(spacing: number): {
  housing: THREE.BufferGeometry;
  tower: THREE.BufferGeometry;
} {
  const blocks: THREE.BufferGeometry[] = [];
  for (const direction of [-1, 1]) {
    const x = (spacing / 2) * direction;
    const block = boxAt(7.4, 3.8, 13.4, x, 8.2 + 1.9, 0);
    blocks.push(block);
  }
  const housing = mergeAll(blocks);
  const towers: THREE.BufferGeometry[] = [];
  for (const direction of [-1, 1]) {
    const x = (spacing / 2) * direction;
    towers.push(boxAt(6.9, 8.3, 13.0, x, 16.15, 0));
    towers.push(boxAt(8.4, 0.55, 14.0, x, 20.35, 0));
  }
  const tower = mergeAll(towers);
  return { housing, tower };
}

export function stabWireGeometry(spacing: number): THREE.BufferGeometry {
  const half = spacing / 2;
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-half, 17.8, 0),
      new THREE.Vector3(-half, 12.6, 0),
      new THREE.Vector3(-half, 10.4, 2.4),
      new THREE.Vector3(-half + Math.min(8, spacing * 0.25), 9.7, 8.6),
      new THREE.Vector3(0, 9.7, 9.8),
      new THREE.Vector3(half - Math.min(8, spacing * 0.25), 9.7, 8.6),
      new THREE.Vector3(half, 10.4, 2.4),
      new THREE.Vector3(half, 12.6, 0),
      new THREE.Vector3(half, 17.8, 0),
    ],
    false,
    'catmullrom',
    0.35,
  );
  return new THREE.TubeGeometry(curve, 54, 0.68, 7, false);
}

export function stabStemGeometry(spacing: number): THREE.BufferGeometry {
  const stems: THREE.BufferGeometry[] = [];
  for (const direction of [-1, 1]) {
    const x = (spacing / 2) * direction;
    const body = boxAt(4.75, 9.0, 4.75, x, 21.0, 0);
    const armA = boxAt(4.0, 1.0, 1.15, x, 26.15, 0);
    const armB = boxAt(1.15, 1.0, 4.0, x, 26.15, 0);
    stems.push(body, armA, armB);
  }
  return mergeAll(stems);
}

export function stabScrewPositions(spacing: number): Array<{ x: number; z: number }> {
  const positions: Array<{ x: number; z: number }> = [];
  for (const direction of [-1, 1]) {
    const x = (spacing / 2) * direction;
    positions.push({ x: x - 2.1, z: -4.6 });
    positions.push({ x: x + 2.1, z: -4.6 });
    positions.push({ x: x - 2.1, z: 4.6 });
    positions.push({ x: x + 2.1, z: 4.6 });
  }
  return positions;
}
