import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, Lock, User, Phone, ArrowRight, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Input, Card } from '../../components/ui';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSymbol: false
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
    if (!allRequirementsMet) {
      toast.error('Password does not meet all requirements');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      if (result.success) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register as a vendor to get started"
    >
      <Card variant="glass" className="shadow-2xl border border-white/50 backdrop-blur-xl bg-white/95">
        <div className="mb-6 p-4 bg-gradient-to-r from-success-50 to-primary-50 rounded-xl border border-success-100/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <UserPlus className="w-5 h-5 text-success-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-secondary-900 mb-1">Quick Registration</h3>
              <p className="text-xs text-secondary-600">Create your account in just a few steps</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Company or Personal Name"
            required
            leftIcon={<User className="w-5 h-5" />}
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@company.com"
            required
            leftIcon={<Mail className="w-5 h-5" />}
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+62 812 3456 7890"
            required
            leftIcon={<Phone className="w-5 h-5" />}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="w-5 h-5" />}
          />

          {formData.password && (
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
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="w-5 h-5" />}
          />

          {formData.confirmPassword && (
            <div className={`text-xs flex items-center gap-1.5 ${formData.password === formData.confirmPassword ? 'text-success-600' : 'text-danger-600'}`}>
              {formData.password === formData.confirmPassword ? (
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
            isLoading={isLoading}
            className="w-full mt-2"
            size="lg"
            rightIcon={!isLoading && <ArrowRight className="w-5 h-5" />}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-secondary-100 text-center">
          <p className="text-sm text-secondary-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
