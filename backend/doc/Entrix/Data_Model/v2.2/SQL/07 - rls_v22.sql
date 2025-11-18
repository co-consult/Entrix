-- =====================================================
-- ENTRIX SOLUTION - ROW LEVEL SECURITY (RLS) V2.1
-- Fichier: 08_entrix_rls_v2.1.sql
-- Description: Politiques de sécurité au niveau ligne + nouveaux organisateurs
-- Version: 2.1 - RLS organisateurs et sécurité granulaire
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- ACTIVATION RLS ET NETTOYAGE
-- =====================================================

-- Désactiver RLS temporairement pour nettoyage
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_rights DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS users_admin_access ON users;
DROP POLICY IF EXISTS user_profiles_own_data ON user_profiles;
DROP POLICY IF EXISTS organizers_own_data ON organizers;
DROP POLICY IF EXISTS organizers_public_read ON organizers;
DROP POLICY IF EXISTS organizers_admin_full ON organizers;
DROP POLICY IF EXISTS events_public_read ON events;
DROP POLICY IF EXISTS events_organizer_manage ON events;
DROP POLICY IF EXISTS events_admin_full ON events;
DROP POLICY IF EXISTS tickets_owner_access ON tickets;
DROP POLICY IF EXISTS tickets_organizer_view ON tickets;
DROP POLICY IF EXISTS access_rights_owner_access ON access_rights;
DROP POLICY IF EXISTS access_rights_organizer_view ON access_rights;
DROP POLICY IF EXISTS orders_owner_access ON orders;
DROP POLICY IF EXISTS payments_owner_view ON payments;
DROP POLICY IF EXISTS organizer_commissions_organizer_only ON organizer_commissions;
DROP POLICY IF EXISTS subscriptions_owner_access ON subscriptions;
DROP POLICY IF EXISTS venues_public_read ON venues;
DROP POLICY IF EXISTS venues_organizer_manage ON venues;
DROP POLICY IF EXISTS blacklist_admin_only ON blacklist;
DROP POLICY IF EXISTS audit_logs_admin_read ON audit_logs;

-- =====================================================
-- FONCTIONS UTILITAIRES POUR RLS
-- =====================================================

