import { CAP_PROFILE, KEYCAP_GAP, LAYOUT_HEIGHT_U, LAYOUT_WIDTH_U, STAB_KEYS, U } from '../config/constants';

export type KeyAccent = 'orange' | 'blue';

export interface KeyDefinition {
  /** Stable ID shared by the keycap part, its legend and the BOM. */
  id: string;
  /** Stable ID of the matching mechanical switch part. */
  switchId: string;
  /** KeyboardEvent.code, used for physical keyboard mapping. */
  code: string;
  label: string;
  sublabel?: string;
  row: number;
  col: number;
  /** Centre position in millimetres, keyboard centred at (0, 0). */
  x: number;
  z: number;
  widthU: number;
  heightU: number;
  widthMm: number;
  heightMm: number;
  tilt: number;
  accent?: KeyAccent;
  homeBump?: boolean;
  legendScale?: number;
  /** Distances between stabilizer stems, when the key is stabilized. */
  stabSpacing?: number;
}

type RawKey = {
  code: string;
  label: string;
  sublabel?: string;
  x: number;
  width?: number;
  accent?: KeyAccent;
  homeBump?: boolean;
  legendScale?: number;
};

type RowDef = {
  row: number;
  y: number;
  keys: RawKey[];
};

const ROWS: RowDef[] = [
  {
    row: 0,
    y: 0,
    keys: [
      { code: 'Escape', label: 'Esc', x: 0, accent: 'orange', legendScale: 0.92 },
      { code: 'F1', label: 'F1', x: 2 },
      { code: 'F2', label: 'F2', x: 3 },
      { code: 'F3', label: 'F3', x: 4 },
      { code: 'F4', label: 'F4', x: 5 },
      { code: 'F5', label: 'F5', x: 6.5 },
      { code: 'F6', label: 'F6', x: 7.5 },
      { code: 'F7', label: 'F7', x: 8.5 },
      { code: 'F8', label: 'F8', x: 9.5 },
      { code: 'F9', label: 'F9', x: 11 },
      { code: 'F10', label: 'F10', x: 12 },
      { code: 'F11', label: 'F11', x: 13 },
      { code: 'F12', label: 'F12', x: 14 },
      { code: 'PrintScreen', label: 'PrtSc', sublabel: 'SysRq', x: 15.25, legendScale: 0.72 },
      { code: 'ScrollLock', label: 'ScrLk', x: 16.25, legendScale: 0.72 },
      { code: 'Pause', label: 'Pause', x: 17.25, legendScale: 0.7 },
    ],
  },
  {
    row: 1,
    y: 1.5,
    keys: [
      { code: 'Backquote', label: '`', sublabel: '~', x: 0 },
      { code: 'Digit1', label: '1', sublabel: '!', x: 1 },
      { code: 'Digit2', label: '2', sublabel: '@', x: 2 },
      { code: 'Digit3', label: '3', sublabel: '#', x: 3 },
      { code: 'Digit4', label: '4', sublabel: '$', x: 4 },
      { code: 'Digit5', label: '5', sublabel: '%', x: 5 },
      { code: 'Digit6', label: '6', sublabel: '^', x: 6 },
      { code: 'Digit7', label: '7', sublabel: '&', x: 7 },
      { code: 'Digit8', label: '8', sublabel: '*', x: 8 },
      { code: 'Digit9', label: '9', sublabel: '(', x: 9 },
      { code: 'Digit0', label: '0', sublabel: ')', x: 10 },
      { code: 'Minus', label: '-', sublabel: '_', x: 11 },
      { code: 'Equal', label: '=', sublabel: '+', x: 12 },
      { code: 'Backspace', label: 'Backspace', x: 13, width: 2, legendScale: 0.68 },
      { code: 'Insert', label: 'Ins', x: 15.25, legendScale: 0.8 },
      { code: 'Home', label: 'Home', x: 16.25, legendScale: 0.72 },
      { code: 'PageUp', label: 'PgUp', x: 17.25, legendScale: 0.76 },
    ],
  },
  {
    row: 2,
    y: 2.5,
    keys: [
      { code: 'Tab', label: 'Tab', x: 0, width: 1.5, legendScale: 0.8 },
      { code: 'KeyQ', label: 'Q', x: 1.5 },
      { code: 'KeyW', label: 'W', x: 2.5 },
      { code: 'KeyE', label: 'E', x: 3.5 },
      { code: 'KeyR', label: 'R', x: 4.5 },
      { code: 'KeyT', label: 'T', x: 5.5 },
      { code: 'KeyY', label: 'Y', x: 6.5 },
      { code: 'KeyU', label: 'U', x: 7.5 },
      { code: 'KeyI', label: 'I', x: 8.5 },
      { code: 'KeyO', label: 'O', x: 9.5 },
      { code: 'KeyP', label: 'P', x: 10.5 },
      { code: 'BracketLeft', label: '[', sublabel: '{', x: 11.5 },
      { code: 'BracketRight', label: ']', sublabel: '}', x: 12.5 },
      { code: 'Backslash', label: '\\', sublabel: '|', x: 13.5, width: 1.5 },
      { code: 'Delete', label: 'Del', x: 15.25, legendScale: 0.8 },
      { code: 'End', label: 'End', x: 16.25, legendScale: 0.76 },
      { code: 'PageDown', label: 'PgDn', x: 17.25, legendScale: 0.76 },
    ],
  },
  {
    row: 3,
    y: 3.5,
    keys: [
      { code: 'CapsLock', label: 'Caps Lock', x: 0, width: 1.75, legendScale: 0.58 },
      { code: 'KeyA', label: 'A', x: 1.75 },
      { code: 'KeyS', label: 'S', x: 2.75 },
      { code: 'KeyD', label: 'D', x: 3.75 },
      { code: 'KeyF', label: 'F', x: 4.75, homeBump: true },
      { code: 'KeyG', label: 'G', x: 5.75 },
      { code: 'KeyH', label: 'H', x: 6.75 },
      { code: 'KeyJ', label: 'J', x: 7.75, homeBump: true },
      { code: 'KeyK', label: 'K', x: 8.75 },
      { code: 'KeyL', label: 'L', x: 9.75 },
      { code: 'Semicolon', label: ';', sublabel: ':', x: 10.75 },
      { code: 'Quote', label: "'", sublabel: '"', x: 11.75 },
      { code: 'Enter', label: 'Enter', x: 12.75, width: 2.25, accent: 'orange', legendScale: 0.72 },
    ],
  },
  {
    row: 4,
    y: 4.5,
    keys: [
      { code: 'ShiftLeft', label: 'Shift', x: 0, width: 2.25, legendScale: 0.72 },
      { code: 'KeyZ', label: 'Z', x: 2.25 },
      { code: 'KeyX', label: 'X', x: 3.25 },
      { code: 'KeyC', label: 'C', x: 4.25 },
      { code: 'KeyV', label: 'V', x: 5.25 },
      { code: 'KeyB', label: 'B', x: 6.25 },
      { code: 'KeyN', label: 'N', x: 7.25 },
      { code: 'KeyM', label: 'M', x: 8.25 },
      { code: 'Comma', label: ',', sublabel: '<', x: 9.25 },
      { code: 'Period', label: '.', sublabel: '>', x: 10.25 },
      { code: 'Slash', label: '/', sublabel: '?', x: 11.25 },
      { code: 'ShiftRight', label: 'Shift', x: 12.25, width: 2.75, legendScale: 0.72 },
      { code: 'ArrowUp', label: '↑', x: 16.25, accent: 'blue' },
    ],
  },
  {
    row: 5,
    y: 5.5,
    keys: [
      { code: 'ControlLeft', label: 'Ctrl', x: 0, width: 1.25, legendScale: 0.7 },
      { code: 'MetaLeft', label: 'Win', x: 1.25, width: 1.25, legendScale: 0.7 },
      { code: 'AltLeft', label: 'Alt', x: 2.5, width: 1.25, legendScale: 0.7 },
      { code: 'Space', label: 'SPACE', x: 3.75, width: 6.25, legendScale: 0.46 },
      { code: 'AltRight', label: 'Alt', x: 10, width: 1.25, legendScale: 0.7 },
      { code: 'MetaRight', label: 'Win', x: 11.25, width: 1.25, legendScale: 0.7 },
      { code: 'ContextMenu', label: 'Menu', x: 12.5, width: 1.25, legendScale: 0.62 },
      { code: 'ControlRight', label: 'Ctrl', x: 13.75, width: 1.25, legendScale: 0.7 },
      { code: 'ArrowLeft', label: '←', x: 15.25, accent: 'blue' },
      { code: 'ArrowDown', label: '↓', x: 16.25, accent: 'blue' },
      { code: 'ArrowRight', label: '→', x: 17.25, accent: 'blue' },
    ],
  },
];

