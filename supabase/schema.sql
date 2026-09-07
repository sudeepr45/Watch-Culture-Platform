-- ==============================================================================
-- WATCH CULTURE PLATFORM: CENTRAL WATCH DATABASE SCHEMA
-- Phase 2B: DDL, Row Level Security Policies, and Verified Real Seed Data
-- ==============================================================================

-- 1. Create watches table
CREATE TABLE IF NOT EXISTS public.watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  movement_type TEXT,
  movement_name TEXT,
  calibre TEXT,
  case_diameter_mm NUMERIC(5, 2),
  case_thickness_mm NUMERIC(5, 2),
  lug_to_lug_mm NUMERIC(5, 2),
  case_material TEXT,
  crystal TEXT,
  water_resistance_m NUMERIC(6, 1),
  power_reserve_hours NUMERIC(5, 1),
  bracelet_or_strap TEXT,
  release_year INTEGER,
  category TEXT,
  style TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by slug and brand
CREATE INDEX IF NOT EXISTS idx_watches_slug ON public.watches (slug);
CREATE INDEX IF NOT EXISTS idx_watches_brand ON public.watches (brand);
CREATE INDEX IF NOT EXISTS idx_watches_category ON public.watches (category);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all watch records
DROP POLICY IF EXISTS "Allow public read access for watches" ON public.watches;
CREATE POLICY "Allow public read access for watches"
  ON public.watches
  FOR SELECT
  USING (true);

