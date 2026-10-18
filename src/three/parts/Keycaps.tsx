import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { KEYS, type KeyDefinition } from '../../data/layout';
import { CAP_BOTTOM, KEYCAP_GAP, U } from '../../config/constants';
import { PART_BY_ID } from '../../data/parts';
import { THEMES } from '../../config/themes';
import { useAppStore } from '../../state/store';
import { director } from '../../state/director';
import { getKeycapGeometry, releaseKeycapGeometry } from '../../three/geometry/keycap';
import { createLegendTexture } from '../../three/geometry/legend';
import { useAppearanceOverride, useResolvedAppearance } from '../../customization/hooks';
import { materialPresetFor } from '../../customization/materialPresets';
import { getMaterialMap } from '../../customization/materialTextures';
import type { LegendFont } from '../../customization/types';
import { PartGroup } from '../PartGroup';
import { useStepHighlight } from './partEvents';

const crossMaterial = new THREE.MeshStandardMaterial({
  color: '#1d1b18',
  roughness: 0.8,
  metalness: 0.05,
});

const bumpGeometry = new THREE.BoxGeometry(5.2, 0.35, 1.25);

function Keycap({ definition }: { definition: KeyDefinition }) {
  const themeKey = useAppStore((state) => state.themeKey);
  const active = useAppStore(
    (state) => state.hoveredId === definition.id || state.selectedId === definition.id,
  );
  const theme = THEMES[themeKey];
  const stepHighlight = useStepHighlight(definition.id);
  const part = PART_BY_ID[definition.id];
  const appearance = useResolvedAppearance(definition.id);
  const rawAppearance = useAppearanceOverride(definition.id);

  const geometry = useMemo(
    () =>
      getKeycapGeometry(
        definition.widthMm,
        U - KEYCAP_GAP,
        definition.heightMm,
        definition.stabSpacing,
        {
          cornerRadius: appearance.cornerRadius,
          taper: appearance.taper,
          dish: appearance.dish,
        },
      ),
    [
      definition.widthMm,
      definition.heightMm,
      definition.stabSpacing,
      appearance.cornerRadius,
      appearance.taper,
      appearance.dish,
    ],
  );

  useEffect(() => () => releaseKeycapGeometry(geometry.cacheKey), [geometry]);

  const bodyMaterial = useMemo(() => {
    const preset = materialPresetFor('keycap', rawAppearance?.material);
    const opacity = rawAppearance?.opacity ?? preset?.opacity ?? appearance.opacity ?? 1;
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(
        rawAppearance?.color ?? preset?.color ?? appearance.color ?? theme.keycap,
      ),
      roughness: rawAppearance?.roughness ?? preset?.roughness ?? appearance.roughness ?? 0.56,
      metalness: rawAppearance?.metalness ?? preset?.metalness ?? appearance.metalness ?? 0,
      clearcoat: rawAppearance?.clearcoat ?? preset?.clearcoat ?? appearance.clearcoat ?? 0.08,
      clearcoatRoughness: 0.55,
      transparent: opacity < 0.999,
      opacity,
      depthWrite: opacity >= 0.999,
    });
    if (preset?.map) {
      material.map = getMaterialMap(preset.map);
      material.needsUpdate = true;
    }
    return material;
  }, [
    rawAppearance,
    appearance.color,
    appearance.roughness,
    appearance.metalness,
    appearance.clearcoat,
    appearance.opacity,
    theme.keycap,
  ]);

  const { legendMaterial, legendTexture } = useMemo(() => {
    const legend = createLegendTexture(definition, {
      text: appearance.legendText,
      sub: appearance.legendSub,
      size: appearance.legendSize,
      weight: appearance.legendWeight,
      font: (appearance.legendFont ?? 'sans') as LegendFont,
    });
    const legendColor = appearance.legendColor ?? theme.legend;
    const glow = appearance.legendGlow ?? 0;
    const material = new THREE.MeshStandardMaterial({
      map: legend.texture,
      color: new THREE.Color(legendColor),
      roughness: 0.42,
      metalness: 0,
      transparent: true,
      alphaTest: 0.06,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      emissive: new THREE.Color(legendColor),
      emissiveIntensity: glow * 0.75,
    });
    return { legendMaterial: material, legendTexture: legend };
  }, [
    appearance.legendText,
    appearance.legendSub,
    appearance.legendColor,
    appearance.legendSize,
    appearance.legendWeight,
    appearance.legendFont,
    appearance.legendGlow,
    definition,
    theme.legend,
  ]);

  useEffect(() => () => bodyMaterial.dispose(), [bodyMaterial]);
  useEffect(() => {
    return () => {
      legendMaterial.dispose();
      legendTexture.dispose();
    };
  }, [legendMaterial, legendTexture]);

  useEffect(() => {
    const hoverColor = new THREE.Color(theme.orange);
    const stepColor = new THREE.Color(theme.blue);
    if (active) {
      bodyMaterial.emissive.copy(hoverColor);
      bodyMaterial.emissiveIntensity = 0.42;
    } else if (stepHighlight) {
      bodyMaterial.emissive.copy(stepColor);
      bodyMaterial.emissiveIntensity = 0.34;
    } else {
      bodyMaterial.emissive.setRGB(0, 0, 0);
      bodyMaterial.emissiveIntensity = 0;
    }
  }, [active, stepHighlight, bodyMaterial, theme.orange, theme.blue]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    useAppStore.getState().select(definition.id);
    if (useAppStore.getState().mode === 'preview') {
      director.pressKey(definition.code, 'pointer');
    }
  };

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useAppStore.getState().hover(definition.id);
    document.body.style.cursor = 'pointer';
  };

  const handleOut = () => {
    if (useAppStore.getState().hoveredId === definition.id) {
      useAppStore.getState().hover(null);
    }
    document.body.style.cursor = '';
  };

  if (!part) return null;

  const hasLegend =
    appearance.legendVisible !== false &&
    Boolean((appearance.legendText ?? definition.label) || (appearance.legendSub ?? definition.sublabel));

  return (
    <PartGroup
      id={definition.id}
      position={[definition.x, CAP_BOTTOM, definition.z]}
      rotationDeg={[definition.tilt, 0, 0]}
      pressCode={definition.code}
    >
      <mesh
        geometry={geometry.skirt}
        material={bodyMaterial}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      />
      <mesh
        geometry={geometry.top}
        material={bodyMaterial}
        castShadow
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      />
      {hasLegend ? (
        <mesh
          geometry={geometry.top}
          material={legendMaterial}
          scale={[1.002, 1, 1.002]}
          renderOrder={2}
          onClick={handleClick}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
        />
      ) : null}
      <mesh geometry={geometry.cross} material={crossMaterial} />
      {definition.homeBump ? (
        <mesh
          geometry={bumpGeometry}
          material={bodyMaterial}
          position={[0, definition.heightMm - 0.24, 5.4]}
        />
      ) : null}
    </PartGroup>
  );
}

export function Keycaps() {
  const keycapsVisible = useAppStore((state) => state.categoryVisibility.keycaps);
  if (!keycapsVisible) return null;
  return (
    <group>
      {KEYS.map((definition) => (
        <Keycap key={definition.id} definition={definition} />
      ))}
    </group>
  );
}
