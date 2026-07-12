import { PropertyType } from '@/types';

// ---------------------------------------------------------------------------
// Ghana regions and area data
// ---------------------------------------------------------------------------

export const GHANA_REGIONS: Record<string, string[]> = {
  'Ashanti': ['Kumasi', 'Obuasi', 'Ejisu'],
  'Greater Accra': ['Accra', 'Tema', 'Kasoa'],
  'Western': ['Takoradi', 'Sekondi', 'Tarkwa'],
  'Central': ['Cape Coast', 'Winneba', 'Kasoa'],
  'Eastern': ['Koforidua', 'Nkawkaw', 'Akim Oda'],
  'Northern': ['Tamale', 'Yendi', 'Salaga'],
  'Volta': ['Ho', 'Hohoe', 'Keta'],
};

// City → common areas for autocomplete-style picker
export const CITY_AREAS: Record<string, string[]> = {
  'Kumasi':       ['Kotei', 'Ayeduase', 'Bomso', 'Ahodwo', 'KNUST', 'Suame', 'Asokwa'],
  'Accra':        ['East Legon', 'Madina', 'Cantonments', 'Osu', 'Adenta', 'Achimota', 'Tema'],
  'Takoradi':     ['Effia', 'Sekondi', 'Market Circle'],
  'Cape Coast':   ['Pedu', 'Abura', 'Kotokuraba'],
};

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'SINGLE_ROOM',    label: 'Single Room' },
  { value: 'SELF_CONTAINED', label: 'Self-Contained' },
  { value: 'APARTMENT',      label: 'Apartment' },
  { value: 'HOUSE',          label: 'House' },
];

export const AMENITY_OPTIONS = [
  'water', 'electricity', 'wifi', 'AC', 'fan', 'security', 'parking',
  'furnished', 'generator', 'balcony', 'gym', 'pool', 'gated compound',
  'tiled floor', 'prepaid meter',
];
