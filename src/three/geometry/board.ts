import * as THREE from 'three';
import {
  BOTTOM_FOAM_BOTTOM,
  BOTTOM_FOAM_TOP,
  CASE_D,
  CASE_INNER_D,
  CASE_INNER_W,
  CASE_RADIUS,
  CASE_W,
  GASKET_BOTTOM,
  GASKET_HEIGHT,
  GASKET_W,
  KEY_PITCH,
  PCB_BOTTOM,
  PCB_D,
  PCB_RADIUS,
  PCB_THICK,
  PCB_TOP,
  PCB_W,
  PLATE_BOTTOM,
  PLATE_D,
  PLATE_RADIUS,
  PLATE_THICK,
  PLATE_W,
  SCREW_POSITIONS,
  SHELF_BOTTOM,
  SHELF_OPENING_D,
  SHELF_OPENING_W,
  SHELF_TOP,
  SANDWICH_FOAM_BOTTOM,
  SANDWICH_FOAM_TOP,
  UPPER_BOTTOM,
  UPPER_OPENING_D,
  UPPER_OPENING_W,
  UPPER_TOP,
  USB,
} from '../../config/constants';
import { KEYS, STAB_KEYS_LIST } from '../../data/layout';
import {
  circleHole,
  cBandShape,
  extrudeFlat,
  roundedRectHole,
  roundedRectShape,
  shapeFromPoints,
} from './shapes';

const PCB_MOUNT_HOLES = [
  { x: -174, z: -63 },
  { x: 174, z: -63 },
  { x: -174, z: 63 },
  { x: 174, z: 63 },
];

export function buildPlateGeometry(): THREE.ExtrudeGeometry {
  const shape = roundedRectShape(PLATE_W, PLATE_D, PLATE_RADIUS, 8);
  for (const key of KEYS) {
    shape.holes.push(roundedRectHole(14.15, 14.15, 0.9, key.x, key.z, 3));
  }
  for (const key of STAB_KEYS_LIST) {
    const spacing = key.stabSpacing ?? 0;
    for (const direction of [-1, 1]) {
      shape.holes.push(
        roundedRectHole(8.2, 14.2, 1.1, key.x + (spacing / 2) * direction, key.z, 3),
      );
    }
  }
  for (const hole of PCB_MOUNT_HOLES) {
    shape.holes.push(circleHole(hole.x, hole.z, 2.0, 14));
  }
  return extrudeFlat(shape, PLATE_THICK, { bevel: 0.22, bevelSegments: 1, curveSegments: 6 });
}

export function buildPcbGeometry(): THREE.ExtrudeGeometry {
  const shape = roundedRectShape(PCB_W, PCB_D, PCB_RADIUS, 8);
  for (const key of KEYS) {
    shape.holes.push(circleHole(key.x, key.z, 2.5, 12));
    shape.holes.push(circleHole(key.x - 5.08, key.z, 0.95, 8));
    shape.holes.push(circleHole(key.x + 5.08, key.z, 0.95, 8));
    shape.holes.push(circleHole(key.x + 2.54, key.z - 5.08, 0.8, 8));
    shape.holes.push(circleHole(key.x - 3.81, key.z - 2.54, 0.8, 8));
  }
  for (const key of STAB_KEYS_LIST) {
    const spacing = key.stabSpacing ?? 0;
    for (const direction of [-1, 1]) {
      const x = key.x + (spacing / 2) * direction;
      shape.holes.push(roundedRectHole(7.4, 10.2, 1.4, x, key.z, 3));
      shape.holes.push(circleHole(x - 2.1, key.z - 4.6, 1.05, 8));
      shape.holes.push(circleHole(x + 2.1, key.z - 4.6, 1.05, 8));
      shape.holes.push(circleHole(x - 2.1, key.z + 4.6, 1.05, 8));
      shape.holes.push(circleHole(x + 2.1, key.z + 4.6, 1.05, 8));
    }
  }
  for (const hole of PCB_MOUNT_HOLES) {
    shape.holes.push(circleHole(hole.x, hole.z, 1.6, 12));
  }
  return extrudeFlat(shape, PCB_THICK, { bevel: 0.06, bevelSegments: 1, curveSegments: 6 });
}

export function buildSandwichFoamGeometry(): THREE.ExtrudeGeometry {
  const shape = roundedRectShape(PLATE_W - 1.2, PLATE_D - 1.2, PLATE_RADIUS - 0.5, 8);
  for (const key of KEYS) {
    shape.holes.push(roundedRectHole(15.9, 15.9, 1.2, key.x, key.z, 3));
  }
  for (const key of STAB_KEYS_LIST) {
    const spacing = key.stabSpacing ?? 0;
    for (const direction of [-1, 1]) {
      shape.holes.push(
        roundedRectHole(9.2, 15.2, 1.2, key.x + (spacing / 2) * direction, key.z, 3),
      );
    }
  }
  // Relief for the MCU and the matrix components grouped in the central gap.
  shape.holes.push(roundedRectHole(18, 26, 2, 0, -38, 3));
  shape.holes.push(roundedRectHole(20, 10, 2, 58, -63, 3));
  return extrudeFlat(shape, SANDWICH_FOAM_TOP - SANDWICH_FOAM_BOTTOM, {
    bevel: 0.18,
    bevelSegments: 1,
    curveSegments: 6,
  });
}

