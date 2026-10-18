import { KEYS } from '../data/layout';
import {
  KEYCAP_PART_IDS,
  PARTS,
  STAB_PART_IDS,
  SWITCH_PART_IDS,
  type PartDefinition,
} from '../data/parts';
import { materialOptionsFor } from './materialPresets';
import type {
  AppearanceField,
  AppearanceFieldKind,
  AppearanceSchema,
  ScopeKey,
  ScopeOption,
} from './types';

const color = (key: AppearanceField['key'], label: string): AppearanceField => ({
  key,
  label,
  kind: 'color',
});
const range = (
  key: AppearanceField['key'],
  label: string,
  min: number,
  max: number,
  step = 0.01,
  extra: Partial<AppearanceField> = {},
): AppearanceField => ({ key, label, kind: 'range', min, max, step, ...extra });
const select = (
  key: AppearanceField['key'],
  label: string,
  options: Array<{ value: string; label: string }>,
  extra: Partial<AppearanceField> = {},
): AppearanceField => ({ key, label, kind: 'select', options, ...extra });
const toggle = (key: AppearanceField['key'], label: string): AppearanceField => ({
  key,
  label,
  kind: 'toggle',
});
const materialField = (variant: string): AppearanceField => ({
  key: 'material',
  label: '材质',
  kind: 'select',
  options: materialOptionsFor(variant),
});
const text = (key: AppearanceField['key'], label: string, extra: Partial<AppearanceField> = {}): AppearanceField => ({
  key,
  label,
  kind: 'text',
  ...extra,
});

const KEYCAP_SCHEMA: AppearanceSchema = {
  title: '键帽',
  sections: [
    {
      title: '外观',
      fields: [
        materialField('keycap'),
        color('color', '键帽主色'),
        range('roughness', '粗糙度', 0.05, 1, 0.01),
        range('metalness', '金属度', 0, 1, 0.01),
        range('clearcoat', '清漆', 0, 1, 0.01),
        range('opacity', '透明度', 0.15, 1, 0.01),
      ],
    },
    {
      title: '轮廓（视觉）',
      fields: [
        range('cornerRadius', '圆角半径 mm', 0, 4, 0.1),
        range('taper', '侧壁收分 mm', 0, 2.5, 0.05),
        range('dish', '顶面内凹 mm', 0, 1.5, 0.05),
      ],
    },
    {
      title: '字符',
      fields: [
        text('legendText', '主字符', { perPartOnly: true, hint: '仅应用到当前键帽' }),
        text('legendSub', '副字符', { perPartOnly: true, hint: '仅应用到当前键帽' }),
        color('legendColor', '字符颜色'),
        range('legendSize', '字符大小', 0.5, 1.5, 0.01),
        select(
          'legendWeight',
          '字符粗细',
          [
            { value: '400', label: '常规 400' },
            { value: '500', label: '中等 500' },
            { value: '600', label: '半粗 600' },
            { value: '700', label: '粗体 700' },
            { value: '800', label: '特粗 800' },
          ],
        ),
        select(
          'legendFont',
          '字体',
          [
            { value: 'sans', label: '无衬线' },
            { value: 'serif', label: '衬线' },
            { value: 'mono', label: '等宽' },
          ],
        ),
        toggle('legendVisible', '显示字符'),
        range('legendGlow', '字符微光', 0, 1, 0.01),
      ],
    },
  ],
};

const SWITCH_SCHEMA: AppearanceSchema = {
  title: '机械轴',
  sections: [
    {
      title: '颜色',
      fields: [
        color('lowerColor', '下盖颜色'),
        color('upperColor', '上盖颜色'),
        color('stemColor', '轴心颜色'),
      ],
    },
    {
      title: '上盖与轴心（全部轴体）',
      fields: [
        range('upperOpacity', '上盖透明度', 0.1, 1, 0.01, { global: true }),
        range('upperRoughness', '上盖粗糙度', 0.02, 1, 0.01, { global: true }),
        range('stemRoughness', '轴心粗糙度', 0.02, 1, 0.01, { global: true }),
      ],
    },
  ],
};

