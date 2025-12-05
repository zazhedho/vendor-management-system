import { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary-50">
      <Card className="max-w-md w-full shadow-xl border-danger-100">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-50 mb-2">
            <AlertTriangle className="w-8 h-8 text-danger-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-secondary-900">Something went wrong</h2>
            <p className="text-sm text-secondary-600">
              We encountered an unexpected error. Our team has been notified.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-danger-50 rounded-lg text-left overflow-auto max-h-40 border border-danger-100">
              <p className="text-xs font-mono text-danger-700 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="pt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={resetErrorBoundary}
              variant="primary"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="secondary"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
