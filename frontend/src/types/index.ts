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
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface VendorProfile {
  id: string;
  vendor_id: string;
  vendor_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  business_field?: string;
  npwp_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  created_by_user_id: string;
  winner_vendor_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface EventSubmission {
  id: string;
  event_id: string;
  vendor_id: string;
  pitch_file_path?: string;
  proposal_details?: string;
  score?: number;
  is_shortlisted: boolean;
  is_winner: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  invoice_number: string;
  vendor_id: string;
  amount: string;
  status: string;
  payment_date?: string;
  transfer_proof_path?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Evaluation {
  id: string;
  event_id: string;
  vendor_id: string;
  evaluator_user_id: string;
  overall_rating?: number;
  comments?: string;
  photos?: EvaluationPhoto[];
  created_at: string;
  updated_at?: string;
}

export interface EvaluationPhoto {
  id: string;
  evaluation_id: string;
  photo_path: string;
  review?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
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