const STAB_SCHEMA: AppearanceSchema = {
  title: '卫星轴',
  sections: [
    {
      title: '外观',
      fields: [
        materialField('stabilizer'),
        color('color', '外壳颜色'),
        color('stemColor', '轴心颜色'),
        color('wireColor', '钢丝颜色'),
        color('screwColor', '螺丝颜色'),
        range('wireMetalness', '钢丝金属度', 0, 1, 0.01),
        range('wireRoughness', '钢丝粗糙度', 0.02, 1, 0.01),
      ],
    },
  ],
};

const PLATE_SCHEMA: AppearanceSchema = {
  title: '定位板',
  sections: [
    {
      title: '板面',
      fields: [
        materialField('plate'),
        color('color', '板面颜色'),
        range('roughness', '粗糙度', 0.05, 1, 0.01),
        range('metalness', '金属感', 0, 0.6, 0.01),
        range('opacity', '透明度', 0.35, 1, 0.01),
      ],
    },
  ],
};

const FOAM_SCHEMA: AppearanceSchema = {
  title: '声学棉',
  sections: [
    {
      title: '泡棉',
      fields: [
        materialField('foam'),
        color('color', '颜色'),
        range('roughness', '粗糙度', 0.2, 1, 0.01),
        range('opacity', '透明度', 0.4, 1, 0.01),
        range('grain', '颗粒强度', 0, 1, 0.01),
      ],
    },
  ],
};

const GASKET_SCHEMA: AppearanceSchema = {
  title: 'Gasket 缓冲垫',
  sections: [
    {
      title: '硅胶',
      fields: [
        materialField('gasket'),
        color('color', '颜色'),
        range('roughness', '粗糙度', 0.2, 1, 0.01),
        range('opacity', '透明度', 0.25, 1, 0.01),
      ],
    },
  ],
};

const PCB_SCHEMA: AppearanceSchema = {
  title: '主 PCB',
  sections: [
    {
      title: '阻焊与丝印',
      fields: [
        materialField('pcb'),
        color('solderMask', '阻焊颜色'),
        color('silkscreen', '丝印颜色'),
        color('traceColor', '走线颜色'),
        range('traceOpacity', '走线强度', 0, 1, 0.01),
        toggle('showTraces', '显示走线'),
        toggle('showSilkscreen', '显示丝印'),
      ],
    },
    {
      title: '板材',
      fields: [
        range('roughness', '粗糙度', 0.05, 1, 0.01),
        range('metalness', '金属感', 0, 0.6, 0.01),
      ],
    },
  ],
};

const PCB_SOCKET_SCHEMA: AppearanceSchema = {
  title: '热插拔轴座',
  sections: [
    {
      title: '轴座',
      fields: [color('color', '座体颜色'), range('roughness', '粗糙度', 0.05, 1, 0.01)],
    },
  ],
};

const PCB_DIODE_SCHEMA: AppearanceSchema = {
  title: '二极管',
  sections: [
    {
      title: '贴片二极管',
      fields: [color('color', '本体颜色'), range('roughness', '粗糙度', 0.05, 1, 0.01)],
    },
  ],
};

const PCB_MCU_SCHEMA: AppearanceSchema = {
  title: '主控芯片',
  sections: [
    {
      title: '主控',
      fields: [color('color', '封装颜色'), range('roughness', '粗糙度', 0.05, 1, 0.01)],
    },
  ],
};

const PCB_PASSIVE_SCHEMA: AppearanceSchema = {
  title: '阻容与焊点',
  sections: [
    {
      title: '贴片元件',
      fields: [
        color('color', '本体颜色'),
        color('contactColor', '焊端颜色'),
        range('roughness', '粗糙度', 0.05, 1, 0.01),
      ],
    },
  ],
};

