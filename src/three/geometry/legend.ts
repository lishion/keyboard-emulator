import * as THREE from 'three';
import type { KeyDefinition } from '../../data/layout';
import type { LegendFont } from '../../customization/types';

export interface LegendTexture {
  texture: THREE.CanvasTexture;
  dispose: () => void;
}

export interface LegendOptions {
  text?: string;
  sub?: string;
  size?: number;
  weight?: number;
  font?: LegendFont;
}

const FONT_STACKS: Record<LegendFont, string> = {
  sans: '"Helvetica Neue", "Inter", "Segoe UI", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", "Songti SC", serif',
  mono: '"SFMono-Regular", Menlo, Consolas, "Courier New", monospace',
};

/**
 * A transparent alpha decal. The keycap body keeps its own PBR colour, so
 * changing body colour never requires regenerating 87 legend canvases.
 */
export function createLegendTexture(
  key: KeyDefinition,
  options: LegendOptions = {},
): LegendTexture {
  const wide = key.widthMm > 58;
  const canvasWidth = wide ? 1024 : key.widthMm > 30 ? 640 : 384;
  const depth = 18.27;
  const canvasHeight = Math.max(48, Math.round((canvasWidth * depth) / key.widthMm));
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = Math.max(16, Math.round(canvasHeight / 2) * 2);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const texture = new THREE.CanvasTexture(canvas);
    return { texture, dispose: () => texture.dispose() };
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const main = options.text ?? key.label;
  const sub = options.sub ?? key.sublabel ?? '';
  const scale = (key.legendScale ?? 1) * (options.size ?? 1);
  const weight = options.weight ?? 700;
  const family = FONT_STACKS[options.font ?? 'sans'];
  let mainSize = canvas.height * 0.43 * scale;
  const subSize = canvas.height * 0.25 * scale;
  const maxWidth = canvas.width * 0.8;

  if (!main && !sub) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { texture, dispose: () => texture.dispose() };
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  const drawCentered = (value: string, y: number, size: number, fontWeight = weight) => {
    if (!value) return;
    let fitted = size;
    ctx.font = `${fontWeight} ${fitted}px ${family}`;
    const measured = ctx.measureText(value).width;
    if (measured > maxWidth) {
      fitted *= maxWidth / measured;
      ctx.font = `${fontWeight} ${fitted}px ${family}`;
    }
    ctx.fillText(value, canvas.width / 2, y);
  };

  if (sub) {
    const subY = canvas.height * 0.33;
    const mainY = canvas.height * 0.67;
    drawCentered(sub, subY, subSize * 0.92, Math.min(weight, 600));
    drawCentered(main, mainY, mainSize, weight);
  } else {
    const symbol = /^[↑↓←→]$/.test(main);
    if (symbol) mainSize *= 1.18;
    drawCentered(main, canvas.height * (symbol ? 0.5 : 0.52), mainSize, weight);
  }

  if (key.homeBump) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(
      canvas.width / 2 - canvas.width * 0.08,
      canvas.height * 0.86,
      canvas.width * 0.16,
      Math.max(2, canvas.height * 0.014),
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return { texture, dispose: () => texture.dispose() };
}
