import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, Lock, User, Phone, Briefcase, ArrowRight, UserPlus } from 'lucide-react';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Input, Card } from '../../components/ui';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'vendor' // Default role
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role
      });

      if (result.success) {
        toast.success('Registration successful! 🎉 Please login.');
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
      subtitle="Join as a vendor or client to get started"
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

          <div>
            <label className="block text-sm font-semibold text-secondary-800 mb-2">
              Account Type<span className="text-danger-500 ml-1">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                <Briefcase className="w-5 h-5" />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-secondary-200 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all appearance-none shadow-sm hover:shadow cursor-pointer"
              >
                <option value="vendor">Vendor</option>
                <option value="client">Client</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-secondary-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

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
