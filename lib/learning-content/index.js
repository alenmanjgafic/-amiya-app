/**
 * LEARNING CONTENT INDEX
 * Central export for all learning series
 */

import HEALTHY_CONFLICT_SERIES, {
  getBiteById,
  getNextBite,
  getScreenCount
} from './healthy-conflict';

// All available series
export const ALL_SERIES = [
  HEALTHY_CONFLICT_SERIES,
  // Future series will be added here:
  // CONVERSATION_SERIES,
  // FEEL_CLOSER_SERIES,
];

// Get series by ID
export function getSeriesById(seriesId) {
  return ALL_SERIES.find(s => s.id === seriesId);
}

// Get bite from any series
export function getBiteFromAnySeries(biteId) {
  for (const series of ALL_SERIES) {
    const bite = series.bites.find(b => b.id === biteId);
    if (bite) {
      return { bite, series };
    }
  }
  return null;
}

// Get total duration for a series
export function getSeriesDuration(seriesId) {
  const series = getSeriesById(seriesId);
  if (!series) return 0;
  return series.bites.reduce((acc, bite) => acc + bite.durationMin, 0);
}

// Export individual series
export {
  HEALTHY_CONFLICT_SERIES,
  getBiteById,
  getNextBite,
  getScreenCount,
};
