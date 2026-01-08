/**
 * LEARNING CONTENT INDEX
 * Central export for all learning series
 * Updated for Chapter structure (Content + Activity)
 */

import HEALTHY_CONFLICT_SERIES, {
  getChapterById,
  getNextChapter,
  getContentScreenCount,
  hasActivityType,
  getChaptersByActivityType,
} from './healthy-conflict';
import FEEL_CLOSER_SERIES from './feel-closer';
import CLEAR_CONVERSATION_SERIES from './clear-conversation';

// All available series
export const ALL_SERIES = [
  HEALTHY_CONFLICT_SERIES,
  FEEL_CLOSER_SERIES,
  CLEAR_CONVERSATION_SERIES,
];

// Get series by ID
export function getSeriesById(seriesId) {
  return ALL_SERIES.find(s => s.id === seriesId);
}

// Get chapter from any series
export function getChapterFromAnySeries(chapterId) {
  for (const series of ALL_SERIES) {
    const chapter = series.chapters.find(c => c.id === chapterId);
    if (chapter) {
      return { chapter, series };
    }
  }
  return null;
}

// Get total duration for a series
export function getSeriesDuration(seriesId) {
  const series = getSeriesById(seriesId);
  if (!series) return 0;
  return series.chapters.reduce((acc, chapter) => acc + chapter.durationMin, 0);
}

// Get chapter count for a series
export function getChapterCount(seriesId) {
  const series = getSeriesById(seriesId);
  return series ? series.chapters.length : 0;
}

// Legacy support: Map bite functions to chapter functions
// This helps during migration
export function getBiteById(biteId) {
  // Try to find as chapter ID
  const result = getChapterFromAnySeries(biteId);
  if (result) {
    // Return in bite-like format for backward compatibility
    return {
      id: result.chapter.id,
      order: result.chapter.number,
      title: result.chapter.title,
      subtitle: result.chapter.subtitle,
      durationMin: result.chapter.durationMin,
      screens: result.chapter.content.screens,
      // Add chapter-specific fields
      _isChapter: true,
      content: result.chapter.content,
      activity: result.chapter.activity,
    };
  }
  return null;
}

export function getNextBite(currentBiteId) {
  const result = getChapterFromAnySeries(currentBiteId);
  if (!result) return null;

  const nextChapter = result.series.chapters.find(
    c => c.number === result.chapter.number + 1
  );

  if (nextChapter) {
    return {
      id: nextChapter.id,
      order: nextChapter.number,
      title: nextChapter.title,
      subtitle: nextChapter.subtitle,
      durationMin: nextChapter.durationMin,
      screens: nextChapter.content.screens,
      _isChapter: true,
      content: nextChapter.content,
      activity: nextChapter.activity,
    };
  }
  return null;
}

export function getScreenCount(biteId) {
  const result = getChapterFromAnySeries(biteId);
  return result ? result.chapter.content.screens.length : 0;
}

// Legacy alias for backward compatibility
export const getBiteFromAnySeries = getChapterFromAnySeries;

// Export individual series
export {
  HEALTHY_CONFLICT_SERIES,
  FEEL_CLOSER_SERIES,
  CLEAR_CONVERSATION_SERIES,
  getChapterById,
  getNextChapter,
  getContentScreenCount,
  hasActivityType,
  getChaptersByActivityType,
};
