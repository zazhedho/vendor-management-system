import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui';

/**
 * VendorProfileRedirect - Redirect component for /vendor/profile route
 * 
 * Redirects based on RBAC permissions:
 * - Users with 'vendor.list' permission → /vendors (admin list view)
 * - Users with 'vendor.view' permission only → /vendor/profile/detail (own profile)
 */
export const VendorProfileRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, isLoading } = useAuth();

  const canListVendors = hasPermission('vendor', 'list');
  const canViewVendor = hasPermission('vendor', 'view');

  useEffect(() => {
    if (isLoading) return;

    if (canListVendors) {
      // Admin/Client with list permission → vendor list page
      navigate('/vendors', { replace: true });
    } else if (canViewVendor) {
      // Vendor with view permission only → own profile detail
      navigate('/vendor/profile/detail', { replace: true });
    } else {
      // No permission → redirect to home
      navigate('/', { replace: true });
    }
  }, [canListVendors, canViewVendor, isLoading, navigate]);

  return (
    <div className="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
  );
};
