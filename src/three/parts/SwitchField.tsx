import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { KEYS } from '../../data/layout';
import { SWITCH_BASE_Y } from '../../config/constants';
import { THEMES } from '../../config/themes';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';
import { ASSEMBLY_STEPS } from '../../data/steps';
import {
  crossHole,
  mergeAll,
  roundedBoxGeometry,
  roundedRectShape,
  extrudeFlat,
  boxAt,
} from '../../three/geometry/shapes';
import { getMaterialSet } from '../../three/materials';
import { resolveAppearance } from '../../customization/defaults';
import type { AppearanceValues } from '../../customization/types';

function buildGeometries() {
  const lower = roundedBoxGeometry(15.4, 8.2, 15.4, 1.7);
  lower.translate(0, -4.4, 0);

  const upperShape = roundedRectShape(11.55, 11.55, 1.9, 4);
  upperShape.holes.push(crossHole(2.18, 0.68));
  const upper = extrudeFlat(upperShape, 7.4, { curveSegments: 4 });
  upper.translate(0, 3.8, 0);

  const body = roundedBoxGeometry(4.85, 7.6, 4.85, 0.55, 2);
  body.translate(0, 4.2, 0);
  const armA = boxAt(4.15, 1.15, 1.2, 0, 12.25, 0);
  const armB = boxAt(1.2, 1.15, 4.15, 0, 12.25, 0);
  const stem = mergeAll([body, armA, armB]);

  return { lower, upper, stem };
}

function SwitchSelection() {
  const themeKey = useAppStore((state) => state.themeKey);
  const activeId = useAppStore((state) => {
    const id = state.hoveredId ?? state.selectedId;
    return id?.startsWith('sw-') ? id : null;
  });
  const group = useRef<THREE.Group>(null);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  const key = useMemo(() => KEYS.find((entry) => entry.switchId === activeId), [activeId]);

  useFrame(() => {
    const object = group.current;
    if (!object || !key) return;
    base.set(key.x, SWITCH_BASE_Y, key.z);
    director.writeInstanceTransform(key.switchId, base, position, quaternion);
    object.position.copy(position);
    object.quaternion.copy(quaternion);
  });

  if (!key) return null;

  return (
    <group ref={group}>
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[17.2, 16.4, 17.2]} />
        <meshBasicMaterial color={THEMES[themeKey].orange} transparent opacity={0.07} depthWrite={false} />
        <Edges color={THEMES[themeKey].orange} threshold={15} />
      </mesh>
    </group>
  );
}

function StepSwitchMarkers() {
  const themeKey = useAppStore((state) => state.themeKey);
  const mode = useAppStore((state) => state.mode);
  const stepIndex = useAppStore((state) => state.teaching.stepIndex);
  const keys = useMemo(() => {
    if (mode !== 'teach') return [];
    const step = ASSEMBLY_STEPS[Math.min(stepIndex, ASSEMBLY_STEPS.length - 1)];
    if (!step) return [];
    const ids = step.partIds.filter((id) => id.startsWith('sw-')).slice(0, 8);
    return KEYS.filter((key) => ids.includes(key.switchId));
  }, [mode, stepIndex]);
  return (
    <group>
      {keys.map((key) => (
        <StepSwitchMarker key={key.switchId} code={key.code} color={THEMES[themeKey].blue} />
      ))}
    </group>
  );
}

function StepSwitchMarker({ code, color }: { code: string; color: string }) {
  const group = useRef<THREE.Group>(null);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  const key = useMemo(() => KEYS.find((entry) => entry.code === code), [code]);
  useFrame(() => {
    if (!group.current || !key) return;
    base.set(key.x, SWITCH_BASE_Y, key.z);
    director.writeInstanceTransform(key.switchId, base, position, quaternion);
    group.current.position.copy(position);
    group.current.quaternion.copy(quaternion);
  });
  if (!key) return null;
  return (
    <group ref={group}>
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[17.5, 16.8, 17.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} />
        <Edges color={color} threshold={15} />
      </mesh>
    </group>
  );
}

