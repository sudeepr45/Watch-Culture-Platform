// src/data/plates.ts
// The 100 MOJEAN plates. DO NOT reorder, rename or change any number or setting:
// plate numbers are permanent. To add plates later, append them at 101 and up.

export type FamilyKey =
  | 'rings' | 'rosette' | 'tapisserie' | 'hobnail' | 'barley' | 'basket' | 'sun' | 'geneva'
  | 'ribbing' | 'wave' | 'emboss' | 'perlage' | 'snail' | 'snow' | 'bark' | 'conc'
  | 'meteo' | 'grid' | 'scales' | 'spiral' | 'honey' | 'satin' | 'grene';

export type PlateParams = Record<string, number>;

export interface Plate {
  id: number; // 1 to 100
  family: FamilyKey;
  name: string;
  params: PlateParams;
}

export interface Family {
  label: string; // technique
  how: string; // how it is drawn
  met: string; // where you have met it
  confidence: string;
}

/** Order here is the order of the filter chips. */
export const FAMILIES: Record<FamilyKey, Family> = {
  rings: { label: 'Rose-engine rings', how: 'One wavy circle drawn many times, each copy nudged around a small circle. Real rose engines cut similar curves into metal.', met: 'Engine-turned dials in the Breguet tradition. F.P. Journe is known for guilloché dials.', confidence: 'High for Breguet, medium for Journe' },
  rosette: { label: 'Twisted rosette', how: 'The same wavy circle, shrinking and turning a little with each pass.', met: 'Rose-engine ornament in general. No single maker.', confidence: 'General' },
  tapisserie: { label: 'Tapisserie', how: 'A square grid of tiny pyramids, each drawn as a small square with four diagonals to its corners.', met: 'Audemars Piguet Royal Oak dials, in petite, grande and mega sizes.', confidence: 'High' },
  hobnail: { label: 'Clous de Paris (hobnail)', how: 'The same pyramids on a grid turned 45 degrees.', met: 'Hobnail bezels on Patek Philippe Calatrava watches, and the Clous de Paris dial of the Girard-Perregaux Laureato.', confidence: 'High for the bezels and the Laureato, medium for other dials' },
  barley: { label: 'Grain d’orge (barleycorn)', how: 'Staggered rows of small grains, each a pointed oval.', met: 'Breguet’s signature dial pattern.', confidence: 'High' },
  basket: { label: 'Basket weave', how: 'Blocks of parallel lines, alternating horizontal and vertical.', met: 'Classical dials from several Swiss makers. Check the specific reference before naming a brand.', confidence: 'Low' },
  sun: { label: 'Sunburst', how: 'Fine lines radiating from the centre.', met: 'Used by almost every maker.', confidence: 'General' },
  geneva: { label: 'Côtes de Genève', how: 'Straight, parallel stripes with a slight wave.', met: 'The stripe finish on movement plates in the Geneva Seal tradition, as at Vacheron Constantin and Patek Philippe.', confidence: 'High' },
  ribbing: { label: 'Glashütte stripes', how: 'Very fine parallel stripes, close together.', met: 'Glashütte ribbing on German movement plates, as in A. Lange & Söhne calibres.', confidence: 'Medium to high' },
  wave: { label: 'Wave', how: 'Parallel lines bent by a sine wave, each shifted from the one before.', met: 'Wave dials such as the Omega Seamaster 300M, and the wave motif on the Rolex Datejust.', confidence: 'High' },
  emboss: { label: 'Embossed lines', how: 'Parallel lines, every second one heavier, like a ridged surface.', met: 'The horizontally embossed dial of the Patek Philippe Nautilus.', confidence: 'High' },
  perlage: { label: 'Perlage', how: 'Overlapping circles in staggered rows.', met: 'Circular graining on movement plates, common across Swiss and German makers.', confidence: 'General' },
  snail: { label: 'Snailing', how: 'Curved lines fanning out from the centre.', met: 'Snailing (colimaçonnage) on barrels and wheels, a movement-finishing technique.', confidence: 'General' },
  snow: { label: 'Snowfield', how: 'Scattered dots, denser and sparser in soft patches.', met: 'Grand Seiko’s Snowflake dial (the SBGA211 is in the MOJEAN archive). The real dial is textured, not engine-turned, so this is an approximation.', confidence: 'High' },
  bark: { label: 'Bark', how: 'Short horizontal dashes in uneven columns.', met: 'Grand Seiko’s White Birch dials. Textured, not engine-turned, so this is an approximation.', confidence: 'Medium to high' },
  conc: { label: 'Concentric stripes', how: 'Evenly spaced circles, sometimes with the centre shifted.', met: 'Circular graining and circular Geneva stripes on rotors and plates.', confidence: 'General' },
  meteo: { label: 'Meteorite', how: 'Many short straight lines in three directions, scattered at random.', met: 'Meteorite dials, such as those Rolex has offered on the Daytona and Omega on some models.', confidence: 'Medium to high' },
  grid: { label: 'Embossed grid', how: 'Rounded squares in a grid, each with an inner outline.', met: 'The embossed grid dial of the Patek Philippe Aquanaut.', confidence: 'High' },
  scales: { label: 'Scales', how: 'Overlapping half-circles in staggered rows, each hiding part of the one behind.', met: 'Scale and feather patterns on art and high-jewellery dials. No single maker.', confidence: 'General' },
  spiral: { label: 'Spiral groove', how: 'One continuous spiral from the centre outward.', met: 'Spiral and phonograph-style dials. No single maker.', confidence: 'General' },
  honey: { label: 'Honeycomb', how: 'A grid of hexagons, sometimes with an inner outline.', met: 'Hexagonal patterns on sports and tool watches. No single maker.', confidence: 'General' },
  satin: { label: 'Satin brushing', how: 'Short strokes of random length, laid in rows.', met: 'Brushed and satin finishes on cases, dials and bracelets across the industry.', confidence: 'General' },
  grene: { label: 'Grained dial', how: 'Fine, evenly scattered dots.', met: 'Fine-grained silver dials, as on A. Lange & Söhne.', confidence: 'Medium' },
};