-- 3. Verified Real Watch Seed Dataset (12 Real Timepieces)
INSERT INTO public.watches (
  brand,
  model,
  reference_number,
  slug,
  description,
  price,
  currency,
  movement_type,
  movement_name,
  calibre,
  case_diameter_mm,
  case_thickness_mm,
  lug_to_lug_mm,
  case_material,
  crystal,
  water_resistance_m,
  power_reserve_hours,
  bracelet_or_strap,
  release_year,
  category,
  style,
  image_url
) VALUES
(
  'Casio',
  'G-Shock CasiOak All-Black',
  'GA-2100-1A1',
  'casio-g-shock-ga-2100-1a1',
  'The stealth octagonal icon that earned the nickname "CasiOak". Built with a carbon core guard structure, dual analog-digital readout, and world-class shock resistance at an accessible price point.',
  99.00,
  'USD',
  'Quartz',
  'Module 5611',
  '5611',
  45.40,
  11.80,
  48.50,
  'Carbon-reinforced Resin',
  'Mineral Glass',
  200.0,
  NULL,
  'Resin Strap',
  2019,
  'Affordable',
  'Sport',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
),
(
  'Seiko',
  '5 Sports Automatic',
  'SRPD55',
  'seiko-5-sports-srpd55',
  'The quintessential entry mechanical sports watch. Features Seiko''s durable 4R36 day-date calibre, a unidirectional rotating timing bezel, and LumiBrite hands in a classic dive-style silhouette.',
  295.00,
  'USD',
  'Automatic',
  'Seiko In-House 4R36',
  '4R36',
  42.50,
  13.40,
  46.00,
  'Stainless Steel',
  'Hardlex Crystal',
  100.0,
  41.0,
  'Stainless Steel Three-Link Bracelet',
  2019,
  'Affordable',
  'Dive',
  'https://images.unsplash.com/photo-1547996160-71dfa63582b8?auto=format&fit=crop&w=1200&q=80'
),
(
  'Hamilton',
  'Khaki Field Mechanical',
  'H69439931',
  'hamilton-khaki-field-mechanical-h69439931',
  'A faithful reproduction of Hamilton''s mid-20th century military service watches. Features a bead-blasted matte case, 24-hour military dial, and the hand-wound H-50 calibre boasting 80 hours of power reserve.',
  595.00,
  'USD',
  'Manual-Wind',
  'Hamilton H-50',
  'H-50 (ETA 2801-2 base)',
  38.00,
  9.50,
  47.00,
  'Sandblasted Stainless Steel',
  'Sapphire Crystal',
  50.0,
  80.0,
  'Green Textile NATO Strap with Leather Accents',
  2018,
  'Field',
  'Military',
  'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80'
),
(
  'Tissot',
  'PRX Powermatic 80',
  'T137.407.11.041.00',
  'tissot-prx-powermatic-80-blue',
  'Reviving an iconic 1978 design with a tapered tonneau case, waffle tapisserie dial, and integrated stainless steel bracelet. Powered by the Powermatic 80 calibre with an anti-magnetic Nivachron balance spring.',
  725.00,
  'USD',
  'Automatic',
  'Powermatic 80.111',
  'ETA C07.111',
  40.00,
  10.90,
  44.00,
  '316L Stainless Steel',
  'Scratch-Resistant Sapphire Crystal',
  100.0,
  80.0,
  'Integrated Stainless Steel Bracelet',
  2021,
  'Integrated Bracelet',
  'Everyday',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
),
(
  'Tudor',
  'Black Bay 58',
  'M79030N-0001',
  'tudor-black-bay-58-m79030n',
  'A masterclass in vintage dive watch proportions, named after Tudor''s first 200m dive watch released in 1958. Features gilt dial accents, snowflake hands, and the COSC-certified in-house MT5402 movement.',
  4000.00,
  'USD',
  'Automatic',
  'Manufacture Calibre MT5402',
  'MT5402 (COSC)',
  39.00,
  11.90,
  47.70,
  '316L Stainless Steel',
  'Domed Sapphire Crystal',
  200.0,
  70.0,
  'Riveted Steel Bracelet with Folding Clasp',
  2018,
  'Dive',
  'Vintage Sport',
  'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&q=80'
),
(
  'Rolex',
  'Submariner Date',
  '126610LN',
  'rolex-submariner-date-126610ln',
  'The benchmark archetype of the modern luxury dive watch. Features a unidirectional Cerachrom ceramic bezel, black dial with Chromalight display, and the cutting-edge Calibre 3235 Superlative Chronometer.',
  10250.00,
  'USD',
  'Automatic',
  'Rolex In-House 3235',
  'Calibre 3235',
  41.00,
  12.30,
  48.10,
  'Oystersteel (904L)',
  'Sapphire Crystal with Cyclops Lens',
  300.0,
  70.0,
  'Oyster Bracelet with Glidelock Extension',
  2020,
  'Dive',
  'Luxury Sport',
  'https://images.unsplash.com/photo-1547996160-71dfa63582b8?auto=format&fit=crop&w=1200&q=80'
),
(
  'Omega',
  'Speedmaster Professional Moonwatch',
  '310.30.42.50.01.002',
  'omega-speedmaster-professional-moonwatch-sapphire',
  'Flight-qualified by NASA for all manned space missions since 1965. This current generation features the step dial, dot-over-ninety anodised bezel, and the Master Chronometer Co-Axial Calibre 3861 with sapphire sandwich caseback.',
  8000.00,
  'USD',
  'Manual-Wind',
  'Omega Master Chronometer Calibre 3861',
  'Calibre 3861 (METAS Certified)',
  42.00,
  13.20,
  47.50,
  'Stainless Steel',
  'Domed Scratch-Resistant Sapphire Crystal',
  50.0,
  50.0,
  'Five-Arched-Links Steel Bracelet',
  2021,
  'Chronograph',
  'Iconic Sport',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
),
(
  'Cartier',
  'Tank Must Large Model',
  'WSTA0041',
  'cartier-tank-must-large-wsta0041',
  'First conceived by Louis Cartier in 1917 inspired by Renault military tanks on the Western Front. Features polished brancards, blued steel sword hands, a synthetic cabochon sapphire crown, and Roman numeral dial.',
  3300.00,
  'USD',
  'Quartz',
  'High-Autonomy Quartz Movement',
  'Cartier Quartz',
  25.50,
  6.60,
  33.70,
  'Polished Stainless Steel',
  'Mineral Crystal',
  30.0,
  NULL,
  'Grained Black Calfskin Leather Strap',
  2021,
  'Dress',
  'Classic Elegant',
  'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80'
),
(
  'Grand Seiko',
  'Heritage Spring Drive "Snowflake"',
  'SBGA211',
  'grand-seiko-snowflake-sbga211',
  'Celebrated for its dial texture evoking wind-swept snow in the Shinshu mountains of Japan. Crafted from High-Intensity Titanium and powered by the revolutionary Spring Drive 9R65 with an impeccably smooth glide motion.',
  6200.00,
  'USD',
  'Spring Drive',
  'Grand Seiko 9R65',
  'Calibre 9R65',
  41.00,
  12.50,
  49.00,
  'High-Intensity Titanium (Zaratsu Polished)',
  'Dual-Curved Sapphire Crystal',
  100.0,
  72.0,
  'High-Intensity Titanium Bracelet',
  2017,
  'Everyday',
  'Haute Craftsmanship',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
),
(
  'Rolex',
  'GMT-Master II "Pepsi"',
  '126710BLRO',
  'rolex-gmt-master-ii-pepsi-126710blro',
  'The quintessential pilot''s multi-timezone complication. Fitted with a bidirectional red and blue Cerachrom ceramic bezel, 24-hour arrow hand, and the five-link Jubilee bracelet with the Calibre 3285 movement.',
  10900.00,
  'USD',
  'Automatic',
  'Rolex Calibre 3285',
  'Calibre 3285',
  40.00,
  12.10,
  48.00,
  'Oystersteel (904L)',
  'Sapphire Crystal with Cyclops Lens',
  100.0,
  70.0,
  'Jubilee Five-Piece Links Bracelet',
  2018,
  'GMT',
  'Travel Luxury',
  'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&q=80'
),
(
  'Jaeger-LeCoultre',
  'Reverso Classic Monoface',
  'Q2618430',
  'jaeger-lecoultre-reverso-classic-monoface',
  'Conceived in 1931 for British army polo players in India needing a watch face that could swivel to protect the crystal from mallet strikes. Pure Art Deco geometry with godrons, guilloché center, and sword hands.',
  5800.00,
  'USD',
  'Quartz',
  'Jaeger-LeCoultre Calibre 657',
  'Calibre 657',
  21.00,
  7.40,
  35.70,
  'Stainless Steel Swiveling Case',
  'Sapphire Crystal',
  30.0,
  NULL,
  'Casa Fagliano Leather Strap',
  2016,
  'Dress',
  'Art Deco Luxury',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
),
(
  'Audemars Piguet',
  'Royal Oak "Jumbo" Extra-Thin',
  '16202ST.OO.1240ST.01',
  'audemars-piguet-royal-oak-jumbo-16202st',
  'Designed by Gérald Genta in 1972, revolutionizing luxury watchmaking with stainless steel finished to the level of precious metals. Features the iconic octagonal bezel with exposed hexagonal screws, Petite Tapisserie dial, and ultra-thin Calibre 7121.',
  35300.00,
  'USD',
  'Automatic',
  'Manufacture Calibre 7121',
  'Calibre 7121',
  39.00,
  8.10,
  48.60,
  'Stainless Steel (Hand-Satin Finished)',
  'Glareproofed Sapphire Crystal & Caseback',
  50.0,
  55.0,
  'Integrated Stainless Steel Bracelet with AP Folding Clasp',
  2022,
  'Integrated Bracelet',
  'Haute Horlogerie',
  'https://images.unsplash.com/photo-1547996160-71dfa63582b8?auto=format&fit=crop&w=1200&q=80'
)
ON CONFLICT (slug) DO UPDATE SET
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  reference_number = EXCLUDED.reference_number,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  movement_type = EXCLUDED.movement_type,
  movement_name = EXCLUDED.movement_name,
  calibre = EXCLUDED.calibre,
  case_diameter_mm = EXCLUDED.case_diameter_mm,
  case_thickness_mm = EXCLUDED.case_thickness_mm,
  lug_to_lug_mm = EXCLUDED.lug_to_lug_mm,
  case_material = EXCLUDED.case_material,
  crystal = EXCLUDED.crystal,
  water_resistance_m = EXCLUDED.water_resistance_m,
  power_reserve_hours = EXCLUDED.power_reserve_hours,
  bracelet_or_strap = EXCLUDED.bracelet_or_strap,
  release_year = EXCLUDED.release_year,
  category = EXCLUDED.category,
  style = EXCLUDED.style,
  image_url = EXCLUDED.image_url,
  updated_at = now();