export function SwitchField() {
  const themeKey = useAppStore((state) => state.themeKey);
  const theme = THEMES[themeKey];
  const visible = useAppStore((state) => state.categoryVisibility.switches);
  const isolateId = useAppStore((state) => state.isolateId);
  const isolatedKey = isolateId?.startsWith('sw-') ? KEYS.find((key) => key.switchId === isolateId) : null;
  const switchVisible = isolateId === null || Boolean(isolatedKey);
  const appearance = useAppStore(
    useShallow((state) => {
      const switches: Record<string, AppearanceValues> = {};
      for (const key of KEYS) {
        const value = state.appearance[key.switchId];
        if (value) switches[key.switchId] = value;
      }
      return switches;
    }),
  );
  const styles = useMemo(() => {
    const result: Record<string, ReturnType<typeof resolveAppearance>> = {};
    for (const key of KEYS) {
      result[key.switchId] = resolveAppearance(key.switchId, themeKey, appearance[key.switchId]);
    }
    return result;
  }, [themeKey, appearance]);
  const styleSource =
    KEYS.map((key) => key.switchId).find((id) => {
      const value = appearance[id];
      return Boolean(
        value &&
          (value.upperOpacity !== undefined ||
            value.upperRoughness !== undefined ||
            value.stemRoughness !== undefined),
      );
    }) ?? KEYS[0].switchId;
  const firstStyle = styles[styleSource];
  const upperOpacity = firstStyle.upperOpacity ?? 0.46;
  const upperRoughness = firstStyle.upperRoughness ?? 0.24;
  const stemRoughness = firstStyle.stemRoughness ?? 0.4;
  const geometries = useMemo(buildGeometries, []);
  const materials = useMemo(() => {
    const set = getMaterialSet(themeKey);
    const lower = set.materials.nylon.clone() as THREE.MeshPhysicalMaterial;
    lower.color.set('#ffffff');
    const upper = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: upperRoughness,
      metalness: 0,
      transparent: true,
      opacity: upperOpacity,
      depthWrite: false,
      clearcoat: 0.5,
    });
    const stem = set.materials.pom.clone() as THREE.MeshPhysicalMaterial;
    stem.color.set('#ffffff');
    stem.roughness = stemRoughness;
    return { lower, upper, stem };
  }, [themeKey, upperOpacity, upperRoughness, stemRoughness]);

  useEffect(() => {
    return () => {
      materials.lower.dispose();
      materials.upper.dispose();
      materials.stem.dispose();
    };
  }, [materials]);

  const keyColors = useMemo(() => {
    return Object.fromEntries(
      KEYS.map((key) => {
        const style = styles[key.switchId];
        return [
          key.switchId,
          {
            lower: new THREE.Color(style.lowerColor ?? '#34302c'),
            upper: new THREE.Color(style.upperColor ?? '#d7d1c4'),
            stem: new THREE.Color(style.stemColor ?? theme.stem),
          },
        ];
      }),
    ) as Record<string, { lower: THREE.Color; upper: THREE.Color; stem: THREE.Color }>;
  }, [styles, theme.stem]);

  const lowerRef = useRef<THREE.InstancedMesh>(null);
  const upperRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  const scale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  const update = () => {
    const lower = lowerRef.current;
    const upper = upperRef.current;
    const stem = stemRef.current;
    if (!lower || !upper || !stem) return;
    const visibleKeys = isolatedKey ? [isolatedKey] : KEYS;
    lower.count = visibleKeys.length;
    upper.count = visibleKeys.length;
    stem.count = visibleKeys.length;
    visibleKeys.forEach((key, index) => {
      base.set(key.x, SWITCH_BASE_Y, key.z);
      director.writeInstanceTransform(key.switchId, base, position, quaternion);
      matrix.compose(position, quaternion, scale);
      lower.setMatrixAt(index, matrix);
      upper.setMatrixAt(index, matrix);
      director.writeInstanceTransform(key.switchId, base, position, quaternion, key.code);
      matrix.compose(position, quaternion, scale);
      stem.setMatrixAt(index, matrix);
    });
    lower.instanceMatrix.needsUpdate = true;
    upper.instanceMatrix.needsUpdate = true;
    stem.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    update();
    for (const mesh of [lowerRef.current, upperRef.current, stemRef.current]) {
      mesh?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(update);

  useLayoutEffect(() => {
    const targets = isolatedKey ? [isolatedKey] : KEYS;
    for (let index = 0; index < targets.length; index += 1) {
      const key = targets[index];
      const colors = keyColors[key.switchId];
      if (!colors) continue;
      lowerRef.current?.setColorAt(index, colors.lower);
      upperRef.current?.setColorAt(index, colors.upper);
      stemRef.current?.setColorAt(index, colors.stem);
    }
    for (const mesh of [lowerRef.current, upperRef.current, stemRef.current]) {
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [keyColors, isolatedKey]);

  const pick = (event: ThreeEvent<PointerEvent>) => {
    const instanceId = event.instanceId;
    if (instanceId === undefined) return;
    const key = (isolatedKey ? [isolatedKey] : KEYS)[instanceId];
    if (!key) return;
    event.stopPropagation();
    useAppStore.getState().hover(key.switchId);
    document.body.style.cursor = 'pointer';
  };

  const leave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const hovered = useAppStore.getState().hoveredId;
    if (hovered?.startsWith('sw-')) useAppStore.getState().hover(null);
    document.body.style.cursor = '';
  };

  const click = (event: ThreeEvent<MouseEvent>) => {
    const instanceId = event.instanceId;
    if (instanceId === undefined) return;
    const key = (isolatedKey ? [isolatedKey] : KEYS)[instanceId];
    if (!key) return;
    event.stopPropagation();
    useAppStore.getState().select(key.switchId);
  };

  if (!visible || !switchVisible) return null;

  return (
    <group>
      <instancedMesh
        ref={lowerRef}
        args={[geometries.lower, materials.lower, KEYS.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={upperRef}
        args={[geometries.upper, materials.upper, KEYS.length]}
        frustumCulled={false}
        onPointerMove={pick}
        onPointerOut={leave}
        onClick={click}
      />
      <instancedMesh
        ref={stemRef}
        args={[geometries.stem, materials.stem, KEYS.length]}
        frustumCulled={false}
      />
      <SwitchSelection />
      {isolateId === null ? <StepSwitchMarkers /> : null}
    </group>
  );
}
