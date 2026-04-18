/**
 * Safe parsing utilities to prevent NaN values and database constraint violations
 */

export interface ParseIntOptions {
  min?: number;
  max?: number;
  allowZero?: boolean;
  fieldName?: string;
}

/**
 * Safely parse a value to integer with comprehensive validation
 * @param value - Value to parse (can be string, number, or any)
 * @param fieldName - Name of the field for error messages
 * @param options - Additional validation options
 * @returns Parsed integer value
 * @throws Error if parsing fails or validation constraints are not met
 */
export const parseIntSafe = (
  value: any,
  fieldName: string = "Value",
  options: ParseIntOptions = {},
): number => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} cannot be null or undefined`);
  }

  // Handle empty strings
  if (value === "" || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  // Convert to string first to handle various input types
  const stringValue = String(value).trim();

  // Parse the integer
  const parsed = parseInt(stringValue, 10);

  // Check if parsing resulted in NaN
  if (isNaN(parsed)) {
    throw new Error(
      `${fieldName} must be a valid integer (received: ${value})`,
    );
  }

  // Reject decimal strings explicitly (e.g. "8.5") so they aren't silently truncated
  if (stringValue.includes(".")) {
    throw new Error(
      `${fieldName} must be an integer, not a decimal (received: ${value})`,
    );
  }

  // Check if the original string was a valid integer representation
  if (String(parsed) !== stringValue) {
    throw new Error(
      `${fieldName} contains non-numeric characters (received: ${value})`,
    );
  }

  // Apply validation constraints
  if (options.min !== undefined && parsed < options.min) {
    throw new Error(
      `${fieldName} must be at least ${options.min} (received: ${parsed})`,
    );
  }

  if (options.max !== undefined && parsed > options.max) {
    throw new Error(
      `${fieldName} must be at most ${options.max} (received: ${parsed})`,
    );
  }

  if (!options.allowZero && parsed === 0) {
    throw new Error(
      `${fieldName} must be greater than 0 (received: ${parsed})`,
    );
  }

  return parsed;
};

/**
 * Safely parse a value to float with comprehensive validation
 * @param value - Value to parse (can be string, number, or any)
 * @param fieldName - Name of the field for error messages
 * @param options - Additional validation options (min, max, allowZero)
 * @returns Parsed float value
 * @throws Error if parsing fails or validation constraints are not met
 */
export const parseFloatSafe = (
  value: any,
  fieldName: string = "Value",
  options: ParseIntOptions = {},
): number => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} cannot be null or undefined`);
  }

  // Handle empty strings
  if (value === "" || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  // Convert to string first to handle various input types
  const stringValue = String(value).trim();

  // Parse the float
  const parsed = parseFloat(stringValue);

  // Check if parsing resulted in NaN
  if (isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number (received: ${value})`);
  }

  // Apply validation constraints
  if (options.min !== undefined && parsed < options.min) {
    throw new Error(
      `${fieldName} must be at least ${options.min} (received: ${parsed})`,
    );
  }

  if (options.max !== undefined && parsed > options.max) {
    throw new Error(
      `${fieldName} must be at most ${options.max} (received: ${parsed})`,
    );
  }

  if (!options.allowZero && parsed === 0) {
    throw new Error(
      `${fieldName} must be greater than 0 (received: ${parsed})`,
    );
  }

  return parsed;
};

/**
 * Extract numeric ID from a string ID (e.g., "CID001" -> 1)
 * @param idString - String containing numeric ID
 * @param prefix - Expected prefix (e.g., "CID", "ITM", "CAT")
 * @param fieldName - Name of the field for error messages
 * @returns Extracted numeric ID
 * @throws Error if extraction fails
 */
export const extractNumericId = (
  idString: string | null | undefined,
  prefix: string,
  fieldName: string = "ID",
): number => {
  if (!idString) {
    throw new Error(`${fieldName} cannot be null or empty`);
  }

  const trimmedId = idString.trim();

  if (!trimmedId.startsWith(prefix)) {
    throw new Error(
      `${fieldName} must start with '${prefix}' (received: ${idString})`,
    );
  }

  const numericPart = trimmedId.substring(prefix.length);

  if (!numericPart) {
    throw new Error(
      `${fieldName} is missing numeric part (received: ${idString})`,
    );
  }

  try {
    return parseIntSafe(numericPart, `${fieldName} numeric part`, { min: 1 });
  } catch (error) {
    throw new Error(
      `Invalid ${fieldName}: ${idString} - ${error instanceof Error ? error.message : "Invalid format"}`,
    );
  }
};

/**
 * Generate next ID in sequence with proper error handling
 * @param maxId - Current maximum ID value
 * @param prefix - Prefix for the ID (e.g., "CID", "ITM", "CAT")
 * @param padLength - Length to pad the numeric part (default: 3)
 * @returns Next ID in sequence
 */
export const generateNextId = (
  maxId: number | null | undefined,
  prefix: string,
  padLength: number = 3,
): string => {
  // Handle null/undefined by starting from 1
  const currentMax = maxId ?? 0;

  // Validate that maxId is a valid number if provided
  if (maxId !== null && maxId !== undefined && (isNaN(maxId) || maxId < 0)) {
    throw new Error(`Invalid maximum ID value: ${maxId}`);
  }

  const nextNumber = currentMax + 1;

  // Pad with leading zeros
  const paddedNumber = nextNumber.toString().padStart(padLength, "0");

  return `${prefix}${paddedNumber}`;
};

/**
 * Validate and coerce a value to a positive integer
 * Useful for Zod transforms that need safe parsing
 * @param value - Value to coerce
 * @param fieldName - Name of the field for error messages
 * @returns Coerced positive integer
 */
export const coercePositiveInt = (
  value: any,
  fieldName: string = "Value",
): number => {
  return parseIntSafe(value, fieldName, { min: 1 });
};

/**
 * Validate and coerce a value to a non-negative integer
 * @param value - Value to coerce
 * @param fieldName - Name of the field for error messages
 * @returns Coerced non-negative integer
 */
export const coerceNonNegativeInt = (
  value: any,
  fieldName: string = "Value",
): number => {
  return parseIntSafe(value, fieldName, { min: 0, allowZero: true });
};

/**
 * Validate and coerce a value to a positive float
 * @param value - Value to coerce
 * @param fieldName - Name of the field for error messages
 * @returns Coerced positive float
 */
export const coercePositiveFloat = (
  value: any,
  fieldName: string = "Value",
): number => {
  return parseFloatSafe(value, fieldName, { min: 0.01 });
};

/**
 * Validate and coerce a value to a non-negative float
 * @param value - Value to coerce
 * @param fieldName - Name of the field for error messages
 * @returns Coerced non-negative float
 */
export const coerceNonNegativeFloat = (
  value: any,
  fieldName: string = "Value",
): number => {
  return parseFloatSafe(value, fieldName, { min: 0, allowZero: true });
};
