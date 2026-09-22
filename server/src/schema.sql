CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  client_code VARCHAR(40) UNIQUE,
  full_name VARCHAR(180) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(30),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(180),
  address TEXT,
  state VARCHAR(100),
  nationality VARCHAR(100) NOT NULL DEFAULT 'Nigerian',
  passport_number VARCHAR(80),
  passport_issue_date DATE,
  passport_expiry_date DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  destination VARCHAR(120) NOT NULL,
  service_type VARCHAR(80) NOT NULL,
  total_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  opportunity_id VARCHAR(80),
  status VARCHAR(40) NOT NULL DEFAULT 'New',
  assigned_to INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
  document_type VARCHAR(100) NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
  payment_code VARCHAR(50),
  receipt_number VARCHAR(50) UNIQUE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(160),
  purpose VARCHAR(180) NOT NULL,
  notes TEXT,
  received_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80),
  entity_id VARCHAR(80),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_passport ON clients(passport_number);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS total_fee NUMERIC(14,2) NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_total_fee_nonnegative') THEN
    ALTER TABLE applications ADD CONSTRAINT applications_total_fee_nonnegative CHECK (total_fee >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_code VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_payment_code ON payments(payment_code);
UPDATE payments SET payment_code = 'ASY-PAY-' || EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::TEXT || '-' || LPAD(id::TEXT, 6, '0') WHERE payment_code IS NULL OR payment_code = '';

CREATE OR REPLACE FUNCTION set_payment_code() RETURNS trigger AS $$
BEGIN
  IF NEW.payment_code IS NULL OR NEW.payment_code = '' THEN
    NEW.payment_code := 'ASY-PAY-' || EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()))::TEXT || '-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_payment_code ON payments;
CREATE TRIGGER trg_set_payment_code
BEFORE INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION set_payment_code();

CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);

CREATE OR REPLACE FUNCTION set_client_code() RETURNS trigger AS $$
BEGIN
  IF NEW.client_code IS NULL OR NEW.client_code = '' THEN
    NEW.client_code := 'ASY-' || EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()))::TEXT || '-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_client_code ON clients;
CREATE TRIGGER trg_set_client_code
BEFORE INSERT ON clients
FOR EACH ROW EXECUTE FUNCTION set_client_code();

CREATE OR REPLACE FUNCTION set_receipt_number() RETURNS trigger AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'ASY-RCPT-' || EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()))::TEXT || '-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_receipt_number ON payments;
CREATE TRIGGER trg_set_receipt_number
BEFORE INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION set_receipt_number();


CREATE TABLE IF NOT EXISTS opportunities (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  country VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL CHECK (category IN ('Employment', 'Visa', 'Travel', 'Tour', 'Mobility', 'Other')),
  service_type VARCHAR(100),
  opportunity_code VARCHAR(80) UNIQUE,
  status VARCHAR(40) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Not Available', 'Coming Soon', 'Paused')),
  summary TEXT,
  requirements TEXT,
  partner_name VARCHAR(180),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_country ON opportunities(country);
CREATE INDEX IF NOT EXISTS idx_opportunities_updated_at ON opportunities(updated_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  link VARCHAR(180),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGSERIAL PRIMARY KEY,
  client_name VARCHAR(180) NOT NULL,
  destination VARCHAR(120),
  service_type VARCHAR(100),
  quote TEXT NOT NULL,
  consent_for_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(is_published, featured, created_at DESC);
