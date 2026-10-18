import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import {
  BOTTOM_FOAM_BOTTOM,
  GASKET_BOTTOM,
  PCB_BOTTOM,
  PCB_THICK,
  PLATE_BOTTOM,
  SANDWICH_FOAM_BOTTOM,
  SCREW_POSITIONS,
  UPPER_BOTTOM,
  USB,
} from '../../config/constants';
import { KEYS } from '../../data/layout';
import { gasketOffset } from '../../data/parts';
import { THEMES } from '../../config/themes';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';
import { getMaterialSet } from '../../three/materials';
import {
  buildBottomFoamGeometry,
  buildLowerCaseGeometries,
  buildPcbGeometry,
  buildPlateGeometry,
  buildSandwichFoamGeometry,
  buildCaseLinerGeometry,
  buildUpperCaseGeometry,
  gasketGeometry,
} from '../../three/geometry/board';
import { createPcbTexture } from '../../three/geometry/pcbTexture';
import { roundedBoxGeometry } from '../../three/geometry/shapes';
import { caseScrew, screwRecessMaterial, usbScrew } from '../../three/geometry/hardware';
import { PartGroup } from '../PartGroup';
import { clearHover, hoverPart, partPointerHandlers, selectPart, useStepHighlight } from './partEvents';
import {
  useAppearanceOverride,
  useFoamMaterial,
  useOverriddenMaterial,
  useResolvedAppearance,
} from '../../customization/hooks';
import { materialPresetFor } from '../../customization/materialPresets';
import { getMaterialMap } from '../../customization/materialTextures';
import { computeLedColor, resolveLedStyle } from '../../customization/led';

const PCB_CHILD_IDS = new Set(['pcb', 'pcb-hotswap', 'pcb-diodes', 'pcb-leds', 'pcb-mcu', 'pcb-passives']);

function useActive(id: string): boolean {
  return useAppStore((state) => state.hoveredId === id || state.selectedId === id);
}

function PartOutline({ id, active }: { id: string; active: boolean }) {
  const theme = THEMES[useAppStore((state) => state.themeKey)];
  const step = useStepHighlight(id);
  if (!active && !step) return null;
  return <Outlines thickness={0.8} color={active ? theme.orange : theme.blue} opacity={0.95} transparent />;
}

export function Plate() {
  const themeKey = useAppStore((state) => state.themeKey);
  const active = useActive('plate');
  const geometry = useMemo(buildPlateGeometry, []);
  const material = useOverriddenMaterial('plate', getMaterialSet(themeKey).materials.fr4);
  const handlers = useMemo(() => partPointerHandlers('plate'), []);
  return (
    <PartGroup id="plate" position={[0, PLATE_BOTTOM, 0]}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow {...handlers}>
        <PartOutline id="plate" active={active} />
      </mesh>
    </PartGroup>
  );
}

export function Gaskets() {
  const geometry = useMemo(gasketGeometry, []);
  return (
    <group>
      {Array.from({ length: 8 }, (_, index) => {
        const offset = gasketOffset(index);
        return <Gasket key={index} id={`gasket-${index + 1}`} geometry={geometry} offset={offset} />;
      })}
    </group>
  );
}

function Gasket({
  id,
  geometry,
  offset,
}: {
  id: string;
  geometry: THREE.BufferGeometry;
  offset: { x: number; z: number; rot: number };
}) {
  const themeKey = useAppStore((state) => state.themeKey);
  const active = useActive(id);
  const material = useOverriddenMaterial(id, getMaterialSet(themeKey).materials.silicone);
  const handlers = useMemo(() => partPointerHandlers(id), [id]);
  return (
    <PartGroup id={id} position={[offset.x, GASKET_BOTTOM, offset.z]} rotationDeg={[0, offset.rot, 0]}>
      <mesh geometry={geometry} material={material} castShadow {...handlers}>
        <PartOutline id={id} active={active} />
      </mesh>
    </PartGroup>
  );
}

export function SandwichFoam() {
  const active = useActive('foam-sandwich');
  const geometry = useMemo(buildSandwichFoamGeometry, []);
  const material = useFoamMaterial('foam-sandwich');
  const handlers = useMemo(() => partPointerHandlers('foam-sandwich'), []);
  return (
    <PartGroup id="foam-sandwich" position={[0, SANDWICH_FOAM_BOTTOM, 0]}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow {...handlers}>
        <PartOutline id="foam-sandwich" active={active} />
      </mesh>
    </PartGroup>
  );
}