const LED_SCHEMA: AppearanceSchema = {
  title: 'LED 与键帽光晕',
  sections: [
    {
      title: '颜色',
      fields: [
        color('ledBaseColor', '基础色'),
        color('ledPressColor', '按压色'),
      ],
    },
    {
      title: '灯光（全部键位）',
      fields: [
        range('ledBrightness', '亮度', 0, 2, 0.01),
        range('ledGlowRadius', '光晕半径', 0, 2, 0.01),
        select(
          'ledMode',
          '灯光模式',
          [
            { value: 'off', label: '关闭' },
            { value: 'static', label: '常亮' },
            { value: 'press', label: '仅按压' },
            { value: 'breathing', label: '呼吸' },
            { value: 'rainbow', label: '渐变循环' },
          ],
        ),
      ],
    },
  ],
};

const CASE_SCHEMA: AppearanceSchema = {
  title: '外壳',
  sections: [
    {
      title: '表面',
      fields: [
        materialField('case'),
        color('color', '主色'),
        range('roughness', '粗糙度', 0.04, 1, 0.01),
        range('metalness', '金属度', 0, 1, 0.01),
        range('clearcoat', '清漆', 0, 1, 0.01),
        range('opacity', '透明度', 0.25, 1, 0.01),
      ],
    },
    {
      title: '细节',
      fields: [color('accentColor', '强调线 / 铭牌颜色')],
    },
  ],
};

const SCREW_SCHEMA: AppearanceSchema = {
  title: '紧固件',
  sections: [
    {
      title: '螺丝',
      fields: [
        materialField('screw'),
        color('color', '金属颜色'),
        range('metalness', '金属度', 0, 1, 0.01),
        range('roughness', '粗糙度', 0.04, 1, 0.01),
      ],
    },
  ],
};

const FOOT_SCHEMA: AppearanceSchema = {
  title: '脚垫',
  sections: [
    {
      title: '橡胶',
      fields: [
        materialField('foot'),
        color('color', '颜色'),
        range('roughness', '粗糙度', 0.2, 1, 0.01),
      ],
    },
  ],
};

const USB_BOARD_SCHEMA: AppearanceSchema = {
  title: 'USB-C 子板',
  sections: [
    {
      title: '板材与接口',
      fields: [
        materialField('usb'),
        color('boardColor', '子板颜色'),
        color('portColor', '接口金属色'),
        color('plasticColor', '塑料座颜色'),
      ],
    },
    {
      title: '状态指示',
      fields: [
        color('indicatorColor', '指示颜色'),
        range('indicatorBrightness', '指示亮度', 0, 2, 0.01),
      ],
    },
  ],
};

const USB_CABLE_SCHEMA: AppearanceSchema = {
  title: '内部连接线',
  sections: [
    {
      title: '线材',
      fields: [
        materialField('cable'),
        color('color', '线材颜色'),
        color('connectorColor', '接头颜色'),
        range('roughness', '表面粗糙度', 0.05, 1, 0.01),
      ],
    },
  ],
};

const HERO_TOP_SCHEMA: AppearanceSchema = {
  title: '示范轴上盖',
  sections: [
    {
      title: 'PC 上盖',
      fields: [
        materialField('hero-top'),
        color('color', '颜色'),
        range('opacity', '透明度', 0.08, 1, 0.01),
        range('roughness', '粗糙度', 0.02, 1, 0.01),
      ],
    },
  ],
};

const HERO_STEM_SCHEMA: AppearanceSchema = {
  title: '示范轴轴心',
  sections: [
    {
      title: 'POM 轴心',
      fields: [
        materialField('hero-stem'),
        color('color', '颜色'),
        range('roughness', '粗糙度', 0.02, 1, 0.01),
      ],
    },
  ],
};

const HERO_SPRING_SCHEMA: AppearanceSchema = {
  title: '示范轴弹簧',
  sections: [
    {
      title: '弹簧',
      fields: [
        materialField('hero-spring'),
        color('color', '颜色'),
        range('metalness', '金属度', 0, 1, 0.01),
        range('roughness', '粗糙度', 0.04, 1, 0.01),
      ],
    },
  ],
};

const HERO_BOTTOM_SCHEMA: AppearanceSchema = {
  title: '示范轴下盖',
  sections: [
    {
      title: 'PA66 下盖',
      fields: [color('color', '颜色'), range('roughness', '粗糙度', 0.02, 1, 0.01)],
    },
  ],
};

