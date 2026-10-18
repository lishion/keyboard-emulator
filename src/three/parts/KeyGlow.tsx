import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { KEYS } from '../../data/layout';
import { CAP_BOTTOM } from '../../config/constants';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';
import { useResolvedAppearance } from '../../customization/hooks';
import { computeLedColor, isLedOff, resolveLedStyle } from '../../customization/led';

const SIZE = 30;

export function KeyGlow() {
  const visible = useAppStore(
    (state) => state.mode === 'preview' && state.categoryVisibility.keycaps && state.isolateId === null,
  );
  const ledAppearance = useResolvedAppearance('pcb-leds');
  const ledStyle = useMemo(() => resolveLedStyle(ledAppearance), [ledAppearance]);
  const ledVisible = !isLedOff(ledStyle);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
      gradient.addColorStop(0.42, 'rgba(255,255,255,0.55)');
      gradient.addColorStop(0.72, 'rgba(255,255,255,0.16)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const geometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(SIZE, SIZE);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: '#ffffff',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [texture],
  );
  useEffect(() => () => material.dispose(), [material]);

  const topTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(255,255,255,0.04)');
      gradient.addColorStop(0.34, 'rgba(255,255,255,0.16)');
      gradient.addColorStop(0.62, 'rgba(255,255,255,0.72)');
      gradient.addColorStop(0.8, 'rgba(255,255,255,0.35)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => topTexture.dispose(), [topTexture]);
  const topMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: topTexture,
        color: '#ffffff',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [topTexture],
  );
  useEffect(() => () => topMaterial.dispose(), [topMaterial]);

  const mesh = useRef<THREE.InstancedMesh>(null);
  const topMesh = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const dark = useMemo(() => new THREE.Color('#000000'), []);
  const identity = useMemo(() => new THREE.Quaternion(), []);
  const glowPosition = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const spread = 0.72 + ledStyle.glowRadius * 0.34;
    KEYS.forEach((key, index) => {
      glowPosition.set(key.x, 25.5, key.z);
      scale.set(spread, 1, spread);
      matrix.compose(glowPosition, identity, scale);
      mesh.current?.setMatrixAt(index, matrix);
      mesh.current?.setColorAt(index, dark);
      position.set(key.x, CAP_BOTTOM + key.heightMm + 0.55, key.z);
      quaternion.setFromEuler(new THREE.Euler((key.tilt * Math.PI) / 180, 0, 0));
      scale.set(Math.max(1, key.widthMm / 18.27) * (0.94 + ledStyle.glowRadius * 0.06), 1, 1.12);
      matrix.compose(position, quaternion, scale);
      topMesh.current?.setMatrixAt(index, matrix);
      topMesh.current?.setColorAt(index, dark);
    });
    if (mesh.current?.instanceMatrix) mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    if (topMesh.current?.instanceMatrix) topMesh.current.instanceMatrix.needsUpdate = true;
    if (topMesh.current?.instanceColor) topMesh.current.instanceColor.needsUpdate = true;
  }, [matrix, dark, position, quaternion, scale, identity, glowPosition, ledStyle.glowRadius]);

  useFrame((state) => {
    const instanced = mesh.current;
    const topInstanced = topMesh.current;
    if (!instanced || !topInstanced) return;
    const time = state.clock.elapsedTime;
    KEYS.forEach((key, index) => {
      const depth = director.getKeyDepth(key.code);
      computeLedColor(ledStyle, index, depth, time, color);
      instanced.setColorAt(index, color);
      topInstanced.setColorAt(index, color);
    });
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    if (topInstanced.instanceColor) topInstanced.instanceColor.needsUpdate = true;
  });

  if (!visible || !ledVisible) return null;

  return (
    <group>
      <instancedMesh
        ref={mesh}
        args={[geometry, material, KEYS.length]}
        frustumCulled={false}
        renderOrder={5}
      />
      <instancedMesh
        ref={topMesh}
        args={[geometry, topMaterial, KEYS.length]}
        frustumCulled={false}
        renderOrder={6}
      />
    </group>
  );
}
