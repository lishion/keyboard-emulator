/**
 * All physical dimensions in this project are authored in millimetres.
 * The complete keyboard model is wrapped in a group scaled by MM so that
 * one Three.js scene unit equals 10 mm.
 */
export const MM = 0.1;

export const U = 19.05;
export const MAIN_WIDTH_U = 15;
export const LAYOUT_WIDTH_U = 18.25;
export const LAYOUT_HEIGHT_U = 6.5;
export const KEY_PITCH = U;

export const KEYFIELD_W = LAYOUT_WIDTH_U * U; // 347.6625
export const KEYFIELD_D = LAYOUT_HEIGHT_U * U; // 123.825

export const CASE_W = 372;
export const CASE_D = 152;
export const CASE_RADIUS = 14;
export const CASE_WALL = 3.2;
export const CASE_INNER_W = CASE_W - CASE_WALL * 2;
export const CASE_INNER_D = CASE_D - CASE_WALL * 2;

/** Rounded-rect plate / PCB footprint (slightly larger than the key field). */
export const PLATE_W = 356;
export const PLATE_D = 132;
export const PLATE_RADIUS = 9;
export const PLATE_THICK = 1.4;
export const PLATE_BOTTOM = 18.9;
export const PLATE_TOP = PLATE_BOTTOM + PLATE_THICK;

export const PCB_W = 354;
export const PCB_D = 130;
export const PCB_RADIUS = 8;
export const PCB_THICK = 1.6;
export const PCB_BOTTOM = 12.2;
export const PCB_TOP = PCB_BOTTOM + PCB_THICK;
export const PCB_Y = PCB_TOP;

/** Lower shell rim / upper shell lower face. */
export const LOWER_BOTTOM = 0;
export const LOWER_TOP = 20.9;
export const CASE_FLOOR = 3.0;
export const SHELF_TOP = 18.9;
export const SHELF_BOTTOM = 16.6;
export const SHELF_OPENING_W = 360;
export const SHELF_OPENING_D = 138;

export const UPPER_BOTTOM = LOWER_TOP + 0.35;
export const UPPER_TOP = 24.9;
export const UPPER_OPENING_W = 350;
export const UPPER_OPENING_D = 126;

export const BOTTOM_FOAM_BOTTOM = 4.0;
export const BOTTOM_FOAM_TOP = 10.0;

export const SANDWICH_FOAM_BOTTOM = PCB_TOP + 0.4;
export const SANDWICH_FOAM_TOP = PLATE_BOTTOM - 0.35;

export const GASKET_BOTTOM = 18.85;
export const GASKET_HEIGHT = 2.35;
export const GASKET_W = 8;

export const SWITCH_BASE_Y = PCB_TOP;
export const SWITCH_HOUSING_BOTTOM = -4.4;
export const SWITCH_UPPER_TOP = 11.6;
export const SWITCH_TRAVEL = 3.8;

export const CAP_BOTTOM = 24.4;
export const CAP_PROFILE: Record<number, { height: number; tilt: number }> = {
  0: { height: 8.5, tilt: 8 },
  1: { height: 9.3, tilt: 6.5 },
  2: { height: 9.3, tilt: 4 },
  3: { height: 9.9, tilt: 0.5 },
  4: { height: 9.5, tilt: -4 },
  5: { height: 9.1, tilt: -7.5 },
};

export const KEYCAP_GAP = 0.78;

/** Long keys that receive a plate-mount visual stabilizer set. */
export const STAB_KEYS: Record<string, number> = {
  Space: 100,
  Enter: 30,
  Backspace: 25,
  ShiftLeft: 30,
  ShiftRight: 35,
};

export const SCREW_POSITIONS: Array<{ x: number; z: number }> = [
  { x: -180.5, z: -50 },
  { x: 180.5, z: -50 },
  { x: -180.5, z: 50 },
  { x: 180.5, z: 50 },
  { x: -90, z: 70 },
  { x: 90, z: 70 },
];

export const USB = {
  openingW: 13.2,
  openingH: 4.8,
  wallZ: -CASE_D / 2,
  boardW: 26,
  boardH: 15,
  boardZ: -71.9,
  boardY: 12.0,
  portY: 12.4,
};

export const MODE_NAMES = {
  preview: '产品预览',
  explode: '爆炸图',
  teach: '拆装教学',
  axis: '机械轴原理',
} as const;

export type ViewPreset = 'perspective' | 'top' | 'bottom' | 'side' | 'close';
