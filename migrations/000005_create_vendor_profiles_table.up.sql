CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    fax VARCHAR(20),
    mobile VARCHAR(20),
    province VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    business_field VARCHAR(255),
    npwp_number VARCHAR(50),
    npwp_name VARCHAR(255),
    npwp_address TEXT,
    npwp_file_path VARCHAR(500),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    account_number VARCHAR(50),
    account_holder_name VARCHAR(255),
    bank_book_file_path VARCHAR(500),
    transaction_type TEXT,
    purch_group VARCHAR(100),
    region_or_so VARCHAR(255),
    nik VARCHAR(20),
    ktp_file_path VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(50),
    CONSTRAINT fk_vendor_profiles_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_vendor_id ON vendor_profiles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_npwp ON vendor_profiles(npwp_number);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_nik ON vendor_profiles(nik);
