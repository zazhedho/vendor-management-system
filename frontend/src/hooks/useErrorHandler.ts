import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { parseError, getErrorMessage } from '../utils/errorParser';
import { ErrorHandlerOptions, ErrorType } from '../types/error';

/**
 * Custom hook for centralized error handling
 *
 * Usage:
 * const { handleError } = useErrorHandler();
 *
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleError(error, { context: 'Fetching vendors' });
 * }
 */
export const useErrorHandler = () => {
  /**
   * Handle error with toast notification and optional console logging
   */
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToConsole = import.meta.env.DEV, // Only log in development
      context = '',
      fallbackMessage = 'An unexpected error occurred',
    } = options;

    const parsedError = parseError(error);
    const errorMessage = parsedError.message || fallbackMessage;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    // Show toast notification
    if (showToast) {
      switch (parsedError.type) {
        case ErrorType.NETWORK:
          toast.error(fullMessage, {
            toastId: 'network-error', // Prevent duplicate network error toasts
          });
          break;

        case ErrorType.AUTHENTICATION:
          toast.error(fullMessage, {
            toastId: 'auth-error',
          });
          // Optionally redirect to login
          break;

        case ErrorType.AUTHORIZATION:
          toast.warning(fullMessage);
          break;

        case ErrorType.VALIDATION:
          // Show validation errors
          if (parsedError.details) {
            Object.entries(parsedError.details).forEach(([field, messages]) => {
              messages.forEach(msg => {
                toast.error(`${field}: ${msg}`);
              });
            });
          } else {
            toast.error(fullMessage);
          }
          break;

        case ErrorType.NOT_FOUND:
          toast.warning(fullMessage);
          break;

        case ErrorType.SERVER:
          toast.error(fullMessage);
          break;

        default:
          toast.error(fullMessage);
      }
    }

    // Console logging (development only)
    if (logToConsole) {
      console.group(`🔴 Error${context ? ` - ${context}` : ''}`);
      console.error('Type:', parsedError.type);
      console.error('Message:', errorMessage);
      if (parsedError.details) {
        console.error('Details:', parsedError.details);
      }
      if (parsedError.originalError) {
        console.error('Original Error:', parsedError.originalError);
      }
      console.groupEnd();
    }

    return parsedError;
  }, []);

  /**
   * Handle error silently (no toast, only console in dev)
   */
  const handleSilentError = useCallback((
    error: unknown,
    context?: string
  ) => {
    return handleError(error, {
      showToast: false,
      context,
    });
  }, [handleError]);

  /**
   * Handle error with custom message
   */
  const handleErrorWithMessage = useCallback((
    error: unknown,
    customMessage: string,
    showToast = true
  ) => {
    if (showToast) {
      toast.error(customMessage);
    }

    if (import.meta.env.DEV) {
      const parsedError = parseError(error);
      console.group(`🔴 Error - ${customMessage}`);
      console.error('Original message:', parsedError.message);
      console.error('Original error:', parsedError.originalError);
      console.groupEnd();
    }

    return parseError(error);
  }, []);

  /**
   * Get error message without handling (useful for inline error displays)
   */
  const getError = useCallback((error: unknown, fallback?: string) => {
    return getErrorMessage(error, fallback);
  }, []);

  return {
    handleError,
    handleSilentError,
    handleErrorWithMessage,
    getError,
  };
};
