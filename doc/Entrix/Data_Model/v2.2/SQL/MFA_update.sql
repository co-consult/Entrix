-- Création de la table user_mfa_settings
CREATE TABLE user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    method mfa_method NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    backup_phone VARCHAR(20),
    totp_secret VARCHAR(255),
    backup_codes_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ(6),
    enabled_at TIMESTAMPTZ(6),
    disabled_at TIMESTAMPTZ(6),
    metadata JSONB,
    created_at TIMESTAMPTZ(6) DEFAULT now(),
    updated_at TIMESTAMPTZ(6) DEFAULT now(),
    
    -- Contraintes
    CONSTRAINT fk_user_mfa_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_mfa_settings_user_method UNIQUE (user_id, method)
);

-- Index pour performances
CREATE INDEX idx_user_mfa_settings_user ON user_mfa_settings(user_id);
CREATE INDEX idx_user_mfa_settings_method ON user_mfa_settings(method);
CREATE INDEX idx_user_mfa_settings_enabled ON user_mfa_settings(is_enabled);
CREATE INDEX idx_user_mfa_settings_primary ON user_mfa_settings(is_primary);
CREATE INDEX idx_user_mfa_settings_user_enabled ON user_mfa_settings(user_id, is_enabled);
CREATE INDEX idx_user_mfa_settings_last_used ON user_mfa_settings(last_used_at);

-- Table pour les appareils de confiance MFA
CREATE TABLE user_trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(200),
    trusted_at TIMESTAMPTZ(6) DEFAULT now(),
    expires_at TIMESTAMPTZ(6) NOT NULL,
    last_seen_at TIMESTAMPTZ(6) DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ(6) DEFAULT now(),
    
    -- Contraintes
    CONSTRAINT fk_user_trusted_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_trusted_devices_user_fingerprint UNIQUE (user_id, device_fingerprint)
);

-- Index pour user_trusted_devices
CREATE INDEX idx_user_trusted_devices_user ON user_trusted_devices(user_id);
CREATE INDEX idx_user_trusted_devices_fingerprint ON user_trusted_devices(device_fingerprint);
CREATE INDEX idx_user_trusted_devices_expires ON user_trusted_devices(expires_at);
CREATE INDEX idx_user_trusted_devices_active ON user_trusted_devices(is_active);
CREATE INDEX idx_user_trusted_devices_user_active ON user_trusted_devices(user_id, is_active);