import * as THREE from 'three';
import type { AppearanceValues, LedMode } from './types';

export interface LedStyle {
  base: THREE.Color;
  press: THREE.Color;
  brightness: number;
  glowRadius: number;
  mode: LedMode;
}

export function resolveLedStyle(appearance: AppearanceValues): LedStyle {
  return {
    base: new THREE.Color(appearance.ledBaseColor ?? '#e87432'),
    press: new THREE.Color(appearance.ledPressColor ?? '#fff0d8'),
    brightness: Math.max(0, appearance.ledBrightness ?? 1),
    glowRadius: Math.max(0, appearance.ledGlowRadius ?? 1),
    mode: appearance.ledMode ?? 'press',
  };
}

export function computeLedColor(
  style: LedStyle,
  index: number,
  depth: number,
  time: number,
  target: THREE.Color,
): THREE.Color {
  const t = THREE.MathUtils.clamp(depth / 3.55, 0, 1);
  if (style.mode === 'off') {
    target.setRGB(0, 0, 0);
    return target;
  }
  if (style.mode === 'rainbow') {
    const hue = (time * 0.06 + index / 87) % 1;
    target.setHSL(hue, 0.78, 0.55).multiplyScalar(style.brightness * 0.9);
    target.lerp(style.press, t * 0.6);
    return target;
  }
  target.copy(style.base);
  let factor = 0.55;
  if (style.mode === 'press') factor = 0.06;
  if (style.mode === 'breathing') {
    factor = 0.3 + 0.38 * (0.5 + 0.5 * Math.sin(time * 1.8 + index * 0.055));
  }
  target.multiplyScalar(factor * style.brightness);
  target.lerp(style.press, t * Math.min(1, style.brightness));
  return target;
}

export function isLedOff(style: LedStyle): boolean {
  return style.mode === 'off' || style.brightness <= 0.001;
}
