import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Input, Card } from '../../components/ui';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your vendor dashboard"
    >
      <Card variant="glass" className="shadow-2xl border border-white/50 backdrop-blur-xl bg-white/95">
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-info-50 rounded-xl border border-primary-100/50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-secondary-900 mb-1">Secure Login</h3>
              <p className="text-xs text-secondary-600">Your credentials are encrypted and secure</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            leftIcon={<Mail className="w-5 h-5" />}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-secondary-800">
                Password<span className="text-danger-500 ml-1">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              leftIcon={<Lock className="w-5 h-5" />}
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="lg"
            rightIcon={!isLoading && <ArrowRight className="w-5 h-5" />}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-secondary-100 text-center">
          <p className="text-sm text-secondary-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-bold transition-colors hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