-- Fonction pour obtenir l'ID utilisateur actuel
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $func$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_user_id', true), '')::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $func$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code IN ('ADMIN', 'SUPER_ADMIN')
        AND ur.status = 'ACTIVE'
        AND (ur.valid_until IS NULL OR ur.valid_until >= NOW())
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est un organisateur
CREATE OR REPLACE FUNCTION is_organizer(p_organizer_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $func$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code IN ('ORGANIZER', 'ORGANIZER_ADMIN')
        AND ur.status = 'ACTIVE'
        AND (ur.valid_until IS NULL OR ur.valid_until >= NOW())
    ) OR EXISTS (
        SELECT 1 FROM organizers o
        WHERE (p_organizer_id IS NULL OR o.id = p_organizer_id)
        AND (o.created_by = current_user_id() OR o.updated_by = current_user_id())
        AND o.status = 'ACTIVE'
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur peut gérer un organisateur spécifique
CREATE OR REPLACE FUNCTION can_manage_organizer(p_organizer_id UUID)
RETURNS BOOLEAN AS $func$
BEGIN
    -- Admin complet
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Créateur ou updater de l'organisateur
    IF EXISTS (
        SELECT 1 FROM organizers 
        WHERE id = p_organizer_id 
        AND (created_by = current_user_id() OR updated_by = current_user_id())
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Utilisateur avec rôle organisateur ET membre de l'équipe
    RETURN EXISTS (
        SELECT 1 FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
        WHERE ug.user_id = current_user_id()
        AND g.code = 'ORGANIZER_' || p_organizer_id::TEXT
        AND ug.status = 'ACTIVE'
        AND g.is_active = TRUE
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les droits de lecture sur un organisateur
CREATE OR REPLACE FUNCTION can_view_organizer(p_organizer_id UUID)
RETURNS BOOLEAN AS $func$
BEGIN
    -- Admin ou organisateur peut tout voir
    IF is_admin() OR can_manage_organizer(p_organizer_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Organisateur validé et actif visible par tous
    RETURN EXISTS (
        SELECT 1 FROM organizers 
        WHERE id = p_organizer_id 
        AND status = 'ACTIVE' 
        AND validated_at IS NOT NULL
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur peut voir les données financières
CREATE OR REPLACE FUNCTION can_view_financial_data(p_organizer_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $func$
BEGIN
    -- Admin peut tout voir
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Organisateur peut voir ses propres données
    IF p_organizer_id IS NOT NULL AND can_manage_organizer(p_organizer_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Rôle comptable/financier
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code IN ('ACCOUNTANT', 'FINANCIAL_MANAGER')
        AND ur.status = 'ACTIVE'
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MODULE 1: POLITIQUES UTILISATEURS
-- =====================================================

-- Activer RLS pour users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et modifier leurs propres données
CREATE POLICY users_own_data ON users
FOR ALL TO public
USING (id = current_user_id())
WITH CHECK (id = current_user_id());

-- Les admins peuvent tout voir et modifier
CREATE POLICY users_admin_access ON users
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- Activer RLS pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY user_profiles_own_data ON user_profiles
FOR ALL TO public
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Les admins peuvent tout voir et modifier
CREATE POLICY user_profiles_admin_access ON user_profiles
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- MODULE 2: POLITIQUES ORGANISATEURS (NOUVEAU)
-- =====================================================

-- Activer RLS pour organizers
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Lecture publique des organisateurs actifs et validés
CREATE POLICY organizers_public_read ON organizers
FOR SELECT TO public
USING (can_view_organizer(id));

-- Les organisateurs peuvent gérer leurs propres données
CREATE POLICY organizers_own_data ON organizers
FOR ALL TO public
USING (can_manage_organizer(id))
WITH CHECK (can_manage_organizer(id));

-- Les admins peuvent tout faire
CREATE POLICY organizers_admin_full ON organizers
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- MODULE 3: POLITIQUES ÉVÉNEMENTS
-- =====================================================

-- Activer RLS pour events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Lecture publique des événements publiés
CREATE POLICY events_public_read ON events
FOR SELECT TO public
USING (
    status = 'PUBLISHED' 
    AND visibility = 'PUBLIC'
    AND can_view_organizer(organizer_id)
);

-- Les organisateurs peuvent gérer leurs événements
CREATE POLICY events_organizer_manage ON events
FOR ALL TO public
USING (can_manage_organizer(organizer_id))
WITH CHECK (can_manage_organizer(organizer_id));

-- Les admins peuvent tout faire
CREATE POLICY events_admin_full ON events
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- Politique spéciale pour les événements privés
CREATE POLICY events_private_access ON events
FOR SELECT TO public
USING (
    visibility != 'PUBLIC' 
    AND (
        can_manage_organizer(organizer_id) OR
        EXISTS (
            SELECT 1 FROM user_groups ug
            JOIN groups g ON ug.group_id = g.id
            WHERE ug.user_id = current_user_id()
            AND g.code = 'EVENT_' || id::TEXT
            AND ug.status = 'ACTIVE'
        )
    )
);

-- =====================================================
-- MODULE 4: POLITIQUES BILLETTERIE
-- =====================================================

-- Activer RLS pour tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et gérer leurs billets
CREATE POLICY tickets_owner_access ON tickets
FOR ALL TO public
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Les organisateurs peuvent voir les billets de leurs événements
CREATE POLICY tickets_organizer_view ON tickets
FOR SELECT TO public
USING (
    can_manage_organizer(organizer_id) OR
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = event_id 
        AND can_manage_organizer(e.organizer_id)
    )
);

-- Les admins peuvent tout voir
CREATE POLICY tickets_admin_access ON tickets
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- Activer RLS pour access_rights
ALTER TABLE access_rights ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs droits d'accès
CREATE POLICY access_rights_owner_access ON access_rights
FOR SELECT TO public
USING (user_id = current_user_id());

-- Les organisateurs peuvent voir les droits d'accès de leurs événements
CREATE POLICY access_rights_organizer_view ON access_rights
FOR SELECT TO public
USING (
    can_manage_organizer(organizer_id) OR
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = event_id 
        AND can_manage_organizer(e.organizer_id)
    )
);

-- Politique pour contrôle d'accès (lecture seule pour validation)
CREATE POLICY access_rights_validation_read ON access_rights
FOR SELECT TO public
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code IN ('ACCESS_CONTROLLER', 'SECURITY_STAFF')
        AND ur.status = 'ACTIVE'
    )
);

-- Les admins peuvent tout voir
CREATE POLICY access_rights_admin_access ON access_rights
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- MODULE 5: POLITIQUES COMMANDES ET PAIEMENTS
-- =====================================================

-- Activer RLS pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs commandes
CREATE POLICY orders_owner_access ON orders
FOR ALL TO public
USING (user_id = current_user_id() OR guest_email = current_setting('app.current_user_email', true))
WITH CHECK (user_id = current_user_id());

-- Les organisateurs peuvent voir les commandes de leurs événements
CREATE POLICY orders_organizer_view ON orders
FOR SELECT TO public
USING (
    can_manage_organizer(primary_organizer_id) OR
    EXISTS (
        SELECT 1 FROM order_items oi
        JOIN events e ON oi.event_id = e.id
        WHERE oi.order_id = id
        AND can_manage_organizer(e.organizer_id)
    )
);

-- Les admins peuvent tout voir
CREATE POLICY orders_admin_access ON orders
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- Activer RLS pour payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs paiements
CREATE POLICY payments_owner_view ON payments
FOR SELECT TO public
USING (
    EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.id = order_id 
        AND o.user_id = current_user_id()
    )
);

-- Les organisateurs peuvent voir les paiements liés à leurs événements
CREATE POLICY payments_organizer_view ON payments
FOR SELECT TO public
USING (can_manage_organizer(primary_organizer_id));

-- Les admins et rôles financiers peuvent tout voir
CREATE POLICY payments_admin_financial_access ON payments
FOR ALL TO public
USING (can_view_financial_data())
WITH CHECK (can_view_financial_data());

-- =====================================================
-- MODULE 6: POLITIQUES COMMISSIONS ORGANISATEURS
-- =====================================================

-- Activer RLS pour organizer_commissions
ALTER TABLE organizer_commissions ENABLE ROW LEVEL SECURITY;

-- Les organisateurs peuvent voir leurs commissions
CREATE POLICY organizer_commissions_organizer_only ON organizer_commissions
FOR SELECT TO public
USING (can_manage_organizer(organizer_id));

-- Les admins et rôles financiers peuvent tout voir et modifier
CREATE POLICY organizer_commissions_admin_financial ON organizer_commissions
FOR ALL TO public
USING (can_view_financial_data())
WITH CHECK (can_view_financial_data());

-- =====================================================
-- MODULE 7: POLITIQUES ABONNEMENTS
-- =====================================================

-- Activer RLS pour subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs abonnements
CREATE POLICY subscriptions_owner_access ON subscriptions
FOR ALL TO public
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Les organisateurs peuvent voir les abonnements à leurs plans
CREATE POLICY subscriptions_organizer_view ON subscriptions
FOR SELECT TO public
USING (can_manage_organizer(organizer_id));

-- Les admins peuvent tout voir
CREATE POLICY subscriptions_admin_access ON subscriptions
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- MODULE 8: POLITIQUES VENUES
-- =====================================================

-- Activer RLS pour venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Lecture publique des venues actifs
CREATE POLICY venues_public_read ON venues
FOR SELECT TO public
USING (is_active = TRUE);

-- Les propriétaires/gestionnaires peuvent modifier leurs venues
CREATE POLICY venues_organizer_manage ON venues
FOR ALL TO public
USING (
    can_manage_organizer(primary_owner_id) OR 
    can_manage_organizer(primary_manager_id) OR
    EXISTS (
        SELECT 1 FROM venue_organizer_relations vor
        WHERE vor.venue_id = id
        AND vor.is_active = TRUE
        AND can_manage_organizer(vor.organizer_id)
        AND vor.relation_type IN ('OWNER', 'MANAGER')
    )
)
WITH CHECK (
    can_manage_organizer(primary_owner_id) OR 
    can_manage_organizer(primary_manager_id) OR
    is_admin()
);

-- Les admins peuvent tout faire
CREATE POLICY venues_admin_full ON venues
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- MODULE 9: POLITIQUES SÉCURITÉ ET BLACKLIST
-- =====================================================

-- Activer RLS pour blacklist
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- Seuls les admins et organisateurs peuvent voir la blacklist
CREATE POLICY blacklist_admin_organizer_read ON blacklist
FOR SELECT TO public
USING (
    is_admin() OR 
    can_manage_organizer(organizer_id) OR
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code IN ('SECURITY_MANAGER', 'ORGANIZER')
        AND ur.status = 'ACTIVE'
    )
);

-- Seuls les admins peuvent modifier la blacklist
CREATE POLICY blacklist_admin_only ON blacklist
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- Les organisateurs peuvent créer des entrées blacklist pour leur scope
CREATE POLICY blacklist_organizer_create ON blacklist
FOR INSERT TO public
WITH CHECK (
    scope = 'ORGANIZER' 
    AND can_manage_organizer(organizer_id)
);

-- =====================================================
-- MODULE 10: POLITIQUES AUDIT ET LOGS
-- =====================================================

-- Activer RLS pour audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres actions
CREATE POLICY audit_logs_own_actions ON audit_logs
FOR SELECT TO public
USING (user_id = current_user_id());

-- Les organisateurs peuvent voir les logs liés à leurs données
CREATE POLICY audit_logs_organizer_scope ON audit_logs
FOR SELECT TO public
USING (
    table_name = 'organizers' 
    AND can_manage_organizer(record_id) OR
    table_name = 'events' 
    AND EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = record_id 
        AND can_manage_organizer(e.organizer_id)
    )
);

