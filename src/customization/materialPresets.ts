import type { AppearanceValues } from './types';
import type { MaterialMapKind } from './materialTextures';

export interface MaterialPreset {
  label: string;
  color?: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  opacity?: number;
  map?: MaterialMapKind;
}

type PresetSet = Record<string, MaterialPreset>;

const CASE_MATERIALS: PresetSet = {
  aluminum: {
    label: '6063 铝合金',
    roughness: 0.34,
    metalness: 0.88,
    clearcoat: 0.28,
    opacity: 1,
  },
  walnut: {
    label: '胡桃木',
    color: '#6b4429',
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.12,
    opacity: 1,
    map: 'wood',
  },
  mahogany: {
    label: '桃花心木',
    color: '#5c3024',
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.14,
    opacity: 1,
    map: 'wood',
  },
  acrylic: {
    label: '透明亚克力',
    color: '#cfe8ee',
    roughness: 0.06,
    metalness: 0,
    clearcoat: 0.86,
    opacity: 0.34,
  },
  brass: {
    label: '黄铜',
    color: '#b08d57',
    roughness: 0.28,
    metalness: 0.95,
    clearcoat: 0.18,
    opacity: 1,
  },
  steel: {
    label: '不锈钢',
    color: '#c3c7cb',
    roughness: 0.22,
    metalness: 1,
    clearcoat: 0.16,
    opacity: 1,
  },
  carbon: {
    label: '碳纤维',
    color: '#2c3035',
    roughness: 0.38,
    metalness: 0.2,
    clearcoat: 0.26,
    opacity: 1,
    map: 'carbon',
  },
  pc: {
    label: '聚碳酸酯',
    color: '#d8d4ca',
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.24,
    opacity: 1,
  },
};

const KEYCAP_MATERIALS: PresetSet = {
  pbt: {
    label: 'PBT 热升华',
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.08,
    opacity: 1,
  },
  abs: {
    label: 'ABS 双色',
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.14,
    opacity: 1,
  },
  resin: {
    label: '树脂',
    roughness: 0.17,
    metalness: 0,
    clearcoat: 0.78,
    opacity: 1,
  },
  ceramic: {
    label: '陶瓷',
    roughness: 0.26,
    metalness: 0,
    clearcoat: 0.52,
    opacity: 1,
  },
  aluminum: {
    label: '铝合金',
    color: '#c7c9cb',
    roughness: 0.3,
    metalness: 0.86,
    clearcoat: 0.16,
    opacity: 1,
  },
  acrylic: {
    label: '透明亚克力',
    color: '#d8eef2',
    roughness: 0.08,
    metalness: 0,
    clearcoat: 0.8,
    opacity: 0.45,
  },
  wood: {
    label: '胡桃木',
    color: '#6b4429',
    roughness: 0.6,
    metalness: 0,
    clearcoat: 0.12,
    opacity: 1,
    map: 'wood',
  },
};

const PLATE_MATERIALS: PresetSet = {
  fr4: {
    label: 'FR4',
    roughness: 0.64,
    metalness: 0.05,
    clearcoat: 0.02,
    opacity: 1,
  },
  aluminum: {
    label: '铝合金',
    color: '#b8bcc0',
    roughness: 0.3,
    metalness: 0.9,
    clearcoat: 0.12,
    opacity: 1,
  },
  brass: {
    label: '黄铜',
    color: '#b08d57',
    roughness: 0.3,
    metalness: 0.95,
    clearcoat: 0.15,
    opacity: 1,
  },
  carbon: {
    label: '碳纤维',
    color: '#24282c',
    roughness: 0.38,
    metalness: 0.2,
    clearcoat: 0.24,
    opacity: 1,
    map: 'carbon',
  },
  pom: {
    label: 'POM',
    color: '#e6e2d7',
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.04,
    opacity: 1,
  },
  acrylic: {
    label: '透明亚克力',
    color: '#cfe8ee',
    roughness: 0.08,
    metalness: 0,
    clearcoat: 0.75,
    opacity: 0.4,
  },
};

const FOAM_MATERIALS: PresetSet = {
  pu: {
    label: '聚氨酯泡棉',
    roughness: 1,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
  },
  silicone: {
    label: '硅胶泡棉',
    color: '#9fa5a2',
    roughness: 0.84,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
  },
  felt: {
    label: '毛毡',
    color: '#a89a88',
    roughness: 1,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
    map: 'felt',
  },
};

const GASKET_MATERIALS: PresetSet = {
  silicone: {
    label: '硅胶',
    roughness: 0.78,
    metalness: 0,
    clearcoat: 0.02,
    opacity: 1,
  },
  rubber: {
    label: '橡胶',
    color: '#2a2a2a',
    roughness: 0.92,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
  },
  poron: {
    label: 'Poron',
    color: '#6a5f52',
    roughness: 0.88,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
  },
};

