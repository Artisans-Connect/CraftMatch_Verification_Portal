// Single source of truth for trade categories and Ghana regions.
// Used in forms (ApplyPage), filters (ApplicationsTable), and display (LandingPage).

export const TRADE_CATEGORIES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Welder',
  'Mason',
  'Tiler',
  'Mechanic',
] as const;

export type TradeCategory = typeof TRADE_CATEGORIES[number];

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Brong-Ahafo',
  'Upper East',
  'Upper West',
] as const;

export type GhanaRegion = typeof GHANA_REGIONS[number];

// Emoji mapping for display purposes only — not stored in DB.
export const TRADE_EMOJI: Record<string, string> = {
  Electrician: '⚡',
  Plumber: '🔧',
  Carpenter: '🔨',
  Painter: '🎨',
  Welder: '🔥',
  Mason: '🧱',
  Tiler: '📐',
  Mechanic: '🚗',
};

// Hero artisan cards on landing page
export const HERO_ARTISANS = [
  { label: 'Electrician', emoji: '⚡', color: 'bg-gold-50 text-gold-700 border-gold-200' },
  { label: 'Carpenter',   emoji: '🔨', color: 'bg-primary-50 text-primary-700 border-primary-200' },
  { label: 'Mason',       emoji: '🧱', color: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  { label: 'Plumber',     emoji: '🔧', color: 'bg-info-light text-info-dark border-info/20' },
] as const;

// Rejection reason templates shown in the admin reject modal.
export const REJECTION_REASONS = [
  { value: 'Insufficient documentation provided.',              label: 'Insufficient documentation' },
  { value: 'ID documents are unclear or invalid.',              label: 'Invalid or unclear ID' },
  { value: 'Information provided does not match records.',      label: 'Information mismatch' },
  { value: 'Suspicious or fraudulent documents detected.',      label: 'Suspicious documents' },
  { value: 'Application is incomplete.',                        label: 'Incomplete application' },
] as const;