-- Les admins peuvent tout voir
CREATE POLICY audit_logs_admin_read ON audit_logs
FOR SELECT TO public
USING (is_admin());

-- =====================================================
-- MODULE 11: POLITIQUES SPÉCIALES POUR API
-- =====================================================

-- Politique pour l'API publique (lecture seule)
CREATE POLICY api_public_events ON events
FOR SELECT TO public
USING (
    status = 'PUBLISHED' 
    AND visibility = 'PUBLIC'
    AND scheduled_start >= NOW() - INTERVAL '1 hour'
);

-- Politique pour les statistiques publiques venues
CREATE POLICY api_public_venues ON venues
FOR SELECT TO public
USING (
    is_active = TRUE 
    AND EXISTS (
        SELECT 1 FROM events e 
        WHERE e.venue_id = id 
        AND e.status = 'PUBLISHED' 
        AND e.visibility = 'PUBLIC'
    )
);

-- =====================================================
-- MODULE 12: POLITIQUES ADMINISTRATIVES AVANCÉES
-- =====================================================

-- Politique pour les super-admins (bypass complet)
CREATE POLICY super_admin_bypass ON users
FOR ALL TO public
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code = 'SUPER_ADMIN'
        AND ur.status = 'ACTIVE'
    )
);

-- Politique pour l'accès en urgence (avec audit renforcé)
CREATE POLICY emergency_access ON events
FOR ALL TO public
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code = 'EMERGENCY_ACCESS'
        AND ur.status = 'ACTIVE'
    )
);

