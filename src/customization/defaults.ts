import * as THREE from 'three';
import { THEMES, type ThemeKey } from '../config/themes';
import { KEY_BY_ID } from '../data/layout';
import { PART_BY_ID, type PartDefinition } from '../data/parts';
import { getMaterialSet, keycapBaseColor } from '../three/materials';
import type { AppearanceValues } from './types';
import { defaultMaterialFor } from './materialPresets';
import { variantForPart } from './schema';

function hex(color: THREE.Color): string {
  return `#${color.getHexString()}`;
}

function materialDefaults(part: PartDefinition, themeKey: ThemeKey): AppearanceValues {
  const theme = THEMES[themeKey];
  const set = getMaterialSet(themeKey);
  const base = set.materials[part.material] as THREE.MeshPhysicalMaterial;
  const variant = variantForPart(part);
  const values: AppearanceValues = {
    material: defaultMaterialFor(variant, part.id),
    color: hex(base.color),
    roughness: base.roughness,
    metalness: base.metalness ?? 0,
    clearcoat: base.clearcoat ?? 0,
    opacity: base.opacity ?? 1,
  };
  const key = part.type === 'keycap' ? KEY_BY_ID[part.id] : undefined;
  if (key) {
    values.color = keycapBaseColor(theme, key.accent, key.widthU > 1);
    values.cornerRadius = 1.7;
    values.taper = 1.45;
    values.dish = 0.7;
    values.legendText = key.label;
    values.legendSub = key.sublabel ?? '';
    values.legendColor =
      key.accent === 'orange' || key.accent === 'blue' ? '#fbf6ea' : theme.legend;
    values.legendSize = 1;
    values.legendWeight = 700;
    values.legendFont = 'sans';
    values.legendVisible = true;
    values.legendGlow = 0;
  }
  if (part.type === 'switch') {
    values.lowerColor = hex((set.materials.nylon as THREE.MeshPhysicalMaterial).color);
    values.upperColor = '#d7d1c4';
    values.stemColor = theme.stem;
    values.upperOpacity = 0.46;
    values.upperRoughness = 0.24;
    values.stemRoughness = 0.4;
  }
  if (part.type === 'stabilizer') {
    values.color = hex((set.materials.nylon as THREE.MeshPhysicalMaterial).color);
    values.stemColor = theme.stem;
    values.wireColor = hex((set.materials.steel as THREE.MeshPhysicalMaterial).color);
    values.wireMetalness = 0.55;
    values.wireRoughness = 0.34;
    values.screwColor = values.wireColor;
  }
  if (part.type === 'foam') {
    values.grain = 0.42;
  }
  if (part.id === 'pcb') {
    values.color = theme.pcb;
    values.solderMask = theme.pcb;
    values.silkscreen = '#eef0e8';
    values.traceColor = '#cb9f4f';
    values.traceOpacity = 0.55;
    values.showTraces = true;
    values.showSilkscreen = true;
    values.roughness = 0.48;
    values.metalness = 0.12;
  }
  if (part.id === 'pcb-hotswap') {
    values.color = hex((set.materials.nylon as THREE.MeshPhysicalMaterial).color);
  }
  if (part.id === 'pcb-diodes' || part.id === 'pcb-passives') {
    values.color = hex((set.materials.solder as THREE.MeshPhysicalMaterial).color);
  }
  if (part.id === 'pcb-passives') {
    values.contactColor = hex((set.materials.gold as THREE.MeshPhysicalMaterial).color);
  }
  if (part.id === 'pcb-mcu') {
    values.color = '#181a19';
    values.roughness = 0.4;
  }
  if (part.id === 'pcb-leds') {
    values.ledBaseColor = theme.orange;
    values.ledPressColor = '#fff0d8';
    values.ledBrightness = 1;
    values.ledGlowRadius = 1;
    values.ledMode = 'press';
  }
  if (part.type === 'case') {
    values.accentColor = theme.orange;
    values.hideInternals = true;
  }
  if (part.id === 'usb-board') {
    values.boardColor = theme.pcb;
    values.portColor = hex((set.materials.steel as THREE.MeshPhysicalMaterial).color);
    values.plasticColor = '#e7e2d5';
    values.indicatorColor = theme.orange;
    values.indicatorBrightness = 1;
  }
  if (part.id === 'usb-cable') {
    values.color = hex((set.materials.cable as THREE.MeshPhysicalMaterial).color);
    values.connectorColor = hex((set.materials.nylon as THREE.MeshPhysicalMaterial).color);
  }
  if (part.type === 'foot') {
    values.color = hex((set.materials.rubber as THREE.MeshPhysicalMaterial).color);
  }
  if (part.type === 'screw') {
    values.color = hex((set.materials.steel as THREE.MeshPhysicalMaterial).color);
  }
  if (part.type === 'hero') {
    values.opacity = base.opacity ?? 1;
  }
  return values;
}

/**
 * Resolve theme defaults + local part overrides into one flat object.
 * Components use this for keycaps / foam / PCB / LEDs where a value is needed
 * even when the user never touched the control.
 */
export function resolveAppearance(
  partId: string,
  themeKey: ThemeKey,
  override?: AppearanceValues,
): AppearanceValues {
  const part = PART_BY_ID[partId];
  if (!part) return { ...(override ?? {}) };
  const defaults = materialDefaults(part, themeKey);
  const result: AppearanceValues = { ...defaults };
  if (override) {
    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
  }
  return result;
}