export function buildBottomFoamGeometry(): THREE.ExtrudeGeometry {
  const shape = roundedRectShape(CASE_INNER_W - 8.5, CASE_INNER_D - 8.5, 8, 8);
  for (const screw of SCREW_POSITIONS) {
    shape.holes.push(circleHole(screw.x, screw.z, 3.5, 12));
  }
  for (const key of STAB_KEYS_LIST) {
    const spacing = key.stabSpacing ?? 0;
    shape.holes.push(roundedRectHole(spacing + 12, 12, 3, key.x, key.z + 7.5, 3));
  }
  // The daughterboard and cable keep a clear channel at the rear edge.
  shape.holes.push(roundedRectHole(46, 22, 3, 0, -59, 3));
  return extrudeFlat(shape, BOTTOM_FOAM_TOP - BOTTOM_FOAM_BOTTOM, {
    bevel: 0.5,
    bevelSegments: 1,
    curveSegments: 6,
  });
}

export interface LowerCaseGeometries {
  bottom: THREE.BufferGeometry;
  wallLower: THREE.BufferGeometry;
  wallMiddle: THREE.BufferGeometry;
  wallUpper: THREE.BufferGeometry;
  shelf: THREE.BufferGeometry;
  bosses: THREE.BufferGeometry;
}

/**
 * Side-only extrusion for case walls. Keeping the outer/inner vertical skin
 * removes the horizontal cap rings that become visible as dark bands through a
 * semi-transparent acrylic case. The top and bottom are covered by the case.
 */
function buildWallSides(shape: THREE.Shape, y0: number, y1: number): THREE.BufferGeometry {
  const extracted = shape.extractPoints(8);
  const contours = [extracted.shape, ...extracted.holes];
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const edge = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  const tri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    nx: number,
    ny: number,
    nz: number,
    ua: number,
    va: number,
    ub: number,
    vb: number,
    uc: number,
    vc: number,
  ) => {
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    cross.crossVectors(ab, ac);
    if (cross.dot(normal.set(nx, ny, nz)) < 0) {
      positions.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
      uvs.push(ua, va, uc, vc, ub, vb);
    } else {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      uvs.push(ua, va, ub, vb, uc, vc);
    }
    for (let i = 0; i < 3; i += 1) normals.push(nx, ny, nz);
  };

  for (const contour of contours) {
    let perimeter = 0;
    for (let i = 0; i < contour.length; i += 1) {
      const p = contour[i];
      const q = contour[(i + 1) % contour.length];
      edge.set(q.x - p.x, 0, q.y - p.y);
      if (edge.lengthSq() < 1e-8) continue;
      normal.crossVectors(up, edge).normalize();
      const u0 = perimeter / 60;
      perimeter += edge.length();
      const u1 = perimeter / 60;
      const a = new THREE.Vector3(p.x, y0, p.y);
      const b = new THREE.Vector3(q.x, y0, q.y);
      const c = new THREE.Vector3(q.x, y1, q.y);
      const d = new THREE.Vector3(p.x, y1, p.y);
      tri(a, b, c, normal.x, normal.y, normal.z, u0, 0, u1, 0, u1, 1);
      tri(a, c, d, normal.x, normal.y, normal.z, u0, 0, u1, 1, u0, 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildLowerCaseGeometries(): LowerCaseGeometries {
  const bottomShape = roundedRectShape(CASE_W, CASE_D, CASE_RADIUS, 10);
  for (const screw of SCREW_POSITIONS) {
    bottomShape.holes.push(circleHole(screw.x, screw.z, 1.5, 12));
  }
  const bottom = extrudeFlat(bottomShape, 3.0, { bevel: 0.55, bevelSegments: 2, curveSegments: 8 });
  bottom.translate(0, -0.0, 0);

  const outer = () => roundedRectShape(CASE_W, CASE_D, CASE_RADIUS, 10);
  const innerHole = () =>
    roundedRectHole(CASE_INNER_W, CASE_INNER_D, CASE_RADIUS - 3.0, 0, 0, 8);

  const wallLowerShape = outer();
  wallLowerShape.holes.push(innerHole());
  const wallLower = buildWallSides(wallLowerShape, 3.0, 10.6);

  const cBand = cBandShape(
    CASE_W,
    CASE_D,
    CASE_INNER_W,
    CASE_INNER_D,
    CASE_RADIUS,
    CASE_RADIUS - 3.0,
    6.6,
  );
  const wallMiddle = buildWallSides(cBand, 10.6, 15.4);

  const wallUpperShape = outer();
  wallUpperShape.holes.push(innerHole());
  const wallUpper = buildWallSides(wallUpperShape, 15.4, 20.9);

  const shelfShape = shapeFromPoints(
    roundedRectPointsLocal(CASE_INNER_W + 1.2, CASE_INNER_D + 1.2, CASE_RADIUS - 2.6, 8),
  );
  shelfShape.holes.push(
    roundedRectHole(SHELF_OPENING_W, SHELF_OPENING_D, 9, 0, 0, 8),
  );
  const shelf = extrudeFlat(shelfShape, SHELF_TOP - SHELF_BOTTOM, { curveSegments: 8 });
  shelf.translate(0, SHELF_BOTTOM, 0);

  const bossGeometries: THREE.BufferGeometry[] = [];
  for (const screw of SCREW_POSITIONS) {
    const geometry = new THREE.CylinderGeometry(2.6, 2.9, 18.0, 16);
    geometry.translate(screw.x, 3.0 + 9.0, screw.z);
    bossGeometries.push(geometry);
  }
  for (const direction of [-1, 1]) {
    const geometry = new THREE.CylinderGeometry(2.15, 2.3, 4.2, 12);
    geometry.translate(direction * 8.5, 5.0, USB.boardZ);
    bossGeometries.push(geometry);
  }
  const bosses = mergeBosses(bossGeometries);

  return { bottom, wallLower, wallMiddle, wallUpper, shelf, bosses };
}

function roundedRectPointsLocal(width: number, height: number, radius: number, segments: number) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, Math.min(width, height) / 2);
  const corners = [
    { x: hw - r, y: -hh + r, start: -Math.PI / 2 },
    { x: hw - r, y: hh - r, start: 0 },
    { x: -hw + r, y: hh - r, start: Math.PI / 2 },
    { x: -hw + r, y: -hh + r, start: Math.PI },
  ];
  const points: THREE.Vector2[] = [];
  for (const corner of corners) {
    for (let i = 0; i <= segments; i += 1) {
      const angle = corner.start + (i / segments) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(corner.x + Math.cos(angle) * r, corner.y + Math.sin(angle) * r),
      );
    }
  }
  return points;
}