export const PLATES: Plate[] = [];

function add(family: FamilyKey, names: string[], params: PlateParams[]): void {
  names.forEach((name, i) => {
    PLATES.push({ id: PLATES.length + 1, family, name, params: params[i] as PlateParams });
  });
}

// ---- Plates 1 to 50 ----
add('rings', ['Rings I', 'Rings II', 'Rings III', 'Rings IV', 'Rings V', 'Rings VI', 'Rings VII', 'Rings VIII', 'Rings IX', 'Rings X'], [
  { k: 7, k2: 13, a: 0.09, a2: 0.04, N: 182, e: 0.22, q: 1 },
  { k: 13, k2: 25, a: 0.05, a2: 0.05, N: 188, e: 0.35, q: 3, st: 1 },
  { k: 22, k2: 13, a: 0.11, a2: 0.03, N: 219, e: 0.22, q: 1 },
  { k: 11, k2: 25, a: 0.13, a2: 0, N: 212, e: 0.33, q: 3 },
  { k: 9, k2: 7, a: 0.07, a2: 0.02, N: 163, e: 0.24, q: 3, st: 1 },
  { k: 16, k2: 5, a: 0.08, a2: 0.02, N: 200, e: 0.07, q: 1 },
  { k: 6, k2: 18, a: 0.14, a2: 0.05, N: 150, e: 0.12, q: 2 },
  { k: 24, k2: 11, a: 0.04, a2: 0.03, N: 220, e: 0.4, q: 2, st: 1 },
  { k: 5, k2: 21, a: 0.1, a2: 0.04, N: 140, e: 0.28, q: 1 },
  { k: 15, k2: 4, a: 0.12, a2: 0.02, N: 170, e: 0.18, q: 2 },
]);
add('rosette', ['Rosette I', 'Rosette II', 'Rosette III', 'Rosette IV'], [
  { k: 12, k2: 10, a: 0.14, a2: 0.05, N: 126, m: 1, smin: 0.3 },
  { k: 5, k2: 3, a: 0.13, a2: 0.07, N: 123, m: 0.9, smin: 0.12, st: 1 },
  { k: 8, k2: 9, a: 0.17, a2: 0.08, N: 116, m: 2, smin: 0.1 },
  { k: 3, k2: 11, a: 0.25, a2: 0.1, N: 118, m: 1.8, smin: 0.15 },
]);
add('tapisserie', ['Petite tapisserie', 'Grande tapisserie', 'Mega tapisserie'], [
  { n: 44, rot: 0, t: 0.5 }, { n: 26, rot: 0, t: 0.5 }, { n: 14, rot: 0, t: 0.52 },
]);
add('hobnail', ['Hobnail, fine', 'Hobnail, medium', 'Hobnail, wide'], [
  { n: 40, rot: 45, t: 0.5 }, { n: 24, rot: 45, t: 0.55, st: 1 }, { n: 16, rot: 45, t: 0.45 },
]);
add('barley', ['Barleycorn I', 'Barleycorn II', 'Barleycorn III'], [
  { g: 0.034, ang: 45 }, { g: 0.05, ang: 45 }, { g: 0.024, ang: -45 },
]);
add('basket', ['Basket I', 'Basket II', 'Basket III'], [
  { b: 0.07, m: 6 }, { b: 0.05, m: 5 }, { b: 0.1, m: 9 },
]);
add('sun', ['Sunburst I', 'Sunburst II', 'Sunburst III', 'Sunburst IV'], [
  { n: 360, r0: 0.04, alt: 0 }, { n: 720, r0: 0.1, alt: 0 }, { n: 180, r0: 0, alt: 1 }, { n: 540, r0: 0.2, alt: 1 },
]);
add('geneva', ['Geneva stripes I', 'Geneva stripes II'], [
  { n: 90, amp: 0.004, len: 0.9, ang: 0, ph: 0.2 }, { n: 140, amp: 0.003, len: 0.9, ang: 30, ph: 0.2 },
]);
add('ribbing', ['Ribbing'], [{ n: 200, amp: 0.0015, len: 1, ang: 0, ph: 0 }]);
add('wave', ['Wave I', 'Wave II', 'Wave III', 'Wave IV'], [
  { n: 46, amp: 0.018, len: 0.22, ang: 0, ph: 0.35 },
  { n: 60, amp: 0.03, len: 0.14, ang: 0, ph: 0.5, st: 1 },
  { n: 50, amp: 0.02, len: 0.2, ang: 35, ph: 0.4 },
  { n: 34, amp: 0.04, len: 0.5, ang: 90, ph: 0.25 },
]);
add('emboss', ['Embossed'], [{ n: 70, amp: 0, len: 1, ang: 0, ph: 0, th: 1 }]);
add('perlage', ['Perlage I', 'Perlage II', 'Perlage III'], [
  { s: 0.05, r: 0.62 }, { s: 0.035, r: 0.7, st: 1 }, { s: 0.08, r: 0.55 },
]);
add('snail', ['Snailing I', 'Snailing II', 'Snailing III'], [
  { n: 90, tw: 1.2 }, { n: 150, tw: 2.4 }, { n: 60, tw: 0.6 },
]);
add('snow', ['Snowfield I', 'Snowfield II', 'Snowfield III'], [
  { g: 0.012, dot: 0.9, f: 6 }, { g: 0.008, dot: 0.7, f: 10 }, { g: 0.018, dot: 1.1, f: 4 },
]);
add('bark', ['Bark I', 'Bark II', 'Bark III'], [
  { cs: 0.03, len: 1.6, gap: 0.5 }, { cs: 0.02, len: 1.8, gap: 0.4 }, { cs: 0.045, len: 1.4, gap: 0.7 },
]);

