import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Key, Lock, ArrowRight, ArrowLeft, Shield, CheckCircle, XCircle } from 'lucide-react';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Input, Card } from '../../components/ui';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSymbol: false
  });

  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'newPassword') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[^a-zA-Z0-9]/.test(value)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
    if (!allRequirementsMet) {
      toast.error('New password does not meet all requirements');
      return;
    }

    setLoading(true);

    const result = await updatePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });

    if (result.success) {
      toast.success('Password changed successfully!');
      navigate('/login');
    } else {
      toast.error(result.error || 'Failed to change password');
    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title="Change Password"
      subtitle="Update your password to keep your account secure"
    >
      <Card variant="glass" className="shadow-2xl border border-white/50 backdrop-blur-xl bg-white/95">
        <div className="mb-6 p-4 bg-gradient-to-r from-warning-50 to-orange-50 rounded-xl border border-warning-100/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-warning-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-secondary-900 mb-1">Security Update</h3>
              <p className="text-xs text-secondary-600">
                Create a strong password that meets all requirements
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Current Password"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            required
            leftIcon={<Key className="w-5 h-5" />}
          />

          <Input
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            required
            leftIcon={<Lock className="w-5 h-5" />}
          />

          {formData.newPassword && (
            <div className="p-4 bg-secondary-50 rounded-xl border border-secondary-200">
              <p className="text-sm font-semibold text-secondary-900 mb-3">Password Requirements:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.minLength ? 'text-success-600' : 'text-secondary-500'}`}>
                  {passwordValidation.minLength ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Min 8 characters</span>
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasLowercase ? 'text-success-600' : 'text-secondary-500'}`}>
                  {passwordValidation.hasLowercase ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Lowercase (a-z)</span>
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasUppercase ? 'text-success-600' : 'text-secondary-500'}`}>
                  {passwordValidation.hasUppercase ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Uppercase (A-Z)</span>
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasNumber ? 'text-success-600' : 'text-secondary-500'}`}>
                  {passwordValidation.hasNumber ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Number (0-9)</span>
                </div>
                <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasSymbol ? 'text-success-600' : 'text-secondary-500'}`}>
                  {passwordValidation.hasSymbol ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Symbol (!@#$...)</span>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            required
            leftIcon={<Lock className="w-5 h-5" />}
          />

          {formData.confirmPassword && (
            <div className={`text-xs flex items-center gap-1.5 ${formData.newPassword === formData.confirmPassword ? 'text-success-600' : 'text-danger-600'}`}>
              {formData.newPassword === formData.confirmPassword ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Passwords do not match</span>
                </>
              )}
            </div>
          )}

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            size="lg"
            rightIcon={!loading && <ArrowRight className="w-5 h-5" />}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-secondary-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-bold transition-colors hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default ChangePassword;
