export type ThemeKey = 'graphite' | 'midnight' | 'sand';

export interface Theme {
  key: ThemeKey;
  name: string;
  note: string;
  case: string;
  caseAlt: string;
  keycap: string;
  modifier: string;
  orange: string;
  blue: string;
  stem: string;
  legend: string;
  background: string;
  pcb: string;
  plate: string;
  foam: string;
  silicone: string;
  accentCss: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  graphite: {
    key: 'graphite',
    name: '石墨 / 米白',
    note: '石墨阳极铝 + 米白 PBT + 橙色强调',
    case: '#33363b',
    caseAlt: '#484d55',
    keycap: '#ece5d6',
    modifier: '#d7cfbe',
    orange: '#e87432',
    blue: '#5d8fa8',
    stem: '#e87432',
    legend: '#2b2a27',
    background: '#efebe3',
    pcb: '#17352c',
    plate: '#2f3b36',
    foam: '#a9a398',
    silicone: '#d6d0c2',
    accentCss: '#e87432',
  },
  midnight: {
    key: 'midnight',
    name: '午夜 / 冷灰',
    note: '深蓝灰铝壳 + 冷白键帽 + 青蓝强调',
    case: '#2b3541',
    caseAlt: '#404f5f',
    keycap: '#e5e6e1',
    modifier: '#ccd2d2',
    orange: '#df7c44',
    blue: '#4b8bab',
    stem: '#df7c44',
    legend: '#252a2f',
    background: '#e8eae8',
    pcb: '#14312f',
    plate: '#293a3a',
    foam: '#9fa5a2',
    silicone: '#cfd4d1',
    accentCss: '#4b8bab',
  },
  sand: {
    key: 'sand',
    name: '暖沙 / 银灰',
    note: '暖银喷砂铝 + 沙白 PBT + 陶土橙',
    case: '#b8b0a1',
    caseAlt: '#d2cabc',
    keycap: '#f3eee2',
    modifier: '#e0d7c7',
    orange: '#c86a34',
    blue: '#567e8f',
    stem: '#c86a34',
    legend: '#2c2924',
    background: '#f3efe7',
    pcb: '#17352c',
    plate: '#36413b',
    foam: '#b5ad9f',
    silicone: '#ded7c9',
    accentCss: '#c86a34',
  },
};

export const THEME_LIST = Object.values(THEMES);