export function BottomFoam() {
  const active = useActive('foam-bottom');
  const geometry = useMemo(buildBottomFoamGeometry, []);
  const material = useFoamMaterial('foam-bottom');
  const handlers = useMemo(() => partPointerHandlers('foam-bottom'), []);
  return (
    <PartGroup id="foam-bottom" position={[0, BOTTOM_FOAM_BOTTOM, 0]}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow {...handlers}>
        <PartOutline id="foam-bottom" active={active} />
      </mesh>
    </PartGroup>
  );
}

export function Pcb() {
  const themeKey = useAppStore((state) => state.themeKey);
  const theme = THEMES[themeKey];
  const set = getMaterialSet(themeKey);
  const geometry = useMemo(buildPcbGeometry, []);
  const appearance = useResolvedAppearance('pcb');
  const rawAppearance = useAppearanceOverride('pcb');
  const pcbPreset = materialPresetFor('pcb', rawAppearance?.material);
  const ledAppearance = useResolvedAppearance('pcb-leds');
  const ledStyle = useMemo(() => resolveLedStyle(ledAppearance), [ledAppearance]);
  const pcbActive = useAppStore(
    (state) =>
      PCB_CHILD_IDS.has(state.hoveredId ?? '') || PCB_CHILD_IDS.has(state.selectedId ?? ''),
  );
  const handlers = useMemo(() => partPointerHandlers('pcb'), []);
  const { texture, topMaterial, sideMaterial } = useMemo(() => {
    const map = createPcbTexture(theme, {
      solderMask: appearance.solderMask,
      silkscreen: appearance.silkscreen,
      traceColor: appearance.traceColor,
      traceOpacity: appearance.traceOpacity,
      showTraces: appearance.showTraces,
      showSilkscreen: appearance.showSilkscreen,
    });
    const top = new THREE.MeshPhysicalMaterial({
      map,
      color: '#ffffff',
      metalness:
        rawAppearance?.metalness ?? pcbPreset?.metalness ?? appearance.metalness ?? 0.18,
      roughness:
        rawAppearance?.roughness ?? pcbPreset?.roughness ?? appearance.roughness ?? 0.42,
      clearcoat: 0.18,
      clearcoatRoughness: 0.4,
    });
    const side = new THREE.MeshStandardMaterial({
      color: new THREE.Color(appearance.solderMask ?? theme.pcb).offsetHSL(0, -0.05, 0.035),
      roughness: 0.55,
      metalness: 0.1,
    });
    return { texture: map, topMaterial: top, sideMaterial: side };
  }, [
    theme,
    appearance.solderMask,
    appearance.silkscreen,
    appearance.traceColor,
    appearance.traceOpacity,
    appearance.showTraces,
    appearance.showSilkscreen,
    appearance.metalness,
    appearance.roughness,
    rawAppearance?.metalness,
    rawAppearance?.roughness,
    pcbPreset,
  ]);

  useEffect(() => {
    return () => {
      texture.dispose();
      topMaterial.dispose();
      sideMaterial.dispose();
    };
  }, [texture, topMaterial, sideMaterial]);

  const socketGeometry = useMemo(() => {
    const geometry = roundedBoxGeometry(9.4, 2.8, 5.6, 0.45, 2);
    geometry.translate(0, -3.2, 0);
    return geometry;
  }, []);
  const diodeGeometry = useMemo(() => new THREE.BoxGeometry(1.7, 0.75, 1.0), []);
  const ledGeometry = useMemo(() => new THREE.BoxGeometry(1.9, 0.55, 1.9), []);
  const socketRef = useRef<THREE.InstancedMesh>(null);
  const diodeRef = useRef<THREE.InstancedMesh>(null);
  const ledRef = useRef<THREE.InstancedMesh>(null);
  const ledMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    [],
  );
  useEffect(() => () => ledMaterial.dispose(), [ledMaterial]);
  const socketMaterial = useOverriddenMaterial('pcb-hotswap', set.materials.nylon);
  const diodeMaterial = useOverriddenMaterial('pcb-diodes', set.materials.solder);
  const indicatorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ledStyle.base,
        emissive: ledStyle.base,
        emissiveIntensity: 0.35 * ledStyle.brightness,
        roughness: 0.4,
        metalness: 0.15,
      }),
    [ledStyle.base, ledStyle.brightness],
  );
  useEffect(() => () => indicatorMaterial.dispose(), [indicatorMaterial]);
  const ledScratch = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    KEYS.forEach((key, index) => {
      matrix.makeTranslation(key.x, 0, key.z - 3.4);
      socketRef.current?.setMatrixAt(index, matrix);
      matrix.makeTranslation(key.x + 6.4, -2.0, key.z + 5.2);
      diodeRef.current?.setMatrixAt(index, matrix);
      matrix.makeTranslation(key.x + 8.4, PCB_THICK + 0.34, key.z);
      ledRef.current?.setMatrixAt(index, matrix);
    });
    if (socketRef.current) socketRef.current.instanceMatrix.needsUpdate = true;
    if (diodeRef.current) diodeRef.current.instanceMatrix.needsUpdate = true;
    if (ledRef.current) {
      ledRef.current.instanceMatrix.needsUpdate = true;
      if (ledRef.current.instanceColor) ledRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame((state) => {
    const leds = ledRef.current;
    if (!leds) return;
    const time = state.clock.elapsedTime;
    KEYS.forEach((key, index) => {
      const depth = director.getKeyDepth(key.code);
      computeLedColor(ledStyle, index, depth, time, ledScratch);
      leds.setColorAt(index, ledScratch);
    });
    if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
  });

  return (
    <PartGroup id="pcb" position={[0, PCB_BOTTOM, 0]}>
      <mesh geometry={geometry} material={[topMaterial, sideMaterial]} castShadow receiveShadow {...handlers}>
        <PartOutline id="pcb" active={pcbActive} />
      </mesh>

      <instancedMesh
        ref={socketRef}
        args={[socketGeometry, socketMaterial, KEYS.length]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          selectPart('pcb-hotswap');
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          hoverPart('pcb-hotswap');
        }}
        onPointerOut={() => clearHover('pcb-hotswap')}
      />
      <instancedMesh
        ref={diodeRef}
        args={[diodeGeometry, diodeMaterial, KEYS.length]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          selectPart('pcb-diodes');
        }}
      />
      <instancedMesh
        ref={ledRef}
        args={[ledGeometry, ledMaterial, KEYS.length]}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          selectPart('pcb-leds');
        }}
      />

      <Mcu themeKey={themeKey} />
      <Passives themeKey={themeKey} />

      <mesh
        position={[58, PCB_THICK + 1.6, -62.5]}
        castShadow
        onClick={(event) => {
          event.stopPropagation();
          selectPart('pcb');
        }}
      >
        <boxGeometry args={[8.4, 3.2, 4.2]} />
        <meshStandardMaterial color="#e4dfd2" roughness={0.55} />
      </mesh>
      <mesh position={[-120, PCB_THICK + 0.8, -37]} material={indicatorMaterial}>
        <boxGeometry args={[32, 1.4, 14]} />
      </mesh>
    </PartGroup>
  );
}