export const FIELD_HALF_W = (LAYOUT_WIDTH_U * U) / 2;
export const FIELD_HALF_D = (LAYOUT_HEIGHT_U * U) / 2;

function buildKeys(): KeyDefinition[] {
  const result: KeyDefinition[] = [];
  for (const row of ROWS) {
    row.keys.forEach((raw, col) => {
      const widthU = raw.width ?? 1;
      const widthMm = widthU * U - KEYCAP_GAP;
      const profile = CAP_PROFILE[row.row];
      const x = (raw.x + widthU / 2 - LAYOUT_WIDTH_U / 2) * U;
      // The key field is 6.5U deep: row 0 starts 0.5U below the top edge,
      // so the six row centres are offset by 2.75U from the field centre.
      const z = (row.y - (LAYOUT_HEIGHT_U / 2 - 0.5)) * U;
      result.push({
        id: `cap-${raw.code}`,
        switchId: `sw-${raw.code}`,
        code: raw.code,
        label: raw.label,
        sublabel: raw.sublabel,
        row: row.row,
        col,
        x,
        z,
        widthU,
        heightU: 1,
        widthMm,
        heightMm: profile.height,
        tilt: profile.tilt,
        accent: raw.accent,
        homeBump: raw.homeBump,
        legendScale: raw.legendScale,
        stabSpacing: STAB_KEYS[raw.code],
      });
    });
  }
  return result;
}

export const KEYS: KeyDefinition[] = buildKeys();

export const KEY_BY_CODE: Record<string, KeyDefinition> = Object.fromEntries(
  KEYS.map((key) => [key.code, key]),
);

export const KEY_BY_ID: Record<string, KeyDefinition> = Object.fromEntries(
  KEYS.map((key) => [key.id, key]),
);

export const SWITCH_BY_ID: Record<string, KeyDefinition> = Object.fromEntries(
  KEYS.map((key) => [key.switchId, key]),
);

export const STAB_KEYS_LIST = KEYS.filter((key) => key.stabSpacing !== undefined);

export const ROW_LABELS = ['F 区', '数字区', 'Tab 区', 'Caps 区', 'Shift 区', '底排'];

/** Sanity helpers reused by tests and UI. */
export const KEY_COUNT = KEYS.length;
