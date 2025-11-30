import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, ArrowRight, CheckCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../components/AuthLayout';
import { Button, Input, Card } from '../../components/ui';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { forgotPassword } = useAuth();

  useEffect(() => {
    const storedEndTime = localStorage.getItem('forgotPasswordCountdownEnd');
    if (storedEndTime) {
      const remaining = Math.ceil((parseInt(storedEndTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
        setSubmitted(true);
        const storedEmail = localStorage.getItem('forgotPasswordEmail');
        if (storedEmail) setEmail(storedEmail);
      } else {
        localStorage.removeItem('forgotPasswordCountdownEnd');
        localStorage.removeItem('forgotPasswordEmail');
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('forgotPasswordCountdownEnd');
            localStorage.removeItem('forgotPasswordEmail');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startCountdown = () => {
    const duration = 300;
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem('forgotPasswordCountdownEnd', endTime.toString());
    localStorage.setItem('forgotPasswordEmail', email);
    setCountdown(duration);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    const result = await forgotPassword(email);
    if (result.success) {
      toast.success('Password reset instructions resent! 📧');
      startCountdown();
    } else {
      toast.error(result.error || 'Failed to resend email');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setSubmitted(true);
      startCountdown();
      toast.success('Password reset instructions sent! 📧');
    } else {
      toast.error(result.error || 'Failed to send reset email');
    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title={!submitted ? "Forgot Password?" : "Check Your Email"}
      subtitle={!submitted
        ? "Enter your email and we'll send reset instructions"
        : "We've sent password reset instructions"}
    >
      <Card variant="glass" className="shadow-2xl border border-white/50 backdrop-blur-xl bg-white/95">
        {!submitted ? (
          <>
            {/* Info Badge */}
            <div className="mb-6 p-4 bg-gradient-to-r from-info-50 to-primary-50 rounded-xl border border-info-100/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Mail className="w-5 h-5 text-info-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-secondary-900 mb-1">Password Recovery</h3>
                  <p className="text-xs text-secondary-600">
                    We'll email you a secure link to reset your password
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                leftIcon={<Mail className="w-5 h-5" />}
                helperText="Enter the email associated with your account"
              />

              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                size="lg"
                rightIcon={!loading && <ArrowRight className="w-5 h-5" />}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-success-100 to-success-50 rounded-2xl shadow-lg mb-4 relative">
                <CheckCircle className="w-12 h-12 text-success-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Email Sent!</h3>
              <p className="text-secondary-600 mb-4">
                We've sent password reset instructions to{' '}
                <span className="font-semibold text-primary-600">{email}</span>
              </p>
            </div>

            {/* Countdown Warning */}
            {countdown > 0 && (
              <div className="p-4 bg-gradient-to-r from-warning-50 to-orange-50 border border-warning-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5 text-warning-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-warning-900">Please wait</h4>
                    <p className="text-xs text-warning-700">
                      You can resend in <span className="font-mono font-bold">{formatTime(countdown)}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="w-full"
                size="lg"
                variant="primary"
                leftIcon={<RefreshCw className="w-5 h-5" />}
              >
                {loading ? 'Resending...' : 'Resend Email'}
              </Button>

              <Button
                onClick={() => setSubmitted(false)}
                disabled={countdown > 0}
                className="w-full"
                size="lg"
                variant="secondary"
              >
                Try Another Email
              </Button>
            </div>
          </div>
        )}

        {/* Back to Login */}
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

export default ForgotPassword;