function Mcu({ themeKey }: { themeKey: keyof typeof THEMES }) {
  const active = useAppStore(
    (state) => state.hoveredId === 'pcb-mcu' || state.selectedId === 'pcb-mcu',
  );
  const theme = THEMES[themeKey];
  const bodyBase = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#181a19', roughness: 0.55, metalness: 0.1 }),
    [],
  );
  useEffect(() => () => bodyBase.dispose(), [bodyBase]);
  const bodyMaterial = useOverriddenMaterial('pcb-mcu', bodyBase);
  const pins = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 7; i += 1) {
      const offset = -3 + i;
      for (const [dx, dz] of [
        [offset, -3.9],
        [offset, 3.9],
        [-3.9, offset],
        [3.9, offset],
      ]) {
        const geometry = new THREE.BoxGeometry(0.35, 0.4, 0.35);
        geometry.translate(dx, 0.8, dz);
        geos.push(geometry);
      }
    }
    return geos;
  }, []);
  return (
    <group
      position={[0, PCB_THICK + 0.7, -38]}
      onClick={(event) => {
        event.stopPropagation();
        selectPart('pcb-mcu');
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        hoverPart('pcb-mcu');
      }}
      onPointerOut={() => clearHover('pcb-mcu')}
    >
      <mesh castShadow material={bodyMaterial}>
        <boxGeometry args={[7, 1.1, 7]} />
      </mesh>
      {pins.map((geometry, index) => (
        <mesh key={index} geometry={geometry} material={getMaterialSet(themeKey).materials.solder} />
      ))}
      {active ? <mesh position={[0, 0.2, 0]}><boxGeometry args={[7.6, 1.5, 7.6]} /><meshBasicMaterial color={theme.orange} transparent opacity={0.12} /></mesh> : null}
    </group>
  );
}