function mergeBosses(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (const geometry of geometries) {
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    const position = nonIndexed.getAttribute('position');
    const normal = nonIndexed.getAttribute('normal');
    const uv = nonIndexed.getAttribute('uv');
    for (let i = 0; i < position.count; i += 1) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
      if (normal) normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
      if (uv) uvs.push(uv.getX(i), uv.getY(i));
    }
    if (nonIndexed !== geometry) nonIndexed.dispose();
    geometry.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length) merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  else merged.computeVertexNormals();
  if (uvs.length) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return merged;
}

export function buildCaseLinerGeometry(): THREE.BufferGeometry {
  const shape = cBandShape(
    CASE_W - 0.35,
    CASE_D - 0.35,
    CASE_W - 1.15,
    CASE_D - 1.15,
    CASE_RADIUS - 0.2,
    CASE_RADIUS - 0.7,
    6.6,
  );
  const geometry = extrudeFlat(shape, 17.9, { curveSegments: 8 });
  geometry.translate(0, 3.0, 0);
  return geometry;
}

export function buildUpperCaseGeometry(): THREE.ExtrudeGeometry {
  const shape = roundedRectShape(CASE_W, CASE_D, CASE_RADIUS, 10);
  shape.holes.push(
    roundedRectHole(UPPER_OPENING_W, UPPER_OPENING_D, 11, 0, 0, 10),
  );
  return extrudeFlat(shape, UPPER_TOP - UPPER_BOTTOM, {
    bevel: 0.45,
    bevelSegments: 2,
    curveSegments: 10,
  });
}

export function gasketGeometry(): THREE.BufferGeometry {
  const shape = roundedRectShape(GASKET_W, 24, 1.4, 4);
  return extrudeFlat(shape, GASKET_HEIGHT, { bevel: 0.5, bevelSegments: 2, curveSegments: 4 });
}

export const KEY_CENTER_Z = 0;
export const BOARD_Y = {
  plate: PLATE_BOTTOM,
  pcb: PCB_BOTTOM,
  pcbTop: PCB_TOP,
  foam: SANDWICH_FOAM_BOTTOM,
  bottomFoam: BOTTOM_FOAM_BOTTOM,
  gasket: GASKET_BOTTOM,
};
export const KEY_PITCH_MM = KEY_PITCH;
