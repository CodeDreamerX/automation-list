/**
 * Logo Background Variant Mapping Utilities
 * 
 * Centralizes the mapping between form values and database values for logo background variants.
 * 
 * Form values: 'white', 'light', 'gray', 'neutral', 'dark', 'brand'
 * Database values: 'light', 'neutral', 'dark', 'brand'
 * 
 * The form uses more granular options (white/light/gray) while the database
 * stores normalized values (light/neutral). This utility handles the bidirectional
 * conversion between these representations.
 */

/**
 * Maps form values to database values for logo background variants.
 * 
 * @param formValue - The form value ('white', 'light', 'gray', 'neutral', 'dark', 'brand')
 * @returns The corresponding database value ('light', 'neutral', 'dark', 'brand'), defaults to 'light'
 */
export function mapFormVariantToDbVariant(formValue: string | null | undefined): string {
  if (!formValue) return 'light';
  
  const variantMap: Record<string, string> = {
    'white': 'light',
    'light': 'light',
    'gray': 'neutral',
    'neutral': 'neutral',
    'dark': 'dark',
    'brand': 'brand'
  };
  
  return variantMap[formValue.toLowerCase()] || 'light';
}

/**
 * Maps database values to form values for logo background variants.
 * 
 * @param dbValue - The database value ('light', 'neutral', 'dark', 'brand')
 * @returns The corresponding form value ('white', 'light', 'gray', 'dark', 'brand'), defaults to 'white'
 */
export function mapDbVariantToFormVariant(dbValue: string | null | undefined): string {
  if (!dbValue) return 'white';
  
  const dbToFormMap: Record<string, string> = {
    'light': 'white',
    'neutral': 'gray',
    'dark': 'dark',
    'brand': 'brand'
  };
  
  return dbToFormMap[dbValue.toLowerCase()] || 'white';
}

