export const SEVERITY_LEVELS = {
  LOW:      { label: 'Low',      color: '#74C69D', bg: '#D8F3DC' },
  MEDIUM:   { label: 'Medium',   color: '#F4A261', bg: '#FFF3E0' },
  HIGH:     { label: 'High',     color: '#E63946', bg: '#FFE5E5' },
  CRITICAL: { label: 'Critical', color: '#9B1D1D', bg: '#FFD0D0' },
}

export const WASTE_TYPES = {
  PLASTIC:  { label: 'Plastic',  co2Factor: 2.5, color: '#3B82F6', icon: '🧴' },
  ORGANIC:  { label: 'Organic',  co2Factor: 0.8, color: '#8B4513', icon: '🥬' },
  MIXED:    { label: 'Mixed',    co2Factor: 1.5, color: '#6B7280', icon: '♻️' },
  EWASTE:   { label: 'E-Waste',  co2Factor: 5.0, color: '#8B5CF6', icon: '💻' },
}

export const RECYCLER_TYPES = {
  PLASTIC:  { label: 'Plastic Recycler',  color: '#3B82F6', bg: '#EFF6FF', accepts: ['PLASTIC', 'MIXED'] },
  ORGANIC:  { label: 'Organic/Compost',   color: '#8B4513', bg: '#FEF3C7', accepts: ['ORGANIC', 'MIXED'] },
  EWASTE:   { label: 'E-Waste Recycler',  color: '#8B5CF6', bg: '#F5F3FF', accepts: ['EWASTE'] },
  GENERAL:  { label: 'General Recycler',  color: '#40916C', bg: '#D8F3DC', accepts: ['PLASTIC','ORGANIC','MIXED','EWASTE'] },
}

export const DISPATCH_STATUS = {
  PENDING:    { label: 'Awaiting tricycle',   color: '#F4A261' },
  DISPATCHED: { label: 'Tricycle en route',   color: '#3B82F6' },
  COLLECTED:  { label: 'Waste collected',     color: '#74C69D' },
  DELIVERED:  { label: 'Delivered to plant',  color: '#2D6A4F' },
  CANCELLED:  { label: 'Cancelled',           color: '#E63946' },
}

export const ACCRA_CENTER = [5.6037, -0.1870]
export const ACCRA_ZOOM   = 13

export const POINTS = {
  REPORT_SUBMITTED: 5,
  REPORT_VERIFIED:  10,
  KG_COLLECTED:     3,
}

export const PRICE_PER_KG_GHS = {
  PLASTIC: 1.20,
  ORGANIC: 0.40,
  EWASTE:  5.00,
  MIXED:   0.80,
}
