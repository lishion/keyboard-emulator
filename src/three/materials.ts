import * as THREE from 'three';
import type { MaterialKey } from '../data/parts';
import { THEMES, type Theme, type ThemeKey } from '../config/themes';

export interface MaterialSet {
  theme: Theme;
  materials: Record<MaterialKey, THREE.Material>;
}

const cache = new Map<ThemeKey, MaterialSet>();

function physical(
  color: string,
  options: Partial<THREE.MeshPhysicalMaterialParameters> = {},
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0.05,
    roughness: 0.6,
    clearcoat: 0.06,
    clearcoatRoughness: 0.5,
    ...options,
  });
}

export function getMaterialSet(themeKey: ThemeKey): MaterialSet {
  const existing = cache.get(themeKey);
  if (existing) return existing;
  const theme = THEMES[themeKey];
  const aluminum = physical(theme.case, {
    metalness: 0.88,
    roughness: 0.34,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
  });
  const aluminumLight = physical(theme.caseAlt, {
    metalness: 0.8,
    roughness: 0.4,
    clearcoat: 0.2,
  });
  const pbtCream = physical(theme.keycap, { roughness: 0.56, clearcoat: 0.08 });
  const pbtModifier = physical(theme.modifier, { roughness: 0.58, clearcoat: 0.06 });
  const pbtOrange = physical(theme.orange, { roughness: 0.55, clearcoat: 0.08 });
  const pbtBlue = physical(theme.blue, { roughness: 0.55, clearcoat: 0.08 });
  const fr4 = physical(theme.plate, { roughness: 0.64, clearcoat: 0.02 });
  const pcb = physical(theme.pcb, { metalness: 0.12, roughness: 0.48, clearcoat: 0.05 });
  const foam = physical(theme.foam, { roughness: 1, clearcoat: 0 });
  const silicone = physical(theme.silicone, { roughness: 0.78, clearcoat: 0.02 });
  const nylon = physical('#34302c', { roughness: 0.64, clearcoat: 0.03 });
  const polycarbonate = physical('#e3ded5', {
    roughness: 0.16,
    metalness: 0,
    clearcoat: 0.7,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const pom = physical(theme.stem, { roughness: 0.4, clearcoat: 0.15 });
  const steel = physical('#cfd2d4', { metalness: 0.55, roughness: 0.34, clearcoat: 0.12 });
  const gold = physical('#e0b35f', { metalness: 0.9, roughness: 0.24, clearcoat: 0.2, emissive: new THREE.Color('#2a1a05'), emissiveIntensity: 0.12 });
  const rubber = physical('#1f1f1f', { roughness: 0.96, metalness: 0 });
  const cable = physical('#1c1d1e', { roughness: 0.72, metalness: 0.02 });
  const acrylic = physical('#c8d6da', {
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0,
    depthWrite: false,
  });
  const copper = physical('#b46a3e', { metalness: 1, roughness: 0.35 });
  const solder = physical('#aeb2b2', { metalness: 0.9, roughness: 0.35 });

  const materials: Record<MaterialKey, THREE.Material> = {
    aluminum,
    aluminumLight,
    pbtCream,
    pbtModifier,
    pbtOrange,
    pbtBlue,
    fr4,
    pcb,
    foam,
    silicone,
    nylon,
    polycarbonate,
    pom,
    steel,
    gold,
    rubber,
    cable,
    acrylic,
    copper,
    solder,
  };
  const set = { theme, materials };
  cache.set(themeKey, set);
  return set;
}

export function keycapBaseColor(theme: Theme, accent?: 'orange' | 'blue', wide?: boolean): string {
  if (accent === 'orange') return theme.orange;
  if (accent === 'blue') return theme.blue;
  return wide ? theme.modifier : theme.keycap;
}

export function disposeMaterialSet(): void {
  for (const set of cache.values()) {
    for (const material of Object.values(set.materials)) {
      material.dispose();
    }
  }
  cache.clear();
}