const SCREW_MATERIALS: PresetSet = {
  steel: {
    label: '不锈钢',
    color: '#cfd2d4',
    roughness: 0.34,
    metalness: 0.55,
    clearcoat: 0.12,
    opacity: 1,
  },
  blackNickel: {
    label: '黑镍',
    color: '#3b3e42',
    roughness: 0.3,
    metalness: 0.8,
    clearcoat: 0.2,
    opacity: 1,
  },
  brass: {
    label: '黄铜',
    color: '#b08d57',
    roughness: 0.28,
    metalness: 0.95,
    clearcoat: 0.18,
    opacity: 1,
  },
  titanium: {
    label: '钛合金',
    color: '#8d9296',
    roughness: 0.4,
    metalness: 0.8,
    clearcoat: 0.14,
    opacity: 1,
  },
  copper: {
    label: '紫铜',
    color: '#b46a3e',
    roughness: 0.32,
    metalness: 0.95,
    clearcoat: 0.16,
    opacity: 1,
  },
};

const FOOT_MATERIALS: PresetSet = {
  rubber: {
    label: '丁腈橡胶',
    color: '#1f1f1f',
    roughness: 0.96,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
  },
  silicone: {
    label: '硅胶',
    color: '#8a8f8d',
    roughness: 0.75,
    metalness: 0,
    clearcoat: 0.02,
    opacity: 1,
  },
  felt: {
    label: '毛毡',
    color: '#a99a84',
    roughness: 1,
    metalness: 0,
    clearcoat: 0,
    opacity: 1,
    map: 'felt',
  },
  cork: {
    label: '软木',
    color: '#b58b5a',
    roughness: 0.95,
    metalness: 0,
    clearcoat: 0.02,
    opacity: 1,
    map: 'wood',
  },
};

const CABLE_MATERIALS: PresetSet = {
  rubber: {
    label: '橡胶',
    color: '#1c1d1e',
    roughness: 0.72,
    metalness: 0.02,
    clearcoat: 0.04,
    opacity: 1,
  },
  braided: {
    label: '编织',
    color: '#5b5e62',
    roughness: 0.55,
    metalness: 0.08,
    clearcoat: 0.05,
    opacity: 1,
    map: 'braid',
  },
  paracord: {
    label: '伞绳',
    color: '#7a6a58',
    roughness: 0.82,
    metalness: 0,
    clearcoat: 0.02,
    opacity: 1,
    map: 'braid',
  },
};

const USB_MATERIALS: PresetSet = {
  fr4: {
    label: 'FR4 子板',
    roughness: 0.45,
    metalness: 0.12,
    clearcoat: 0.1,
    opacity: 1,
  },
  aluminum: {
    label: '铝基板',
    color: '#b8bcc0',
    roughness: 0.35,
    metalness: 0.85,
    clearcoat: 0.16,
    opacity: 1,
  },
  ceramic: {
    label: '陶瓷基板',
    color: '#d8d4ca',
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.32,
    opacity: 1,
  },
};

const PCB_MATERIALS: PresetSet = {
  fr4: {
    label: 'FR4',
    roughness: 0.48,
    metalness: 0.12,
    clearcoat: 0.08,
    opacity: 1,
  },
  aluminum: {
    label: '铝基板',
    color: '#b8bcc0',
    roughness: 0.4,
    metalness: 0.7,
    clearcoat: 0.12,
    opacity: 1,
  },
  ceramic: {
    label: '陶瓷基板',
    color: '#d8d4ca',
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.28,
    opacity: 1,
  },
};

const STAB_MATERIALS: PresetSet = {
  nylon: {
    label: 'PA66 尼龙',
    roughness: 0.64,
    metalness: 0,
    clearcoat: 0.03,
    opacity: 1,
  },
  pom: {
    label: 'POM',
    color: '#e6e2d7',
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.08,
    opacity: 1,
  },
  aluminum: {
    label: '铝合金',
    color: '#b8bcc0',
    roughness: 0.3,
    metalness: 0.85,
    clearcoat: 0.14,
    opacity: 1,
  },
};

const HERO_TOP_MATERIALS: PresetSet = {
  pc: {
    label: '半透 PC',
    roughness: 0.16,
    metalness: 0,
    clearcoat: 0.7,
    opacity: 0.42,
  },
  acrylic: {
    label: '透明亚克力',
    color: '#d5edf2',
    roughness: 0.06,
    metalness: 0,
    clearcoat: 0.86,
    opacity: 0.32,
  },
  pom: {
    label: 'POM',
    color: '#e6e2d7',
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.1,
    opacity: 1,
  },
};

