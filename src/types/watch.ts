export interface Watch {
  id: string
  brand: string
  model: string
  reference_number: string
  slug: string
  description: string | null
  price: number | null
  currency: string
  movement_type: string | null
  movement_name: string | null
  calibre: string | null
  case_diameter_mm: number | null
  case_thickness_mm: number | null
  lug_to_lug_mm: number | null
  case_material: string | null
  crystal: string | null
  water_resistance_m: number | null
  power_reserve_hours: number | null
  bracelet_or_strap: string | null
  release_year: number | null
  category: string | null
  style: string | null
  image_url: string | null
  // Lifecycle status — controlled by curator via RLS-protected INSERT/UPDATE
  status: 'draft' | 'published' | 'archived'
  // Image provenance metadata — optional, curator-entered
  image_source_name: string | null
  image_source_url: string | null
  image_verification_status: 'pending' | 'verified' | null
  image_verified_at: string | null
  image_usage_note: string | null
  created_at: string
  updated_at: string
}
