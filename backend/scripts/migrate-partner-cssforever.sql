-- CSSForever partner integration tables
-- Run: docker exec -i entrix_postgres psql -U entrix_user -d entrix_db < backend/scripts/migrate-partner-cssforever.sql

CREATE TYPE partner_subscription_type AS ENUM ('GRADIN', 'CHAISE');

CREATE TABLE IF NOT EXISTS partner_legacy_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  subscription_type partner_subscription_type NOT NULL,
  previous_season VARCHAR(20),
  stand_number VARCHAR(20),
  row_number VARCHAR(20),
  seat_number VARCHAR(20),
  linked_user_id UUID REFERENCES users(id) ON UPDATE NO ACTION,
  linked_qr_code VARCHAR(255),
  linked_serial VARCHAR(20),
  confirmed_at TIMESTAMPTZ,
  subscription_id UUID REFERENCES subscriptions(id) ON UPDATE NO ACTION,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_legacy_subscribers_type ON partner_legacy_subscribers(subscription_type);
CREATE INDEX IF NOT EXISTS idx_partner_legacy_subscribers_qr ON partner_legacy_subscribers(linked_qr_code);

CREATE TABLE IF NOT EXISTS partner_payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference VARCHAR(255) NOT NULL UNIQUE,
  subscription_id UUID REFERENCES subscriptions(id) ON UPDATE NO ACTION,
  order_id UUID REFERENCES orders(id) ON UPDATE NO ACTION,
  partner_login VARCHAR(100),
  flow_type VARCHAR(20) NOT NULL,
  amount_paid DECIMAL(12, 3),
  currency VARCHAR(3),
  response_payload JSONB,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_payment_confirmations_login ON partner_payment_confirmations(partner_login);

CREATE TABLE IF NOT EXISTS partner_api_audit_log (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip VARCHAR(45),
  api_key_prefix VARCHAR(20),
  payload_hash VARCHAR(64),
  response_status VARCHAR(10),
  error_code VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_api_audit_log_endpoint ON partner_api_audit_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_partner_api_audit_log_created ON partner_api_audit_log(created_at);
