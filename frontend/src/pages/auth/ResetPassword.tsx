import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Lock, ArrowRight, ArrowLeft, Shield, CheckCircle, XCircle } from 'lucide-react';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Input, Card } from '../../components/ui';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
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

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Invalid password reset link.');
      navigate('/login');
    }
  }, [searchParams, navigate]);

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
      toast.error('Passwords do not match');
      return;
    }

    const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
    if (!allRequirementsMet) {
      toast.error('New password does not meet all requirements');
      return;
    }

    setLoading(true);

    const result = await resetPassword(token, formData.newPassword);

    if (result.success) {
      toast.success('Password reset successfully! 🎉');
      navigate('/login');
    } else {
      toast.error(result.error || 'Failed to reset password');
    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new strong password for your account"
    >
      <Card variant="glass" className="shadow-2xl border border-white/50 backdrop-blur-xl bg-white/95">
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-info-50 rounded-xl border border-primary-100/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-secondary-900 mb-1">Secure Password</h3>
              <p className="text-xs text-secondary-600">
                Create a strong password that meets all requirements
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            required
            minLength={8}
            leftIcon={<Lock className="w-5 h-5" />}
          />

          {formData.newPassword && (
            <div className="p-4 bg-secondary-50 rounded-xl border border-secondary-200">
              <p className="text-sm font-semibold text-secondary-900 mb-3">Password Requirements:</p>
              <div className="space-y-2">
                <div className={`text-sm flex items-center gap-2 ${passwordValidation.minLength ? 'text-success-600' : 'text-danger-600'}`}>
                  {passwordValidation.minLength ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>Minimum 8 characters</span>
                </div>
                <div className={`text-sm flex items-center gap-2 ${passwordValidation.hasLowercase ? 'text-success-600' : 'text-danger-600'}`}>
                  {passwordValidation.hasLowercase ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>At least 1 lowercase letter (a-z)</span>
                </div>
                <div className={`text-sm flex items-center gap-2 ${passwordValidation.hasUppercase ? 'text-success-600' : 'text-danger-600'}`}>
                  {passwordValidation.hasUppercase ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>
                <div className={`text-sm flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-success-600' : 'text-danger-600'}`}>
                  {passwordValidation.hasNumber ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>At least 1 number (0-9)</span>
                </div>
                <div className={`text-sm flex items-center gap-2 ${passwordValidation.hasSymbol ? 'text-success-600' : 'text-danger-600'}`}>
                  {passwordValidation.hasSymbol ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>At least 1 symbol (!@#$%^&*...)</span>
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
            minLength={8}
            leftIcon={<Lock className="w-5 h-5" />}
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            size="lg"
            rightIcon={!loading && <ArrowRight className="w-5 h-5" />}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
