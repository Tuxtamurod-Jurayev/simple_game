import * as THREE from 'three';

/**
 * Procedural military textures generated dynamically on HTML5 Canvas
 * Zero external asset dependencies, ultra-crisp, realistic PBR appearance.
 */

// Cached textures
let usaCamoTex: THREE.CanvasTexture | null = null;
let chinaCamoTex: THREE.CanvasTexture | null = null;
let glaCamoTex: THREE.CanvasTexture | null = null;
let treadTex: THREE.CanvasTexture | null = null;
let runwayTex: THREE.CanvasTexture | null = null;
let concreteTex: THREE.CanvasTexture | null = null;

export function getUSACamoTexture(): THREE.CanvasTexture {
  if (usaCamoTex) return usaCamoTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base desert tan
  ctx.fillStyle = '#bfa278';
  ctx.fillRect(0, 0, 256, 256);

  // Digital camo blocks
  const colors = ['#9e835c', '#d6be9c', '#6f7457', '#877558'];
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = colors[i % colors.length];
    const bx = Math.floor(Math.random() * 16) * 16;
    const by = Math.floor(Math.random() * 16) * 16;
    const bw = (Math.floor(Math.random() * 3) + 1) * 16;
    const bh = (Math.floor(Math.random() * 3) + 1) * 16;
    ctx.fillRect(bx, by, bw, bh);
  }

  // Panel seams
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 248);
  ctx.beginPath();
  ctx.moveTo(128, 4); ctx.lineTo(128, 252);
  ctx.moveTo(4, 128); ctx.lineTo(252, 128);
  ctx.stroke();

  // Rivets on corners
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  for (const rx of [12, 120, 136, 244]) {
    for (const ry of [12, 120, 136, 244]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  usaCamoTex = new THREE.CanvasTexture(canvas);
  usaCamoTex.wrapS = THREE.RepeatWrapping;
  usaCamoTex.wrapT = THREE.RepeatWrapping;
  return usaCamoTex;
}

export function getChinaArmorTexture(): THREE.CanvasTexture {
  if (chinaCamoTex) return chinaCamoTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark industrial crimson/steel base
  ctx.fillStyle = '#8b2522';
  ctx.fillRect(0, 0, 256, 256);

  // Camo splotches (darker red and gold-brown)
  const blotches = ['#691816', '#a1332f', '#752d19', '#4d1413'];
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = blotches[i % blotches.length];
    ctx.beginPath();
    const cx = Math.random() * 256;
    const cy = Math.random() * 256;
    const r = Math.random() * 35 + 15;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heavy steel armor plate borders
  ctx.strokeStyle = 'rgba(15, 5, 5, 0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 244, 244);

  // Big bolts
  ctx.fillStyle = '#f59e0b';
  for (const bx of [16, 240]) {
    for (const by of [16, 240]) {
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  chinaCamoTex = new THREE.CanvasTexture(canvas);
  chinaCamoTex.wrapS = THREE.RepeatWrapping;
  chinaCamoTex.wrapT = THREE.RepeatWrapping;
  return chinaCamoTex;
}

export function getGLAArmorTexture(): THREE.CanvasTexture {
  if (glaCamoTex) return glaCamoTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Weathered olive / rusty desert iron
  ctx.fillStyle = '#3c4735';
  ctx.fillRect(0, 0, 256, 256);

  // Rust patches
  const rustColors = ['#5a462b', '#6d3c1c', '#2c3525', '#80562f'];
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = rustColors[i % rustColors.length];
    ctx.fillRect(
      Math.random() * 256,
      Math.random() * 256,
      Math.random() * 45 + 10,
      Math.random() * 30 + 10
    );
  }

  // Scratches
  ctx.strokeStyle = 'rgba(200, 200, 180, 0.4)';
  ctx.lineWidth = 1;
  for (let s = 0; s < 30; s++) {
    ctx.beginPath();
    const sx = Math.random() * 256;
    const sy = Math.random() * 256;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() * 30 - 15), sy + (Math.random() * 30 - 15));
    ctx.stroke();
  }

  glaCamoTex = new THREE.CanvasTexture(canvas);
  glaCamoTex.wrapS = THREE.RepeatWrapping;
  glaCamoTex.wrapT = THREE.RepeatWrapping;
  return glaCamoTex;
}

export function getTreadTexture(): THREE.CanvasTexture {
  if (treadTex) return treadTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 64, 128);

  // Tread ridges
  for (let y = 0; y < 128; y += 16) {
    ctx.fillStyle = '#27272a';
    ctx.fillRect(4, y + 2, 56, 10);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(10, y + 4, 44, 4);
    // Center guide pin slot
    ctx.fillStyle = '#09090b';
    ctx.fillRect(28, y, 8, 16);
  }

  treadTex = new THREE.CanvasTexture(canvas);
  treadTex.wrapS = THREE.RepeatWrapping;
  treadTex.wrapT = THREE.RepeatWrapping;
  treadTex.repeat.set(1, 4);
  return treadTex;
}

export function getRunwayTexture(): THREE.CanvasTexture {
  if (runwayTex) return runwayTex;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark tarmac
  ctx.fillStyle = '#262626';
  ctx.fillRect(0, 0, 128, 256);

  // White runway dashed line
  ctx.fillStyle = '#ffffff';
  for (let y = 16; y < 256; y += 48) {
    ctx.fillRect(60, y, 8, 28);
  }

  // Threshold piano keys
  for (let x = 16; x < 112; x += 16) {
    ctx.fillRect(x, 4, 8, 20);
    ctx.fillRect(x, 232, 8, 20);
  }

  runwayTex = new THREE.CanvasTexture(canvas);
  runwayTex.wrapS = THREE.RepeatWrapping;
  runwayTex.wrapT = THREE.RepeatWrapping;
  return runwayTex;
}

export function getConcreteTexture(): THREE.CanvasTexture {
  if (concreteTex) return concreteTex;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#52525b';
  ctx.fillRect(0, 0, 128, 128);

  // Slab seams
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 124);

  // Stains
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.arc(64, 64, 30, 0, Math.PI * 2);
  ctx.fill();

  concreteTex = new THREE.CanvasTexture(canvas);
  concreteTex.wrapS = THREE.RepeatWrapping;
  concreteTex.wrapT = THREE.RepeatWrapping;
  return concreteTex;
}