const HERO_STEM_MATERIALS: PresetSet = {
  pom: {
    label: 'POM',
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.15,
    opacity: 1,
  },
  nylon: {
    label: '尼龙',
    color: '#34302c',
    roughness: 0.64,
    metalness: 0,
    clearcoat: 0.04,
    opacity: 1,
  },
  aluminum: {
    label: '铝合金',
    color: '#c7c9cb',
    roughness: 0.3,
    metalness: 0.85,
    clearcoat: 0.16,
    opacity: 1,
  },
};

const HERO_SPRING_MATERIALS: PresetSet = {
  steel: {
    label: '不锈钢',
    color: '#cfd2d4',
    roughness: 0.34,
    metalness: 0.55,
    clearcoat: 0.12,
    opacity: 1,
  },
  gold: {
    label: '镀金',
    color: '#e0b35f',
    roughness: 0.24,
    metalness: 0.9,
    clearcoat: 0.2,
    opacity: 1,
  },
  brass: {
    label: '黄铜',
    color: '#b08d57',
    roughness: 0.3,
    metalness: 0.95,
    clearcoat: 0.18,
    opacity: 1,
  },
};

const HERO_CONTACT_MATERIALS: PresetSet = {
  gold: {
    label: '镀金铜',
    color: '#e0b35f',
    roughness: 0.24,
    metalness: 0.9,
    clearcoat: 0.2,
    opacity: 1,
  },
  silver: {
    label: '镀银',
    color: '#d5d8da',
    roughness: 0.28,
    metalness: 0.92,
    clearcoat: 0.18,
    opacity: 1,
  },
  copper: {
    label: '紫铜',
    color: '#b46a3e',
    roughness: 0.32,
    metalness: 0.95,
    clearcoat: 0.16,
    opacity: 1,
  },
};

const HERO_METAL_MATERIALS: PresetSet = {
  gold: {
    label: '镀金',
    color: '#e0b35f',
    roughness: 0.24,
    metalness: 0.9,
    clearcoat: 0.2,
    opacity: 1,
  },
  steel: {
    label: '不锈钢',
    color: '#cfd2d4',
    roughness: 0.34,
    metalness: 0.55,
    clearcoat: 0.12,
    opacity: 1,
  },
  nylon: {
    label: '尼龙',
    color: '#34302c',
    roughness: 0.64,
    metalness: 0,
    clearcoat: 0.03,
    opacity: 1,
  },
};

const SETS: Record<string, PresetSet> = {
  keycap: KEYCAP_MATERIALS,
  case: CASE_MATERIALS,
  plate: PLATE_MATERIALS,
  foam: FOAM_MATERIALS,
  gasket: GASKET_MATERIALS,
  screw: SCREW_MATERIALS,
  foot: FOOT_MATERIALS,
  cable: CABLE_MATERIALS,
  usb: USB_MATERIALS,
  pcb: PCB_MATERIALS,
  stabilizer: STAB_MATERIALS,
  'hero-top': HERO_TOP_MATERIALS,
  'hero-stem': HERO_STEM_MATERIALS,
  'hero-spring': HERO_SPRING_MATERIALS,
  'hero-contact': HERO_CONTACT_MATERIALS,
  'hero-metal': HERO_METAL_MATERIALS,
};

function normalizeVariant(variant: string): string {
  if (variant === 'case-upper' || variant === 'case-lower') return 'case';
  if (variant === 'usb-board') return 'usb';
  if (variant === 'usb-cable') return 'cable';
  return variant;
}

export function materialSetFor(variant: string): PresetSet | undefined {
  return SETS[normalizeVariant(variant)];
}

export function materialOptionsFor(variant: string): Array<{ value: string; label: string }> {
  const set = SETS[normalizeVariant(variant)];
  if (!set) return [];
  return Object.entries(set).map(([value, preset]) => ({ value, label: preset.label }));
}

export function materialPresetFor(variant: string, material?: string): MaterialPreset | undefined {
  if (!material) return undefined;
  return SETS[normalizeVariant(variant)]?.[material];
}

export function defaultMaterialFor(variant: string, partId?: string): string | undefined {
  variant = normalizeVariant(variant);
  if (variant === 'hero-metal') return partId?.startsWith('hero-pin') ? 'gold' : 'nylon';
  if (variant === 'hero-top') return 'pc';
  if (variant === 'hero-stem') return 'pom';
  if (variant === 'hero-spring') return 'steel';
  if (variant === 'hero-contact') return 'gold';
  return Object.keys(SETS[variant] ?? {})[0];
}

/** Material changes also reset the visible PBR fields to the preset's look. */
export function materialPatch(variant: string, material: string): AppearanceValues {
  variant = normalizeVariant(variant);
  const preset = materialPresetFor(variant, material);
  if (!preset) return { material };
  const colorKey = variant === 'usb' ? 'boardColor' : 'color';
  return {
    material,
    [colorKey]: preset.color,
    roughness: preset.roughness,
    metalness: preset.metalness,
    clearcoat: preset.clearcoat,
    opacity: preset.opacity ?? 1,
  };
}
