import React from 'react';
import { Input } from '../ui';
import { VendorProfile } from '../../types';

interface VendorFormSectionProps {
  formData: Partial<VendorProfile>;
  setFormData: (data: Partial<VendorProfile>) => void;
  provinces: any[];
  cities: any[];
  districts: any[];
  onProvinceChange: (provinceId: string) => void;
  onCityChange: (cityId: string) => void;
}

export const VendorFormSection: React.FC<VendorFormSectionProps> = ({
  formData,
  setFormData,
  provinces,
  cities,
  districts,
  onProvinceChange,
  onCityChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Vendor Name"
          required
          value={formData.vendor_name || ''}
          onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          required
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Phone"
          required
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="Telephone"
          value={formData.telephone || ''}
          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
        />
      </div>

      {/* Address */}
      <div className="space-y-4">
        <Input
          label="Address"
          required
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-secondary-800 mb-2">
              Province <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.province_id || ''}
              onChange={(e) => {
                setFormData({ ...formData, province_id: e.target.value });
                onProvinceChange(e.target.value);
              }}
              className="w-full px-4 py-3 rounded-xl border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            >
              <option value="">Select Province</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-800 mb-2">
              City <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.city_id || ''}
              onChange={(e) => {
                setFormData({ ...formData, city_id: e.target.value });
                onCityChange(e.target.value);
              }}
              className="w-full px-4 py-3 rounded-xl border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              disabled={!formData.province_id}
            >
              <option value="">Select City</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-800 mb-2">
              District
            </label>
            <select
              value={formData.district_id || ''}
              onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              disabled={!formData.city_id}
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Postal Code"
          value={formData.postal_code || ''}
          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
        />
      </div>

      {/* Business Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Business Field"
          value={formData.business_field || ''}
          onChange={(e) => setFormData({ ...formData, business_field: e.target.value })}
        />
        <Input
          label="Transaction Type"
          value={formData.transaction_type || ''}
          onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
        />
      </div>

      {/* KTP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="KTP Number"
          value={formData.ktp_number || ''}
          onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
        />
        <Input
          label="KTP Name"
          value={formData.ktp_name || ''}
          onChange={(e) => setFormData({ ...formData, ktp_name: e.target.value })}
        />
      </div>

      {/* NPWP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="NPWP Number"
          value={formData.npwp_number || ''}
          onChange={(e) => setFormData({ ...formData, npwp_number: e.target.value })}
        />
        <Input
          label="NPWP Name"
          value={formData.npwp_name || ''}
          onChange={(e) => setFormData({ ...formData, npwp_name: e.target.value })}
        />
        <Input
          label="Tax Status"
          value={formData.tax_status || ''}
          onChange={(e) => setFormData({ ...formData, tax_status: e.target.value })}
        />
      </div>

      {/* Bank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Bank Name"
          value={formData.bank_name || ''}
          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
        />
        <Input
          label="Account Number"
          value={formData.account_number || ''}
          onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
        />
        <Input
          label="Account Holder Name"
          value={formData.account_holder_name || ''}
          onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
        />
      </div>

      {/* Contact Person */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Contact Person"
          value={formData.contact_person || ''}
          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
        />
        <Input
          label="Contact Email"
          type="email"
          value={formData.contact_email || ''}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
        />
        <Input
          label="Contact Phone"
          value={formData.contact_phone || ''}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
        />
      </div>
    </div>
  );
};