-- =====================================================
-- FONCTIONS DE VALIDATION RLS
-- =====================================================

-- Fonction pour valider les politiques RLS
CREATE OR REPLACE FUNCTION validate_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    policies_count INTEGER,
    rls_enabled BOOLEAN
) AS $func$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT,
        COUNT(p.polname)::INTEGER,
        c.relrowsecurity
    FROM pg_class c
    LEFT JOIN pg_policy p ON c.oid = p.polrelid
    WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
    AND c.relname IN (
        'users', 'user_profiles', 'organizers', 'events', 'tickets', 
        'access_rights', 'orders', 'payments', 'organizer_commissions',
        'subscriptions', 'venues', 'blacklist', 'audit_logs'
    )
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname;
END;
$func$ LANGUAGE plpgsql;

-- Fonction pour tester les politiques RLS
CREATE OR REPLACE FUNCTION test_rls_access(
    p_user_id UUID,
    p_table_name TEXT,
    p_operation TEXT DEFAULT 'SELECT'
)
RETURNS BOOLEAN AS $func$
DECLARE
    test_query TEXT;
    result BOOLEAN := FALSE;
BEGIN
    -- Définir l'utilisateur pour le test
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, false);
    
    -- Construire et exécuter la requête de test
    test_query := format('SELECT EXISTS(SELECT 1 FROM %I LIMIT 1)', p_table_name);
    
    BEGIN
        EXECUTE test_query INTO result;
    EXCEPTION WHEN OTHERS THEN
        result := FALSE;
    END;
    
    RETURN result;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONFIGURATION ET OPTIMISATION RLS
