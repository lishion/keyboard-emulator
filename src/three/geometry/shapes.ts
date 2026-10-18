import * as THREE from 'three';

/** Points of a rounded rectangle, counter-clockwise, in the XZ-like shape plane. */
export function roundedRectPoints(
  width: number,
  height: number,
  radius: number,
  segments = 6,
  cx = 0,
  cy = 0,
): THREE.Vector2[] {
  const r = Math.min(radius, Math.min(width, height) / 2);
  const hw = width / 2;
  const hh = height / 2;
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
        new THREE.Vector2(cx + corner.x + Math.cos(angle) * r, cy + corner.y + Math.sin(angle) * r),
      );
    }
  }
  return points;
}

export function shapeFromPoints(points: THREE.Vector2[]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.setFromPoints(points);
  shape.closePath();
  return shape;
}

export function holeFromPoints(points: THREE.Vector2[]): THREE.Path {
  const path = new THREE.Path();
  path.setFromPoints([...points].reverse());
  path.closePath();
  return path;
}

export function roundedRectShape(
  width: number,
  height: number,
  radius: number,
  segments = 6,
  cx = 0,
  cy = 0,
): THREE.Shape {
  return shapeFromPoints(roundedRectPoints(width, height, radius, segments, cx, cy));
}

export function roundedRectHole(
  width: number,
  height: number,
  radius: number,
  cx = 0,
  cy = 0,
  segments = 4,
): THREE.Path {
  return holeFromPoints(roundedRectPoints(width, height, radius, segments, cx, cy));
}

export function circleHole(cx: number, cy: number, radius: number, segments = 12): THREE.Path {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
  }
  return holeFromPoints(points);
}

/**
 * Extrude a shape flat in world XZ. The extrusion starts at y = 0 and goes up.
 * Shape Y maps to world Z.
 */
export function extrudeFlat(
  shape: THREE.Shape,
  depth: number,
  options: { bevel?: number; bevelSegments?: number; curveSegments?: number } = {},
): THREE.ExtrudeGeometry {
  const bevel = options.bevel ?? 0;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: options.bevelSegments ?? 2,
    curveSegments: options.curveSegments ?? 8,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, depth, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rounded box geometry with a supplied corner radius (no extra dependencies). */
export function roundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius = 1,
  segments = 3,
): THREE.BufferGeometry {
  const shape = roundedRectShape(width, depth, radius, segments);
  return extrudeFlat(shape, height, { bevel: radius * 0.55, bevelSegments: 2 });
}

/** A simple cross (plus) outline used for switch stem guides and keycap sockets. */
export function crossShape(armLength = 2.05, armWidth = 0.6, fillet = 0.12): THREE.Shape {
  const a = armLength;
  const w = armWidth;
  const f = fillet;
  const s = new THREE.Shape();
  s.moveTo(-w, -a);
  s.lineTo(w, -a);
  s.lineTo(w, -w);
  s.lineTo(a, -w);
  s.lineTo(a, w);
  s.lineTo(w, w);
  s.lineTo(w, a);
  s.lineTo(-w, a);
  s.lineTo(-w, w);
  s.lineTo(-a, w);
  s.lineTo(-a, -w);
  s.lineTo(-w, -w);
  s.closePath();
  // Tiny rounded corners are not essential at this scale; fillet keeps the API honest.
  if (f > 0) s.curves.forEach((curve) => curve.getPoints(2));
  return s;
}


export function crossHole(armLength = 2.05, armWidth = 0.6): THREE.Path {
  const a = armLength;
  const w = armWidth;
  const points = [
    new THREE.Vector2(-w, -a),
    new THREE.Vector2(w, -a),
    new THREE.Vector2(w, -w),
    new THREE.Vector2(a, -w),
    new THREE.Vector2(a, w),
    new THREE.Vector2(w, w),
    new THREE.Vector2(w, a),
    new THREE.Vector2(-w, a),
    new THREE.Vector2(-w, w),
    new THREE.Vector2(-a, w),
    new THREE.Vector2(-a, -w),
    new THREE.Vector2(-w, -w),
  ];
  return holeFromPoints(points);
}

/** Merge a set of pre-transformed geometries into one. */
export function mergeAll(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const geometry of geometries) {
    const source = geometry.index ? geometry.toNonIndexed() : geometry;
    const position = source.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
    }
    if (source !== geometry) source.dispose();
    geometry.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  return merged;
}

export function boxAt(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.translate(x, y, z);
  return geometry;
}

export function cylinderAt(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  x: number,
  y: number,
  z: number,
  segments = 16,
): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  geometry.translate(x, y + height / 2, z);
  return geometry;
}

/** Build a rounded-rect C shaped wall band, used for the USB-C opening. */
export function cBandShape(
  outerW: number,
  outerD: number,
  innerW: number,
  innerD: number,
  radiusOuter: number,
  radiusInner: number,
  gapHalf: number,
): THREE.Shape {
  const ow = outerW / 2;
  const od = outerD / 2;
  const iw = innerW / 2;
  const id = innerD / 2;
  const ro = radiusOuter;
  const ri = radiusInner;
  const s = new THREE.Shape();
  s.moveTo(gapHalf, -od);
  s.lineTo(ow - ro, -od);
  s.quadraticCurveTo(ow, -od, ow, -od + ro);
  s.lineTo(ow, od - ro);
  s.quadraticCurveTo(ow, od, ow - ro, od);
  s.lineTo(-ow + ro, od);
  s.quadraticCurveTo(-ow, od, -ow, od - ro);
  s.lineTo(-ow, -od + ro);
  s.quadraticCurveTo(-ow, -od, -ow + ro, -od);
  s.lineTo(-gapHalf, -od);
  s.lineTo(-gapHalf, -id);
  s.lineTo(-iw + ri, -id);
  s.quadraticCurveTo(-iw, -id, -iw, -id + ri);
  s.lineTo(-iw, id - ri);
  s.quadraticCurveTo(-iw, id, -iw + ri, id);
  s.lineTo(iw - ri, id);
  s.quadraticCurveTo(iw, id, iw, id - ri);
  s.lineTo(iw, -id + ri);
  s.quadraticCurveTo(iw, -id, iw - ri, -id);
  s.lineTo(gapHalf, -id);
  s.closePath();
  return s;
}

/**
 * Geometry for a cylindrical compression spring between yBottom and yTop.
 * Used only by the hero switch; board switches intentionally use a simplified body.
 */
export function springGeometry(
  radius: number,
  wireRadius: number,
  yBottom: number,
  yTop: number,
  turns = 7,
  radialSegments = 6,
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const steps = Math.max(24, Math.round(turns * 18));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        yBottom + (yTop - yBottom) * t,
        Math.sin(angle) * radius,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, steps, wireRadius, radialSegments, false);
}
