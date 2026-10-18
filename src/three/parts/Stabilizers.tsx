import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { STAB_KEYS_LIST } from '../../data/layout';
import { THEMES } from '../../config/themes';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';
import { useStepHighlight } from './partEvents';
import { getMaterialSet } from '../../three/materials';
import { PartGroup } from '../PartGroup';
import { useAppearanceOverride, useResolvedAppearance } from '../../customization/hooks';
import { materialPresetFor } from '../../customization/materialPresets';
import {
  stabScrew,
  stabScrewPositions,
  stabStemGeometry,
  stabWireGeometry,
  mergeStabHousing,
  screwRecessMaterial,
} from '../../three/geometry/hardware';

function Stabilizer({ code }: { code: string }) {
  const key = STAB_KEYS_LIST.find((entry) => entry.code === code);
  const themeKey = useAppStore((state) => state.themeKey);
  const active = useAppStore(
    (state) => state.hoveredId === `stab-${code}` || state.selectedId === `stab-${code}`,
  );
  const stepHighlight = useStepHighlight(`stab-${code}`);
  const set = getMaterialSet(themeKey);
  const theme = THEMES[themeKey];
  const appearance = useResolvedAppearance(`stab-${code}`);
  const rawAppearance = useAppearanceOverride(`stab-${code}`);
  const stabPreset = materialPresetFor('stabilizer', rawAppearance?.material);
  const housingMaterial = useMemo(() => {
    const material = set.materials.nylon.clone() as THREE.MeshPhysicalMaterial;
    material.color.set(
      rawAppearance?.color ?? stabPreset?.color ?? appearance.color ?? '#34302c',
    );
    material.roughness = stabPreset?.roughness ?? 0.64;
    material.metalness = stabPreset?.metalness ?? 0;
    if (stabPreset?.clearcoat !== undefined) material.clearcoat = stabPreset.clearcoat;
    material.needsUpdate = true;
    return material;
  }, [set, rawAppearance?.color, stabPreset, appearance.color]);
  const stemMaterial = useMemo(() => {
    const material = set.materials.pom.clone() as THREE.MeshPhysicalMaterial;
    material.color.set(appearance.stemColor ?? theme.stem);
    material.needsUpdate = true;
    return material;
  }, [set, appearance.stemColor, theme.stem]);
  const wireMaterial = useMemo(() => {
    const material = set.materials.steel.clone() as THREE.MeshPhysicalMaterial;
    material.color.set(appearance.wireColor ?? '#cfd2d4');
    material.metalness = appearance.wireMetalness ?? 0.55;
    material.roughness = appearance.wireRoughness ?? 0.34;
    material.needsUpdate = true;
    return material;
  }, [set, appearance.wireColor, appearance.wireMetalness, appearance.wireRoughness]);
  const screwMaterial = useMemo(() => {
    const material = set.materials.steel.clone() as THREE.MeshPhysicalMaterial;
    material.color.set(appearance.screwColor ?? '#cfd2d4');
    material.needsUpdate = true;
    return material;
  }, [set, appearance.screwColor]);
  useEffect(() => () => housingMaterial.dispose(), [housingMaterial]);
  useEffect(() => () => stemMaterial.dispose(), [stemMaterial]);
  useEffect(() => () => wireMaterial.dispose(), [wireMaterial]);
  useEffect(() => () => screwMaterial.dispose(), [screwMaterial]);
  const stems = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    if (!key?.stabSpacing) return null;
    const { housing, tower } = mergeStabHousing(key.stabSpacing);
    return {
      housing,
      tower,
      stems: stabStemGeometry(key.stabSpacing),
      wire: stabWireGeometry(key.stabSpacing),
      screws: stabScrewPositions(key.stabSpacing),
    };
  }, [key]);

  useFrame(() => {
    if (!key) return;
    const depth = director.getKeyDepth(key.code);
    if (stems.current) stems.current.position.y = -depth;
    if (wire.current) wire.current.position.y = -depth;
  });

  if (!key?.stabSpacing || !geometry) return null;

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    useAppStore.getState().select(`stab-${code}`);
  };
  const handleOver = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    useAppStore.getState().hover(`stab-${code}`);
  };
  const handleOut = () => {
    if (useAppStore.getState().hoveredId === `stab-${code}`) useAppStore.getState().hover(null);
  };

  return (
    <PartGroup id={`stab-${code}`} position={[key.x, 0, key.z]}>
      <mesh
        geometry={geometry.housing}
        material={housingMaterial}
        castShadow
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      />
      <mesh geometry={geometry.tower} material={housingMaterial} castShadow />
      <group ref={stems}>
        <mesh geometry={geometry.stems} material={stemMaterial} castShadow />
      </group>
      <mesh ref={wire} geometry={geometry.wire} material={wireMaterial} castShadow />
      {geometry.screws.map((position, index) => (
        <group key={index} position={[position.x, 9.0, position.z]}>
          <mesh geometry={stabScrew.shaft} material={screwMaterial} />
          <mesh geometry={stabScrew.recess} material={screwRecessMaterial} />
        </group>
      ))}
      {active || stepHighlight ? (
        <mesh position={[0, 18, 0]}>
          <boxGeometry args={[key.stabSpacing + 12, 24, 18]} />
          <meshBasicMaterial color={active ? theme.orange : theme.blue} transparent opacity={stepHighlight ? 0.09 : 0.05} depthWrite={false} />
        </mesh>
      ) : null}
    </PartGroup>
  );
}

export function Stabilizers() {
  return (
    <group>
      {STAB_KEYS_LIST.map((key) => (
        <Stabilizer key={key.code} code={key.code} />
      ))}
    </group>
  );
}