function Passives({ themeKey }: { themeKey: keyof typeof THEMES }) {
  const set = getMaterialSet(themeKey);
  const bodyMaterial = useOverriddenMaterial('pcb-passives', set.materials.solder);
  const contactMaterial = useOverriddenMaterial('pcb-passives', set.materials.gold, 'contactColor');
  const blocks = useMemo(() => {
    const items: Array<{ x: number; z: number; w: number; d: number }> = [];
    let seed = 11;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 22; i += 1) {
      items.push({
        x: -130 + next() * 260,
        z: -40 + next() * 20,
        w: 1 + next() * 2.4,
        d: 0.8 + next() * 1.4,
      });
    }
    for (let i = 0; i < 12; i += 1) {
      items.push({ x: 42 + next() * 30, z: -58 + next() * 8, w: 1.2, d: 0.8 });
    }
    return items;
  }, []);
  return (
    <group>
      {blocks.map((block, index) => (
        <mesh
          key={index}
          position={[block.x, PCB_THICK + 0.35, block.z]}
          material={index % 4 === 0 ? contactMaterial : bodyMaterial}
          onClick={(event) => {
            event.stopPropagation();
            selectPart('pcb-passives');
          }}
        >
          <boxGeometry args={[block.w, 0.35, block.d]} />
        </mesh>
      ))}
    </group>
  );
}


