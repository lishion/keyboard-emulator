import * as THREE from 'three';
import { roundedRectPoints } from './shapes';

export interface KeycapGeometrySet {
  skirt: THREE.BufferGeometry;
  top: THREE.BufferGeometry;
  cross: THREE.BufferGeometry;
  cacheKey: string;
}

export const KEYCAP_SHAPE_DEFAULTS = {
  cornerRadius: 1.7,
  taper: 1.45,
  dish: 0.7,
} as const;

const WALL_BOTTOM = 1.8;
const WALL_TOP = 1.25;

function ring(
  width: number,
  depth: number,
  radius: number,
  y: number,
  segments = 7,
): THREE.Vector3[] {
  return roundedRectPoints(width, depth, radius, segments).map(
    (p) => new THREE.Vector3(p.x, y, p.y),
  );
}

function triangleNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
}

function fixTriangle(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  ref: (centroid: THREE.Vector3) => THREE.Vector3,
): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const centroid = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3);
  const normal = triangleNormal(a, b, c);
  if (normal.dot(ref(centroid)) < 0) return [a, c, b];
  return [a, b, c];
}

function surfaceBetween(
  lower: THREE.Vector3[],
  upper: THREE.Vector3[],
  reference: (centroid: THREE.Vector3) => THREE.Vector3,
): THREE.BufferGeometry {
  const count = lower.length;
  const positions: number[] = [];
  const indices: number[] = [];
  for (const point of lower) positions.push(point.x, point.y, point.z);
  for (const point of upper) positions.push(point.x, point.y, point.z);
  for (let i = 0; i < count; i += 1) {
    const j = (i + 1) % count;
    const a = lower[i];
    const b = lower[j];
    const c = upper[j];
    const d = upper[i];
    const tri1 = fixTriangle(a, b, c, reference);
    const tri2 = fixTriangle(a, c, d, reference);
    for (const tri of [tri1, tri2]) {
      for (const point of tri) {
        const index = positions.length / 3;
        positions.push(point.x, point.y, point.z);
        indices.push(index);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function fan(
  ringPoints: THREE.Vector3[],
  center: THREE.Vector3,
  reference: (centroid: THREE.Vector3) => THREE.Vector3,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const count = ringPoints.length;
  for (let i = 0; i < count; i += 1) {
    const j = (i + 1) % count;
    const tri = fixTriangle(ringPoints[i], ringPoints[j], center, reference);
    for (const point of tri) {
      const index = positions.length / 3;
      positions.push(point.x, point.y, point.z);
      indices.push(index);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mergeGeometriesSafe(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const hasUv = geometries.every((geometry) => geometry.getAttribute('uv'));
  for (const geometry of geometries) {
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    const position = nonIndexed.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
    }
    if (hasUv) {
      const uv = nonIndexed.getAttribute('uv');
      for (let i = 0; i < uv.count; i += 1) uvs.push(uv.getX(i), uv.getY(i));
    }
    if (nonIndexed !== geometry) nonIndexed.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (hasUv) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.computeVertexNormals();
  return merged;
}

function makeDishedTop(
  width: number,
  depth: number,
  topY: number,
  outerTop: THREE.Vector3[],
  dish: number,
): THREE.BufferGeometry {
  const rings = [1, 0.76, 0.5, 0.26];
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const ringPoints: THREE.Vector3[][] = [];
  for (const scale of rings) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < outerTop.length; i += 1) {
      const base = outerTop[i];
      const x = base.x * scale;
      const z = base.z * scale;
      const y = topY - dish * Math.pow(1 - scale, 1.35);
      points.push(new THREE.Vector3(x, y, z));
    }
    ringPoints.push(points);
    for (const point of points) {
      positions.push(point.x, point.y, point.z);
      uvs.push(0.5 + point.x / width, 0.5 - point.z / depth);
    }
  }
  const center = new THREE.Vector3(0, topY - dish, 0);
  const centerIndex = positions.length / 3;
  positions.push(center.x, center.y, center.z);
  uvs.push(0.5, 0.5);

  const reference = () => new THREE.Vector3(0, 1, 0);
  const count = outerTop.length;
  for (let r = 0; r < ringPoints.length - 1; r += 1) {
    const inner = r * count;
    const outer = (r + 1) * count;
    for (let i = 0; i < count; i += 1) {
      const j = (i + 1) % count;
      const a = outer + i;
      const b = outer + j;
      const c = inner + j;
      const d = inner + i;
      const va = new THREE.Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
      const vb = new THREE.Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
      const vc = new THREE.Vector3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);
      const order = triangleNormal(va, vb, vc).dot(reference()) >= 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
      indices.push(...order);
    }
  }
  const innerStart = (ringPoints.length - 1) * count;
  for (let i = 0; i < count; i += 1) {
    const j = (i + 1) % count;
    const a = innerStart + i;
    const b = innerStart + j;
    const va = new THREE.Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
    const vb = new THREE.Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
    const order =
      triangleNormal(va, vb, center).dot(reference()) >= 0
        ? [a, b, centerIndex]
        : [a, centerIndex, b];
    indices.push(...order);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

type CachedKeycap = KeycapGeometrySet & { refs: number };

const cache = new Map<string, CachedKeycap>();
const MAX_CACHE = 96;

function evictUnused(): void {
  if (cache.size <= MAX_CACHE) return;
  for (const [key, entry] of cache) {
    if (cache.size <= MAX_CACHE) break;
    if (entry.refs > 0) continue;
    entry.skirt.dispose();
    entry.top.dispose();
    entry.cross.dispose();
    cache.delete(key);
  }
}

export interface KeycapShapeOptions {
  cornerRadius?: number;
  taper?: number;
  dish?: number;
}

export function getKeycapGeometry(
  width: number,
  depth: number,
  height: number,
  stabSpacing?: number,
  shape: KeycapShapeOptions = {},
): KeycapGeometrySet {
  const radius = Math.max(0, shape.cornerRadius ?? KEYCAP_SHAPE_DEFAULTS.cornerRadius);
  const taper = Math.max(0, shape.taper ?? KEYCAP_SHAPE_DEFAULTS.taper);
  const dish = Math.max(0, shape.dish ?? KEYCAP_SHAPE_DEFAULTS.dish);
  const cacheKey = `${width.toFixed(2)}|${depth.toFixed(2)}|${height.toFixed(2)}|${stabSpacing ?? 0}|${radius.toFixed(2)}|${taper.toFixed(2)}|${dish.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    cached.refs += 1;
    return cached;
  }

  const topW = Math.max(6, width - taper * 2);
  const topD = Math.max(6, depth - taper * 2);
  const innerBottomW = width - WALL_BOTTOM * 2;
  const innerBottomD = depth - WALL_BOTTOM * 2;
  const innerTopW = Math.max(4, topW - WALL_TOP * 2);
  const innerTopD = Math.max(4, topD - WALL_TOP * 2);
  const topY = height;
  const ceilingY = topY - Math.max(0.95, dish + 0.25);
  const topRadius = Math.min(radius + 0.4, Math.min(topW, topD) / 2);
  const innerRadius = Math.max(0.35, radius * 0.65);

  const outerBottom = ring(width, depth, radius, 0);
  const outerTop = ring(topW, topD, topRadius, topY);
  const innerBottom = ring(innerBottomW, innerBottomD, innerRadius, 0);
  const innerTop = ring(innerTopW, innerTopD, innerRadius, ceilingY);

  const parts: THREE.BufferGeometry[] = [];
  parts.push(
    surfaceBetween(outerBottom, outerTop, (centroid) => new THREE.Vector3(centroid.x, 0, centroid.z)),
  );
  parts.push(
    surfaceBetween(innerBottom, innerTop, (centroid) => new THREE.Vector3(-centroid.x, 0, -centroid.z)),
  );
  parts.push(surfaceBetween(outerBottom, innerBottom, () => new THREE.Vector3(0, -1, 0)));
  parts.push(fan(innerTop, new THREE.Vector3(0, ceilingY, 0), () => new THREE.Vector3(0, -1, 0)));

  const socketHeight = ceilingY - 0.5;
  if (socketHeight > 0.6) {
    parts.push(
      new THREE.CylinderGeometry(2.9, 3.1, socketHeight, 18).translate(
        0,
        0.5 + socketHeight / 2,
        0,
      ),
    );
  }
  if (stabSpacing && stabSpacing > 0) {
    for (const direction of [-1, 1]) {
      parts.push(
        new THREE.CylinderGeometry(2.35, 2.55, socketHeight, 16).translate(
          (stabSpacing / 2) * direction,
          0.5 + socketHeight / 2,
          0,
        ),
      );
    }
  }

  const skirt = mergeGeometriesSafe(parts);
  skirt.computeVertexNormals();
  const top = makeDishedTop(width, depth, topY, outerTop, dish);
  const cross = new THREE.BoxGeometry(4.15, 0.28, 1.15);
  const cross2 = new THREE.BoxGeometry(1.15, 0.28, 4.15);
  cross.translate(0, 0.38, 0);
  cross2.translate(0, 0.38, 0);
  const crosses: THREE.BufferGeometry[] = [];
  for (const centerX of stabSpacing && stabSpacing > 0
    ? [-stabSpacing / 2, 0, stabSpacing / 2]
    : [0]) {
    const c1 = cross.clone().translate(centerX, 0, 0);
    const c2 = cross2.clone().translate(centerX, 0, 0);
    crosses.push(c1, c2);
  }
  cross.dispose();
  cross2.dispose();
  const crossGeometry = mergeGeometriesSafe(crosses);

  const set: CachedKeycap = { skirt, top, cross: crossGeometry, cacheKey, refs: 1 };
  cache.set(cacheKey, set);
  evictUnused();
  return set;
}

/** Called by a keycap when its memoised geometry is replaced or unmounted. */
export function releaseKeycapGeometry(cacheKey: string): void {
  const entry = cache.get(cacheKey);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  evictUnused();
}
