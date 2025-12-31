import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determine tooth type from tooth ID
 */
export function getToothType(toothId: number): 'molar' | 'premolar' | 'anterior' {
  // Molar: 16-18, 26-28, 36-38, 46-48
  if ((toothId >= 16 && toothId <= 18) || (toothId >= 26 && toothId <= 28) ||
    (toothId >= 36 && toothId <= 38) || (toothId >= 46 && toothId <= 48)) {
    return 'molar';
  }
  // Premolar: 14-15, 24-25, 34-35, 44-45
  if ((toothId >= 14 && toothId <= 15) || (toothId >= 24 && toothId <= 25) ||
    (toothId >= 34 && toothId <= 35) || (toothId >= 44 && toothId <= 45)) {
    return 'premolar';
  }
  // Anterior: 11-13, 21-23, 31-33, 41-43
  return 'anterior';
} 