function BottomBadge() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 768, 256);
      gradient.addColorStop(0, '#4a4e54');
      gradient.addColorStop(0.5, '#5b6067');
      gradient.addColorStop(1, '#3f444a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 768, 256);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, 740, 228);
      ctx.fillStyle = '#f4eee1';
      ctx.font = '700 64px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText('MX-87', 44, 106);
      ctx.fillStyle = '#e87432';
      ctx.fillRect(44, 126, 92, 5);
      ctx.fillStyle = 'rgba(246,240,228,0.75)';
      ctx.font = '500 21px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText('6063 ALUMINIUM  ·  T6  ·  GASKET MOUNT', 44, 170);
      ctx.font = '500 17px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = 'rgba(246,240,228,0.45)';
      ctx.fillText('STRUCTURE REFERENCE — NOT A PRODUCT REPLICA', 44, 205);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(246,240,228,0.6)';
      ctx.font = '500 19px monospace';
      ctx.fillText('ANSI TKL / 87', 716, 106);
      ctx.fillText('19.05 mm PITCH', 716, 138);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, -0.585, 17]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[118, 39]} />
      <meshStandardMaterial map={texture} metalness={0.72} roughness={0.38} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function CaseLower() {
  const themeKey = useAppStore((state) => state.themeKey);
  const theme = THEMES[themeKey];
  const active = useActive('case-lower');
  const geometries = useMemo(buildLowerCaseGeometries, []);
  const baseMetal = getMaterialSet(themeKey).materials.aluminum;
  const material = useOverriddenMaterial('case-lower', baseMetal);
  const bottomBase = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(theme.caseAlt).offsetHSL(0, -0.02, -0.02),
        metalness: 0.52,
        roughness: 0.48,
      }),
    [theme.caseAlt],
  );
  const bottomMaterial = useOverriddenMaterial('case-lower', bottomBase);
  const appearance = useResolvedAppearance('case-lower');
  const showLiner = material.transparent && appearance.hideInternals !== false;
  const linerGeometry = useMemo(buildCaseLinerGeometry, []);
  const linerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(appearance.color ?? theme.case).offsetHSL(0, -0.04, -0.12),
        roughness: 0.72,
        metalness: 0.1,
      }),
    [appearance.color, theme.case],
  );
  useEffect(() => () => linerMaterial.dispose(), [linerMaterial]);
  useEffect(() => () => linerGeometry.dispose(), [linerGeometry]);
  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.accentColor ?? theme.orange,
        roughness: 0.38,
        metalness: 0.72,
      }),
    [appearance.accentColor, theme.orange],
  );
  useEffect(() => () => bottomBase.dispose(), [bottomBase]);
  useEffect(() => () => accentMaterial.dispose(), [accentMaterial]);
  const handlers = useMemo(() => partPointerHandlers('case-lower'), []);
  const glass = material.transparent;
  const bottomGlass = bottomMaterial.transparent;
  const cast = !glass;
  const receive = !glass;
  return (
    <PartGroup id="case-lower">
      <mesh
        geometry={geometries.bottom}
        material={bottomMaterial}
        castShadow={!bottomGlass}
        receiveShadow={!bottomGlass}
        renderOrder={bottomGlass ? 4 : 0}
        {...handlers}
      >
        <PartOutline id="case-lower" active={active} />
      </mesh>
      <mesh
        geometry={geometries.wallLower}
        material={material}
        castShadow={cast}
        receiveShadow={receive}
        renderOrder={glass ? 4 : 0}
        {...handlers}
      >
        <PartOutline id="case-lower" active={active} />
      </mesh>
      <mesh
        geometry={geometries.wallMiddle}
        material={material}
        castShadow={cast}
        receiveShadow={receive}
        renderOrder={glass ? 4 : 0}
        {...handlers}
      >
        <PartOutline id="case-lower" active={active} />
      </mesh>
      <mesh
        geometry={geometries.wallUpper}
        material={material}
        castShadow={cast}
        receiveShadow={receive}
        renderOrder={glass ? 4 : 0}
        {...handlers}
      >
        <PartOutline id="case-lower" active={active} />
      </mesh>
      <mesh geometry={geometries.shelf} material={material} castShadow={cast} renderOrder={glass ? 4 : 0} {...handlers}>
        <PartOutline id="case-lower" active={active} />
      </mesh>
      <mesh geometry={geometries.bosses} material={material} castShadow={cast} renderOrder={glass ? 4 : 0} {...handlers} />
      {SCREW_POSITIONS.map((screw, index) => (
        <mesh key={index} position={[screw.x, -0.58, screw.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.55, 3.25, 22]} />
          <meshStandardMaterial color="#5a5f66" metalness={0.9} roughness={0.36} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <BottomBadge />
      {showLiner ? (
        <mesh geometry={linerGeometry} material={linerMaterial} renderOrder={3} />
      ) : null}
      <mesh position={[0, 2.65, -55]} material={accentMaterial}>
        <boxGeometry args={[72, 0.28, 7]} />
      </mesh>
    </PartGroup>
  );
}

export function CaseUpper() {
  const themeKey = useAppStore((state) => state.themeKey);
  const active = useActive('case-upper');
  const geometry = useMemo(buildUpperCaseGeometry, []);
  const material = useOverriddenMaterial(
    'case-upper',
    getMaterialSet(themeKey).materials.aluminum,
  );
  const appearance = useResolvedAppearance('case-upper');
  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.accentColor ?? '#e87432',
        roughness: 0.35,
        metalness: 0.7,
        emissive: new THREE.Color(appearance.accentColor ?? '#e87432'),
        emissiveIntensity: 0.06,
      }),
    [appearance.accentColor],
  );
  useEffect(() => () => accentMaterial.dispose(), [accentMaterial]);
  const handlers = useMemo(() => partPointerHandlers('case-upper'), []);
  const glass = material.transparent;
  return (
    <PartGroup id="case-upper" position={[0, UPPER_BOTTOM, 0]}>
      <mesh
        geometry={geometry}
        material={material}
        castShadow={!glass}
        receiveShadow={!glass}
        renderOrder={glass ? 4 : 0}
        {...handlers}
      >
        <PartOutline id="case-upper" active={active} />
      </mesh>
      <mesh position={[0, 3.56, 70.4]} material={accentMaterial}>
        <boxGeometry args={[42, 0.16, 1.0]} />
      </mesh>
    </PartGroup>
  );
}

export function CaseScrews() {
  return (
    <group>
      {SCREW_POSITIONS.map((screw, index) => (
        <Screw key={index} id={`screw-${index + 1}`} position={[screw.x, -1.8, screw.z]} />
      ))}
    </group>
  );
}

