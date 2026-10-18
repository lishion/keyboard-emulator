import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore, type CameraRequest } from '../state/store';
import type { ViewPreset } from '../config/constants';

interface CameraTarget {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const PRESETS: Record<ViewPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  perspective: { position: [0, 24, 41], target: [0, 2.6, 0] },
  top: { position: [0, 45, 0.015], target: [0, 2.2, 0] },
  bottom: { position: [0, -30, 16], target: [0, 2.0, 0] },
  side: { position: [43, 12, 0.015], target: [0, 3.0, 0] },
  close: { position: [-16, 13, 20], target: [-10.5, 4.2, -2] },
};

function computeRequest(request: CameraRequest, aspect: number, axisExplode: number): CameraTarget {
  if (request.position && request.target) {
    const target = new THREE.Vector3(...request.target);
    const scale =
      request.kind === 'teach' || request.kind === 'axis'
        ? Math.max(1, Math.min(1.7, 1.45 / aspect))
        : 1;
    const position = new THREE.Vector3(...request.position)
      .sub(target)
      .multiplyScalar(scale)
      .add(target);
    return { position, target };
  }
  if (request.kind === 'explode') {
    const scale = Math.max(1, Math.min(1.6, 1.12 / aspect));
    const target = new THREE.Vector3(0, 7.2, 0);
    const position = new THREE.Vector3(-26, 30, 62).sub(target).multiplyScalar(scale).add(target);
    return { position, target };
  }
  if (request.kind === 'axis') {
    const scale = Math.max(1, Math.min(1.45, 1.05 / aspect));
    const target = new THREE.Vector3(0, 0.9 + axisExplode * 1.3, 0);
    const position = new THREE.Vector3(5.4 + axisExplode * 2.0, 4.1 + axisExplode * 1.8, 7.6 + axisExplode * 2.9)
      .sub(target)
      .multiplyScalar(scale)
      .add(target);
    return { position, target };
  }
  if (request.kind === 'teach') {
    const preset = PRESETS.perspective;
    return {
      position: new THREE.Vector3(...preset.position),
      target: new THREE.Vector3(...preset.target),
    };
  }
  const preset = PRESETS[request.kind];
  const scale = Math.max(1, Math.min(2.1, 1.5 / aspect));
  const target = new THREE.Vector3(...preset.target);
  const position = new THREE.Vector3(...preset.position).sub(target).multiplyScalar(scale).add(target);
  return { position, target };
}

export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const request = useAppStore((state) => state.cameraRequest);
  const axisExplode = useAppStore((state) => state.axisExplode);
  const animating = useRef(false);
  const desired = useRef<CameraTarget | null>(null);
  const lastNonce = useRef(-1);

  useEffect(() => {
    if (!request) return;
    const followsAxis = request.kind === 'axis' && !request.position;
    if (request.nonce === lastNonce.current && !followsAxis) return;
    lastNonce.current = request.nonce;
    desired.current = computeRequest(request, size.width / Math.max(1, size.height), axisExplode);
    animating.current = true;
  }, [request, size.width, size.height, axisExplode]);

  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      animating.current = false;
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controls]);

  useFrame((_, delta) => {
    if (!animating.current || !desired.current) return;
    const blend = 1 - Math.exp(-delta * 5.2);
    camera.position.lerp(desired.current.position, blend);
    if (controls) {
      controls.target.lerp(desired.current.target, blend);
      controls.update();
    } else {
      camera.lookAt(desired.current.target);
    }
    if (
      camera.position.distanceTo(desired.current.position) < 0.05 &&
      (!controls || controls.target.distanceTo(desired.current.target) < 0.05)
    ) {
      camera.position.copy(desired.current.position);
      if (controls) controls.target.copy(desired.current.target);
      animating.current = false;
    }
  });

  return null;
}
