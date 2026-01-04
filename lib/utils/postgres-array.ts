/**
 * PostgreSQL Array Utilities
 * 
 * Helper functions to safely handle PostgreSQL array data that may come
 * in different formats (native arrays, string format {val1,val2}, etc.)
 * 
 * This module ensures robust handling of array data from PostgreSQL queries
 * to prevent "is not a function" errors when calling array methods.
 */

/**
 * Parse PostgreSQL array to JavaScript array
 * Handles both native arrays and string representations like {val1,val2}
 */
export function parsePostgresArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value.map(String);
  }
  
  // If it's a string (PostgreSQL array notation), parse it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1);
      if (inner === '') {
        return [];
      }
      
      // Handle quoted values and simple values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if (char === '"' && (i === 0 || inner[i - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      
      // Don't forget the last value
      if (current) {
        values.push(current.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
      }
      
      return values;
    }
    
    // Single value without braces
    return [value];
  }
  
  return [];
}

/**
 * Alias for parsePostgresArray - more descriptive name for column handling
 */
export function getColumns(columns: unknown): string[] {
  return parsePostgresArray(columns);
}

/**
 * Alias for parsePostgresArray - more descriptive name for values handling
 */
export function getValues(values: unknown): string[] {
  return parsePostgresArray(values);
}

/**
 * Safely compare two PostgreSQL arrays (sorted)
 * Returns true if both arrays contain the same elements (order independent)
 */
export function arraysMatch(arr1: unknown, arr2: unknown): boolean {
  const a1 = parsePostgresArray(arr1).sort();
  const a2 = parsePostgresArray(arr2).sort();
  return JSON.stringify(a1) === JSON.stringify(a2);
}

/**
 * Alias for arraysMatch - specifically for comparing column arrays
 */
export function columnsMatch(cols1: unknown, cols2: unknown): boolean {
  return arraysMatch(cols1, cols2);
}

/**
 * Safely join PostgreSQL array with separator
 */
export function safeJoin(arr: unknown, separator: string = ', '): string {
  return parsePostgresArray(arr).join(separator);
}

