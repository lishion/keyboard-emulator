import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../state/store';
import { PART_BY_ID } from '../data/parts';
import { resolveAppearance } from './defaults';
import { getMaterialSet } from '../three/materials';
import { materialPresetFor, type MaterialPreset } from './materialPresets';
import { getMaterialMap } from './materialTextures';
import { variantForPart } from './schema';
import type { AppearanceValues } from './types';

const PBR_KEYS: Array<keyof AppearanceValues> = [
  'color',
  'roughness',
  'metalness',
  'clearcoat',
  'opacity',
];

export function useAppearanceOverride(partId: string): AppearanceValues | undefined {
  return useAppStore((state) => state.appearance[partId]);
}

export function useResolvedAppearance(partId: string): AppearanceValues {
  const themeKey = useAppStore((state) => state.themeKey);
  const override = useAppearanceOverride(partId);
  return useMemo(
    () => resolveAppearance(partId, themeKey, override),
    [partId, themeKey, override],
  );
}

export function hasPbrOverride(values?: AppearanceValues): boolean {
  return Boolean(values && PBR_KEYS.some((key) => values[key] !== undefined));
}

export function applyAppearanceToMaterial(
  material: THREE.Material,
  values: AppearanceValues,
): void {
  const m = material as THREE.MeshPhysicalMaterial;
  if (values.color && m.color) m.color.set(values.color);
  if (values.roughness !== undefined && m.roughness !== undefined) m.roughness = values.roughness;
  if (values.metalness !== undefined && m.metalness !== undefined) m.metalness = values.metalness;
  if (values.clearcoat !== undefined && m.clearcoat !== undefined) m.clearcoat = values.clearcoat;
  if (values.opacity !== undefined) {
    m.opacity = values.opacity;
    if (values.opacity < 0.999) {
      m.transparent = true;
      m.depthWrite = false;
    } else if (!m.userData.intrinsicallyTransparent) {
      m.transparent = false;
      m.depthWrite = true;
    }
  }
  m.needsUpdate = true;
}

function cleanTransparency(m: THREE.MeshPhysicalMaterial): void {
  if (m.opacity < 0.999 || m.transparent) {
    m.transparent = true;
    m.depthWrite = false;
    // A translucent metal looks muddy and produces dark self-shadow bands.
    // Keep a trace of metalness, but bias the surface toward glass/plastic.
    if (m.metalness > 0.18) m.metalness = 0.18;
    if (m.roughness < 0.06) m.roughness = 0.06;
    m.needsUpdate = true;
  }
}

export function applyPresetToMaterial(
  material: THREE.MeshPhysicalMaterial,
  preset: MaterialPreset,
  overrideColor?: string,
): void {
  if (!overrideColor && preset.color) material.color.set(preset.color);
  material.roughness = preset.roughness;
  if (material.metalness !== undefined) material.metalness = preset.metalness;
  if (preset.clearcoat !== undefined && material.clearcoat !== undefined) {
    material.clearcoat = preset.clearcoat;
  }
  if (preset.opacity !== undefined) {
    material.opacity = preset.opacity;
    material.transparent = preset.opacity < 0.999;
  }
  if (preset.map) {
    material.map = getMaterialMap(preset.map);
  }
  material.needsUpdate = true;
}

/**
 * Clone a theme material only when the selected part has PBR overrides.
 * `colorKey` lets stabilizer wire/screw/axis parts map their own color field.
 */
export function useOverriddenMaterial(
  partId: string,
  baseMaterial: THREE.Material,
  colorKey: keyof AppearanceValues = 'color',
): THREE.Material {
  const override = useAppearanceOverride(partId);
  const material = useMemo(() => {
    if (!override) return baseMaterial;
    const part = PART_BY_ID[partId];
    const preset =
      colorKey === 'color' && part
        ? materialPresetFor(variantForPart(part), override.material)
        : undefined;
    const hasColor = typeof override[colorKey] === 'string';
    const hasPbr = hasPbrOverride({
      color: hasColor ? (override[colorKey] as string) : undefined,
      roughness: override.roughness,
      metalness: override.metalness,
      clearcoat: override.clearcoat,
      opacity: override.opacity,
    });
    if (!preset && !hasPbr) return baseMaterial;
    const clone = baseMaterial.clone() as THREE.MeshPhysicalMaterial;
    clone.userData.intrinsicallyTransparent = baseMaterial.transparent;
    if (preset) applyPresetToMaterial(clone, preset, hasColor ? (override[colorKey] as string) : undefined);
    applyAppearanceToMaterial(clone, {
      color: hasColor ? (override[colorKey] as string) : undefined,
      roughness: override.roughness,
      metalness: override.metalness,
      clearcoat: override.clearcoat,
      opacity: override.opacity,
    });
    cleanTransparency(clone);
    return clone;
  }, [baseMaterial, override, colorKey, partId]);

  useEffect(
    () => () => {
      if (material !== baseMaterial) material.dispose();
    },
    [material, baseMaterial],
  );

  return material;
}

export function usePart(partId: string) {
  return PART_BY_ID[partId];
}

let foamNoise: THREE.CanvasTexture | null = null;

function getFoamNoise(): THREE.CanvasTexture {
  if (foamNoise) return foamNoise;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(size, size);
    let seed = 73;
    for (let i = 0; i < size * size; i += 1) {
      seed = (seed * 16807) % 2147483647;
      const value = 110 + (seed / 2147483647) * 145;
      image.data[i * 4] = value;
      image.data[i * 4 + 1] = value;
      image.data[i * 4 + 2] = value;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.needsUpdate = true;
  foamNoise = texture;
  return texture;
}

export function useFoamMaterial(partId: string): THREE.Material {
  const themeKey = useAppStore((state) => state.themeKey);
  const appearance = useResolvedAppearance(partId);
  const raw = useAppearanceOverride(partId);
  const material = useMemo(() => {
    const preset = materialPresetFor('foam', raw?.material);
    const base = getMaterialSet(themeKey).materials.foam.clone() as THREE.MeshPhysicalMaterial;
    base.color.set(raw?.color ?? preset?.color ?? appearance.color ?? '#a9a398');
    base.roughness = raw?.roughness ?? preset?.roughness ?? appearance.roughness ?? 1;
    base.metalness = 0;
    const opacity = raw?.opacity ?? preset?.opacity ?? appearance.opacity ?? 1;
    base.transparent = opacity < 0.999;
    base.opacity = opacity;
    base.depthWrite = opacity >= 0.999;
    if (preset?.map) base.map = getMaterialMap(preset.map);
    base.bumpMap = getFoamNoise();
    base.bumpScale = Math.max(0, appearance.grain ?? 0.4) * 0.6;
    base.needsUpdate = true;
    return base;
  }, [
    themeKey,
    raw,
    appearance.color,
    appearance.roughness,
    appearance.opacity,
    appearance.grain,
  ]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}