function Screw({
  id,
  position,
}: {
  id: string;
  position: [number, number, number];
}) {
  const themeKey = useAppStore((state) => state.themeKey);
  const active = useActive(id);
  const material = useOverriddenMaterial(id, getMaterialSet(themeKey).materials.steel);
  const handlers = useMemo(() => partPointerHandlers(id), [id]);
  return (
    <PartGroup id={id} position={position}>
      <mesh geometry={caseScrew.shaft} material={material} castShadow {...handlers}>
        <PartOutline id={id} active={active} />
      </mesh>
      <mesh geometry={caseScrew.recess} material={screwRecessMaterial} />
    </PartGroup>
  );
}

export function Feet() {
  const geometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(7.3, 7.7, 1.8, 22);
    geometry.translate(0, 0.9, 0);
    return geometry;
  }, []);
  return (
    <group>
      {[
        [-160, -62],
        [160, -62],
        [-160, 62],
        [160, 62],
      ].map(([x, z], index) => (
        <Foot key={index} id={`foot-${index + 1}`} x={x} z={z} geometry={geometry} />
      ))}
    </group>
  );
}

function Foot({
  id,
  x,
  z,
  geometry,
}: {
  id: string;
  x: number;
  z: number;
  geometry: THREE.BufferGeometry;
}) {
  const themeKey = useAppStore((state) => state.themeKey);
  const material = useOverriddenMaterial(id, getMaterialSet(themeKey).materials.rubber);
  const handlers = useMemo(() => partPointerHandlers(id), [id]);
  const active = useActive(id);
  return (
    <PartGroup id={id} position={[x, -2.4, z]}>
      <mesh geometry={geometry} material={material} castShadow {...handlers}>
        <PartOutline id={id} active={active} />
      </mesh>
    </PartGroup>
  );
}

export function UsbModule() {
  const themeKey = useAppStore((state) => state.themeKey);
  const set = getMaterialSet(themeKey);
  const theme = THEMES[themeKey];
  const appearance = useResolvedAppearance('usb-board');
  const rawAppearance = useAppearanceOverride('usb-board');
  const usbPreset = materialPresetFor('usb', rawAppearance?.material);
  const active = useActive('usb-board');
  const handlers = useMemo(() => partPointerHandlers('usb-board'), []);
  const boardMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: rawAppearance?.boardColor ?? usbPreset?.color ?? appearance.boardColor ?? theme.pcb,
        metalness: usbPreset?.metalness ?? 0.15,
        roughness: usbPreset?.roughness ?? 0.45,
        clearcoat: usbPreset?.clearcoat ?? 0.1,
      }),
    [rawAppearance?.boardColor, usbPreset, appearance.boardColor, theme.pcb],
  );
  const portMaterial = useOverriddenMaterial('usb-board', set.materials.steel, 'portColor');
  const plasticMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.plasticColor ?? '#e7e2d5',
        roughness: 0.55,
      }),
    [appearance.plasticColor],
  );
  const indicatorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.indicatorColor ?? theme.orange,
        emissive: appearance.indicatorColor ?? theme.orange,
        emissiveIntensity: 0.4 * (appearance.indicatorBrightness ?? 1),
        roughness: 0.35,
      }),
    [appearance.indicatorColor, appearance.indicatorBrightness, theme.orange],
  );
  useEffect(() => () => boardMaterial.dispose(), [boardMaterial]);
  useEffect(() => () => plasticMaterial.dispose(), [plasticMaterial]);
  useEffect(() => () => indicatorMaterial.dispose(), [indicatorMaterial]);

  return (
    <group>
      <PartGroup id="usb-board" position={[0, USB.boardY, USB.boardZ]}>
        <mesh castShadow receiveShadow material={boardMaterial} {...handlers}>
          <boxGeometry args={[USB.boardW, USB.boardH, 1.6]} />
          <PartOutline id="usb-board" active={active} />
        </mesh>
        <mesh position={[0, 0.6, -2.9]} material={portMaterial} castShadow>
          <boxGeometry args={[9.2, 3.8, 4.2]} />
        </mesh>
        <mesh position={[0, 0.6, -3.9]}>
          <boxGeometry args={[7.4, 2.2, 1.8]} />
          <meshStandardMaterial color="#0a0b0c" roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.6, -3.45]} material={set.materials.gold}>
          <boxGeometry args={[5.2, 0.65, 1.9]} />
        </mesh>
        <mesh position={[0, -1.5, 3.1]} material={plasticMaterial} castShadow>
          <boxGeometry args={[9.2, 4.2, 4.2]} />
        </mesh>
        <mesh position={[5.0, 3.1, 1.0]} material={set.materials.solder}>
          <boxGeometry args={[3.2, 1.0, 3.0]} />
        </mesh>
        <mesh position={[-5.2, 3.1, 1.0]} material={set.materials.solder}>
          <boxGeometry args={[2.4, 0.9, 2.6]} />
        </mesh>
        <mesh position={[0, 4.8, 1.2]} material={indicatorMaterial}>
          <boxGeometry args={[7.0, 0.3, 2.0]} />
        </mesh>
      </PartGroup>
      {[-1, 1].map((direction) => (
        <UsbScrew key={direction} id={`usb-screw-${direction === -1 ? 1 : 2}`} x={direction * 8.5} />
      ))}
      <Cable />
    </group>
  );
}

