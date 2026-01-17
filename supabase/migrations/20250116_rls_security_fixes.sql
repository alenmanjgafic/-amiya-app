-- ═══════════════════════════════════════════════════════════════════════════
-- RLS SECURITY FIXES für Amiya App
-- Datum: 2025-01-16
--
-- Behebt folgende Sicherheitslücken:
-- 1. invite_codes: Alle pending Codes waren für jeden sichtbar
-- 2. couples: Beliebige user_a_id konnte gesetzt werden
-- 3. agreement_checkins: Check-ins für fremde Agreements möglich
-- 4. sessions: Sessions für fremde Couples erstellbar
-- 5. user_bite_progress/responses: FOR ALL ohne WITH CHECK
-- 6. DELETE Policies fehlten komplett
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SCHRITT 1: Alte unsichere Policies löschen
-- ═══════════════════════════════════════════════════════════════════════════

-- invite_codes: Die problematische "Anyone can validate" Policy entfernen
DROP POLICY IF EXISTS "Anyone can validate codes" ON invite_codes;

-- couples: Die unsichere INSERT Policy entfernen
DROP POLICY IF EXISTS "Users can create couple" ON couples;

-- agreement_checkins: Die unvollständige INSERT Policy entfernen
DROP POLICY IF EXISTS "Users can create own checkins" ON agreement_checkins;

-- sessions: Die unvollständige INSERT Policy entfernen
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;

-- user_bite_progress: FOR ALL Policy ohne WITH CHECK entfernen
DROP POLICY IF EXISTS "Users can manage own progress" ON user_bite_progress;
DROP POLICY IF EXISTS "Users can read own progress" ON user_bite_progress;

-- user_bite_responses: FOR ALL Policy ohne WITH CHECK entfernen
DROP POLICY IF EXISTS "Users can manage own responses" ON user_bite_responses;
DROP POLICY IF EXISTS "Users can read own responses" ON user_bite_responses;


-- ═══════════════════════════════════════════════════════════════════════════
-- SCHRITT 2: Sichere Policies erstellen
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- INVITE_CODES: Code-Validierung nur noch via API (Service Role)
-- Keine SELECT Policy für fremde Codes mehr!
-- ───────────────────────────────────────────────────────────────────────────

-- (Keine neue Policy - Validierung läuft über /api/couple/pair mit Service Role)


-- ───────────────────────────────────────────────────────────────────────────
-- COUPLES: INSERT nur noch via API (Service Role)
-- Verhindert dass User beliebige Partner-IDs setzen
-- ───────────────────────────────────────────────────────────────────────────

-- (Keine neue INSERT Policy - Couple-Erstellung läuft über /api/couple/pair)


-- ───────────────────────────────────────────────────────────────────────────
-- AGREEMENT_CHECKINS: Prüft ob Agreement zum eigenen Couple gehört
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can create own checkins"
ON agreement_checkins FOR INSERT
WITH CHECK (
  -- User muss der eingeloggte User sein (Spalte heißt checked_in_by)
  checked_in_by = auth.uid()
  -- UND das Agreement muss zum eigenen Couple gehören
  AND agreement_id IN (
    SELECT a.id
    FROM agreements a
    WHERE a.couple_id IN (
      SELECT p.couple_id
      FROM profiles p
      WHERE p.id = auth.uid()
    )
  )
);


-- ───────────────────────────────────────────────────────────────────────────
-- SESSIONS: Prüft ob couple_id zum eigenen Couple gehört
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can create own sessions"
ON sessions FOR INSERT
WITH CHECK (
  -- User muss der eingeloggte User sein
  user_id = auth.uid()
  -- UND entweder keine couple_id (Solo) oder eigene couple_id
  AND (
    couple_id IS NULL
    OR couple_id IN (
      SELECT p.couple_id
      FROM profiles p
      WHERE p.id = auth.uid()
    )
  )
);


-- ───────────────────────────────────────────────────────────────────────────
-- USER_BITE_PROGRESS: Sichere FOR ALL Policy mit WITH CHECK
-- ───────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bite_progress') THEN
    -- SELECT: Nur eigene Daten lesen
    EXECUTE 'CREATE POLICY "Users can read own progress"
      ON user_bite_progress FOR SELECT
      USING (user_id = auth.uid())';

    -- INSERT: Nur mit eigener user_id
    EXECUTE 'CREATE POLICY "Users can insert own progress"
      ON user_bite_progress FOR INSERT
      WITH CHECK (user_id = auth.uid())';

    -- UPDATE: Nur eigene Daten ändern
    EXECUTE 'CREATE POLICY "Users can update own progress"
      ON user_bite_progress FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';

    -- DELETE: Nur eigene Daten löschen
    EXECUTE 'CREATE POLICY "Users can delete own progress"
      ON user_bite_progress FOR DELETE
      USING (user_id = auth.uid())';
  END IF;
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- USER_BITE_RESPONSES: Sichere Policies
-- ───────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bite_responses') THEN
    EXECUTE 'CREATE POLICY "Users can read own responses"
      ON user_bite_responses FOR SELECT
      USING (user_id = auth.uid())';

    EXECUTE 'CREATE POLICY "Users can insert own responses"
      ON user_bite_responses FOR INSERT
      WITH CHECK (user_id = auth.uid())';

    EXECUTE 'CREATE POLICY "Users can update own responses"
      ON user_bite_responses FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';

    EXECUTE 'CREATE POLICY "Users can delete own responses"
      ON user_bite_responses FOR DELETE
      USING (user_id = auth.uid())';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SCHRITT 3: DELETE Policies für GDPR-Compliance
-- ═══════════════════════════════════════════════════════════════════════════

-- PROFILES: User kann eigenes Profil löschen
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (id = auth.uid());

-- SESSIONS: User kann eigene Sessions löschen
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (user_id = auth.uid());

-- INVITE_CODES: User kann eigene Codes löschen
DROP POLICY IF EXISTS "Users can delete own invite codes" ON invite_codes;
CREATE POLICY "Users can delete own invite codes"
ON invite_codes FOR DELETE
USING (user_id = auth.uid());

-- AGREEMENT_CHECKINS: User kann eigene Check-ins löschen
DROP POLICY IF EXISTS "Users can delete own checkins" ON agreement_checkins;
CREATE POLICY "Users can delete own checkins"
ON agreement_checkins FOR DELETE
USING (checked_in_by = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════
-- SCHRITT 4: RPC-Funktion für sichere Code-Validierung (Optional)
-- Falls du doch client-seitige Validierung brauchst
-- ═══════════════════════════════════════════════════════════════════════════

-- Diese Funktion gibt nur zurück ob ein Code gültig ist, nicht die Daten
CREATE OR REPLACE FUNCTION validate_invite_code(input_code TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  inviter_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Läuft mit DB-Owner Rechten, umgeht RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as is_valid,
    ic.user_id as inviter_id
  FROM invite_codes ic
  WHERE ic.code = input_code
    AND ic.status = 'pending'
    AND ic.used_by IS NULL
    AND ic.expires_at > NOW()
  LIMIT 1;

  -- Wenn nichts gefunden, leere Ergebnismenge
  -- (is_valid wird dann nicht TRUE sein)
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION: Prüfe ob alle Policies korrekt sind
-- ═══════════════════════════════════════════════════════════════════════════

-- Zeige alle Policies nach dem Update
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