-- ==============================================================================
-- PHASE 2E: SUPABASE AUTHENTICATION & USER PROFILES SCHEMA
-- ==============================================================================

-- 4. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure index for fast username lookups and unique constraint enforcement
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 5. Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access for profiles (display name, username, bio, avatar)
DROP POLICY IF EXISTS "Allow public read access for profiles" ON public.profiles;
CREATE POLICY "Allow public read access for profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile matching auth.uid()
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile matching auth.uid()
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Trigger to automatically provision a profile on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      'collector_' || substring(new.id::text, 1, 8)
    ),
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      'Watch Enthusiast'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PHASE 2F: MY COLLECTION / MY WRIST SCHEMA
-- ==============================================================================

-- 7. Create user_watches table linking auth.users and public.watches
CREATE TABLE IF NOT EXISTS public.user_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_watch UNIQUE (user_id, watch_id)
);

-- Indexes for fast collection lookups by user and watch
CREATE INDEX IF NOT EXISTS idx_user_watches_user_id ON public.user_watches (user_id);
CREATE INDEX IF NOT EXISTS idx_user_watches_watch_id ON public.user_watches (watch_id);

-- 8. Enable Row Level Security (RLS) on user_watches
ALTER TABLE public.user_watches ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- SELECT: Authenticated users can only read their own collection in v1
DROP POLICY IF EXISTS "Allow users to read own collection" ON public.user_watches;
CREATE POLICY "Allow users to read own collection"
  ON public.user_watches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Authenticated users can only insert watches into their own collection
DROP POLICY IF EXISTS "Allow users to insert into own collection" ON public.user_watches;
CREATE POLICY "Allow users to insert into own collection"
  ON public.user_watches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Authenticated users can only remove watches from their own collection
DROP POLICY IF EXISTS "Allow users to delete from own collection" ON public.user_watches;
CREATE POLICY "Allow users to delete from own collection"
  ON public.user_watches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

