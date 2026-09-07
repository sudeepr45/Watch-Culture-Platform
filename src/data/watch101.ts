import type { Watch101Topic, TopicCategoryMeta, TopicCategory } from '../types/watch101'

export const TOPIC_CATEGORIES: TopicCategoryMeta[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    shortLabel: 'Foundations',
    description: 'The internal mechanics, physics, and power delivery that make horology tick.',
  },
  {
    id: 'complications',
    label: 'Complications',
    shortLabel: 'Complications',
    description: 'Any mechanical function on a watch beyond telling hours, minutes, and seconds.',
  },
  {
    id: 'materials',
    label: 'Materials & Construction',
    shortLabel: 'Materials',
    description: 'Crystals, metallurgy, water sealing, and the physical architecture of the case.',
  },
  {
    id: 'language',
    label: 'Watch Language',
    shortLabel: 'Language',
    description: 'The vocabulary, reference codes, standards, and collector vernacular.',
  },
]

export const WATCH_101_TOPICS: Watch101Topic[] = [
  // ==========================================
  // 1. FOUNDATIONS
  // ==========================================
  {
    id: 'f1',
    slug: 'automatic-vs-quartz',
    title: 'Automatic vs Quartz',
    category: 'foundations',
    shortDescription: 'Ticking crystal vs sweeping mechanical gears: understanding the fundamental split in timekeeping.',
    readTimeMinutes: 3,
    keywords: ['automatic', 'quartz', 'battery', 'mechanical', 'movement', 'seconds hand', 'sweep', 'accuracy'],
    tenSecondAnswer:
      'Quartz runs on a battery vibrating a synthetic quartz crystal 32,768 times per second (giving a 1-second tick). Automatic watches run on pure mechanical springs wound naturally by the motion of your wrist, producing a smooth sweeping seconds hand.',
    deeperExplanation: {
      lead: 'The divide between quartz and automatic is the defining technical distinction in modern watches.',
      paragraphs: [
        'A quartz watch uses a tiny battery to send an electrical current through a tuning-fork-shaped quartz crystal. This crystal oscillates at an ultra-precise frequency: exactly 32,768 times per second. An integrated circuit counts these pulses and steps a tiny electric motor once every second, which is why quartz seconds hands tick abruptly once per second.',
        'An automatic watch contains zero electrical components. Instead, it houses a coiled spring (the mainspring) inside a tiny barrel. A weighted metal rotor pivots freely on ball bearings with every movement of your arm, continuously winding the spring. As that spring unwinds, gears transfer energy through an escapement that releases power in rapid micro-pulses (typically 6 to 8 beats per second), creating the iconic smooth sweep.',
      ],
      keyTakeaways: [
        'Quartz is more accurate (losing/gaining ~15 seconds per month) and cheaper to maintain.',
        'Automatic has infinite lifespan with proper servicing, zero battery waste, and immense mechanical soul.',
        'Look at the seconds hand: ticking once per second means quartz; sweeping smoothly means mechanical.',
      ],
    },
    whyItMatters:
      'Choosing between quartz and automatic dictates how you live with the watch. If you want a grab-and-go tool that is always on time after sitting in a drawer for six months, buy quartz. If you appreciate miniature kinetic sculptures that come alive only when you wear them, buy mechanical.',
    interactiveType: 'automatic-vs-quartz',
    watchSlugs: ['seiko-5-sports-srpd55', 'casio-g-shock-ga-2100-1a1', 'cartier-tank-must-wsta0041'],
    relatedTopicSlugs: ['mechanical-watches', 'power-reserve', 'frequency-beat-rate', 'rotor'],
    battleSuggestion: {
      watch1Slug: 'seiko-5-sports-srpd55',
      watch2Slug: 'casio-g-shock-ga-2100-1a1',
      label: 'Everyday Automatic vs Cult Digital/Analog Quartz',
      prompt: 'Compare an accessible automatic mechanical workhorse against the world\'s most resilient carbon quartz piece.',
    },
  },
  {
    id: 'f2',
    slug: 'mechanical-watches',
    title: 'Mechanical Watches',
    category: 'foundations',
    shortDescription: 'How hundreds of tiny gears, springs, and levers measure the passage of time without a single battery.',
    readTimeMinutes: 3,
    keywords: ['mechanical', 'manual wind', 'hand wound', 'geartrain', 'mainspring', 'balance wheel', 'craftsmanship'],
    tenSecondAnswer:
      'A mechanical watch uses purely physical components—springs, gears, wheels, and jewels—to store and regulate energy. They come in two varieties: manual-wind (you turn the crown by hand) and automatic (your wrist movement winds it).',
    deeperExplanation: {
      lead: 'Mechanical watches represent centuries of micro-engineering miniaturized onto a wrist.',
      paragraphs: [
        'Every mechanical watch operates on a straightforward chain of physics: Energy Source (the coiled mainspring), Transmission (the wheel train multiplying rotations), Regulation (the escapement and balance wheel governing speed), and Display (the dial and hands showing time).',
        'Manual-wind watches lack the weighted rotor found in automatics. Because there is no oscillating weight blocking the view or adding thickness, manual-wind watches are often slimmer, lighter, and offer an unobstructed view through sapphire exhibition casebacks. They also require an intimate ritual: turning the crown every 1 to 3 days to replenish the mainspring.',
      ],
      keyTakeaways: [
        'No batteries, no circuit boards, no planned obsolescence.',
        'Manual-wind watches require deliberate winding; automatics wind themselves through wrist inertia.',
        'A well-engineered mechanical calibre can outlive its owner when serviced every 5 to 10 years.',
      ],
    },
    whyItMatters:
      'Understanding mechanical horology shifts watches from being utilitarian time-tellers into wearable kinetic art. When you wind a manual watch like the Hamilton Khaki or Omega Speedmaster, you are personally powering a physical machine that has zero digital dependencies.',
    watchSlugs: ['hamilton-khaki-field-mechanical-h69439931', 'tudor-black-bay-58-m79030n-0001', 'omega-speedmaster-professional-moonwatch-31030425001002'],
    relatedTopicSlugs: ['automatic-vs-quartz', 'what-is-a-calibre', 'power-reserve', 'what-is-an-escapement'],
    battleSuggestion: {
      watch1Slug: 'hamilton-khaki-field-mechanical-h69439931',
      watch2Slug: 'tudor-black-bay-58-m79030n-0001',
      label: 'Manual-Wind Military Field vs Automatic Luxury Diver',
      prompt: 'Put pure hand-wound field heritage up against a certified chronometer automatic dive watch.',
    },
  },
  {
    id: 'f3',
    slug: 'what-is-a-calibre',
    title: 'What Is a Calibre?',
    category: 'foundations',
    shortDescription: 'The engine inside the chassis: understanding movement designations, architecture, and provenance.',
    readTimeMinutes: 3,
    keywords: ['calibre', 'caliber', 'movement', 'in-house', 'ETA', 'Sellita', 'manufacture'],
    tenSecondAnswer:
      '"Calibre" (or caliber) is the watchmaker term for a specific movement model. Just as a Porsche 911 has a specific engine code, a Rolex Submariner contains Calibre 3235, and an Omega Speedmaster contains Calibre 3861.',
    deeperExplanation: {
      lead: 'In horology, the calibre is the identity of the internal engine.',
      paragraphs: [
        'Historically derived from the French word for diameter or template, "calibre" originally described the size and layout of a watch movement’s plates and bridges. Today, it designates the specific movement model, detailing its architecture, beat rate, jewel count, and complications.',
        'The watch community frequently debates "in-house" calibres (designed, fabricated, and assembled entirely by the brand, such as Tudor\'s MT5402 or Rolex\'s 3235) versus "sourced" calibres (proven movements from specialized manufacturers like ETA, Sellita, or Miyota). In-house calibres offer exclusivity and custom engineering, while sourced calibres offer reliable serviceability and accessible parts worldwide.',
      ],
      keyTakeaways: [
        'Calibre refers exclusively to the internal movement, not the watch case or dial.',
        'Calibre names often reveal history (e.g. Omega Calibre 3861 traces its lineage back to the Moonwatch Calibre 321 from 1957).',
        'In-house is not automatically superior to sourced—what matters is precision, finishing, and engineering durability.',
      ],
    },
    whyItMatters:
      'Two watches from different brands with wildly different price tags might actually share the exact same underlying movement calibre. Knowing what calibre is inside a watch prevents you from overpaying for mere branding.',
    watchSlugs: ['rolex-submariner-date-126610ln', 'omega-speedmaster-professional-moonwatch-31030425001002', 'tudor-black-bay-58-m79030n-0001'],
    relatedTopicSlugs: ['mechanical-watches', 'what-is-an-escapement', 'accuracy', 'frequency-beat-rate'],
  },
  {
    id: 'f4',
    slug: 'power-reserve',
    title: 'Power Reserve',
    category: 'foundations',
    shortDescription: 'How long a mechanical watch keeps running when you take it off your wrist.',
    readTimeMinutes: 2,
    keywords: ['power reserve', 'hours', 'mainspring', 'barrel', 'weekend proof', 'indicator'],
    tenSecondAnswer:
      'Power reserve is the number of hours a mechanical watch will continue running after being fully wound. Standard watches run for ~38 to 42 hours; modern "weekend-proof" movements run for 70 to 80+ hours.',
    deeperExplanation: {
      lead: 'Power reserve measures the energy storage capacity of your watch’s mainspring barrel.',
      paragraphs: [
        'When you wind a watch or walk around wearing it, the mainspring coils tightly inside a cylindrical gear called the mainspring barrel. The power reserve is simply how long that spring takes to unwind completely until the balance wheel stops oscillating.',
        'The modern gold standard is the "weekend-proof" movement (~70 to 80 hours). This allows you to take your watch off on Friday evening at 6:00 PM, leave it on your nightstand, and put it back on Monday morning at 7:00 AM without having to reset the time or wind it.',
      ],
      keyTakeaways: [
        'Standard vintage & entry movements: ~38 to 42 hours.',
        'Modern luxury & weekend-proof movements: 70 to 80 hours (e.g. Tissot Powermatic 80, Tudor MT5402, Rolex 3235).',
        'Some watches feature a physical gauge on the dial called a Power Reserve Indicator showing remaining fuel.',
      ],
    },
    whyItMatters:
      'If you rotate between multiple watches throughout the week, a 70+ hour power reserve eliminates the annoyance of resetting the time and date every time you pick up a piece you haven\'t worn for two days.',
    interactiveType: 'power-reserve',
    watchSlugs: ['tissot-prx-powermatic-80-t1374071104100', 'hamilton-khaki-field-mechanical-h69439931', 'grand-seiko-snowflake-sbga211'],
    relatedTopicSlugs: ['mechanical-watches', 'automatic-vs-quartz', 'winding'],
  },
  {
    id: 'f5',
    slug: 'what-is-an-escapement',
    title: 'What Is an Escapement?',
    category: 'foundations',
    shortDescription: 'The mechanical brain that meters out energy fractions of a second at a time—creating the tick.',
    readTimeMinutes: 3,
    keywords: ['escapement', 'balance wheel', 'pallet fork', 'co-axial', 'tick tock', 'regulation', 'hairspring'],
    tenSecondAnswer:
      'The escapement is the braking mechanism of a watch. Without it, the wound spring would violently unwind in two seconds. The escapement lets energy escape in tiny, controlled bursts, creating the signature "tick-tock" sound.',
    deeperExplanation: {
      lead: 'The escapement solves the central challenge of horology: converting raw continuous tension into precise, measured intervals of time.',
      paragraphs: [
        'An escapement consists of an escape wheel with tooth-shaped spokes and an oscillating pallet fork with two synthetic ruby jewels. As the balance wheel swings back and forth like a miniature pendulum, it flicks the pallet fork, locking and unlocking the escape wheel one tooth at a time.',
        'Every time a tooth slips past the pallet jewel, it gives a tiny impulse back to the balance wheel to keep it swinging, while simultaneously producing that audible "tick." The standard design since the 1700s is the Swiss Lever Escapement. In 1999, Omega industrialized George Daniels’ revolutionary Co-Axial Escapement, which uses radial friction instead of sliding friction, drastically reducing wear and extending service intervals.',
      ],
      keyTakeaways: [
        'The escapement converts raw unwinding power into regulated beats.',
        'The "tick-tock" sound is the metal escape wheel teeth striking the ruby pallet stones.',
        'Escapement efficiency directly influences accuracy, power reserve, and service intervals.',
      ],
    },
    whyItMatters:
      'The escapement is the beating heart of horology. Understanding how the balance wheel and escapement interact helps you appreciate why mechanical watches are susceptible to magnetism, shocks, and position changes.',
    watchSlugs: ['omega-speedmaster-professional-moonwatch-31030425001002', 'rolex-submariner-date-126610ln'],
    relatedTopicSlugs: ['mechanical-watches', 'frequency-beat-rate', 'watch-jewels', 'accuracy'],
  },
  {
    id: 'f6',
    slug: 'watch-jewels',
    title: 'Watch Jewels',
    category: 'foundations',
    shortDescription: 'Why movements have synthetic rubies inside—and why it has nothing to do with flashy jewelry.',
    readTimeMinutes: 2,
    keywords: ['jewels', 'synthetic sapphire', 'ruby', 'friction', 'bearings', 'durability', 'pivot'],
    tenSecondAnswer:
      'Watch jewels are not decorative gems. They are precision-machined synthetic sapphires and rubies used as low-friction, wear-resistant bearings for spinning gear pivots. They stop metal gears from grinding themselves to dust.',
    deeperExplanation: {
      lead: 'In a mechanical movement, metal pivots spin millions of times each year. If steel pivoted inside brass plates, friction would destroy the watch.',
      paragraphs: [
        'Synthetic corundum (man-made sapphire and ruby) has a hardness rating of 9 on the Mohs scale—second only to diamond. By polishing tiny donut-shaped jewel holes and seating steel gear axles inside them, friction is reduced to near zero, and microscopic capillary action holds lubricating oil in place.',
        'Most standard time-only mechanical calibres feature 17 to 23 jewels (one for every high-friction pivot point, the pallet fork, and the impulse roller). While vintage marketing once boasted "More Jewels = More Luxury," modern movements use exactly the number of jewels required by their mechanical architecture.',
      ],
      keyTakeaways: [
        'Watch jewels are synthetic corundum (aluminum oxide), not mined natural gems.',
        'They function as slick bearings to eliminate metal-on-metal friction and wear.',
        'A standard time-and-date movement typically requires around 21 to 25 jewels.',
      ],
    },
    whyItMatters:
      'When you see "24 JEWELS" engraved on the rotor of an accessible Seiko 5 Sports or "32 JEWELS" on an Audemars Piguet, you know it signifies friction-reducing mechanical engineering, not decorative bling.',
    watchSlugs: ['seiko-5-sports-srpd55', 'audemars-piguet-royal-oak-jumbo-16202st-oo-1240st-01'],
    relatedTopicSlugs: ['what-is-an-escapement', 'mechanical-watches', 'what-is-a-calibre'],
  },

  // ==========================================
  // 2. COMPLICATIONS
  // ==========================================
  {
    id: 'c1',
    slug: 'chronograph',
    title: 'Chronograph',
    category: 'complications',
    shortDescription: 'The mechanical stopwatch: two pushers, multiple sub-dials, and race-track timing precision.',
    readTimeMinutes: 3,
    keywords: ['chronograph', 'stopwatch', 'pushers', 'sub-dials', 'tachymeter', 'flyback', 'split-seconds'],
    tenSecondAnswer:
      'A chronograph is a watch with a built-in stopwatch. Controlled by buttons ("pushers") on the side of the case, it uses sub-dials to measure elapsed seconds, minutes, and hours independently from regular timekeeping.',
    deeperExplanation: {
      lead: 'The chronograph is the quintessential sports complication, born from motorsport, aviation, and spaceflight.',
      paragraphs: [
        'The key to understanding a chronograph is the central seconds hand. In normal timekeeping, this large hand stays frozen at 12 o\'clock. When you press the top pusher at 2 o\'clock, that central hand springs to life, timing elapsed seconds with high precision. Sub-dials count elapsed minutes (usually up to 30 or 60) and elapsed hours (up to 12).',
        'Pressing the top pusher again stops the timer so you can read the recorded elapsed time. Pressing the bottom pusher at 4 o\'clock instantly resets all hands back to zero. Many chronographs also feature a Tachymeter scale on the outer bezel to calculate speed over a measured mile or kilometer.',
      ],
      keyTakeaways: [
        'Top pusher = Start & Stop. Bottom pusher = Reset.',
        'The large central hand is the stopwatch hand; running seconds live in a small sub-dial.',
        'Famous examples include the Omega Speedmaster (NASA Apollo missions) and Rolex Daytona.',
      ],
    },
    whyItMatters:
      'Chronographs have more moving parts than almost any other standard complication. When shopping, note that servicing a chronograph is more complex and expensive than a time-only watch, but the interactive tactile pleasure of clicking mechanical pushers is unmatched.',
    interactiveType: 'chronograph',
    watchSlugs: ['omega-speedmaster-professional-moonwatch-31030425001002'],
    relatedTopicSlugs: ['gmt', 'complication', 'what-is-a-calibre'],
  },
  {
    id: 'c2',
    slug: 'gmt',
    title: 'GMT',
    category: 'complications',
    shortDescription: 'Track two time zones simultaneously with an additional 24-hour hand and a two-tone bezel.',
    readTimeMinutes: 3,
    keywords: ['gmt', 'dual time', 'greenwich mean time', '24-hour', 'pepsi bezel', 'traveler', 'pilot watch'],
    tenSecondAnswer:
      'A GMT watch tracks two time zones at the same time. In addition to normal 12-hour hands, it features a fourth hand that circles the dial once every 24 hours, pointing to an outer 24-hour bezel to tell home or UTC time.',
    deeperExplanation: {
      lead: 'Created during the dawn of the jet age in the 1950s, GMT watches solved jet lag for commercial pilots.',
      paragraphs: [
        'When Pan American World Airways began long-haul transatlantic flights in 1954, pilots crossed multiple time zones rapidly. Rolex engineered the GMT-Master (named after Greenwich Mean Time, the international civil time standard). It used a distinctively colored fourth hand that rotates half as fast as the hour hand, reading against a 24-hour bezel.',
        'The bezel is often split into two distinct colors (such as red and blue, famously dubbed the "Pepsi") to distinguish daytime hours (6:00 to 18:00) from nighttime hours (18:00 to 6:00) at a single glance. By simply rotating the bezel, travelers can even calculate a third time zone on the fly.',
      ],
      keyTakeaways: [
        'Normal hour hand = Local time (where you are).',
        '24-hour GMT hand = Home time (or UTC reference time).',
        'Two-tone bezel halves visually distinguish day from night.',
      ],
    },
    whyItMatters:
      'GMT is widely considered the single most practical complication for modern life. If you travel across time zones or work with colleagues on the other side of the globe, a GMT lets you track their time without touching your phone.',
    interactiveType: 'gmt',
    watchSlugs: ['rolex-gmt-master-ii-126710blro-pepsi'],
    relatedTopicSlugs: ['chronograph', 'complication', 'bezel'],
  },
  {
    id: 'c3',
    slug: 'moonphase',
    title: 'Moonphase',
    category: 'complications',
    shortDescription: 'Tracking the 29.5-day lunar cycle: the most poetic and visually arresting watch complication.',
    readTimeMinutes: 2,
    keywords: ['moonphase', 'lunar cycle', 'waxing', 'waning', 'dress watch', 'astronomy', 'poetic'],
    tenSecondAnswer:
      'A moonphase complication shows the current phase of the moon as seen from Earth—from new moon to full moon—using a rotating disc decorated with golden moons and stars behind a crescent aperture.',
    deeperExplanation: {
      lead: 'Long before mechanical clocks existed, humanity tracked time by observing the cycles of the moon.',
      paragraphs: [
        'A synodic lunar month lasts approximately 29.53 days. A mechanical moonphase watch achieves this by driving a 59-tooth gear that carries two identical painted moons. The disc rotates once every 59 days (two complete 29.5-day cycles), revealing the moon waxing and waning behind the double-curved edge of the dial window.',
        'While modern wristwatches no longer serve as essential tide-predicting or night-navigation tools for sailors, the moonphase remains celebrated as one of the most romantic, artistic, and aesthetically enchanting complications in high watchmaking.',
      ],
      keyTakeaways: [
        'A complete lunar cycle is 29.5 days.',
        'A standard moonphase uses a 59-tooth gear advancing once per day.',
        'High-end astronomical moonphases can remain accurate without correction for over 100 years.',
      ],
    },
    whyItMatters:
      'The moonphase adds celestial warmth and classical pedigree to a dial. If you appreciate traditional watchmaking aesthetics over pure utilitarian tool features, a moonphase dress watch is an iconic choice.',
    watchSlugs: ['jaeger-lecoultre-reverso-classic-monoface-q2618430'],
    relatedTopicSlugs: ['chronograph', 'gmt', 'complication'],
  },
  {
    id: 'c4',
    slug: 'tourbillon',
    title: 'Tourbillon',
    category: 'complications',
    shortDescription: 'A rotating cage designed to defy gravity: the ultimate badge of haute horlogerie craftsmanship.',
    readTimeMinutes: 3,
    keywords: ['tourbillon', 'breguet', 'gravity', 'escapement', 'cage', 'haute horlogerie', 'prestige'],
    tenSecondAnswer:
      'Invented in 1801 by Abraham-Louis Breguet, a tourbillon mounts the escapement and balance wheel inside a continuously rotating cage (usually 1 revolution per minute) to average out the positional errors caused by Earth\'s gravity.',
    deeperExplanation: {
      lead: 'The tourbillon is French for "whirlwind," named for the hypnotic spinning motion of its miniature cage.',
      paragraphs: [
        'In the 18th and 19th centuries, pocket watches sat upright inside waistcoat pockets all day. Because gravity pulled on the delicate hairspring in one constant downward direction, it caused the watch to gain or lose time depending on its vertical orientation.',
        'Breguet’s ingenious solution was to place the entire escapement, balance wheel, and hairspring inside a lightweight titanium or steel cage that rotates 360 degrees constantly. While modern wristwatches move with your arm and do not suffer from stationary gravity errors, the tourbillon remains the pinnacle demonstration of a watchmaker\'s artisanal skill.',
      ],
      keyTakeaways: [
        'Invented by Abraham-Louis Breguet in 1801 for vertical pocket watches.',
        'The cage typically rotates once every 60 seconds, functioning as a running seconds display.',
        'Constructing a tourbillon cage weighing less than 0.3 grams requires master-level watchmaker finishing.',
      ],
    },
    whyItMatters:
      'A tourbillon serves little practical accuracy benefit on a modern wrist, but it serves immense artistic value. Seeing a spinning tourbillon exposed through a dial cutout reveals the raw kinetic theater of high horology.',
    watchSlugs: ['audemars-piguet-royal-oak-jumbo-16202st-oo-1240st-01'],
    relatedTopicSlugs: ['what-is-an-escapement', 'accuracy', 'complication'],
  },

  // ==========================================
  // 3. MATERIALS & CONSTRUCTION
  // ==========================================
  {
    id: 'm1',
    slug: 'sapphire-crystal',
    title: 'Sapphire Crystal',
    category: 'materials',
    shortDescription: 'The nearly scratchproof glass standard of modern luxury horology.',
    readTimeMinutes: 2,
    keywords: ['sapphire', 'crystal', 'glass', 'mohs scale', 'scratchproof', 'anti-reflective', 'ar coating'],
    tenSecondAnswer:
      'Sapphire crystal is not standard glass—it is synthetic sapphire created by crystallizing aluminum oxide at over 2,000°C. Measuring 9 out of 10 on the Mohs hardness scale, only diamond or silicon carbide can scratch it.',
    deeperExplanation: {
      lead: 'Sapphire crystal is the gold standard for watch dials because everyday keys, coins, and bricks cannot scratch it.',
      paragraphs: [
        'Prior to the widespread adoption of synthetic sapphire in the 1970s and 80s, watches used acrylic plastic (Hesalite) or hardened mineral glass. While plastic scratches easily and mineral glass picks up hairline abrasions over time, sapphire crystal looks brand new even after decades of daily wear.',
        'Because pure sapphire is highly reflective, quality watchmakers apply microscopic anti-reflective (AR) coatings to the underside (or both sides) of the crystal. This eliminates glare and makes the crystal seem virtually invisible, allowing the dial details to pop.',
      ],
      keyTakeaways: [
        'Mohs Hardness: Diamond = 10, Sapphire = 9, Hardened Mineral = 6.5, Acrylic = 3.',
        'Virtually impervious to everyday scratches from keys, walls, and desk corners.',
        'Can shatter under extreme direct high-impact force due to its rigid crystalline structure.',
      ],
    },
    whyItMatters:
      'If you plan to wear a watch every day, insist on sapphire crystal whenever possible. It preserves clarity and resale value better than any other dial covering.',
    watchSlugs: ['tudor-black-bay-58-m79030n-0001', 'rolex-submariner-date-126610ln', 'tissot-prx-powermatic-80-t1374071104100'],
    relatedTopicSlugs: ['mineral-crystal', 'water-resistance', 'case-materials'],
  },
  {
    id: 'm2',
    slug: 'mineral-crystal',
    title: 'Mineral Crystal',
    category: 'materials',
    shortDescription: 'Hardened glass crystals: balancing affordability and impact resistance.',
    readTimeMinutes: 2,
    keywords: ['mineral crystal', 'hardlex', 'glass', 'impact', 'shatter', 'scratch', 'mohs scale'],
    tenSecondAnswer:
      'Mineral crystal is heat- or chemically-tempered glass. It is much more scratch-resistant than vintage acrylic plastic, and less prone to shattering upon catastrophic impact than ultra-hard sapphire.',
    deeperExplanation: {
      lead: 'Mineral crystal is the practical glass workhorse found across accessible tool watches and adventure timepieces.',
      paragraphs: [
        'On the Mohs mineral hardness scale, mineral crystal rates around 6 to 6.5. This means that while keys or doorframes might occasionally leave hairline scratches, it has greater elasticity and tensile flex than sapphire. When subjected to violent shock (like dropping a watch onto concrete), mineral crystal is more likely to chip or crack rather than pulverize into dangerous microscopic shards.',
        'Seiko’s proprietary mineral crystal is called "Hardlex," which undergoes specialized chemical treatment to maximize hardness while preserving shock elasticity. You will find mineral glass across rugged classics like the Casio G-Shock and entry-level automatic dive watches.',
      ],
      keyTakeaways: [
        'Rates ~6.5 on Mohs scale: more scratch-resistant than plastic, less than sapphire.',
        'More shatter-resistant than sapphire under catastrophic impact.',
        'Significantly more affordable to produce and replace during routine servicing.',
      ],
    },
    whyItMatters:
      'For extreme shock-proof sports watches like G-Shocks or entry automatics under $300, mineral crystal provides excellent utility without driving up replacement costs.',
    watchSlugs: ['seiko-5-sports-srpd55', 'casio-g-shock-ga-2100-1a1'],
    relatedTopicSlugs: ['sapphire-crystal', 'case-materials', 'water-resistance'],
  },
  {
    id: 'm3',
    slug: 'water-resistance',
    title: 'Water Resistance',
    category: 'materials',
    shortDescription: 'The biggest lie in horology: why "30 Meters" doesn\'t mean you can dive 30 meters.',
    readTimeMinutes: 3,
    keywords: ['water resistance', 'atm', 'bar', 'meters', 'screw-down crown', 'gaskets', 'diving', 'submariner'],
    tenSecondAnswer:
      'Water resistance ratings are measured in static laboratory conditions. A "30m" watch can only handle minor splashes—swimming requires at least 100m, and true scuba diving requires 200m or 300m with a screw-down crown.',
    deeperExplanation: {
      lead: 'Water resistance numbers are pressure ratings, not swimming depth guarantees.',
      paragraphs: [
        'When a watch manufacturer states "30 Meters" (or 3 ATM / 3 BAR), that test was conducted on a motionless watch in still water. Moving your arm in a pool, diving into water, or turning on a high-pressure shower creates dynamic pressure that far exceeds static ratings.',
        'Waterproofing depends on synthetic rubber O-rings (gaskets) around the caseback, crystal, and crown. For serious aquatic durability (100m to 300m+), watches feature a screw-down crown that threads tightly against the case, compressing internal gaskets to form a hermetic vault.',
      ],
      keyTakeaways: [
        '30m (3 ATM): Rain and hand washing only. Do NOT submerge or shower.',
        '50m (5 ATM): Light surface swimming. No jumping or water sports.',
        '100m (10 ATM): Safe for recreational pool swimming and snorkeling.',
        '200m–300m+: Full scuba diving, certified ISO 6425 dive ratings, screw-down crown mandatory.',
      ],
    },
    whyItMatters:
      'Accidentally ruining a luxury watch by wearing a 30m dress watch into a hot tub or swimming pool is the most common beginner tragedy. Learn your watch\'s rating before stepping near water.',
    interactiveType: 'water-resistance',
    watchSlugs: ['rolex-submariner-date-126610ln', 'tudor-black-bay-58-m79030n-0001', 'cartier-tank-must-wsta0041'],
    relatedTopicSlugs: ['crown', 'sapphire-crystal', 'case-materials'],
    battleSuggestion: {
      watch1Slug: 'rolex-submariner-date-126610ln',
      watch2Slug: 'cartier-tank-must-wsta0041',
      label: '300m Subsea Vault vs 30m Parisian Dress Watch',
      prompt: 'Compare the ultimate 300-meter deep-sea tool against a pure 30-meter high-society design icon.',
    },
  },
  {
    id: 'm4',
    slug: 'case-materials',
    title: 'Case Materials',
    category: 'materials',
    shortDescription: 'Stainless steel, titanium, carbon, and gold: how metals define weight, shine, and durability.',
    readTimeMinutes: 3,
    keywords: ['case materials', '316l', '904l oystersteel', 'titanium', 'carbon core', 'gold', 'durability'],
    tenSecondAnswer:
      'The case houses and protects the movement. The vast majority of watches use 316L stainless steel, but options range from lightweight titanium and carbon resin to luxury precious metals like gold and platinum.',
    deeperExplanation: {
      lead: 'Case materials dictate how a watch feels on the skin, how it ages, and how much abuse it can withstand.',
      paragraphs: [
        '316L Stainless Steel is the undisputed industry benchmark: corrosion-resistant, easily brushed or polished, and durable. Rolex exclusively uses 904L steel (branded "Oystersteel"), an alloy richer in chromium, molybdenum, and nickel that resists harsh acids and takes an exceptionally bright polish.',
        'Titanium is roughly 40% lighter than steel and completely hypoallergenic. Brands like Grand Seiko use proprietary High-Intensity Titanium, which accepts mirror-like Zaratsu polishing while remaining featherlight. Carbon fiber and resin (championed by Casio\'s Carbon Core Guard) offer maximum shock absorption at ultra-low weight.',
      ],
      keyTakeaways: [
        '316L Steel: Industry standard, balanced weight, easy to service and polish.',
        '904L Steel (Rolex): Increased chemical/corrosion resistance and brilliant luster.',
        'Titanium: 40% lighter than steel, warm to the touch, hypoallergenic.',
        'Precious Metals: 18K Gold and 950 Platinum offer immense heft and timeless prestige.',
      ],
    },
    whyItMatters:
      'Case material directly influences everyday comfort. A heavy steel watch feels reassuring to some but tiring to others; titanium disappears on the wrist; carbon handles pure impact.',
    watchSlugs: ['grand-seiko-snowflake-sbga211', 'rolex-submariner-date-126610ln', 'casio-g-shock-ga-2100-1a1'],
    relatedTopicSlugs: ['case-size', 'lug-to-lug', 'sapphire-crystal'],
  },
  {
    id: 'm5',
    slug: 'case-size',
    title: 'Case Size',
    category: 'materials',
    shortDescription: 'Case diameter in millimeters: finding the sweet spot for your wrist circumference.',
    readTimeMinutes: 2,
    keywords: ['case size', 'diameter', 'millimeters', 'wrist size', 'proportions', 'fit'],
    tenSecondAnswer:
      'Case size is measured as the outer diameter of the case in millimeters (excluding the crown). Most modern men\'s watches measure between 36mm and 42mm, with 38mm to 40mm considered the universal modern sweet spot.',
    deeperExplanation: {
      lead: 'Understanding case diameter helps you judge whether a watch will look elegant, balanced, or cartoonishly oversized on your wrist.',
      paragraphs: [
        'Case diameter is measured with calipers from the 9 o\'clock edge to the 3 o\'clock edge, strictly excluding the winding crown. In the mid-20th century, men wore 32mm to 36mm watches. The 2000s saw an oversized watch boom pushing cases to 44mm–48mm. Today, horology has returned to balanced classic proportions.',
        'Wrist size is usually measured in inches or centimeters (e.g. 6.5 inches / 16.5 cm). Those with smaller wrists (~6.0"–6.75") typically look best in 36mm–39mm cases, while larger wrists (7.0"+) comfortably carry 41mm–44mm pieces.',
      ],
      keyTakeaways: [
        '34mm–36mm: Classic vintage proportion, perfect for dress watches.',
        '38mm–40mm: The golden modern sweet spot for everyday versatility.',
        '41mm–44mm: Bold sports watches, divers, and chronographs.',
        'Always consider bezel width: a watch with a thin bezel looks visually larger than a diver with a thick bezel of the same diameter.',
      ],
    },
    whyItMatters:
      'Never buy a watch based on diameter alone without checking lug-to-lug distance. A 42mm watch with short curved lugs can wear smaller than a 39mm watch with long flat lugs.',
    interactiveType: 'case-size',
    watchSlugs: ['hamilton-khaki-field-mechanical-h69439931', 'tudor-black-bay-58-m79030n-0001', 'rolex-submariner-date-126610ln'],
    relatedTopicSlugs: ['lug-to-lug', 'case-materials'],
  },
  {
    id: 'm6',
    slug: 'lug-to-lug',
    title: 'Lug-to-Lug',
    category: 'materials',
    shortDescription: 'The secret measurement that actually determines whether a watch fits your wrist without overhang.',
    readTimeMinutes: 2,
    keywords: ['lug to lug', 'wrist fit', 'overhang', 'lugs', 'case geometry', 'dimensions'],
    tenSecondAnswer:
      'Lug-to-lug is the vertical span of the watch from the very tip of the top strap attachment horns to the tip of the bottom horns. If this distance exceeds the flat width of your wrist, the watch will overhang and fit poorly.',
    deeperExplanation: {
      lead: 'Experienced watch collectors care far more about lug-to-lug than case diameter.',
      paragraphs: [
        'The lugs are the metal horns projecting from the watch case that hold the strap or bracelet pins. While case diameter only measures horizontal width, lug-to-lug measures how the watch sits across the top of your wrist from edge to edge.',
        'If a watch has a 40mm diameter but an aggressive 50mm lug-to-lug with straight, un-curved horns, the lugs will poke out into empty air over the sides of your wrist ("lug overhang"). A well-designed watch uses compact, downward-curving lugs that hug the wrist naturally.',
      ],
      keyTakeaways: [
        'Lug-to-lug determines true wrist fit, not case diameter.',
        'Measure the flat top of your wrist: your lug-to-lug should always be smaller than that measurement.',
        'Curved, downturned lugs drape comfortably and visually reduce perceived size.',
      ],
    },
    whyItMatters:
      'If you\'ve ever tried on a 38mm watch that felt uncomfortably large (like the Hamilton Khaki with its long 47mm lugs) or a 42mm diver that felt surprisingly compact (like the Seiko SKX/SRPD), lug-to-lug was the secret reason why.',
    watchSlugs: ['hamilton-khaki-field-mechanical-h69439931', 'tissot-prx-powermatic-80-t1374071104100'],
    relatedTopicSlugs: ['case-size', 'case-materials'],
  },

  // ==========================================
  // 4. WATCH LANGUAGE
  // ==========================================
  {
    id: 'l1',
    slug: 'reference-number',
    title: 'Reference Number',
    category: 'language',
    shortDescription: 'The serial code of the horological world: how collectors talk in numbers.',
    readTimeMinutes: 2,
    keywords: ['reference number', 'ref', 'model code', 'submariner 126610ln', 'speedmaster', 'collector'],
    tenSecondAnswer:
      'A reference number ("Ref.") is the manufacturer\'s alphanumeric model identifier. Instead of saying "black ceramic Submariner Date," collectors say "126610LN." It specifies the exact case metal, bezel, dial, and generation.',
    deeperExplanation: {
      lead: 'In watch culture, reference numbers are the lingua franca of enthusiasts and auction houses.',
      paragraphs: [
        'Because iconic models like the Rolex Submariner or Omega Speedmaster have existed for over 60 years across dozens of iterations, generic names are too vague. A reference number acts like a vehicle identification code.',
        'For example, in the Rolex Ref. 126610LN: "1266" denotes the modern 41mm case generation with Calibre 3235, the penultimate digit "1" indicates stainless steel, and "LN" stands for *Lunette Noire* (French for Black Bezel). Learning reference numbers unlocks deeper research and collector precision.',
      ],
      keyTakeaways: [
        'Reference numbers specify the exact variant, year era, and material composition.',
        'Usually stamped between the lugs, on the caseback, or inside warranty papers.',
        'Used universally on secondary marketplaces to ensure you are buying the exact intended generation.',
      ],
    },
    whyItMatters:
      'A single digit difference in a reference number can represent thousands of dollars in value or completely different movement generations.',
    watchSlugs: ['rolex-submariner-date-126610ln', 'omega-speedmaster-professional-moonwatch-31030425001002'],
    relatedTopicSlugs: ['what-is-a-calibre', 'accuracy', 'complication'],
  },
  {
    id: 'l2',
    slug: 'accuracy',
    title: 'Accuracy & Chronometer Standards',
    category: 'language',
    shortDescription: 'Seconds gained or lost per day: COSC, METAS, and what chronometer certification really means.',
    readTimeMinutes: 3,
    keywords: ['accuracy', 'chronometer', 'cosc', 'metas', 'seconds per day', 'precision', 'superlative'],
    tenSecondAnswer:
      'Mechanical accuracy is measured in seconds per day (e.g. +4/-2s/day). A "Chronometer" is an officially certified movement tested by an independent laboratory (like Switzerland\'s COSC) to guarantee high precision across varying temperatures and positions.',
    deeperExplanation: {
      lead: 'Even the most expensive mechanical watches in the world are less accurate than a $20 quartz watch.',
      paragraphs: [
        'A mechanical movement containing over 150 moving parts oscillates hundreds of thousands of times every day. Tiny variations in temperature, gravity, and lubrication cause microscopic rate deviations, expressed as "+/- seconds per day."',
        'COSC (Contrôle Officiel Suisse des Chronomètres) is the official Swiss test facility. For 15 days, uncased movements are tested in 5 different positions and 3 different temperatures. Only movements that keep time between -4 and +6 seconds per day earn the title "Certified Chronometer." Advanced brands test even further: Rolex tests cased watches to -2/+2s/day, and METAS tests Omega to 0/+5s/day with 15,000 Gauss magnetic resistance.',
      ],
      keyTakeaways: [
        'Standard mechanical: -10 to +20 seconds per day.',
        'COSC Chronometer: -4 to +6 seconds per day.',
        'Superlative / Master Chronometer: -2/+2s or 0/+5s per day with extreme anti-magnetism.',
      ],
    },
    whyItMatters:
      'If you expect your mechanical watch to match the atomic clock on your smartphone to the exact second every month, you will be disappointed. Appreciating mechanical watches means accepting that +3 seconds per day represents 99.996% mathematical precision.',
    watchSlugs: ['tudor-black-bay-58-m79030n-0001', 'grand-seiko-snowflake-sbga211'],
    relatedTopicSlugs: ['frequency-beat-rate', 'what-is-an-escapement', 'automatic-vs-quartz'],
  },
  {
    id: 'l3',
    slug: 'frequency-beat-rate',
    title: 'Frequency / Beat Rate',
    category: 'language',
    shortDescription: 'Vibrations per hour (VPH): how balance wheel oscillations create a buttery-smooth second sweep.',
    readTimeMinutes: 2,
    keywords: ['frequency', 'beat rate', 'vph', 'hertz', 'smooth sweep', 'balance wheel', 'hi-beat'],
    tenSecondAnswer:
      'Beat rate measures how fast the balance wheel oscillates, measured in Vibrations Per Hour (VPH) or Hertz (Hz). The higher the frequency, the smoother the seconds hand sweeps across the dial and the more resistant the watch is to wrist shocks.',
    deeperExplanation: {
      lead: 'The speed of the tick determines the fluidity of the sweep.',
      paragraphs: [
        'Most modern mechanical watches beat at 28,800 VPH (4 Hertz), meaning the balance wheel oscillates 4 times per second, moving the seconds hand in 8 microscopic jumps every second. Vintage or accessible movements often beat at 21,600 VPH (3 Hz / 6 jumps per second).',
        'Specialized "Hi-Beat" movements operate at 36,000 VPH (5 Hz / 10 jumps per second) for extraordinary sweep fluidity. Grand Seiko’s Spring Drive takes this to the ultimate extreme: by using an electromagnetic glide wheel with no escapement ticks, the seconds hand glides in 100% continuous, silent, frictionless motion.',
      ],
      keyTakeaways: [
        '21,600 VPH (3 Hz): Vintage pace, lower wear, long service life (e.g. Seiko 4R36).',
        '28,800 VPH (4 Hz): Modern standard for luxury Swiss horology.',
        'Spring Drive: Completely continuous, silent gliding sweep with zero ticks.',
      ],
    },
    whyItMatters:
      'The sweep of the seconds hand is the first thing that mesmerizes newcomers to mechanical horology. Watching a 28,800 VPH or Spring Drive sweep is the visual signature of kinetic mechanics.',
    watchSlugs: ['grand-seiko-snowflake-sbga211', 'audemars-piguet-royal-oak-jumbo-16202st-oo-1240st-01'],
    relatedTopicSlugs: ['what-is-an-escapement', 'accuracy', 'automatic-vs-quartz'],
  },
  {
    id: 'l4',
    slug: 'winding',
    title: 'Winding',
    category: 'language',
    shortDescription: 'Feeding energy into the mainspring: crown positions, manual ritual, and overwinding myths.',
    readTimeMinutes: 2,
    keywords: ['winding', 'crown', 'mainspring', 'overwinding', 'automatic clutch', 'hand-wound'],
    tenSecondAnswer:
      'Winding is the act of turning the crown clockwise to compress the mainspring inside its barrel. In modern automatic watches, you cannot "overwind" and break the spring—a built-in slipping bridle clutch prevents damage.',
    deeperExplanation: {
      lead: 'Winding connects the wearer directly to the watch’s power reserve.',
      paragraphs: [
        'In manual-wind watches, you wind the crown until you feel clear physical resistance: the spring is fully coiled and stops. In vintage manual pieces, forcing the crown past this point could snap the spring.',
        'In modern automatic watches, however, the mainspring features a special slipping clutch at its outer end. When fully wound, the spring simply slides harmlessly inside the barrel walls as you continue turning or moving. You can wind an automatic 100 times without ever causing damage.',
      ],
      keyTakeaways: [
        'Automatic watches CANNOT be overwound thanks to a slipping bridle mechanism.',
        'Manual-wind watches reach a definite stopping point—never force the crown once tight.',
        'Winding an automatic 20 to 30 turns from a dead stop jumpstarts maximum amplitude and accuracy.',
      ],
    },
    whyItMatters:
      'Never shake an automatic watch aggressively to start it. Instead, give the crown 20 to 30 smooth clockwise turns to give the movement healthy starting torque before putting it on your wrist.',
    watchSlugs: ['hamilton-khaki-field-mechanical-h69439931', 'seiko-5-sports-srpd55'],
    relatedTopicSlugs: ['crown', 'rotor', 'power-reserve'],
  },
  {
    id: 'l5',
    slug: 'rotor',
    title: 'Rotor (Oscillating Weight)',
    category: 'language',
    shortDescription: 'The semi-circular metal weight that spins with your arm to wind automatic movements.',
    readTimeMinutes: 2,
    keywords: ['rotor', 'oscillating weight', 'automatic winding', 'ball bearings', 'tungsten', 'gold', 'caseback'],
    tenSecondAnswer:
      'The rotor is a weighted metal semicircle mounted on ball bearings on the back of an automatic movement. As your wrist naturally moves during the day, gravity causes the rotor to swing freely, winding the mainspring automatically.',
    deeperExplanation: {
      lead: 'The rotor is what turns a mechanical watch into an "automatic" watch.',
      paragraphs: [
        'Invented in primitive forms for pocket watches by Abraham-Louis Perrelet and perfected for wristwatches by Rolex in 1931 (the "Oyster Perpetual"), the rotor harnesses the wearer’s kinetic energy.',
        'To maximize winding efficiency, rotors are made from dense metals—ranging from heavy brass and tungsten in entry models to solid 21K or 22K gold in haute horlogerie like Audemars Piguet. When viewed through a sapphire exhibition caseback, the rotor is often elaborately decorated with Geneva stripes (*Côtes de Genève*) or skeletonized openwork.',
      ],
      keyTakeaways: [
        'Mounted on low-friction micro ball bearings to spin with the slightest wrist tilt.',
        'Uses heavy peripheral weighting to generate maximum winding torque.',
        'Some watches wind in both directions (bidirectional), while others wind only in one direction.',
      ],
    },
    whyItMatters:
      'Looking through an exhibition caseback and seeing the rotor twirl is one of the most delightful tactile experiences of owning an automatic watch.',
    watchSlugs: ['seiko-5-sports-srpd55', 'audemars-piguet-royal-oak-jumbo-16202st-oo-1240st-01'],
    relatedTopicSlugs: ['automatic-vs-quartz', 'winding', 'power-reserve'],
  },
  {
    id: 'l6',
    slug: 'crown',
    title: 'Crown',
    category: 'language',
    shortDescription: 'The command center of your watch: winding, setting time and date, and screw-down locking.',
    readTimeMinutes: 2,
    keywords: ['crown', 'winding stem', 'screw-down', 'positions', 'date setting', 'cabochon', 'waterproofing'],
    tenSecondAnswer:
      'The crown is the knurled knob on the side of the watch case connected to the internal movement stem. Pulling it to different "clicks" (positions) allows you to wind the spring, adjust the date, and set the hours and minutes.',
    deeperExplanation: {
      lead: 'The crown is the primary interface between human fingers and microscopic gears.',
      paragraphs: [
        'Most modern watches utilize multi-position crowns: Position 0 (pushed in against the case) is for manual winding; Position 1 (pulled out one click) is the quickset date change; Position 2 (pulled out completely) stops the seconds hand (called "hacking") and sets the time.',
        'On dive watches, the crown screws down clockwise into the case tube against rubber O-rings to prevent water ingress under pressure. Luxury dress watches like the Cartier Tank feature decorative gemstones, such as a synthetic blue spinel or sapphire cabochon, set directly into the crown.',
      ],
      keyTakeaways: [
        'Position 0 = Winding. Position 1 = Quickset Date. Position 2 = Time setting with hacking seconds.',
        'Never change the date when the watch hands are between 9:00 PM and 3:00 AM (the "danger zone" where the date gear is engaged).',
        'Always ensure a screw-down crown is fully threaded before washing hands or entering water.',
      ],
    },
    whyItMatters:
      'A loose or unscrewed crown is the #1 reason water penetrates and destroys luxury movements. Always check your crown before getting in the pool or shower.',
    watchSlugs: ['rolex-submariner-date-126610ln', 'cartier-tank-must-wsta0041'],
    relatedTopicSlugs: ['winding', 'water-resistance', 'complication'],
  },
  {
    id: 'l7',
    slug: 'complication',
    title: 'Complication',
    category: 'language',
    shortDescription: 'Any feature beyond hours, minutes, and seconds: from a simple date window to grand chiming repeaters.',
    readTimeMinutes: 2,
    keywords: ['complication', 'grand complication', 'date', 'day date', 'calendar', 'perpetual calendar'],
    tenSecondAnswer:
      'In horology, a "complication" is any mechanical function added to a watch beyond basic timekeeping (hours, minutes, and seconds). Examples range from a humble date window to chronographs, GMT hands, and perpetual calendars.',
    deeperExplanation: {
      lead: 'Complications are where watchmakers display their mechanical virtuosity.',
      paragraphs: [
        'A watch that only displays the time is known as a "time-only" watch. As soon as you add a date window, that is a complication. Add a stopwatch, and it becomes a chronograph complication. Add an alarm, a second time zone, or a chiming minute repeater, and each addition multiplies the mechanical complexity exponentially.',
        'A "Grand Complication" is a timepiece that combines multiple high-tier complications simultaneously: typically a perpetual calendar, a split-seconds chronograph, and a chiming minute repeater. These micro-mechanical marvels can take a master watchmaker up to a full year of hand assembly.',
      ],
      keyTakeaways: [
        'Time-only: Hours, minutes, and seconds (no complications).',
        'Common complications: Date, Day-Date, Chronograph, GMT, Power Reserve Indicator.',
        'High complications: Perpetual Calendar, Tourbillon, Minute Repeater, Equation of Time.',
      ],
    },
    whyItMatters:
      'Every complication adds moving parts, thickness, and servicing considerations. Knowing which complications you actually use helps you buy watches that fit your real-world lifestyle.',
    watchSlugs: ['omega-speedmaster-professional-moonwatch-31030425001002', 'rolex-gmt-master-ii-126710blro-pepsi', 'jaeger-lecoultre-reverso-classic-monoface-q2618430'],
    relatedTopicSlugs: ['chronograph', 'gmt', 'moonphase', 'tourbillon'],
  },
]

// ==========================================
// HELPER QUERY FUNCTIONS
// ==========================================

export function getAllTopics(): Watch101Topic[] {
  return WATCH_101_TOPICS
}

export function getTopicBySlug(slug: string): Watch101Topic | undefined {
  return WATCH_101_TOPICS.find((t) => t.slug === slug)
}

export function getTopicsByCategory(category: TopicCategory): Watch101Topic[] {
  return WATCH_101_TOPICS.filter((t) => t.category === category)
}

export function getCategories(): TopicCategoryMeta[] {
  return TOPIC_CATEGORIES
}

export function getAdjacentTopics(slug: string): {
  prev?: Watch101Topic
  next?: Watch101Topic
} {
  const index = WATCH_101_TOPICS.findIndex((t) => t.slug === slug)
  if (index === -1) return {}

  const prev = index > 0 ? WATCH_101_TOPICS[index - 1] : undefined
  const next = index < WATCH_101_TOPICS.length - 1 ? WATCH_101_TOPICS[index + 1] : undefined

  return { prev, next }
}
