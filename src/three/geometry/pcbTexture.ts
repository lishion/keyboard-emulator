import * as THREE from 'three';
import { PCB_D, PCB_W } from '../../config/constants';
import { KEYS, STAB_KEYS_LIST } from '../../data/layout';
import type { Theme } from '../../config/themes';

const W = 2048;
const H = Math.round((W * PCB_D) / PCB_W);

function px(x: number): number {
  return ((x + PCB_W / 2) / PCB_W) * W;
}

function py(z: number): number {
  return (0.5 - z / PCB_D) * H;
}

export interface PcbTextureStyle {
  solderMask?: string;
  silkscreen?: string;
  traceColor?: string;
  traceOpacity?: number;
  showTraces?: boolean;
  showSilkscreen?: boolean;
}

function alpha(hex: string, value: number): string {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${value})`;
}

export function createPcbTexture(theme: Theme, style: PcbTextureStyle = {}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const base = new THREE.Color(style.solderMask ?? theme.pcb);
  const trace = style.traceColor ?? '#cb9f4f';
  const traceStrength = Math.max(0, Math.min(1, style.traceOpacity ?? 0.55));
  const showTraces = style.showTraces !== false;
  const showSilk = style.showSilkscreen !== false;
  const silk = style.silkscreen ?? '#eef0e8';
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, `#${base.clone().offsetHSL(0, 0, 0.025).getHexString()}`);
  gradient.addColorStop(1, `#${base.clone().offsetHSL(0, 0, -0.018).getHexString()}`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Fine copper pour texture.
  ctx.strokeStyle = alpha(trace, 0.07 * traceStrength + 0.02);
  ctx.lineWidth = 1;
  for (let i = 0; i < 140; i += 1) {
    const y = (i / 140) * H;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(i * 0.6) * 8);
    ctx.lineTo(W, y + Math.sin(i * 0.9) * 8);
    ctx.stroke();
  }

  // Matrix traces between the number row and the rows below.
  ctx.strokeStyle = alpha(trace, 0.42 * traceStrength);
  ctx.lineWidth = 2.2;
  if (showTraces) {
    for (const key of KEYS) {
      const x = px(key.x);
      const y = py(key.z);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 12, y + 20);
      ctx.lineTo(x + 12, y + 34);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 8);
      ctx.lineTo(x - 8, y + 24);
      ctx.lineTo(x + 2, y + 32);
      ctx.stroke();
    }
  }

  // Long horizontal row buses.
  ctx.strokeStyle = alpha(trace, 0.34 * traceStrength);
  ctx.lineWidth = 3;
  if (showTraces) {
    for (const z of [-43, -30, 22, 43]) {
      ctx.beginPath();
      ctx.moveTo(px(-168), py(z));
      ctx.lineTo(px(168), py(z));
      ctx.stroke();
    }
  }

  // Switch pads and plated through holes.
  for (const key of KEYS) {
    const x = px(key.x);
    const y = py(key.z);
    ctx.fillStyle = alpha(trace, 0.65 * traceStrength);
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10231d';
    ctx.beginPath();
    ctx.arc(x, y, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alpha(trace, 0.75 * traceStrength);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, 11.5, 0, Math.PI * 2);
    ctx.stroke();

    // Pins and hot-swap footprint.
    for (const offset of [
      { x: 2.54, z: -5.08 },
      { x: -3.81, z: -2.54 },
    ]) {
      ctx.fillStyle = alpha(trace, 0.85 * traceStrength);
      ctx.beginPath();
      ctx.arc(x + (offset.x / PCB_W) * W, y - (offset.z / PCB_D) * H, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (showSilk) ctx.strokeStyle = alpha(silk, 0.23);
    ctx.lineWidth = 1.4;
    if (showSilk) {
      ctx.strokeRect(x - 20, y - 18, 40, 36);
      ctx.fillStyle = alpha(silk, 0.34);
      ctx.font = '500 9px "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(key.code.replace('Key', '').replace('Digit', '').slice(0, 5), x + 22, y - 10);
    }
  }

  // Stabilizer footprints.
  for (const key of STAB_KEYS_LIST) {
    const spacing = key.stabSpacing ?? 0;
    for (const direction of [-1, 1]) {
      const x = px(key.x + (spacing / 2) * direction);
      const y = py(key.z);
      if (showSilk) ctx.strokeStyle = alpha(silk, 0.32);
      ctx.lineWidth = 1.5;
      if (showSilk) ctx.strokeRect(x - 13, y - 17, 26, 34);
      ctx.fillStyle = 'rgba(224, 197, 128, 0.55)';
      for (const dx of [-2.1, 2.1]) {
        for (const dz of [-4.6, 4.6]) {
          ctx.beginPath();
          ctx.arc(x + (dx / PCB_W) * W, y - (dz / PCB_D) * H, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Silkscreen branding and connector labels.
  if (showSilk) {
    ctx.fillStyle = alpha(silk, 0.8);
    ctx.font = '600 34px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MX-87 / TKL', px(-158), py(-30));
    ctx.font = '500 19px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = alpha(silk, 0.55);
    ctx.fillText('REV.A  ·  HOT-SWAP 5-PIN  ·  USB-C', px(-158), py(-30) + 26);
    ctx.fillText('GASKET MOUNT  /  PER-KEY RGB', px(-158), py(-30) + 50);

    ctx.save();
    ctx.translate(px(58), py(62));
    ctx.fillStyle = alpha(silk, 0.6);
    ctx.font = '600 18px monospace';
    ctx.fillText('JST · 4PIN', -40, 0);
    ctx.restore();
  }

  // MCU land pattern and passives.
  const mcuX = px(0);
  const mcuY = py(-38);
  ctx.fillStyle = alpha(trace, 0.55 * traceStrength);
  ctx.fillRect(mcuX - 38, mcuY - 38, 76, 76);
  ctx.fillStyle = 'rgba(10, 24, 19, 0.85)';
  ctx.fillRect(mcuX - 26, mcuY - 26, 52, 52);
  if (showSilk) {
    ctx.fillStyle = alpha(silk, 0.55);
    ctx.font = '600 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MCU', mcuX, mcuY + 5);
  }

  ctx.fillStyle = alpha(silk, 0.45);
  for (let i = 0; i < 18; i += 1) {
    const x = mcuX - 150 + i * 17;
    ctx.fillRect(x, mcuY + 60 + (i % 3) * 14, 9, 5);
  }

  // Board edge silkscreen and via dots.
  if (showSilk) {
    ctx.strokeStyle = alpha(silk, 0.2);
    ctx.lineWidth = 2;
    ctx.strokeRect(px(-PCB_W / 2) + 8, py(PCB_D / 2) + 8, W - 16, H - 16);
  }
  for (let i = 0; i < 90; i += 1) {
    const x = px(-170 + (i * 37) % 340);
    const y = py(-62 + ((i * 23) % 124));
    ctx.fillStyle = alpha(trace, 0.35 * traceStrength);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / PCB_W, 1 / PCB_D);
  texture.offset.set(0.5, 0.5);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
