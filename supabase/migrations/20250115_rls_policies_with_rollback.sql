-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES für Amiya App
-- Mit Rollback-Option falls etwas nicht funktioniert
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- TEIL 1: RLS POLICIES AKTIVIEREN
-- Diesen Teil im Supabase SQL Editor ausführen
-- ═══════════════════════════════════════════════════════════════════════════

-- Erst alte Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own solo sessions" ON sessions;
DROP POLICY IF EXISTS "Users can read couple sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can read own couple" ON couples;
DROP POLICY IF EXISTS "Users can create couple" ON couples;
DROP POLICY IF EXISTS "Users can update own couple" ON couples;
DROP POLICY IF EXISTS "Users can read own invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can update own invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Anyone can validate codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can read couple agreements" ON agreements;
DROP POLICY IF EXISTS "Users can create couple agreements" ON agreements;
DROP POLICY IF EXISTS "Users can update couple agreements" ON agreements;
DROP POLICY IF EXISTS "Users can read couple agreement checkins" ON agreement_checkins;
DROP POLICY IF EXISTS "Users can create own checkins" ON agreement_checkins;
DROP POLICY IF EXISTS "Users can read couple suggestions" ON agreement_suggestions;

-- Auch "Allow all" Policies löschen falls vorhanden
DROP POLICY IF EXISTS "Allow all" ON profiles;
DROP POLICY IF EXISTS "Allow all" ON sessions;
DROP POLICY IF EXISTS "Allow all" ON couples;
DROP POLICY IF EXISTS "Allow all" ON invite_codes;
DROP POLICY IF EXISTS "Allow all" ON agreements;
DROP POLICY IF EXISTS "Allow all" ON agreement_checkins;
DROP POLICY IF EXISTS "Allow all" ON agreement_suggestions;

-- RLS aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_suggestions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read partner profile" ON profiles FOR SELECT USING (id IN (SELECT partner_id FROM profiles WHERE id = auth.uid()));

-- SESSIONS
CREATE POLICY "Users can read own solo sessions" ON sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can read couple sessions" ON sessions FOR SELECT USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create own sessions" ON sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (user_id = auth.uid());

-- COUPLES
CREATE POLICY "Users can read own couple" ON couples FOR SELECT USING (user_a_id = auth.uid() OR user_b_id = auth.uid());
CREATE POLICY "Users can create couple" ON couples FOR INSERT WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());
CREATE POLICY "Users can update own couple" ON couples FOR UPDATE USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- INVITE_CODES
CREATE POLICY "Users can read own invite codes" ON invite_codes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create invite codes" ON invite_codes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own invite codes" ON invite_codes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can validate codes" ON invite_codes FOR SELECT USING (status = 'pending' AND expires_at > NOW());

-- AGREEMENTS
CREATE POLICY "Users can read couple agreements" ON agreements FOR SELECT USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create couple agreements" ON agreements FOR INSERT WITH CHECK (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update couple agreements" ON agreements FOR UPDATE USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

-- AGREEMENT_CHECKINS
CREATE POLICY "Users can read couple agreement checkins" ON agreement_checkins FOR SELECT USING (agreement_id IN (SELECT id FROM agreements WHERE couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Users can create own checkins" ON agreement_checkins FOR INSERT WITH CHECK (user_id = auth.uid());

-- AGREEMENT_SUGGESTIONS
CREATE POLICY "Users can read couple suggestions" ON agreement_suggestions FOR SELECT USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));


-- ═══════════════════════════════════════════════════════════════════════════
-- TEIL 2: ROLLBACK (NUR BEI PROBLEMEN AUSFÜHREN!)
-- Falls die App nach Teil 1 nicht funktioniert, diesen Teil ausführen
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- ROLLBACK: RLS komplett deaktivieren
-- Entferne die Kommentarzeichen (/* und */) um diesen Teil auszuführen

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_suggestions DISABLE ROW LEVEL SECURITY;

-- Danach funktioniert die App wieder wie vorher (ohne RLS-Schutz)
*/
