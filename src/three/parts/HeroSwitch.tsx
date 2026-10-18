import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import { HERO_PARTS } from '../../data/parts';
import { THEMES } from '../../config/themes';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';
import { getMaterialSet } from '../../three/materials';
import {
  boxAt,
  crossHole,
  extrudeFlat,
  mergeAll,
  roundedBoxGeometry,
  roundedRectShape,
  springGeometry,
} from '../../three/geometry/shapes';
import { PartGroup } from '../PartGroup';
import { partPointerHandlers, useStepHighlight } from './partEvents';
import { useOverriddenMaterial } from '../../customization/hooks';

const HERO_BY_ID = Object.fromEntries(HERO_PARTS.map((part) => [part.id, part]));

function useActive(id: string) {
  return useAppStore((state) => state.hoveredId === id || state.selectedId === id);
}

function Outline({ id }: { id: string }) {
  const theme = THEMES[useAppStore((state) => state.themeKey)];
  const active = useActive(id);
  const step = useStepHighlight(id);
  if (!active && !step) return null;
  return <Outlines thickness={0.42} color={active ? theme.orange : theme.blue} />;
}

function heroAssembly(id: string): [number, number, number] {
  return HERO_BY_ID[id]?.assembly?.position ?? [0, 0, 0];
}

export function HeroSwitch() {
  const themeKey = useAppStore((state) => state.themeKey);
  const set = getMaterialSet(themeKey);
  const theme = THEMES[themeKey];
  const topMaterial = useOverriddenMaterial('hero-top', set.materials.polycarbonate);
  const bottomMaterial = useOverriddenMaterial('hero-bottom', set.materials.nylon);
  const stemMaterial = useOverriddenMaterial('hero-stem', set.materials.pom);
  const springMaterial = useOverriddenMaterial('hero-spring', set.materials.steel);
  const movingContactMaterial = useOverriddenMaterial(
    'hero-contact-moving',
    set.materials.gold,
  );
  const fixedContactMaterial = useOverriddenMaterial(
    'hero-contact-fixed',
    set.materials.gold,
  );
  const pin1Material = useOverriddenMaterial('hero-pin-1', set.materials.gold);
  const pin2Material = useOverriddenMaterial('hero-pin-2', set.materials.gold);
  const poleCenterMaterial = useOverriddenMaterial('hero-pole-center', set.materials.nylon);
  const poleLeftMaterial = useOverriddenMaterial('hero-pole-left', set.materials.nylon);
  const poleRightMaterial = useOverriddenMaterial('hero-pole-right', set.materials.nylon);
  const mode = useAppStore((state) => state.mode);
  const stemInner = useRef<THREE.Group>(null);
  const springInner = useRef<THREE.Group>(null);
  const movingLeaf = useRef<THREE.Group>(null);
  const contactGlow = useRef<THREE.Mesh>(null);
  const pressValue = useRef(0);

  const topHousing = useMemo(() => {
    const shape = roundedRectShape(11.55, 11.55, 1.9, 5);
    shape.holes.push(crossHole(2.18, 0.68));
    const shell = extrudeFlat(shape, 7.4, { curveSegments: 5 });
    const clips: THREE.BufferGeometry[] = [];
    for (const direction of [-1, 1]) {
      clips.push(boxAt(1.1, 1.5, 3.6, direction * 6.7, 1.0, 0));
    }
    return mergeAll([shell, ...clips]);
  }, []);

  const bottomHousing = useMemo(() => {
    const floorShape = roundedRectShape(15.6, 15.6, 2.1, 5);
    const floor = extrudeFlat(floorShape, 1.3, { curveSegments: 5 });
    const ringShape = roundedRectShape(15.6, 15.6, 2.1, 5);
    const innerPoints = roundedRectShape(12.4, 12.4, 1.5, 4).getPoints(1).map((p) => p.clone());
    const hole = new THREE.Path();
    hole.setFromPoints(innerPoints.reverse());
    hole.closePath();
    ringShape.holes.push(hole);
    const walls = extrudeFlat(ringShape, 6.9, { curveSegments: 5 });
    walls.translate(0, 1.3, 0);
    const post = new THREE.CylinderGeometry(2.0, 2.1, 2.0, 18);
    post.translate(0, 2.3, 0);
    const ribs: THREE.BufferGeometry[] = [post];
    for (const direction of [-1, 1]) {
      ribs.push(boxAt(0.8, 4.4, 1.4, direction * 4.2, 4.4, 3.2));
      ribs.push(boxAt(1.2, 1.0, 1.2, direction * 6.3, 8.1, 0));
    }
    return mergeAll([floor, walls, ...ribs]);
  }, []);

  const stem = useMemo(() => {
    const body = roundedBoxGeometry(4.6, 7.6, 4.6, 0.55, 3);
    const armA = boxAt(4.15, 1.2, 1.2, 0, 8.2, 0);
    const armB = boxAt(1.2, 1.2, 4.15, 0, 8.2, 0);
    const pusher = boxAt(1.4, 1.8, 1.4, 2.1, 0.4, 1.2);
    const wings: THREE.BufferGeometry[] = [];
    for (const direction of [-1, 1]) {
      wings.push(boxAt(0.5, 4.0, 2.2, direction * 2.9, 3.0, 0));
    }
    return mergeAll([body, armA, armB, pusher, ...wings]);
  }, []);

  const spring = useMemo(() => springGeometry(2.55, 0.46, 0, 7.1, 7.5, 6), []);

  const movingArm = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.7, 0.34, 2.8);
    geometry.translate(-0.8, 4.85, 0);
    return geometry;
  }, []);
  const fixedArm = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.7, 0.34, 2.8);
    geometry.translate(0.8, 4.85, 0);
    return geometry;
  }, []);

  const leafGeometry = useMemo(() => {
    const plate = new THREE.BoxGeometry(0.55, 5.5, 3.1);
    plate.translate(0, 2.75, 0);
    return plate;
  }, []);

  const fixedLeafGeometry = useMemo(() => {
    const plate = new THREE.BoxGeometry(0.55, 5.5, 3.1);
    plate.translate(0, 2.75, 0);
    return plate;
  }, []);

  const plinth = useMemo(() => {
    const board = roundedBoxGeometry(27, 1.2, 19, 2, 3);
    board.translate(0, -7.9, 0);
    const stand = new THREE.CylinderGeometry(17, 18.5, 1.5, 36);
    stand.translate(0, -9.4, 0);
    return { board, stand };
  }, []);

  useFrame((_, dt) => {
    const press = director.getAxisPress();
    pressValue.current += (press - pressValue.current) * Math.min(1, dt * 14);
    const value = pressValue.current;
    if (stemInner.current) stemInner.current.position.y = -value;
    if (springInner.current) {
      springInner.current.scale.y = Math.max(0.42, (7.1 - value) / 7.1);
    }
    if (movingLeaf.current) {
      const bend = Math.min(1, Math.max(0, (value - 1.35) / 1.65));
      movingLeaf.current.rotation.z = 0.12 + bend * 0.32;
      movingLeaf.current.position.x = -bend * 0.55;
    }
    if (contactGlow.current) {
      const closed = value >= 1.95;
      contactGlow.current.visible = closed;
      const material = contactGlow.current.material as THREE.MeshBasicMaterial;
      material.opacity = closed ? 0.55 + Math.sin(performance.now() / 180) * 0.1 : 0;
    }
  });

  if (mode !== 'axis' && mode !== 'teach') return null;

  return (
    <group>
      <mesh geometry={plinth.stand} material={set.materials.acrylic} position={[0, 0, 0]} />
      <mesh geometry={plinth.board} material={set.materials.fr4} castShadow receiveShadow />
      <mesh position={[0, -7.24, 0]} material={set.materials.gold}>
        <boxGeometry args={[10, 0.12, 5]} />
      </mesh>

      <PartGroup id="hero-bottom" position={heroAssembly('hero-bottom')}>
        <mesh geometry={bottomHousing} material={bottomMaterial} castShadow receiveShadow {...partPointerHandlers('hero-bottom')}>
          <Outline id="hero-bottom" />
        </mesh>
      </PartGroup>

      <PartGroup id="hero-spring" position={heroAssembly('hero-spring')}>
        <group ref={springInner}>
          <mesh geometry={spring} material={springMaterial} castShadow {...partPointerHandlers('hero-spring')}>
            <Outline id="hero-spring" />
          </mesh>
        </group>
      </PartGroup>

      <PartGroup id="hero-stem" position={heroAssembly('hero-stem')}>
        <group ref={stemInner}>
          <mesh geometry={stem} material={stemMaterial} castShadow {...partPointerHandlers('hero-stem')}>
            <Outline id="hero-stem" />
          </mesh>
        </group>
      </PartGroup>

      <PartGroup id="hero-top" position={heroAssembly('hero-top')}>
        <mesh geometry={topHousing} material={topMaterial} castShadow {...partPointerHandlers('hero-top')}>
          <Outline id="hero-top" />
        </mesh>
      </PartGroup>

      <PartGroup id="hero-contact-moving" position={heroAssembly('hero-contact-moving')}>
        <group ref={movingLeaf} rotation={[0, 0, 0.12]}>
          <mesh geometry={leafGeometry} material={movingContactMaterial} castShadow {...partPointerHandlers('hero-contact-moving')}>
            <Outline id="hero-contact-moving" />
          </mesh>
          <mesh geometry={movingArm} material={movingContactMaterial} />
          <mesh position={[-0.55, 4.9, 0]} material={movingContactMaterial}>
            <sphereGeometry args={[0.48, 12, 10]} />
          </mesh>
        </group>
      </PartGroup>

      <PartGroup id="hero-contact-fixed" position={heroAssembly('hero-contact-fixed')}>
        <group rotation={[0, 0, -0.12]}>
          <mesh geometry={fixedLeafGeometry} material={fixedContactMaterial} castShadow {...partPointerHandlers('hero-contact-fixed')}>
            <Outline id="hero-contact-fixed" />
          </mesh>
          <mesh geometry={fixedArm} material={fixedContactMaterial} />
          <mesh position={[0.55, 4.9, 0]} material={fixedContactMaterial}>
            <sphereGeometry args={[0.48, 12, 10]} />
          </mesh>
        </group>
      </PartGroup>

      <mesh ref={contactGlow} position={[0, 6.1, 2.4]} visible={false}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshBasicMaterial color={theme.orange} transparent opacity={0} toneMapped={false} />
      </mesh>

      <PartGroup id="hero-pin-1" position={heroAssembly('hero-pin-1')}>
        <mesh material={pin1Material} castShadow {...partPointerHandlers('hero-pin-1')}>
          <cylinderGeometry args={[0.72, 0.82, 3.9, 12]} />
          <Outline id="hero-pin-1" />
        </mesh>
      </PartGroup>
      <PartGroup id="hero-pin-2" position={heroAssembly('hero-pin-2')}>
        <mesh material={pin2Material} castShadow {...partPointerHandlers('hero-pin-2')}>
          <cylinderGeometry args={[0.72, 0.82, 3.9, 12]} />
          <Outline id="hero-pin-2" />
        </mesh>
      </PartGroup>
      <PartGroup id="hero-pole-center" position={heroAssembly('hero-pole-center')}>
        <mesh material={poleCenterMaterial} castShadow {...partPointerHandlers('hero-pole-center')}>
          <cylinderGeometry args={[2.0, 1.85, 4.4, 18]} />
          <Outline id="hero-pole-center" />
        </mesh>
      </PartGroup>
      <PartGroup id="hero-pole-left" position={heroAssembly('hero-pole-left')}>
        <mesh material={poleLeftMaterial} castShadow {...partPointerHandlers('hero-pole-left')}>
          <cylinderGeometry args={[0.86, 0.86, 3.4, 12]} />
          <Outline id="hero-pole-left" />
        </mesh>
      </PartGroup>
      <PartGroup id="hero-pole-right" position={heroAssembly('hero-pole-right')}>
        <mesh material={poleRightMaterial} castShadow {...partPointerHandlers('hero-pole-right')}>
          <cylinderGeometry args={[0.86, 0.86, 3.4, 12]} />
          <Outline id="hero-pole-right" />
        </mesh>
      </PartGroup>
    </group>
  );
}