const HERO_CONTACT_SCHEMA: AppearanceSchema = {
  title: '示范轴触片',
  sections: [
    {
      title: '金属触片',
      fields: [
        materialField('hero-contact'),
        color('color', '金属颜色'),
        range('metalness', '金属度', 0, 1, 0.01),
        range('roughness', '粗糙度', 0.02, 1, 0.01),
      ],
    },
  ],
};

const HERO_METAL_SCHEMA: AppearanceSchema = {
  title: '示范轴金属件',
  sections: [
    {
      title: '引脚 / 定位柱',
      fields: [
        materialField('hero-metal'),
        color('color', '颜色'),
        range('metalness', '金属度', 0, 1, 0.01),
        range('roughness', '粗糙度', 0.02, 1, 0.01),
      ],
    },
  ],
};

const VARIANTS: Record<string, AppearanceSchema> = {
  keycap: KEYCAP_SCHEMA,
  switch: SWITCH_SCHEMA,
  stabilizer: STAB_SCHEMA,
  plate: PLATE_SCHEMA,
  foam: FOAM_SCHEMA,
  gasket: GASKET_SCHEMA,
  pcb: PCB_SCHEMA,
  'pcb-socket': PCB_SOCKET_SCHEMA,
  'pcb-diode': PCB_DIODE_SCHEMA,
  'pcb-mcu': PCB_MCU_SCHEMA,
  'pcb-passive': PCB_PASSIVE_SCHEMA,
  'pcb-led': LED_SCHEMA,
  'case-upper': CASE_SCHEMA,
  'case-lower': CASE_SCHEMA,
  screw: SCREW_SCHEMA,
  foot: FOOT_SCHEMA,
  'usb-board': USB_BOARD_SCHEMA,
  'usb-cable': USB_CABLE_SCHEMA,
  'hero-top': HERO_TOP_SCHEMA,
  'hero-stem': HERO_STEM_SCHEMA,
  'hero-spring': HERO_SPRING_SCHEMA,
  'hero-bottom': HERO_BOTTOM_SCHEMA,
  'hero-contact': HERO_CONTACT_SCHEMA,
  'hero-metal': HERO_METAL_SCHEMA,
};

export function variantForPart(part: PartDefinition): string {
  const id = part.id;
  if (part.type === 'keycap') return 'keycap';
  if (part.type === 'switch') return 'switch';
  if (part.type === 'stabilizer') return 'stabilizer';
  if (part.type === 'plate') return 'plate';
  if (part.type === 'foam') return 'foam';
  if (part.type === 'gasket') return 'gasket';
  if (id === 'pcb') return 'pcb';
  if (id === 'pcb-hotswap') return 'pcb-socket';
  if (id === 'pcb-diodes') return 'pcb-diode';
  if (id === 'pcb-mcu') return 'pcb-mcu';
  if (id === 'pcb-passives') return 'pcb-passive';
  if (id === 'pcb-leds') return 'pcb-led';
  if (id === 'case-upper') return 'case-upper';
  if (id === 'case-lower') return 'case-lower';
  if (part.type === 'screw') return 'screw';
  if (part.type === 'foot') return 'foot';
  if (id === 'usb-board') return 'usb-board';
  if (id === 'usb-cable') return 'usb-cable';
  if (id === 'hero-top') return 'hero-top';
  if (id === 'hero-stem') return 'hero-stem';
  if (id === 'hero-spring') return 'hero-spring';
  if (id === 'hero-bottom') return 'hero-bottom';
  if (id.startsWith('hero-contact')) return 'hero-contact';
  if (id.startsWith('hero-')) return 'hero-metal';
  return 'plate';
}

export function schemaForPart(part: PartDefinition): AppearanceSchema {
  return VARIANTS[variantForPart(part)] ?? PLATE_SCHEMA;
}

