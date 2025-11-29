import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail } from 'lucide-react';

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
      toast.success('Password reset instructions resent.');
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
      toast.success('Password reset instructions sent to your email.');
    } else {
      toast.error(result.error || 'Failed to send reset email');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Mail className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="text-gray-600 mt-2">
            {!submitted
              ? "Enter your email address and we'll send you instructions to reset your password."
              : "Check your email for reset instructions"}
          </p>
        </div>

        <div className="card">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-3 text-green-600 flex justify-center">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h4>
                <p className="text-gray-600 mb-4">
                  We have sent password reset instructions to <strong>{email}</strong>.
                </p>

                {countdown > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    ⏳ Please wait {formatTime(countdown)} before trying again.
                  </div>
                )}
              </div>

              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resending...' : 'Resend Email'}
              </button>

              <button
                onClick={() => setSubmitted(false)}
                disabled={countdown > 0}
                className="btn btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
