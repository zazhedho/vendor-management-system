import { z } from 'zod';

export const vendorProfileSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  business_type: z.string().optional(),
  tax_id: z.string().optional(),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
  event_type: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
});

export const paymentSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
});

export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