function UsbScrew({ id, x }: { id: string; x: number }) {
  const themeKey = useAppStore((state) => state.themeKey);
  const material = useOverriddenMaterial(id, getMaterialSet(themeKey).materials.steel);
  const handlers = useMemo(() => partPointerHandlers(id), [id]);
  const active = useActive(id);
  return (
    <PartGroup id={id} position={[x, 7.0, USB.boardZ + 0.9]}>
      <mesh geometry={usbScrew.shaft} material={material} rotation={[-Math.PI / 2, 0, 0]} {...handlers}>
        <PartOutline id={id} active={active} />
      </mesh>
      <mesh geometry={usbScrew.recess} material={screwRecessMaterial} rotation={[-Math.PI / 2, 0, 0]} />
    </PartGroup>
  );
}

function Cable() {
  const themeKey = useAppStore((state) => state.themeKey);
  const set = getMaterialSet(themeKey);
  const appearance = useResolvedAppearance('usb-cable');
  const rawAppearance = useAppearanceOverride('usb-cable');
  const cablePreset = materialPresetFor('cable', rawAppearance?.material);
  const handlers = useMemo(() => partPointerHandlers('usb-cable'), []);
  const active = useActive('usb-cable');
  const cableMaterial = useMemo(() => {
    const material = set.materials.cable.clone() as THREE.MeshPhysicalMaterial;
    material.color.set(
      rawAppearance?.color ?? cablePreset?.color ?? appearance.color ?? '#1c1d1e',
    );
    material.roughness =
      rawAppearance?.roughness ?? cablePreset?.roughness ?? appearance.roughness ?? 0.72;
    if (cablePreset?.map) material.map = getMaterialMap(cablePreset.map);
    material.needsUpdate = true;
    return material;
  }, [set, rawAppearance?.color, rawAppearance?.roughness, cablePreset, appearance.color, appearance.roughness]);
  const connectorMaterial = useMemo(() => {
    const material = set.materials.nylon.clone() as THREE.MeshPhysicalMaterial;
    material.color.set(appearance.connectorColor ?? '#34302c');
    material.needsUpdate = true;
    return material;
  }, [set, appearance.connectorColor]);
  useEffect(() => () => cableMaterial.dispose(), [cableMaterial]);
  useEffect(() => () => connectorMaterial.dispose(), [connectorMaterial]);
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(9.5, 11.8, -70.4),
        new THREE.Vector3(16, 10.5, -67.2),
        new THREE.Vector3(28, 10.0, -61.5),
        new THREE.Vector3(42, 10.2, -60.4),
        new THREE.Vector3(54, 12.0, -63.2),
        new THREE.Vector3(58, 13.9, -64.0),
      ],
      false,
      'catmullrom',
      0.35,
    );
    return new THREE.TubeGeometry(curve, 54, 1.15, 8, false);
  }, []);
  return (
    <PartGroup id="usb-cable">
      <mesh geometry={geometry} material={cableMaterial} castShadow {...handlers}>
        <PartOutline id="usb-cable" active={active} />
      </mesh>
      <mesh position={[58, 13.9, -63.7]} material={connectorMaterial} castShadow>
        <boxGeometry args={[9, 3.4, 4.2]} />
      </mesh>
      <mesh position={[9.5, 11.8, -70.2]} material={connectorMaterial} castShadow>
        <boxGeometry args={[8, 4.4, 4.0]} />
      </mesh>
    </PartGroup>
  );
}
