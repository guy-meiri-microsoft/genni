import type { DateFilterOptions } from '../types';

const DATE_FILTER_DAYS: Record<Exclude<DateFilterOptions, 'None'>, number> = {
  Last7Days: 6,
  Last14Days: 13,
  Last30Days: 29
};

/**
 * Calculates start and end dates based on DateFilterOptions
 * Returns dates in DD/MM format using UTC to avoid timezone issues
 */
export function calculateDatesFromFilter(dateFilter: DateFilterOptions): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const startDate = new Date(endDate);

  const daysBack = dateFilter === 'None' ? 0 : DATE_FILTER_DAYS[dateFilter];
  startDate.setUTCDate(endDate.getUTCDate() - daysBack);

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
export function updateJsonDates(
  jsonString: string,
  newStartDate: string,
  newEndDate: string,
  originalStartDate?: string,
  originalEndDate?: string,
  isTimeless: boolean = false
): string {
  if (isTimeless) {
    return jsonString;
  }

  try {
    const parsed = JSON.parse(jsonString);
    const hasOriginalDates = originalStartDate && originalEndDate;

    const updateDatesInObject = (obj: unknown): unknown => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(updateDatesInObject);
      }

      const updated = { ...obj as Record<string, unknown> };
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const keyLower = key.toLowerCase();

        if (keyLower.includes('startdate')) {
          updated[key] = hasOriginalDates && typeof value === 'string'
            ? mapTimestampToNewRange(value, originalStartDate, originalEndDate, newStartDate, newEndDate)
            : newStartDate;
        } else if (keyLower.includes('enddate')) {
          updated[key] = hasOriginalDates && typeof value === 'string'
            ? mapTimestampToNewRange(value, originalStartDate, originalEndDate, newStartDate, newEndDate)
            : newEndDate;
        } else if (keyLower.includes('timestamp') && hasOriginalDates && typeof value === 'string') {
          updated[key] = mapTimestampToNewRange(value, originalStartDate, originalEndDate, newStartDate, newEndDate);
        } else if (typeof value === 'object' && value !== null) {
          updated[key] = updateDatesInObject(value);
        }
      }
      return updated;
    };

    return JSON.stringify(updateDatesInObject(parsed), null, 2);
  } catch (error) {
    console.error('Failed to update JSON dates:', error);
    throw new Error('Invalid JSON format');
  }
}

/**
 * Updates a mock key with new start and end dates
 * Expected format: mock_<api>_<start>_<end>_<id>
 * The end date in the key represents the full range (inclusive), so for a 7-day range 
 * from 07/08 to 13/08, the key should be mock_api_07/08_14/08_id (showing the day after the last day)
 */
export function updateMockKey(originalKey: string, newStartDate: string, newEndDate: string): string {
  const parts = originalKey.split('_');

  if (parts.length < 2 || parts[0] !== 'mock') {
    return originalKey; // Return original if not a mock key
  }

  // If timeless (only 2 parts: mock_<api>), return unchanged
  if (parts.length === 2) {
    return originalKey;
  }

  // Calculate the day after the end date for the key format
  const [endDay, endMonth] = newEndDate.split('/');
  const endDateObj = new Date(new Date().getFullYear(), parseInt(endMonth) - 1, parseInt(endDay) + 1);

  // Format the day after end date as DD/MM
  const dayAfterEnd = endDateObj.getDate().toString().padStart(2, '0');
  const monthAfterEnd = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
  const keyEndDate = `${dayAfterEnd}/${monthAfterEnd}`;

  // Replace the date parts if they exist
  if (parts.length >= 3) {
    parts[2] = newStartDate; // startDate
  }
  if (parts.length >= 4) {
    parts[3] = keyEndDate; // endDate + 1 day
  }

  return parts.join('_');
}
