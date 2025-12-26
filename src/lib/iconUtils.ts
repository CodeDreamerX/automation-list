// Icon utility to properly reference category icons
// Icons are served from the public folder at /icons/categories/

import { CATEGORY_ICONS } from './categoryIcons';
import { TECHNOLOGY_ICONS } from './technologyIcons';

// Shared icon name mapping (used by both categories and technologies)
// Map old icon names (with icon- prefix or different names) to actual file names
const iconNameMap: Record<string, string> = {
  // Old names with icon- prefix
  'icon-robot': 'robot',
  'icon-scada': 'scada-hmi',
  'icon-oem': 'oem',
  'icon-iot': 'industrial-it-iot',
  'icon-vision': 'vision-safety',
  'icon-integrator': 'system-integrator',
  // Also handle without prefix for backwards compatibility
  'robot': 'robot',
  'scada': 'scada-hmi',
  'oem': 'oem',
  'iot': 'industrial-it-iot',
  'vision': 'vision-safety',
  'integrator': 'system-integrator',
};

/**
 * Internal helper function to get icon URL from icon name
 * Icons are served from the public folder, so we use absolute paths
 * Handles old icon names with "icon-" prefix and maps them to correct file names
 * @param iconName - The name of the icon (without .svg extension)
 * @returns The URL path to the icon, or empty string if not provided
 */
function getIconUrlInternal(iconName: string | null | undefined): string {
  if (!iconName || typeof iconName !== 'string') return '';
  const trimmed = iconName.trim();
  if (!trimmed) return '';
  
  // Check if we have a mapping for this icon name
  const mappedName = iconNameMap[trimmed.toLowerCase()];
  if (mappedName) {
    return `/icons/categories/${mappedName}.svg`;
  }
  
  // Remove "icon-" prefix if present
  let cleanName = trimmed;
  if (cleanName.toLowerCase().startsWith('icon-')) {
    cleanName = cleanName.substring(5);
  }
  
  // Sanitize the icon name to prevent path traversal - only allow alphanumeric and hyphens
  // Also lowercase to match file system (icon files are lowercase)
  const sanitized = cleanName.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!sanitized) return '';
  return `/icons/categories/${sanitized}.svg`;
}

/**
 * Get the icon URL for a given icon name (categories)
 * Icons are served from the public folder, so we use absolute paths
 * Handles old icon names with "icon-" prefix and maps them to correct file names
 * @param iconName - The name of the icon (without .svg extension)
 * @returns The URL path to the icon, or empty string if not provided
 */
export function getIconUrl(iconName: string | null | undefined): string {
  return getIconUrlInternal(iconName);
}

/**
 * Check if an icon name is valid (exists in the category icons list)
 * @param iconName - The name of the icon to validate
 * @returns True if the icon is valid, false otherwise
 */
export function isValidIcon(iconName: string | null | undefined): boolean {
  if (!iconName) return false;
  return CATEGORY_ICONS.includes(iconName);
}

/**
 * Get the technology icon URL for a given icon name
 * Icons are served from the public folder, so we use absolute paths
 * Handles old icon names with "icon-" prefix and maps them to correct file names
 * Technology icons use the same icons as categories, stored in /icons/categories/
 * @param iconName - The name of the icon (without .svg extension)
 * @returns The URL path to the icon, or empty string if not provided
 */
export function getTechnologyIconUrl(iconName: string | null | undefined): string {
  return getIconUrlInternal(iconName);
}

