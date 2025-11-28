export interface Vendor {
    id: string;
    user_id: string;
    vendor_type: 'perusahaan' | 'perorangan';
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at?: string;
}

export interface VendorProfile {
    id: string;
    vendor_id: string;
    vendor_name: string;
    email: string;
    phone?: string;
    fax?: string;
    mobile?: string;
    province: string;
    city: string;
    district: string;
    address: string;
    business_field: string;
    npwp_number: string;
    npwp_name: string;
    npwp_address: string;
    npwp_file_path?: string;
    bank_name: string;
    bank_branch: string;
    account_number: string;
    account_holder_name: string;
    bank_book_file_path?: string;
    transaction_type: string;
    purch_group: string;
    region_or_so: string;
    nik: string;
    ktp_file_path?: string;
    created_at: string;
    updated_at?: string;
}

export interface VendorData {
    vendor: Vendor;
    profile: VendorProfile | null;
}

export interface VendorProfileRequest {
    vendor_type?: 'perusahaan' | 'perorangan';
    vendor_name: string;
    email: string;
    telephone?: string;
    fax?: string;
    mobile?: string;
    province: string;
    city: string;
    district: string;
    address: string;
    business_field: string;
    npwp_number: string;
    npwp_name: string;
    npwp_address: string;
    npwp_file_path?: string;
    bank_name: string;
    bank_branch: string;
    account_number: string;
    account_holder_name: string;
    bank_book_file_path?: string;
    transaction_type: string;
    purch_group: string;
    region_or_so: string;
    nik: string;
    ktp_file_path?: string;
}

export interface UpdateVendorStatusRequest {
    status: 'pending' | 'approved' | 'rejected';
}