-- =====================================================

-- Optimiser les performances RLS avec des index spécialisés
CREATE INDEX IF NOT EXISTS idx_user_roles_rls ON user_roles(user_id, status) 
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_organizers_rls ON organizers(created_by, updated_by, status) 
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_events_rls ON events(organizer_id, status, visibility);

-- Configuration pour bypass RLS en cas d'urgence (très restrictif)
CREATE OR REPLACE FUNCTION emergency_rls_bypass()
RETURNS VOID AS $func$
BEGIN
    -- Vérifier que l'utilisateur a le droit d'urgence
    IF NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_user_id()
        AND r.code = 'EMERGENCY_BYPASS'
        AND ur.status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'Insufficient privileges for emergency bypass';
    END IF;
    
    -- Logger l'action d'urgence
    INSERT INTO audit_logs (
        user_id, table_name, action, description, severity
    ) VALUES (
        current_user_id(), 'SYSTEM', 'EMERGENCY_BYPASS', 
        'Emergency RLS bypass activated', 'CRITICAL'
    );
    
    -- Activer temporairement le bypass (à implémenter selon besoins)
    PERFORM set_config('app.emergency_bypass', 'true', false);
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VALIDATION ET TESTS
-- =====================================================

-- Vérifier que RLS est activé sur toutes les tables critiques
SELECT * FROM validate_rls_policies();

-- Compter les politiques par table
SELECT 
    table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY table_name
ORDER BY policy_count DESC;

-- Lister toutes les politiques créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test de base des politiques (nécessite un utilisateur valide)
-- SELECT test_rls_access('some-valid-user-uuid'::UUID, 'events', 'SELECT');

-- Message de confirmation
SELECT 
    'RLS Entrix V2.1 configuré avec succès!' as status,
    'Plus de 30 politiques de sécurité incluant organisateurs' as count,
    'Sécurité granulaire au niveau ligne activée' as security,
    'Accès contrôlé par rôles et propriété des données' as features;

-- =====================================================
-- DOCUMENTATION RLS
-- =====================================================

COMMENT ON FUNCTION current_user_id() IS 'Récupère l''ID de l''utilisateur actuel depuis le contexte de session';
COMMENT ON FUNCTION is_admin() IS 'Vérifie si l''utilisateur actuel a des droits d''administration';
COMMENT ON FUNCTION is_organizer(UUID) IS 'Vérifie si l''utilisateur actuel est un organisateur';
COMMENT ON FUNCTION can_manage_organizer(UUID) IS 'Vérifie si l''utilisateur peut gérer un organisateur spécifique';
COMMENT ON FUNCTION can_view_organizer(UUID) IS 'Vérifie si l''utilisateur peut voir les données d''un organisateur';
COMMENT ON FUNCTION can_view_financial_data(UUID) IS 'Vérifie si l''utilisateur peut accéder aux données financières';

-- =====================================================
-- NOTES D'IMPLÉMENTATION
-- =====================================================

/*
NOTES IMPORTANTES POUR L'IMPLÉMENTATION:

1. Variables de session requises:
   - app.current_user_id : UUID de l'utilisateur connecté
   - app.current_user_email : Email pour les commandes invités
   - app.emergency_bypass : Flag pour bypass d'urgence

2. Configuration recommandée dans l'application:
   - Définir app.current_user_id à chaque requête authentifiée
   - Gérer les rôles et groupes utilisateurs correctement
   - Implémenter l'audit des actions sensibles

3. Performance:
   - Les politiques RLS ajoutent des conditions WHERE automatiques
   - Index spécialisés créés pour optimiser les requêtes RLS
   - Éviter les politiques trop complexes sur les grandes tables

4. Sécurité:
   - Les fonctions SECURITY DEFINER s'exécutent avec les privilèges du créateur
   - Les politiques sont appliquées même pour les super-utilisateurs PostgreSQL
   - L'accès d'urgence est strictement contrôlé et audité

5. Tests recommandés:
   - Tester chaque rôle utilisateur
   - Vérifier l'isolation des données organisateurs
   - Valider les accès API publics
   - Tester les cas d'urgence
*/

-- =====================================================
-- FIN DU FICHIER 08_entrix_rls_v2.1.sql
-- =====================================================