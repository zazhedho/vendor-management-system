import React from 'react';
import { Card, Badge } from '../ui';
import { Mail, Phone, MapPin, Building, CreditCard } from 'lucide-react';
import { Vendor, VendorProfile } from '../../types';

interface VendorInfoCardProps {
  vendor: Vendor | null;
  profile: VendorProfile | null;
}

const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'danger';
    default: return 'secondary';
  }
};

export const VendorInfoCard: React.FC<VendorInfoCardProps> = ({ vendor, profile }) => {
  if (!vendor && !profile) return null;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-secondary-900">Vendor Information</h2>
          {vendor?.status && (
            <Badge variant={getStatusVariant(vendor.status)} className="capitalize">
              {vendor.status}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile?.email && (
            <div className="flex items-start gap-3">
              <Mail className="text-primary-600 mt-1" size={18} />
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Email</p>
                <p className="text-sm text-secondary-900">{profile.email}</p>
              </div>
            </div>
          )}

          {profile?.phone && (
            <div className="flex items-start gap-3">
              <Phone className="text-primary-600 mt-1" size={18} />
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Phone</p>
                <p className="text-sm text-secondary-900">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile?.address && (
            <div className="flex items-start gap-3">
              <MapPin className="text-primary-600 mt-1" size={18} />
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Address</p>
                <p className="text-sm text-secondary-900">{profile.address}</p>
                {(profile.city_name || profile.province_name) && (
                  <p className="text-xs text-secondary-500">{[profile.city_name, profile.province_name].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {profile?.business_field && (
            <div className="flex items-start gap-3">
              <Building className="text-primary-600 mt-1" size={18} />
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Business Field</p>
                <p className="text-sm text-secondary-900">{profile.business_field}</p>
              </div>
            </div>
          )}

          {profile?.bank_name && (
            <div className="flex items-start gap-3">
              <CreditCard className="text-primary-600 mt-1" size={18} />
              <div>
                <p className="text-xs text-secondary-500 uppercase tracking-wide">Bank Information</p>
                <p className="text-sm text-secondary-900">{profile.bank_name}</p>
                {profile.account_number && <p className="text-xs text-secondary-500">{profile.account_number}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
