export type LedMode = 'off' | 'static' | 'press' | 'breathing' | 'rainbow';
export type LegendFont = 'sans' | 'serif' | 'mono';
export type FinishPreset = 'matte' | 'satin' | 'gloss' | 'metal';

/**
 * Flat, serialisable appearance override. Every field is optional; a missing
 * field falls back to the current theme / material default.
 */
export interface AppearanceValues {
  material?: string;
  color?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  opacity?: number;
  hideInternals?: boolean;
  accentColor?: string;

  // Keycaps — visible shape and legend
  cornerRadius?: number;
  taper?: number;
  dish?: number;
  legendText?: string;
  legendSub?: string;
  legendColor?: string;
  legendSize?: number;
  legendWeight?: number;
  legendFont?: LegendFont;
  legendVisible?: boolean;
  legendGlow?: number;

  // Switch
  lowerColor?: string;
  upperColor?: string;
  stemColor?: string;
  upperOpacity?: number;
  upperRoughness?: number;
  stemRoughness?: number;

  // Stabilizers
  wireColor?: string;
  wireMetalness?: number;
  wireRoughness?: number;
  screwColor?: string;

  // Foam
  grain?: number;

  // PCB
  solderMask?: string;
  silkscreen?: string;
  traceColor?: string;
  traceOpacity?: number;
  showTraces?: boolean;
  showSilkscreen?: boolean;

  // PCB components
  contactColor?: string;

  // LED group
  ledBaseColor?: string;
  ledPressColor?: string;
  ledBrightness?: number;
  ledGlowRadius?: number;
  ledMode?: LedMode;

  // USB / cable
  boardColor?: string;
  portColor?: string;
  plasticColor?: string;
  indicatorColor?: string;
  indicatorBrightness?: number;
  connectorColor?: string;
}

export type AppearanceRecord = Record<string, AppearanceValues>;

export type AppearanceFieldKind = 'color' | 'range' | 'select' | 'toggle' | 'text';

export interface AppearanceField {
  key: keyof AppearanceValues;
  label: string;
  kind: AppearanceFieldKind;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  /** Applies to every part in the broadest group regardless of the scope selector. */
  global?: boolean;
  /** Legend copy belongs to one physical keycap only. */
  perPartOnly?: boolean;
  hint?: string;
}

export interface AppearanceSection {
  title: string;
  fields: AppearanceField[];
}

export interface AppearanceSchema {
  title: string;
  sections: AppearanceSection[];
}

export type ScopeKey =
  | 'part'
  | 'sameWidth'
  | 'sameRow'
  | 'allKeycaps'
  | 'allSwitches'
  | 'allStabs'
  | 'allGaskets'
  | 'allFoam'
  | 'caseSet'
  | 'allScrews'
  | 'allFeet';

export interface ScopeOption {
  key: ScopeKey;
  label: string;
}
