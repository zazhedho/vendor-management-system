-- ================================
-- ENUM payment_status
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_status'
    ) THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled');
    END IF;
END$$;


-- ================================
-- payments table
-- ================================
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP NULL,
    description TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36) NULL,

    CONSTRAINT fk_payments_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_invoice UNIQUE (invoice_number)
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN payments.status IS 'pending, paid, cancelled';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number
    ON payments(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_vendor_id
    ON payments(vendor_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date
    ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_deleted_at
    ON payments(deleted_at);


-- ================================
-- updated_at trigger
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_payments_set_updated_at'
          AND c.relname = 'payments'
    ) THEN
        CREATE TRIGGER trg_payments_set_updated_at
            BEFORE UPDATE ON payments
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;


-- ================================
-- payment_files table
-- ================================
CREATE TABLE IF NOT EXISTS payment_files (
    id VARCHAR(36) PRIMARY KEY,
    payment_id VARCHAR(36) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    caption TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_payment_files_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE CASCADE
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN payment_files.file_type IS 'proof, invoice, receipt';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_payment_files_payment_id
    ON payment_files(payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_files_file_type
    ON payment_files(file_type);

CREATE INDEX IF NOT EXISTS idx_payment_files_deleted_at
    ON payment_files(deleted_at);
