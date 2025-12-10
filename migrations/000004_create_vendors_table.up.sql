-- ================================
-- ENUM vendor_status
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'vendor_status'
    ) THEN
CREATE TYPE vendor_status AS ENUM (
            'pending',
            'verify',
            'rejected',
            'active',
            'suspended'
        );
END IF;
END$$;


-- ================================
-- vendors table
-- ================================
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(36) PRIMARY KEY,
    user_id UUID NOT NULL,

    vendor_type VARCHAR(50) NOT NULL DEFAULT 'company',
    status vendor_status NOT NULL DEFAULT 'pending',
    vendor_code VARCHAR(100) NULL,

    verified_at TIMESTAMP NULL,
    verified_by VARCHAR(36) NULL,
    deactivate_at TIMESTAMP NULL,
    deactivate_by VARCHAR(36) NULL,

    reject_reason TEXT NULL,
    reverify_at TIMESTAMP NULL,
    expired_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36) NULL,

    CONSTRAINT fk_vendors_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    );


-- ================================
-- Column comment
-- ================================
COMMENT ON COLUMN vendors.status
IS 'Workflow state: pending, verify, rejected, active, suspended';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_vendors_user_id
    ON vendors(user_id);

CREATE INDEX IF NOT EXISTS idx_vendors_status
    ON vendors(status);

CREATE INDEX IF NOT EXISTS idx_vendors_vendor_code
    ON vendors(vendor_code)
    WHERE vendor_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at
    ON vendors(deleted_at);


-- ================================
-- updated_at function
-- ================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ================================
-- updated_at trigger (create-once)
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_vendors_set_updated_at'
          AND c.relname = 'vendors'
    ) THEN
CREATE TRIGGER trg_vendors_set_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END$$;
