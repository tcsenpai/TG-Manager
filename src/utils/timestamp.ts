// Timestamp utilities matching CLI-Manager format exactly
// Based on CLI-Manager/src/core/Task.ts TIMESTAMP_FORMAT

import moment from 'moment';
import { TIMESTAMP_FORMAT } from '../types/cli';

/**
 * Generate current timestamp in CLI-compatible format
 * Matches CLI: moment().format(TIMESTAMP_FORMAT)
 * Format: DD/MM/YYYY
 */
export function generateTimestamp(): string {
  return moment().format(TIMESTAMP_FORMAT);
}

/**
 * Parse timestamp from CLI format
 * Returns moment object for further manipulation if needed
 */
export function parseTimestamp(timestamp: string): moment.Moment {
  return moment(timestamp, TIMESTAMP_FORMAT);
}

/**
 * Validate timestamp format matches CLI expectations
 * Ensures compatibility with CLI-generated files
 */
export function validateTimestamp(timestamp: string): boolean {
  const parsed = moment(timestamp, TIMESTAMP_FORMAT, true);
  return parsed.isValid() && parsed.format(TIMESTAMP_FORMAT) === timestamp;
}

/**
 * Compare two timestamps (useful for sorting)
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareTimestamps(a: string, b: string): number {
  const momentA = parseTimestamp(a);
  const momentB = parseTimestamp(b);

  if (momentA.isBefore(momentB)) return -1;
  if (momentA.isAfter(momentB)) return 1;
  return 0;
}

/**
 * Format timestamp for display (can be customized later)
 * Currently returns CLI format, but allows for future mobile-friendly formats
 */
export function formatTimestampForDisplay(timestamp: string): string {
  return timestamp; // Keep CLI format for now
}