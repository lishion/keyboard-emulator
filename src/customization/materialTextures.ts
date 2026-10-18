import * as THREE from 'three';

export type MaterialMapKind = 'wood' | 'carbon' | 'felt' | 'braid';

const cache = new Map<MaterialMapKind, THREE.CanvasTexture>();

function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function makeCanvas(size: number, paint: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  return canvas;
}

function makeWood(): THREE.CanvasTexture {
  const random = seeded(19);
  const canvas = makeCanvas(512, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#d9c2a4');
    gradient.addColorStop(0.48, '#c9aa84');
    gradient.addColorStop(1, '#b9916c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 80; i += 1) {
      const y = random() * 512;
      const bend = (random() - 0.5) * 40;
      ctx.strokeStyle = `rgba(${65 + Math.floor(random() * 40)},${38 + Math.floor(random() * 30)},${20 + Math.floor(random() * 18)},${0.08 + random() * 0.22})`;
      ctx.lineWidth = 1 + random() * 4;
      ctx.beginPath();
      for (let x = -10; x <= 522; x += 18) {
        const wave = Math.sin(x * 0.017 + i * 0.8) * (5 + random() * 5) + bend;
        const yy = y + wave;
        if (x === -10) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 7; i += 1) {
      const cx = random() * 512;
      const cy = random() * 512;
      ctx.strokeStyle = 'rgba(93,56,31,0.18)';
      ctx.lineWidth = 3;
      for (let r = 5; r < 48; r += 6) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.8, r * 0.55, random() * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
  return finalize(canvas, 3, 2);
}

function makeCarbon(): THREE.CanvasTexture {
  const canvas = makeCanvas(256, (ctx) => {
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, 256, 256);
    const step = 16;
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        const even = ((x / step) + (y / step)) % 2 === 0;
        ctx.fillStyle = even ? '#d8d8d8' : '#8a8a8a';
        ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
        ctx.strokeStyle = even ? 'rgba(255,255,255,0.3)' : 'rgba(20,20,20,0.3)';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + step / 2);
        ctx.lineTo(x + step - 2, y + step / 2);
        ctx.stroke();
      }
    }
  });
  return finalize(canvas, 5, 3);
}

function makeFelt(): THREE.CanvasTexture {
  const random = seeded(41);
  const image = makeCanvas(256, (ctx) => {
    const data = ctx.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i += 1) {
      const value = 170 + Math.floor(random() * 80);
      data.data[i * 4] = value;
      data.data[i * 4 + 1] = value;
      data.data[i * 4 + 2] = value;
      data.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
  });
  return finalize(image, 10, 10);
}

function makeBraid(): THREE.CanvasTexture {
  const canvas = makeCanvas(256, (ctx) => {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 7;
    for (let x = -256; x < 512; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(40,40,40,0.28)';
    ctx.lineWidth = 3;
    for (let x = -256; x < 512; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 256, 0);
      ctx.stroke();
    }
  });
  return finalize(canvas, 6, 2);
}

function finalize(canvas: HTMLCanvasElement, repeatX: number, repeatY: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function getMaterialMap(kind: MaterialMapKind): THREE.CanvasTexture {
  const existing = cache.get(kind);
  if (existing) return existing;
  const texture = kind === 'wood' ? makeWood() : kind === 'carbon' ? makeCarbon() : kind === 'felt' ? makeFelt() : makeBraid();
  cache.set(kind, texture);
  return texture;
}