export function scopesForPart(part: PartDefinition): ScopeOption[] {
  if (part.type === 'keycap') {
    return [
      { key: 'part', label: '仅此键帽' },
      { key: 'sameWidth', label: '同宽度键帽' },
      { key: 'sameRow', label: '同一行键帽' },
      { key: 'allKeycaps', label: '全部键帽' },
    ];
  }
  if (part.type === 'switch') {
    return [
      { key: 'part', label: '仅此轴体' },
      { key: 'allSwitches', label: '全部轴体' },
    ];
  }
  if (part.type === 'stabilizer') {
    return [
      { key: 'part', label: '仅此卫星轴' },
      { key: 'allStabs', label: '全部卫星轴' },
    ];
  }
  if (part.type === 'gasket') {
    return [
      { key: 'part', label: '仅此缓冲垫' },
      { key: 'allGaskets', label: '全部 Gasket' },
    ];
  }
  if (part.type === 'foam') {
    return [
      { key: 'part', label: '仅此声学棉' },
      { key: 'allFoam', label: '夹心棉 + 底棉' },
    ];
  }
  if (part.type === 'case') {
    return [
      { key: 'part', label: '仅此壳体' },
      { key: 'caseSet', label: '上下壳一同修改' },
    ];
  }
  if (part.type === 'screw') {
    return [
      { key: 'part', label: '仅此螺丝' },
      { key: 'allScrews', label: '全部紧固件' },
    ];
  }
  if (part.type === 'foot') {
    return [
      { key: 'part', label: '仅此脚垫' },
      { key: 'allFeet', label: '全部脚垫' },
    ];
  }
  return [{ key: 'part', label: '仅此零件' }];
}

export function idsForScope(part: PartDefinition, scope: ScopeKey): string[] {
  if (part.type === 'keycap') {
    const key = KEYS.find((k) => k.id === part.id);
    if (!key) return [part.id];
    if (scope === 'sameWidth') {
      return KEYS.filter((k) => k.widthU === key.widthU).map((k) => k.id);
    }
    if (scope === 'sameRow') {
      return KEYS.filter((k) => k.row === key.row).map((k) => k.id);
    }
    if (scope === 'allKeycaps') return [...KEYCAP_PART_IDS];
    return [part.id];
  }
  if (part.type === 'switch') {
    return scope === 'allSwitches' ? [...SWITCH_PART_IDS] : [part.id];
  }
  if (part.type === 'stabilizer') {
    return scope === 'allStabs' ? [...STAB_PART_IDS] : [part.id];
  }
  if (part.type === 'gasket') {
    return scope === 'allGaskets'
      ? PARTS.filter((p) => p.type === 'gasket').map((p) => p.id)
      : [part.id];
  }
  if (part.type === 'foam') {
    return scope === 'allFoam'
      ? PARTS.filter((p) => p.type === 'foam').map((p) => p.id)
      : [part.id];
  }
  if (part.type === 'case') {
    return scope === 'caseSet' ? ['case-upper', 'case-lower'] : [part.id];
  }
  if (part.type === 'screw') {
    return scope === 'allScrews'
      ? PARTS.filter((p) => p.type === 'screw').map((p) => p.id)
      : [part.id];
  }
  if (part.type === 'foot') {
    return scope === 'allFeet'
      ? PARTS.filter((p) => p.type === 'foot').map((p) => p.id)
      : [part.id];
  }
  return [part.id];
}

export function globalIdsForField(part: PartDefinition, field: AppearanceField): string[] {
  if (!field.global) return idsForScope(part, 'part');
  if (part.type === 'switch') return [...SWITCH_PART_IDS];
  return [part.id];
}


export const APPEARANCE_KEYS = new Set<string>(
  Object.values(VARIANTS).flatMap((schema) =>
    schema.sections.flatMap((section) => section.fields.map((field) => field.key as string)),
  ),
);


export const APPEARANCE_KINDS = new Map<string, AppearanceFieldKind>();
for (const schema of Object.values(VARIANTS)) {
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!APPEARANCE_KINDS.has(field.key)) {
        APPEARANCE_KINDS.set(field.key, field.kind);
      }
    }
  }
}
