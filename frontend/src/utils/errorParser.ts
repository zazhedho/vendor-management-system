import { ErrorType, ParsedError, ApiError } from '../types/error';
import { AxiosError } from 'axios';

/**
 * Parse various error formats into a standardized ParsedError object
 */
export const parseError = (error: unknown): ParsedError => {
  // Handle Axios errors
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    // Network error (no response)
    if (!axiosError.response) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network error. Please check your internet connection.',
        originalError: error,
      };
    }

    const { status, data } = axiosError.response;

    // Authentication error
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: data?.message || 'Authentication failed. Please login again.',
        originalError: error,
      };
    }

    // Authorization error
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: data?.message || 'You do not have permission to perform this action.',
        originalError: error,
      };
    }

    // Not found error
    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: data?.message || 'The requested resource was not found.',
        originalError: error,
      };
    }

    // Validation error
    if (status === 400 || status === 422) {
      return {
        type: ErrorType.VALIDATION,
        message: data?.message || 'Validation failed. Please check your input.',
        details: data?.details,
        originalError: error,
      };
    }

    // Server error
    if (status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: data?.message || 'Server error. Please try again later.',
        originalError: error,
      };
    }

    // Other HTTP errors
    return {
      type: ErrorType.UNKNOWN,
      message: data?.message || 'An unexpected error occurred.',
      originalError: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred.',
    originalError: error,
  };
};

/**
 * Type guard to check if error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Get user-friendly error message from error
 */
export const getErrorMessage = (error: unknown, fallback = 'An error occurred'): string => {
  const parsed = parseError(error);
  return parsed.message || fallback;
};

/**
 * Check if error is a specific type
 */
export const isErrorType = (error: unknown, type: ErrorType): boolean => {
  const parsed = parseError(error);
  return parsed.type === type;
};

/**
 * Extract validation errors from error response
 */
export const getValidationErrors = (error: unknown): Record<string, string[]> | undefined => {
  const parsed = parseError(error);
  if (parsed.type === ErrorType.VALIDATION) {
    return parsed.details;
  }
  return undefined;
};
