/** Die 14 Hauptallergene nach EU-Verordnung 1169/2011, Kennzeichnung A–R gemäß österreichischer Codex-Empfehlung. */
export const ALLERGENS = {
  A: { de: 'Glutenhaltiges Getreide', en: 'Cereals containing gluten', nl: 'Glutenbevattende granen' },
  B: { de: 'Krebstiere', en: 'Crustaceans', nl: 'Schaaldieren' },
  C: { de: 'Eier', en: 'Eggs', nl: 'Eieren' },
  D: { de: 'Fisch', en: 'Fish', nl: 'Vis' },
  E: { de: 'Erdnüsse', en: 'Peanuts', nl: "Pinda's" },
  F: { de: 'Soja', en: 'Soybeans', nl: 'Soja' },
  G: { de: 'Milch & Laktose', en: 'Milk & lactose', nl: 'Melk & lactose' },
  H: { de: 'Schalenfrüchte (Nüsse)', en: 'Tree nuts', nl: 'Noten' },
  L: { de: 'Sellerie', en: 'Celery', nl: 'Selderij' },
  M: { de: 'Senf', en: 'Mustard', nl: 'Mosterd' },
  N: { de: 'Sesam', en: 'Sesame', nl: 'Sesamzaad' },
  O: { de: 'Schwefeldioxid & Sulfite', en: 'Sulphur dioxide & sulphites', nl: 'Zwaveldioxide & sulfieten' },
  P: { de: 'Lupinen', en: 'Lupin', nl: 'Lupine' },
  R: { de: 'Weichtiere', en: 'Molluscs', nl: 'Weekdieren' },
} as const;

export type AllergenCode = keyof typeof ALLERGENS;
export const ALLERGEN_CODES = Object.keys(ALLERGENS) as AllergenCode[];
