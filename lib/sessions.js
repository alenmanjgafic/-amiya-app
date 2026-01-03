/**
 * SESSIONS SERVICE - lib/sessions.js
 * Handles session CRUD operations with support for Solo and Couple sessions
 */
import { supabase } from './supabase';

export const sessionsService = {
  /**
   * Create a new session
   * @param {string} userId - The user ID
   * @param {string} type - "solo" or "couple"
   * @param {string|null} coupleId - The couple ID (for couple sessions)
   */
  async create(userId, type = "solo", coupleId = null) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        type: type,
        couple_id: coupleId,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * End a session and save the transcript + engagement metrics
   * @param {string} sessionId
   * @param {string} summary - Transcript
   * @param {Array} themes
   * @param {Object|null} engagementMetrics - Adaptive Coaching metrics
   */
  async end(sessionId, summary, themes = [], engagementMetrics = null) {
    const updateData = {
      summary: summary,
      themes: themes,
      status: 'completed',
      ended_at: new Date().toISOString(),
    };

    // Engagement-Metriken hinzufügen wenn vorhanden
    if (engagementMetrics) {
      updateData.engagement_metrics = engagementMetrics;
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Request analysis for a session
   * Returns the analysis result for memory update
   */
  async requestAnalysis(sessionId) {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze session');
      }

      // Return the full result including analysis text
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Analysis request failed:', error);
      throw error;
    }
  },

  /**
   * Get a session by ID
   */
  async getById(sessionId) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all sessions for a user
   */
  async getByUserId(userId, limit = 50) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get all couple sessions
   */
  async getByCoupleId(coupleId, limit = 50) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('type', 'couple')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Update session analysis
   */
  async updateAnalysis(sessionId, analysis, themes = []) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        analysis: analysis,
        themes: themes,
        summary: null, // Delete transcript after analysis (privacy)
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a session (used when viability check fails)
   */
  async delete(sessionId) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  }
};
