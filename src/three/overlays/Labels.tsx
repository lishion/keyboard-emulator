import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { HERO_STEP_INDEX } from '../../data/steps';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';

interface LabelSpec {
  id: string;
  text: string;
  anchorOffset: [number, number, number];
  offset: [number, number, number];
}

const KEYBOARD_LABELS: LabelSpec[] = [
  { id: 'cap-F5', text: '键帽层 · 87', anchorOffset: [0, 18, 0], offset: [-92, 20, 0] },
  { id: 'sw-KeyG', text: '轴体层 · 87', anchorOffset: [0, 12, 0], offset: [105, 6, 0] },
  { id: 'plate', text: 'FR4 定位板', anchorOffset: [0, 5, -70], offset: [-115, 20, -10] },
  { id: 'gasket-1', text: 'Gasket 缓冲垫', anchorOffset: [0, 4, 0], offset: [-48, 10, 0] },
  { id: 'foam-sandwich', text: '夹心棉', anchorOffset: [0, 3, 0], offset: [-52, -2, 26] },
  { id: 'pcb', text: '主 PCB / 热插拔', anchorOffset: [0, 4, 42], offset: [90, 4, 0] },
  { id: 'foam-bottom', text: '底棉', anchorOffset: [0, 4, 0], offset: [56, -10, -26] },
  { id: 'case-lower', text: '铝合金下壳', anchorOffset: [0, 22, 0], offset: [-100, -12, 0] },
  { id: 'case-upper', text: '铝合金上壳', anchorOffset: [0, 3, 0], offset: [72, 16, 0] },
  { id: 'screw-1', text: 'M2 壳体螺丝', anchorOffset: [0, 0, 0], offset: [-34, -14, 0] },
  { id: 'usb-board', text: 'USB-C 子板 / 线缆', anchorOffset: [0, 0, 0], offset: [34, 14, 0] },
];

const HERO_LABELS: LabelSpec[] = [
  { id: 'hero-top', text: '上盖 PC', anchorOffset: [0, 3, 0], offset: [16, 8, 0] },
  { id: 'hero-stem', text: '十字轴心 POM', anchorOffset: [0, 4, 0], offset: [16, -1, 0] },
  { id: 'hero-spring', text: '压缩弹簧', anchorOffset: [-3, 4, 0], offset: [-16, 8, 0] },
  { id: 'hero-bottom', text: '下盖 PA66', anchorOffset: [0, 3, 0], offset: [17, -4, 0] },
  { id: 'hero-contact-moving', text: '动触片', anchorOffset: [0, 3, 0], offset: [14, 3, 0] },
  { id: 'hero-contact-fixed', text: '静触片', anchorOffset: [0, 3, 0], offset: [-14, 3, 0] },
  { id: 'hero-pin-1', text: '金属引脚 ×2', anchorOffset: [0, 0, 0], offset: [14, -6, 0] },
  { id: 'hero-pole-center', text: '定位柱 ×3', anchorOffset: [0, 0, 0], offset: [-15, -8, 0] },
];

function LabelItem({ spec, factor, guides }: { spec: LabelSpec; factor: number; guides: boolean }) {
  const group = useRef<THREE.Group>(null);
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0]), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: '#e87432',
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, []);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);
  useFrame(() => {
    director.getPartLocalPosition(spec.id, anchor);
    anchor.set(
      anchor.x + spec.anchorOffset[0],
      anchor.y + spec.anchorOffset[1],
      anchor.z + spec.anchorOffset[2],
    );
    if (group.current) {
      group.current.position.set(
        anchor.x + spec.offset[0],
        anchor.y + spec.offset[1],
        anchor.z + spec.offset[2],
      );
    }
    const attribute = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    attribute.setXYZ(0, anchor.x, anchor.y, anchor.z);
    attribute.setXYZ(1, anchor.x + spec.offset[0], anchor.y + spec.offset[1], anchor.z + spec.offset[2]);
    attribute.needsUpdate = true;
    line.geometry.computeBoundingSphere();
  });

  return (
    <group ref={group}>
      {guides ? <primitive object={line} /> : null}
      <Html center distanceFactor={factor} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className="part-label">{spec.text}</div>
      </Html>
    </group>
  );
}

export function Labels() {
  const mode = useAppStore((state) => state.mode);
  const showLabels = useAppStore((state) => state.showLabels);
  const showGuides = useAppStore((state) => state.showGuides);
  const stepIndex = useAppStore((state) => state.teaching.stepIndex);
  const explode = useAppStore((state) => state.explode);
  const heroStage = mode === 'axis' || (mode === 'teach' && stepIndex >= HERO_STEP_INDEX);

  return (
    <group>
      {showLabels && mode === 'explode' && explode > 0.06
        ? KEYBOARD_LABELS.map((spec) => (
            <LabelItem key={spec.id} spec={spec} factor={42} guides={showGuides} />
          ))
        : null}
      {showLabels && heroStage
        ? HERO_LABELS.map((spec) => (
            <LabelItem key={spec.id} spec={spec} factor={7} guides={showGuides} />
          ))
        : null}
    </group>
  );
}
