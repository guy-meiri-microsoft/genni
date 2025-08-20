import type { DateFilterOptions } from '../types';

/**
 * Calculates start and end dates based on DateFilterOptions
 * Returns dates in DD/MM format using UTC to avoid timezone issues
 */
export function calculateDatesFromFilter(dateFilter: DateFilterOptions): { startDate: string; endDate: string } {
  const today = new Date();
  
  // Use UTC dates to avoid timezone issues
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const startDate = new Date(endDate);

  switch (dateFilter) {
    case 'Last7Days':
      startDate.setUTCDate(endDate.getUTCDate() - 6); // 7 days including today
      break;
    case 'Last14Days':
      startDate.setUTCDate(endDate.getUTCDate() - 13); // 14 days including today
      break;
    case 'Last30Days':
      startDate.setUTCDate(endDate.getUTCDate() - 29); // 30 days including today
      break;
  }

  // Format as DD/MM using UTC dates
  const formatDate = (date: Date): string => {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * Parses a DD/MM date string and converts it to a Date object for the current year in UTC
 * Handles year overflow if the end date is before the start date
 */
function parseDateRange(startDateStr: string, endDateStr: string): { startDate: Date; endDate: Date } {
  const currentYear = new Date().getFullYear();
  
  // Parse start date - use UTC midnight to match timestamp format
  const [startDay, startMonth] = startDateStr.split('/');
  const startDate = new Date(Date.UTC(currentYear, parseInt(startMonth) - 1, parseInt(startDay), 0, 0, 0, 0));
  
  // Parse end date - use UTC midnight of the day AFTER the end date for clean 24-hour periods
  const [endDay, endMonth] = endDateStr.split('/');
  let endDate = new Date(Date.UTC(currentYear, parseInt(endMonth) - 1, parseInt(endDay) + 1, 0, 0, 0, 0));
  
  // Handle year overflow - if end date is before start date, assume it's next year
  if (endDate <= startDate) {
    endDate = new Date(Date.UTC(currentYear + 1, parseInt(endMonth) - 1, parseInt(endDay) + 1, 0, 0, 0, 0));
  }
  
  return { startDate, endDate };
}

/**
 * Maps a timestamp from one date range to another using a simple offset calculation
 */
function mapTimestampToNewRange(originalTimestamp: string, originalStartDate: string, originalEndDate: string, newStartDate: string, newEndDate: string): string {
  try {
    // Parse the original and new date ranges
    const originalRange = parseDateRange(originalStartDate, originalEndDate);
    const newRange = parseDateRange(newStartDate, newEndDate);
    
    // Parse the original timestamp
    const originalTimestampDate = new Date(originalTimestamp);
    
    // Calculate the offset from the original start date
    const offsetFromOriginalStart = originalTimestampDate.getTime() - originalRange.startDate.getTime();
    
    // Apply the same offset to the new start date
    const newTimestamp = new Date(newRange.startDate.getTime() + offsetFromOriginalStart);
    
    return newTimestamp.toISOString();
  } catch {
    // Fallback: just use current time if anything goes wrong
    return new Date().toISOString();
  }
}

/**
 * Updates JSON string by replacing date fields with new values
 * Looks for fields containing 'startDate', 'endDate', or 'timestamp' in their names
 */
export function updateJsonDates(jsonString: string, newStartDate: string, newEndDate: string, originalStartDate?: string, originalEndDate?: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Helper function to update a date field
    const updateDateField = (value: unknown, fallbackValue: string): unknown => {
      // If we have original dates and the value is a string, map it using offset
      if (typeof value === 'string' && originalStartDate && originalEndDate) {
        return mapTimestampToNewRange(value, originalStartDate, originalEndDate, newStartDate, newEndDate);
      }
      // Otherwise use the fallback value
      return fallbackValue;
    };
    
    // Recursively update date fields
    const updateDatesInObject = (obj: unknown): unknown => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(updateDatesInObject);
      }

      const updated = { ...obj as Record<string, unknown> };
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof key === 'string') {
          const keyLower = key.toLowerCase();
          
          if (keyLower.includes('startdate')) {
            updated[key] = updateDateField(value, newStartDate);
          } else if (keyLower.includes('enddate')) {
            updated[key] = updateDateField(value, newEndDate);
          } else if (keyLower.includes('timestamp') && typeof value === 'string' && originalStartDate && originalEndDate) {
            updated[key] = mapTimestampToNewRange(value, originalStartDate, originalEndDate, newStartDate, newEndDate);
          } else if (typeof value === 'object' && value !== null) {
            updated[key] = updateDatesInObject(value);
          }
        }
      }
      return updated;
    };

    const updatedData = updateDatesInObject(parsed);
    return JSON.stringify(updatedData, null, 2);
  } catch (error) {
    console.error('Failed to update JSON dates:', error);
    throw new Error('Invalid JSON format');
  }
}

/**
 * Updates a mock key with new start and end dates
 * Expected format: mock_<api>_<start>_<end>_<id>
 */
export function updateMockKey(originalKey: string, newStartDate: string, newEndDate: string): string {
  const parts = originalKey.split('_');
  
  if (parts.length < 2 || parts[0] !== 'mock') {
    return originalKey; // Return original if not a mock key
  }

  // Replace the date parts if they exist
  if (parts.length >= 3) {
    parts[2] = newStartDate; // startDate
  }
  if (parts.length >= 4) {
    parts[3] = newEndDate; // endDate
  }

  return parts.join('_');
}