// ---- Plates 51 to 100 ----
add('rings', ['Rings XI', 'Rings XII', 'Rings XIII', 'Rings XIV', 'Rings XV', 'Rings XVI'], [
  { k: 8, k2: 15, a: 0.15, a2: 0.03, N: 160, e: 0.3, q: 1 },
  { k: 19, k2: 6, a: 0.07, a2: 0.05, N: 200, e: 0.15, q: 3, st: 1 },
  { k: 4, k2: 9, a: 0.2, a2: 0.05, N: 130, e: 0.1, q: 1 },
  { k: 12, k2: 20, a: 0.03, a2: 0.06, N: 215, e: 0.42, q: 1 },
  { k: 10, k2: 3, a: 0.16, a2: 0.04, N: 175, e: 0.26, q: 2 },
  { k: 21, k2: 17, a: 0.1, a2: 0.02, N: 205, e: 0.05, q: 2, st: 1 },
]);
add('rosette', ['Rosette V', 'Rosette VI'], [
  { k: 6, k2: 14, a: 0.2, a2: 0.06, N: 130, m: 1.4, smin: 0.2 },
  { k: 10, k2: 4, a: 0.12, a2: 0.04, N: 140, m: 0.6, smin: 0.35, st: 1 },
]);
add('tapisserie', ['Tapisserie IV', 'Tapisserie V', 'Tapisserie VI'], [
  { n: 34, rot: 0, t: 0.42 }, { n: 20, rot: 0, t: 0.62, st: 1 }, { n: 60, rot: 0, t: 0.5 },
]);
add('hobnail', ['Hobnail IV', 'Hobnail V', 'Hobnail VI'], [
  { n: 30, rot: 45, t: 0.4 }, { n: 50, rot: 45, t: 0.55 }, { n: 12, rot: 45, t: 0.5, st: 1 },
]);
add('barley', ['Barleycorn IV', 'Barleycorn V'], [{ g: 0.04, ang: 30 }, { g: 0.03, ang: 60 }]);
add('basket', ['Basket IV', 'Basket V'], [{ b: 0.06, m: 4 }, { b: 0.085, m: 7, st: 1 }]);
add('sun', ['Sunburst V', 'Sunburst VI'], [{ n: 240, r0: 0.06, alt: 1 }, { n: 900, r0: 0.02, alt: 0, st: 1 }]);
add('geneva', ['Geneva stripes III'], [{ n: 70, amp: 0.006, len: 0.7, ang: 60, ph: 0.15 }]);
add('wave', ['Wave V', 'Wave VI'], [
  { n: 40, amp: 0.012, len: 0.3, ang: 20, ph: 0.2 },
  { n: 70, amp: 0.022, len: 0.16, ang: -25, ph: 0.45, st: 1 },
]);
add('emboss', ['Embossed II'], [{ n: 50, amp: 0.002, len: 1, ang: 90, ph: 0, th: 1 }]);
add('conc', ['Concentric I', 'Concentric II', 'Concentric III', 'Concentric IV'], [
  { s: 0.006 }, { s: 0.01, off: 0.12, st: 1 }, { s: 0.016, off: -0.2 }, { s: 0.03, off: 0.3 },
]);
add('meteo', ['Meteorite I', 'Meteorite II', 'Meteorite III'], [
  { n: 900, j: 8, len: 0.35 }, { n: 1500, j: 12, len: 0.25, st: 1 }, { n: 600, j: 6, len: 0.55 },
]);
add('grid', ['Grid I', 'Grid II', 'Grid III', 'Grid IV'], [
  { t: 0.09, gap: 0.14, r: 0.28 }, { t: 0.06, gap: 0.12, r: 0.3, st: 1 }, { t: 0.14, gap: 0.16, r: 0.22 }, { t: 0.045, gap: 0.1, r: 0.4 },
]);
add('scales', ['Scales I', 'Scales II', 'Scales III'], [{ s: 0.05 }, { s: 0.035, st: 1 }, { s: 0.08 }]);
add('spiral', ['Spiral I', 'Spiral II', 'Spiral III'], [{ t: 40 }, { t: 70, st: 1 }, { t: 90, wob: 0.004, wk: 24 }]);
add('honey', ['Honeycomb I', 'Honeycomb II', 'Honeycomb III'], [
  { s: 0.04, inn: 0.6 }, { s: 0.028, inn: 0, st: 1 }, { s: 0.06, inn: 0.7 },
]);
add('satin', ['Satin I', 'Satin II', 'Satin III'], [
  { sp: 0.008, len: 0.22, ang: 0 }, { sp: 0.005, len: 0.3, ang: 90, st: 1 }, { sp: 0.012, len: 0.15, ang: 35 },
]);
add('grene', ['Grained I', 'Grained II', 'Grained III'], [
  { g: 0.01, dot: 0.8, u: 0.9 }, { g: 0.007, dot: 0.6, u: 0.94, st: 1 }, { g: 0.014, dot: 1, u: 0.85 },
]);

if (PLATES.length !== 100) {
  throw new Error(`Expected 100 plates, found ${PLATES.length}`);
}
