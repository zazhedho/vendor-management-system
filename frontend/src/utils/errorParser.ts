import { AxiosError } from 'axios';
import { ErrorType, ParsedError, ApiError } from '../types/error';

type ValidationMap = Record<string, string[]>;
type ValidationEntry = {
  field?: string;
  message?: string;
};

const GENERIC_API_MESSAGES = new Set([
  'Something Went Wrong',
  'Data Not Found',
  'Forbidden',
  'Access Denied',
  'Unauthorized',
  'Bad Request',
  'success',
]);

const cleanMessage = (message?: string | null): string | undefined => {
  if (typeof message !== 'string') return undefined;

  const trimmed = message.trim();
  return trimmed || undefined;
};

const isGenericMessage = (message?: string): boolean => {
  if (!message) return true;
  return GENERIC_API_MESSAGES.has(message);
};

const formatFieldName = (field?: string): string => {
  if (!field) return 'Field';

  return field
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeValidationMap = (value: unknown): ValidationMap | undefined => {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    const entries = value.filter(
      (item): item is ValidationEntry =>
        !!item && typeof item === 'object' && ('field' in item || 'message' in item)
    );

    if (entries.length === 0) {
      return undefined;
    }

    return entries.reduce<ValidationMap>((acc, item) => {
      const key = formatFieldName(item.field);
      const message = cleanMessage(item.message) || 'Invalid value.';
      acc[key] = [...(acc[key] || []), message];
      return acc;
    }, {});
  }

  if (typeof value === 'object') {
    const mapped = Object.entries(value as Record<string, unknown>).reduce<ValidationMap>((acc, [field, messages]) => {
      if (Array.isArray(messages)) {
        const normalized = messages
          .map((message) => cleanMessage(typeof message === 'string' ? message : undefined))
          .filter((message): message is string => !!message);

        if (normalized.length > 0) {
          acc[formatFieldName(field)] = normalized;
        }
      } else {
        const message = cleanMessage(typeof messages === 'string' ? messages : undefined);
        if (message) {
          acc[formatFieldName(field)] = [message];
        }
      }

      return acc;
    }, {});

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }

  return undefined;
};

const extractMessageFromValue = (value: unknown): string | undefined => {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return cleanMessage(value);
  }

  if (Array.isArray(value)) {
    const validationDetails = normalizeValidationMap(value);
    if (validationDetails) {
      const firstField = Object.keys(validationDetails)[0];
      const firstMessage = validationDetails[firstField]?.[0];
      return firstMessage ? `${firstField}: ${firstMessage}` : undefined;
    }

    return value
      .map((item) => extractMessageFromValue(item))
      .filter((message): message is string => !!message)
      .join(', ') || undefined;
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;

    return (
      extractMessageFromValue(objectValue.message) ||
      extractMessageFromValue(objectValue.error) ||
      extractMessageFromValue(objectValue.details)
    );
  }

  return undefined;
};

const extractApiMessage = (payload?: ApiError | Record<string, unknown>): string | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;

  const specificMessage =
    extractMessageFromValue((payload as Record<string, unknown>).error) ||
    extractMessageFromValue((payload as Record<string, unknown>).details);

  const topLevelMessage = cleanMessage(typeof payload.message === 'string' ? payload.message : undefined);

  if (specificMessage && (isGenericMessage(topLevelMessage) || specificMessage !== topLevelMessage)) {
    return specificMessage;
  }

  return topLevelMessage || specificMessage;
};

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
    const details = normalizeValidationMap(data?.details) || normalizeValidationMap(data?.error);
    const apiMessage = extractApiMessage(data);

    // Authentication error
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: apiMessage || 'Your session is no longer valid. Please sign in again.',
        originalError: error,
      };
    }

    // Authorization error
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: apiMessage || 'You do not have permission to perform this action.',
        originalError: error,
      };
    }

    // Not found error
    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: apiMessage || 'The requested data could not be found.',
        originalError: error,
      };
    }

    // Validation error
    if (status === 400 || status === 422) {
      return {
        type: ErrorType.VALIDATION,
        message: apiMessage || 'Please check the form and try again.',
        details,
        originalError: error,
      };
    }

    // Server error
    if (status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: apiMessage || 'The server could not process your request right now. Please try again later.',
        originalError: error,
      };
    }

    // Other HTTP errors
    return {
      type: ErrorType.UNKNOWN,
      message: apiMessage || 'An unexpected error occurred.',
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
