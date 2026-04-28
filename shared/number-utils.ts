/**
 * Utility functions for safe number parsing and validation
 */

/**
 * Safely parse a float value with validation
 * @param value - The value to parse
 * @param defaultValue - Default value if parsing fails
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Parsed number or default value
 */
export function safeParseFloat(
  value: any,
  defaultValue: number = 0,
  min?: number,
  max?: number,
): number {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  // Convert to string and handle comma as decimal separator
  const stringValue = String(value).replace(",", ".");

  // Remove any non-numeric characters except . and -
  const cleanValue = stringValue.replace(/[^0-9.-]/g, "");

  const parsed = Number.parseFloat(cleanValue);

  // Check if parsing resulted in a valid number
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    console.warn(
      `Invalid number value: ${value}, using default: ${defaultValue}`,
    );
    return defaultValue;
  }

  // Apply min/max constraints
  let result = parsed;
  if (min !== undefined && result < min) {
    console.warn(`Value ${result} is below minimum ${min}, using minimum`);
    result = min;
  }
  if (max !== undefined && result > max) {
    console.warn(`Value ${result} is above maximum ${max}, using maximum`);
    result = max;
  }

  return result;
}

/**
 * Safely parse an integer value with validation
 * @param value - The value to parse
 * @param defaultValue - Default value if parsing fails
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Parsed integer or default value
 */
export function safeParseInt(
  value: any,
  defaultValue: number = 0,
  min?: number,
  max?: number,
): number {
  const floatValue = safeParseFloat(value, defaultValue, min, max);
  return Math.round(floatValue);
}

/**
 * Format a number for display with Arabic numerals
 * @param value - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatNumberAr(value: number, decimals: number = 0): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(decimals);
}

/**
 * Validate that a value is a positive number
 * @param value - The value to check
 * @returns True if valid positive number
 */
export function isPositiveNumber(value: any): boolean {
  const parsed = safeParseFloat(value, -1);
  return parsed > 0;
}

/**
 * Calculate percentage with safe division
 * @param value - The value
 * @param total - The total
 * @param decimals - Number of decimal places
 * @returns Percentage or 0 if total is 0
 */
export function safePercentage(
  value: number,
  total: number,
  decimals: number = 2,
): number {
  if (total === 0 || !Number.isFinite(total) || !Number.isFinite(value)) {
    return 0;
  }

  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
}

/**
 * Safe division to prevent divide by zero
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param defaultValue - Default value if division is invalid
 * @returns Result of division or default value
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0,
): number {
  if (
    denominator === 0 ||
    !Number.isFinite(denominator) ||
    !Number.isFinite(numerator)
  ) {
    return defaultValue;
  }

  return numerator / denominator;
}

/**
 * Round a number to specified decimal places
 * @param value - The value to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
