export interface PlateParams {
  waves: number;
  secondWave: number;
  amplitude: number;
  secondAmplitude: number;
  passes: number;
  offset: number;
  turns: number;
  steel: boolean;
}

/** Plate No. 1. Change this to the real launch date. */
const EPOCH_UTC = Date.UTC(2026, 0, 1);

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateFromKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftKey(k: string, days: number): string {
  const d = dateFromKey(k);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function longDate(k: string): string {
  return dateFromKey(k).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function plateNumber(k: string): number | null {
  const [y, m, d] = k.split('-').map(Number);
  const n = Math.floor((Date.UTC(y, m - 1, d) - EPOCH_UTC) / 86_400_000) + 1;
  return n >= 1 ? n : null;
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    let t = (a + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The date string is hashed into a seed, so the same date always gives the same plate. */
export function plateParams(k: string): PlateParams {
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) {
    h ^= k.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = mulberry32(h >>> 0);
  r(); r(); r();
  const waves = 5 + Math.floor(r() * 20);
  let secondWave = 3 + Math.floor(r() * 28);
  if (secondWave === waves) secondWave += 1;
  const amplitude = 0.03 + r() * 0.13;
  const secondAmplitude = r() * 0.06;
  const passes = 90 + Math.floor(r() * 131);
  const offset = 0.06 + r() * 0.4;
  const turns = 1 + Math.floor(r() * 3);
  const steel = r() > 0.7;
  return { waves, secondWave, amplitude, secondAmplitude, passes, offset, turns, steel };
}

/**
 * The cut: one wavy circle, drawn many times. Each copy is turned a little
 * and its centre moves around a small circle. The weave is interference.
 */
export function drawPasses(
  ctx: CanvasRenderingContext2D,
  size: number,
  q: PlateParams,
  from: number,
  to: number,
  samples: number,
  lineWidth: number,
  color: string,
): void {
  const extent = 0.62 + q.offset;
  const scale = (size * 0.44) / extent;
  const radius = 0.62 * scale;
  const shift = q.offset * scale;
  const mid = size / 2;
  const denom = 1 + q.amplitude + q.secondAmplitude;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';

  for (let i = from; i < to; i++) {
    const phase = ((2 * Math.PI * i) / q.passes) * q.turns;
    const ox = mid + shift * Math.cos(phase);
    const oy = mid + shift * Math.sin(phase);
    ctx.beginPath();
    for (let s = 0; s <= samples; s++) {
      const th = (2 * Math.PI * s) / samples;
      const base =
        (1 + q.amplitude * Math.cos(q.waves * th) + q.secondAmplitude * Math.cos(q.secondWave * th)) / denom;
      const x = ox + radius * base * Math.cos(th + phase);
      const y = oy + radius * base * Math.sin(th + phase);
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/** Saves a 1080 x 1440 (3:4) PNG, always in the light palette, sized for Instagram's grid. */
export async function savePlateImage(k: string): Promise<void> {
  const q = plateParams(k);
  const W = 1080;
  const H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FAF9F5';
  ctx.fillRect(0, 0, W, H);

  const plate = document.createElement('canvas');
  plate.width = plate.height = 1000;
  const pctx = plate.getContext('2d');
  if (!pctx) return;
  drawPasses(pctx, 1000, q, 0, q.passes, 900, 1.1, q.steel ? '#334155' : '#121212');
  ctx.drawImage(plate, 40, 60);

  ctx.strokeStyle = '#E7E5DF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 1124);
  ctx.lineTo(1020, 1124);
  ctx.stroke();

  const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const no = plateNumber(k);
  ctx.fillStyle = '#121212';
  ctx.font = `500 40px ${mono}`;
  ctx.fillText(`MOJEAN · PLATE${no ? ` No. ${no}` : ''}`, 60, 1190);
  ctx.fillStyle = '#57534E';
  ctx.font = `500 34px ${mono}`;
  ctx.fillText(longDate(k).toUpperCase(), 60, 1250);
  ctx.fillStyle = '#8C877E';
  ctx.font = `400 30px ${mono}`;
  ctx.fillText(`WAVES ${q.waves} / ${q.secondWave} · PASSES ${q.passes}`, 60, 1310);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mojean-plate-${k}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      resolve();
    });
  });
}
