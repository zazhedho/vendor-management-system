export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions?: string[];
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export interface ApiResponse<T = any> {
  log_id: string;
  code?: number;
  status: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface PaginatedResponse<T = any> {
  log_id: string;
  code: number;
  status: boolean;
  message: string;
  total_data: number;
  total_pages: number;
  current_page: number;
  next_page: boolean;
  prev_page: boolean;
  limit: number;
  data: T[];
  error?: any;
}

export interface Vendor {
  id: string;
  user_id: string;
  vendor_type: string;
  status: string; // pending, verified, rejected, active, suspended
  verified_at?: string;
  verified_by?: string;
  deactivate_at?: string;
  reject_reason?: string;
  reverify_at?: string;
  expired_at?: string;
  profile?: VendorProfile;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface VendorProfile {
  id: string;
  vendor_id: string;
  vendor_name: string;
  email: string;
  telephone?: string;
  fax?: string;
  phone?: string;
  address?: string;
  district_id?: string;
  district_name?: string;
  city_id?: string;
  city_name?: string;
  province_id?: string;
  province_name?: string;
  postal_code?: string;
  business_field?: string;

  // KTP fields
  ktp_number?: string;
  ktp_name?: string;

  // NPWP fields
  npwp_number?: string;
  npwp_name?: string;
  npwp_address?: string;
  tax_status?: string;

  // NIB fields
  nib_number?: string;

  // Bank fields
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  account_holder_name?: string;

  // Business fields
  transaction_type?: string;
  purch_group?: string;
  region_or_so?: string;

  // Contact fields
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;

  // File relationships
  files?: VendorProfileFile[];

  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface VendorProfileFile {
  id: string;
  vendor_profile_id: string;
  file_type: string; // ktp, npwp, bank_book, nib, siup, akta
  file_url: string;
  file_order?: number;
  caption?: string;
  status: string; // pending, approved, rejected
  reject_reason?: string;
  verified_at?: string;
  verified_by?: string;
  issued_at?: string;
  expired_at?: string;
  created_at: string;
  created_by: string;
  deleted_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  status: string; // draft, open, closed, completed, cancelled
  terms_file_path?: string;
  created_by_user_id: string;
  winner_vendor_id?: string;
  winner_vendor?: Vendor;
  winner_submission?: EventSubmission;

  // File relationships
  files?: EventFile[];

  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface EventFile {
  id: string;
  event_id: string;
  file_type: string; // terms, image, document
  file_url: string;
  file_order?: number;
  caption?: string;
  created_at: string;
  created_by: string;
  deleted_at?: string;
}

export interface EventSubmission {
  id: string;
  event_id: string;
  vendor_id: string;
  proposal_details?: string;
  score?: number;
  is_shortlisted: boolean;
  is_winner: boolean;

  // Relationships
  event?: Event;
  vendor?: {
    id: string;
    vendor_type: string;
    status: string;
    profile?: VendorProfile;
  };
  files?: EventSubmissionFile[];

  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface EventSubmissionFile {
  id: string;
  event_submission_id: string;
  file_type: string; // pitch, proposal, document
  file_url: string;
  file_order?: number;
  caption?: string;
  created_at: string;
  created_by: string;
  deleted_at?: string;
}

export interface Payment {
  id: string;
  invoice_number: string;
  vendor_id: string;
  amount: string;
  status: string; // pending, paid, cancelled
  payment_date?: string;
  description?: string;

  // File relationships
  files?: PaymentFile[];

  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface PaymentFile {
  id: string;
  payment_id: string;
  file_type: string; // proof, invoice, receipt
  file_url: string;
  caption?: string;
  created_at: string;
  created_by: string;
  deleted_at?: string;
}

export interface Evaluation {
  id: string;
  event_id: string;
  vendor_id: string;
  evaluator_user_id: string;
  overall_rating?: number;
  comments?: string;

  // Relationships
  event?: Event;
  vendor?: Vendor;
  evaluator?: User;
  photos?: EvaluationPhoto[];

  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface EvaluationPhoto {
  id: string;
  evaluation_id: string;
  photo_url: string;
  review?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permission_ids?: string[];
  menu_ids?: string[];
  created_at: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at?: string;
}

export interface Menu {
  id: string;
  name: string;
  display_name: string;
  path?: string;
  icon?: string;
  parent_id?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MenuItem {
  id?: string;
  path: string | null;
  label: string;
  icon: string;
  name: string;
  parentId?: string | null;
  orderIndex?: number;
  children: MenuItem[];
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  permission?: Permission;
}

export interface RoleMenu {
  role_id: string;
  menu_id: string;
  menu?: Menu;
}
