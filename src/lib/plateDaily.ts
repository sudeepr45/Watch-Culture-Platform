// src/lib/plateDaily.ts
// Which plate belongs to which date. Same date, same plate, for everyone.
// Fixed shuffle (seed 2026) of all 100 plates; day 0 is 1 January 2026; repeats every 100 days.
// No Math.random() and no UTC conversion of the visitor's date: use the LOCAL calendar date.

import { PLATES, type Plate } from '../data/plates';
import { mulberry32 } from './plateEngine';

const EPOCH_UTC = Date.UTC(2026, 0, 1);

function buildOrder(): number[] {
  const r = mulberry32(2026);
  const a = Array.from({ length: 100 }, (_, i) => i);
  for (let i = 99; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i] as number;
    a[i] = a[j] as number;
    a[j] = t;
  }
  return a;
}

const ORDER = buildOrder();

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** 'YYYY-MM-DD' from a local Date. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The plate for a 'YYYY-MM-DD' key. Works for any date, past or future. */
export function plateForDateKey(key: string): Plate {
  const [y = 2026, m = 1, d = 1] = key.split('-').map(Number);
  const dayNumber = Math.floor((Date.UTC(y, m - 1, d) - EPOCH_UTC) / 86_400_000);
  const index = ORDER[((dayNumber % 100) + 100) % 100] as number;
  return PLATES[index] as Plate;
}

export function todaysPlate(): Plate {
  return plateForDateKey(dateKey(new Date()));
}

/*
 Verification values (these must match exactly):
   2026-01-01  -> No. 76  (Concentric II)
   2026-10-11  -> No. 88  (Scales III)
   2026-10-12  -> No. 29  (Sunburst III)
   2026-12-31  -> No. 3   (Rings III)
*/
