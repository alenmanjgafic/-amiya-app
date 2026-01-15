-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES für Amiya App
-- Führe dieses Script im Supabase SQL Editor aus
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User kann eigenes Profil lesen
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- User kann eigenes Profil updaten
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- User kann Partner-Profil lesen (für Couple-Features)
CREATE POLICY "Users can read partner profile"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT partner_id FROM profiles WHERE id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SESSIONS Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- User kann eigene Solo-Sessions lesen
CREATE POLICY "Users can read own solo sessions"
ON sessions FOR SELECT
USING (
  user_id = auth.uid()
);

-- User kann Couple-Sessions lesen wenn Teil des Couples
CREATE POLICY "Users can read couple sessions"
ON sessions FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

-- User kann eigene Sessions erstellen
CREATE POLICY "Users can create own sessions"
ON sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- User kann eigene Sessions updaten
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. COUPLES Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- User kann eigenes Couple lesen
CREATE POLICY "Users can read own couple"
ON couples FOR SELECT
USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- User kann Couple erstellen
CREATE POLICY "Users can create couple"
ON couples FOR INSERT
WITH CHECK (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- User kann eigenes Couple updaten
CREATE POLICY "Users can update own couple"
ON couples FOR UPDATE
USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. INVITE_CODES Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- User kann eigene Codes lesen
CREATE POLICY "Users can read own invite codes"
ON invite_codes FOR SELECT
USING (user_id = auth.uid());

-- User kann Codes erstellen
CREATE POLICY "Users can create invite codes"
ON invite_codes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- User kann eigene Codes updaten
CREATE POLICY "Users can update own invite codes"
ON invite_codes FOR UPDATE
USING (user_id = auth.uid());

-- Jeder kann Code validieren (für Partner-Verbindung)
-- Aber nur das 'code' Feld, nicht user_id!
CREATE POLICY "Anyone can validate codes"
ON invite_codes FOR SELECT
USING (
  status = 'pending'
  AND expires_at > NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. AGREEMENTS Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- User kann Agreements des eigenen Couples lesen
CREATE POLICY "Users can read couple agreements"
ON agreements FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

-- User kann Agreements für eigenes Couple erstellen
CREATE POLICY "Users can create couple agreements"
ON agreements FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

-- User kann Couple-Agreements updaten
CREATE POLICY "Users can update couple agreements"
ON agreements FOR UPDATE
USING (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. AGREEMENT_CHECKINS Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE agreement_checkins ENABLE ROW LEVEL SECURITY;

-- User kann Check-ins für Couple-Agreements lesen
CREATE POLICY "Users can read couple agreement checkins"
ON agreement_checkins FOR SELECT
USING (
  agreement_id IN (
    SELECT id FROM agreements WHERE couple_id IN (
      SELECT couple_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- User kann eigene Check-ins erstellen
CREATE POLICY "Users can create own checkins"
ON agreement_checkins FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. AGREEMENT_SUGGESTIONS Tabelle
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren
ALTER TABLE agreement_suggestions ENABLE ROW LEVEL SECURITY;

-- User kann Suggestions für eigenes Couple lesen
CREATE POLICY "Users can read couple suggestions"
ON agreement_suggestions FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. USER_BITE_PROGRESS Tabelle (Learning)
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren (falls Tabelle existiert)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bite_progress') THEN
    ALTER TABLE user_bite_progress ENABLE ROW LEVEL SECURITY;

    -- User kann eigenen Fortschritt lesen
    EXECUTE 'CREATE POLICY "Users can read own progress" ON user_bite_progress FOR SELECT USING (user_id = auth.uid())';

    -- User kann eigenen Fortschritt erstellen/updaten
    EXECUTE 'CREATE POLICY "Users can manage own progress" ON user_bite_progress FOR ALL USING (user_id = auth.uid())';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. USER_BITE_RESPONSES Tabelle (Learning)
-- ═══════════════════════════════════════════════════════════════════════════

-- RLS aktivieren (falls Tabelle existiert)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bite_responses') THEN
    ALTER TABLE user_bite_responses ENABLE ROW LEVEL SECURITY;

    EXECUTE 'CREATE POLICY "Users can read own responses" ON user_bite_responses FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can manage own responses" ON user_bite_responses FOR ALL USING (user_id = auth.uid())';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- FERTIG!
-- ═══════════════════════════════════════════════════════════════════════════

-- Prüfe ob RLS aktiviert ist:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'sessions', 'couples', 'invite_codes', 'agreements');
