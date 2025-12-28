import { supabase } from './supabase';

export const sessionsService = {
  // Create a new session
  async create(userId, type = 'solo', elevenlabsConversationId = null) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        type,
        elevenlabs_conversation_id: elevenlabsConversationId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // End a session
  async end(sessionId, summary = null, themes = []) {
    const endedAt = new Date().toISOString();
    
    // Get session to calculate duration
    const { data: session } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.floor((new Date(endedAt) - startedAt) / 1000);

    const { data, error } = await supabase
      .from('sessions')
      .update({
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        summary,
        themes,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's sessions
  async getByUser(userId, limit = 20) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get single session
  async getById(sessionId) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  },

  // Request analysis for a session
  async requestAnalysis(sessionId) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        analysis_requested: true,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Save analysis result
  async saveAnalysis(sessionId, analysis) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        analysis,
        analysis_created_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a session (for GDPR compliance)
  async delete(sessionId) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  },

  // Get session statistics
  async getStats(userId) {
    const { data, error } = await supabase
      .from('sessions')
      .select('type, duration_seconds, themes')
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    if (error) throw error;

    const totalSessions = data.length;
    const totalMinutes = Math.floor(
      data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60
    );
    
    const themeCount = {};
    data.forEach(s => {
      (s.themes || []).forEach(theme => {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
    });

    return {
      totalSessions,
      totalMinutes,
      topThemes: Object.entries(themeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme, count]) => ({ theme, count })),
    };
  },
};
