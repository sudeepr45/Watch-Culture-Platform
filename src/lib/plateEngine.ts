// src/lib/plateEngine.ts
// Draws any of the 100 plates onto a square canvas. Pure Canvas 2D, no dependencies.
// Ported line by line from the reference catalogue. Do not "improve" the maths:
// any change alters plates people already know by number.

import type { FamilyKey, Plate } from '../data/plates';

type Ctx = CanvasRenderingContext2D;
type Get = (key: string) => number;
interface Opts {
  lw: number; // base line width
  rng: () => number; // seeded random generator, one per plate
  n: number; // curve samples
  bg: string; // background colour (used by Scales)
}
type Draw = (c: Ctx, S: number, g: Get, o: Opts) => void;

const TAU = 6.2832;

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clipC(c: Ctx, S: number): void {
  c.save();
  c.beginPath();
  c.arc(S / 2, S / 2, S * 0.46, 0, TAU);
  c.clip();
}
function ring(c: Ctx, S: number): void {
  c.beginPath();
  c.arc(S / 2, S / 2, S * 0.46, 0, TAU);
  c.stroke();
}
function rrect(c: Ctx, x: number, y: number, w: number, r: number): void {
  r = Math.min(r, w / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + w, r);
  c.arcTo(x + w, y + w, x, y + w, r);
  c.arcTo(x, y + w, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

const rings: Draw = (c, S, g, o) => {
  const k = g('k'), k2 = g('k2'), a = g('a'), a2 = g('a2'), N = g('N'), e = g('e'), q = g('q');
  const sc = (S * 0.44) / (0.62 + e), R = 0.62 * sc, E = e * sc, m = S / 2, den = 1 + a + a2, n = o.n;
  for (let i = 0; i < N; i++) {
    const ph = ((TAU * i) / N) * q;
    const ox = m + E * Math.cos(ph), oy = m + E * Math.sin(ph);
    c.beginPath();
    for (let s = 0; s <= n; s++) {
      const th = (TAU * s) / n;
      const b = (1 + a * Math.cos(k * th) + a2 * Math.cos(k2 * th)) / den;
      const x = ox + R * b * Math.cos(th + ph), y = oy + R * b * Math.sin(th + ph);
      if (s) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.stroke();
  }
};

const rosette: Draw = (c, S, g, o) => {
  const k = g('k'), k2 = g('k2'), a = g('a'), a2 = g('a2'), N = g('N'), mm = g('m'), smin = g('smin');
  const R = S * 0.44, m = S / 2, den = 1 + a + a2, n = o.n, d = ((TAU / k) * mm) / N;
  for (let i = 0; i < N; i++) {
    const sc = 1 - ((1 - smin) * i) / N;
    c.beginPath();
    for (let s = 0; s <= n; s++) {
      const th = (TAU * s) / n;
      const b = (1 + a * Math.cos(k * th) + a2 * Math.cos(k2 * th)) / den;
      const rr = R * b * sc, ang = th + i * d;
      const x = m + rr * Math.cos(ang), y = m + rr * Math.sin(ang);
      if (s) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.stroke();
  }
};

const tapis: Draw = (c, S, g) => {
  clipC(c, S);
  const n = g('n'), rot = g('rot'), t = g('t');
  const cs = (S * 0.94) / n, K = Math.ceil((S * 0.66) / cs), q = (cs * (1 - t)) / 2;
  c.translate(S / 2, S / 2);
  c.rotate((rot * Math.PI) / 180);
  c.beginPath();
  for (let i = -K; i < K; i++) {
    for (let j = -K; j < K; j++) {
      const x = i * cs, y = j * cs;
      c.rect(x, y, cs, cs);
      c.rect(x + q, y + q, cs - 2 * q, cs - 2 * q);
      c.moveTo(x, y); c.lineTo(x + q, y + q);
      c.moveTo(x + cs, y); c.lineTo(x + cs - q, y + q);
      c.moveTo(x, y + cs); c.lineTo(x + q, y + cs - q);
      c.moveTo(x + cs, y + cs); c.lineTo(x + cs - q, y + cs - q);
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const barley: Draw = (c, S, g) => {
  clipC(c, S);
  const gg = S * g('g'), L = gg * 1.25, w = gg * 0.34, a = (g('ang') * Math.PI) / 180;
  const dx = (Math.cos(a) * L) / 2, dy = (Math.sin(a) * L) / 2, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
  c.beginPath();
  for (let j = 0; j * gg * 0.5 < S + gg; j++) {
    for (let i = -1; i * gg < S + gg; i++) {
      const x = (i + (j & 1 ? 0.5 : 0)) * gg, y = j * gg * 0.5;
      c.moveTo(x - dx, y - dy);
      c.quadraticCurveTo(x + nx, y + ny, x + dx, y + dy);
      c.quadraticCurveTo(x - nx, y - ny, x - dx, y - dy);
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const basket: Draw = (c, S, g) => {
  clipC(c, S);
  const b = S * g('b'), m = g('m'), K = Math.ceil((S * 0.5) / b) + 1, st = b / m;
  c.beginPath();
  for (let i = -K; i < K; i++) {
    for (let j = -K; j < K; j++) {
      const x = S / 2 + i * b, y = S / 2 + j * b;
      if ((i + j) & 1) {
        for (let k = 0.5; k < m; k++) { c.moveTo(x + 0.1 * b, y + k * st); c.lineTo(x + 0.9 * b, y + k * st); }
      } else {
        for (let k = 0.5; k < m; k++) { c.moveTo(x + k * st, y + 0.1 * b); c.lineTo(x + k * st, y + 0.9 * b); }
      }
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const sun: Draw = (c, S, g) => {
  const n = g('n'), alt = g('alt'), m = S / 2, R = S * 0.46, r0 = S * g('r0');
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n;
    const r1 = r0 + (alt && i % 2 ? (R - r0) * 0.35 : 0);
    c.moveTo(m + r1 * Math.cos(a), m + r1 * Math.sin(a));
    c.lineTo(m + R * Math.cos(a), m + R * Math.sin(a));
  }
  c.stroke();
};

const lines: Draw = (c, S, g, o) => {
  clipC(c, S);
  const n = g('n'), amp = g('amp'), len = g('len'), ang = g('ang'), ph = g('ph'), th = g('th');
  const H = S * 0.7, sp = (2 * H) / n, wl = S * len;
  c.translate(S / 2, S / 2);
  c.rotate((ang * Math.PI) / 180);
  for (let i = 0; i < n; i++) {
    const y = -H + i * sp;
    c.lineWidth = o.lw * (th && i % 2 ? 2.4 : 1);
    c.beginPath();
    for (let x = -H; x <= H; x += 4) {
      const yy = y + (amp ? S * amp * Math.sin((TAU * x) / wl + i * ph) : 0);
      if (x === -H) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();
  }
  c.restore();
  ring(c, S);
};

const perlage: Draw = (c, S, g) => {
  clipC(c, S);
  const s = S * g('s'), r = s * g('r'), K = Math.ceil((S * 0.5) / s) + 2;
  c.beginPath();
  for (let j = -K; j <= K; j++) {
    for (let i = -K; i <= K; i++) {
      const x = S / 2 + (i + (j & 1 ? 0.5 : 0)) * s, y = S / 2 + j * s * 0.866;
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, TAU);
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const snail: Draw = (c, S, g) => {
  const n = g('n'), tw = g('tw'), m = S / 2, R = S * 0.46;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = (TAU * i) / n;
    for (let k = 0; k <= 50; k++) {
      const a = a0 + tw * (k / 50) * Math.PI, rr = (R * k) / 50;
      if (k) c.lineTo(m + rr * Math.cos(a), m + rr * Math.sin(a)); else c.moveTo(m, m);
    }
  }
  c.stroke();
};

const snow: Draw = (c, S, g, o) => {
  clipC(c, S);
  const gg = S * g('g'), dot = g('dot'), f = g('f'), u = g('u');
  const a = o.rng() * TAU, b = o.rng() * TAU;
  c.beginPath();
  for (let y = 0; y < S; y += gg) {
    for (let x = 0; x < S; x += gg) {
      const pr = u || 0.5 + 0.4 * Math.sin((x / S) * f * TAU + a) * Math.sin((y / S) * f * TAU + b);
      if (o.rng() < pr) {
        const px = x + o.rng() * gg, py = y + o.rng() * gg;
        const r = Math.max(0.6, S * 0.0022) * dot * (0.7 + o.rng() * 0.9);
        c.moveTo(px + r, py);
        c.arc(px, py, r, 0, TAU);
      }
    }
  }
  c.fill();
  c.restore();
  ring(c, S);
};

const bark: Draw = (c, S, g, o) => {
  clipC(c, S);
  const cs = S * g('cs'), len = g('len'), gap = g('gap');
  c.beginPath();
  for (let x = cs / 2; x < S; x += cs) {
    let y = 0;
    while (y < S) {
      y += cs * (0.5 + o.rng() * gap * 2);
      const l = cs * (0.4 + o.rng() * len);
      const xs = x + (o.rng() - 0.5) * cs * 0.3;
      c.moveTo(xs - l / 2, y);
      c.lineTo(xs + l / 2, y + (o.rng() - 0.5) * cs * 0.2);
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const conc: Draw = (c, S, g) => {
  clipC(c, S);
  const cx = S / 2 + S * g('off'), s = S * g('s');
  c.beginPath();
  for (let r = s; r < S; r += s) {
    c.moveTo(cx + r, S / 2);
    c.arc(cx, S / 2, r, 0, TAU);
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const meteo: Draw = (c, S, g, o) => {
  clipC(c, S);
  const n = g('n'), j = g('j'), len = g('len');
  const A = [0, 60, 120];
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (((A[Math.floor(o.rng() * 3)] ?? 0) + (o.rng() - 0.5) * j) * Math.PI) / 180;
    const x = o.rng() * S, y = o.rng() * S, L = S * (0.2 + o.rng() * len);
    c.moveTo(x - (Math.cos(a) * L) / 2, y - (Math.sin(a) * L) / 2);
    c.lineTo(x + (Math.cos(a) * L) / 2, y + (Math.sin(a) * L) / 2);
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const grid: Draw = (c, S, g) => {
  clipC(c, S);
  const t = S * g('t'), gp = t * g('gap'), w = t - gp, r = g('r'), K = Math.ceil((S * 0.5) / t) + 1;
  c.beginPath();
  for (let i = -K; i < K; i++) {
    for (let j = -K; j < K; j++) {
      const x = S / 2 + i * t + gp / 2, y = S / 2 + j * t + gp / 2;
      rrect(c, x, y, w, w * r);
      rrect(c, x + w * 0.2, y + w * 0.2, w * 0.6, w * 0.6 * r);
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const scales: Draw = (c, S, g, o) => {
  clipC(c, S);
  const s = S * g('s'), K = Math.ceil((S * 0.5) / s) + 2;
  c.fillStyle = o.bg;
  for (let j = -K * 2; j <= K * 2; j++) {
    for (let i = -K; i <= K; i++) {
      const x = S / 2 + (i + (j & 1 ? 0.5 : 0)) * s, y = S / 2 + j * s * 0.5;
      c.beginPath();
      c.arc(x, y, s / 2, 0, Math.PI);
      c.closePath();
      c.fill();
      c.stroke();
    }
  }
  c.restore();
  ring(c, S);
};

const spiral: Draw = (c, S, g) => {
  const t = g('t'), wob = g('wob'), wk = g('wk'), m = S / 2, R = S * 0.46, N = t * 720;
  c.beginPath();
  for (let k = 0; k <= N; k++) {
    const a = ((k / 2) * Math.PI) / 180;
    const r = (R * k) / N + (wob ? S * wob * Math.sin(a * wk) : 0);
    if (k) c.lineTo(m + r * Math.cos(a), m + r * Math.sin(a)); else c.moveTo(m, m);
  }
  c.stroke();
};

const honey: Draw = (c, S, g) => {
  clipC(c, S);
  const s = S * g('s'), inn = g('inn'), w = Math.sqrt(3) * s, K = Math.ceil((S * 0.5) / s) + 2;
  c.beginPath();
  for (let j = -K; j <= K; j++) {
    for (let i = -K; i <= K; i++) {
      const x = S / 2 + i * w + (j & 1 ? w / 2 : 0), y = S / 2 + j * s * 1.5;
      for (let q = 0; q < (inn ? 2 : 1); q++) {
        const f = q ? inn : 1;
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + (k * Math.PI) / 3;
          const px = x + s * f * Math.cos(a), py = y + s * f * Math.sin(a);
          if (k) c.lineTo(px, py); else c.moveTo(px, py);
        }
        c.closePath();
      }
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const satin: Draw = (c, S, g, o) => {
  clipC(c, S);
  c.translate(S / 2, S / 2);
  c.rotate((g('ang') * Math.PI) / 180);
  c.translate(-S / 2, -S / 2);
  const sp = S * g('sp'), len = g('len'), H = S * 1.4;
  c.beginPath();
  for (let y = -S * 0.4; y < H; y += sp) {
    let x = -S * 0.4 - o.rng() * S * 0.2;
    while (x < H) {
      const L = S * (0.04 + o.rng() * len);
      c.moveTo(x, y + (o.rng() - 0.5) * sp * 0.6);
      c.lineTo(x + L, y + (o.rng() - 0.5) * sp * 0.6);
      x += L * (0.75 + o.rng() * 0.5);
    }
  }
  c.stroke();
  c.restore();
  ring(c, S);
};

const FN = { rings, rosette, tapis, barley, basket, sun, lines, perlage, snail, snow, bark, conc, meteo, grid, scales, spiral, honey, satin };
type FnKey = keyof typeof FN;

const MAP: Record<FamilyKey, FnKey> = {
  rings: 'rings', rosette: 'rosette', tapisserie: 'tapis', hobnail: 'tapis', barley: 'barley',
  basket: 'basket', sun: 'sun', geneva: 'lines', ribbing: 'lines', wave: 'lines', emboss: 'lines',
  perlage: 'perlage', snail: 'snail', snow: 'snow', bark: 'bark', conc: 'conc', meteo: 'meteo',
  grid: 'grid', scales: 'scales', spiral: 'spiral', honey: 'honey', satin: 'satin', grene: 'snow',
};

export interface PlateColors {
  ink: string; // normal lines (the site's ink colour)
  steel: string; // lines for plates with params.st (the site's steel-dark colour)
  bg: string; // background of the plate frame (the site's warm-surface colour)
}

/**
 * Draws one plate. `size` is the canvas width in DEVICE pixels (css width x devicePixelRatio).
 * Lines are solid ink, never grey or transparent.
 */
export function drawPlate(ctx: Ctx, size: number, plate: Plate, colors: PlateColors): void {
  const col = plate.params.st ? colors.steel : colors.ink;
  const lw = Math.max(0.5, size / 900);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g: Get = (key) => plate.params[key] ?? 0;
  FN[MAP[plate.family]](ctx, size, g, {
    lw,
    rng: mulberry32(plate.id * 7919 + 13),
    n: size > 600 ? 700 : 260,
    bg: colors.bg,
  });
}
