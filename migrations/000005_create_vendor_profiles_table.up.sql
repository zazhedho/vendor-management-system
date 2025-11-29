-- ================================
-- ENUM file_status
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'file_status'
    ) THEN
        CREATE TYPE file_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;


-- ================================
-- vendor_profiles table
-- ================================
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(36) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NULL,
    fax VARCHAR(50) NULL,
    phone VARCHAR(50) NULL,
    province_id VARCHAR(20) NULL,
    province_name VARCHAR(100) NULL,
    city_id VARCHAR(20) NULL,
    city_name VARCHAR(100) NULL,
    district_id VARCHAR(20) NULL,
    district_name VARCHAR(100) NULL,
    postal_code VARCHAR(10) NULL,
    address TEXT NULL,
    business_field VARCHAR(255) NULL,

    ktp_name VARCHAR(255) NULL,
    ktp_number VARCHAR(50) NULL,
    npwp_name VARCHAR(255) NULL,
    npwp_number VARCHAR(50) NULL,
    npwp_address TEXT NULL,
    tax_status VARCHAR(50) NULL,

    bank_name VARCHAR(100) NULL,
    bank_branch VARCHAR(100) NULL,
    account_number VARCHAR(50) NULL,
    account_holder_name VARCHAR(255) NULL,

    transaction_type VARCHAR(100) NULL,
    purch_group VARCHAR(100) NULL,
    region_or_so VARCHAR(100) NULL,

    contact_person VARCHAR(255) NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36) NULL,

    CONSTRAINT fk_vendor_profiles_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE CASCADE
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN vendor_profiles.tax_status IS 'PKP, non-PKP';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_vendor_id
    ON vendor_profiles(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_email
    ON vendor_profiles(email);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_deleted_at
    ON vendor_profiles(deleted_at);


-- ================================
-- updated_at trigger
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_vendor_profiles_set_updated_at'
          AND c.relname = 'vendor_profiles'
    ) THEN
        CREATE TRIGGER trg_vendor_profiles_set_updated_at
            BEFORE UPDATE ON vendor_profiles
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;


-- ================================
-- vendor_profile_files table
-- ================================
CREATE TABLE IF NOT EXISTS vendor_profile_files (
    id VARCHAR(36) PRIMARY KEY,
    vendor_profile_id VARCHAR(36) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    issued_at TIMESTAMP NULL,
    expired_at TIMESTAMP NULL,
    status file_status NOT NULL DEFAULT 'pending',
    reject_reason TEXT NULL,
    verified_at TIMESTAMP NULL,
    verified_by VARCHAR(36) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_vendor_profile_files_profile
        FOREIGN KEY (vendor_profile_id)
        REFERENCES vendor_profiles(id)
        ON DELETE CASCADE
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN vendor_profile_files.file_type IS 'ktp, npwp, bank_book, nib, siup, akta, dll';
COMMENT ON COLUMN vendor_profile_files.status IS 'pending, approved, rejected';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_vendor_profile_files_vendor_profile_id
    ON vendor_profile_files(vendor_profile_id);

CREATE INDEX IF NOT EXISTS idx_vendor_profile_files_file_type
    ON vendor_profile_files(file_type);

CREATE INDEX IF NOT EXISTS idx_vendor_profile_files_status
    ON vendor_profile_files(status);

CREATE INDEX IF NOT EXISTS idx_vendor_profile_files_deleted_at
    ON vendor_profile_files(deleted_at);
