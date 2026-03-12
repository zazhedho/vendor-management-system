# Hooks Documentation

## useErrorHandler

Centralized error handling hook yang menggantikan `console.error()` dengan error handling yang lebih baik.

### Features

- ✅ **Automatic Toast Notifications** - User-friendly error messages
- ✅ **Error Type Detection** - Network, Auth, Validation, Server errors
- ✅ **Development Logging** - Detailed console logs in dev mode only
- ✅ **Consistent Error Formatting** - Standardized error messages
- ✅ **Production Ready** - No console logs in production

### Quick Start

```tsx
import { useErrorHandler } from '../hooks';

const MyComponent = () => {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      await someApi.getData();
    } catch (error) {
      handleError(error, { context: 'Fetching data' });
    }
  };
};
```

### API

#### `handleError(error, options)`

Handle error dengan toast notification dan logging.

**Parameters:**
- `error` (unknown) - Error object dari API atau try-catch
- `options` (ErrorHandlerOptions) - Optional configuration
  - `showToast` (boolean) - Show toast notification (default: true)
  - `logToConsole` (boolean) - Log to console (default: dev mode only)
  - `context` (string) - Context untuk error message (e.g., "Fetching vendors")
  - `fallbackMessage` (string) - Custom fallback message

**Example:**
```tsx
handleError(error, {
  context: 'Saving vendor',
  fallbackMessage: 'Failed to save. Please try again.'
});
```

#### `handleSilentError(error, context)`

Handle error tanpa toast (hanya console log di dev).

**Use case:** Background operations, polling, auto-save

**Example:**
```tsx
handleSilentError(error, 'Background sync');
```

#### `handleErrorWithMessage(error, customMessage, showToast)`

Handle error dengan custom message yang override API error.

**Example:**
```tsx
handleErrorWithMessage(
  error,
  'Unable to delete vendor. They may have active contracts.'
);
```

#### `getError(error, fallback)`

Get error message string tanpa handling (untuk inline display).

**Example:**
```tsx
const errorMessage = getError(error, 'Unknown error');
setFormError(errorMessage);
```

### Error Types

Hook akan otomatis detect error type dan show appropriate message:

| Error Type | HTTP Status | Message Example |
|-----------|-------------|-----------------|
| NETWORK | No response | "Network error. Please check your internet connection." |
| AUTHENTICATION | 401 | "Authentication failed. Please login again." |
| AUTHORIZATION | 403 | "You do not have permission to perform this action." |
| VALIDATION | 400, 422 | "Validation failed. Please check your input." |
| NOT_FOUND | 404 | "The requested resource was not found." |
| SERVER | 500+ | "Server error. Please try again later." |
| UNKNOWN | Other | "An unexpected error occurred." |

### Migration dari console.error

**Before:**
```tsx
try {
  await api.getData();
} catch (error) {
  console.error('Failed to fetch:', error);
  toast.error('Something went wrong');
}
```

**After:**
```tsx
const { handleError } = useErrorHandler();

try {
  await api.getData();
} catch (error) {
  handleError(error, { context: 'Fetching data' });
}
```

### Common Patterns

#### 1. Form Submission
```tsx
const { handleError } = useErrorHandler();

const handleSubmit = async (data) => {
  try {
    await api.create(data);
    toast.success('Created successfully');
  } catch (error) {
    handleError(error, { context: 'Creating vendor' });
  }
};
```

#### 2. React Query
```tsx
const { handleError } = useErrorHandler();

const { data } = useQuery({
  queryKey: ['vendors'],
  queryFn: () => api.getAll(),
  onError: (error) => handleError(error, { context: 'Loading vendors' })
});
```

#### 3. Context Provider
```tsx
const { handleError } = useErrorHandler();

const deleteItem = async (id) => {
  try {
    await api.delete(id);
    await refetch();
  } catch (error) {
    handleError(error, {
      context: 'Deleting item',
      fallbackMessage: 'Unable to delete. Please try again.'
    });
  }
};
```

#### 4. Silent Background Operations
```tsx
const { handleSilentError } = useErrorHandler();

useEffect(() => {
  const syncData = async () => {
    try {
      await api.sync();
    } catch (error) {
      handleSilentError(error, 'Background sync');
    }
  };

  const interval = setInterval(syncData, 60000);
  return () => clearInterval(interval);
}, []);
```

### Best Practices

✅ **DO:**
- Use meaningful context strings
- Provide user-friendly fallback messages
- Use handleSilentError untuk background operations
- Keep error messages concise dan actionable

❌ **DON'T:**
- Jangan use console.error langsung
- Jangan show technical error details ke user
- Jangan duplicate toast notifications
- Jangan log sensitive data

### Testing

```tsx
import { renderHook } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';

test('handles network error', () => {
  const { result } = renderHook(() => useErrorHandler());

  const networkError = new Error('Network failed');
  result.current.handleError(networkError);

  // Assert toast was shown
  // Assert console.error was called in dev
});
```

### Files Affected

Total: 51 console.error statements di 49 files yang perlu di-migrate.

**Priority Files:**
- AuthContext.tsx
- VendorForm.tsx
- PaymentForm.tsx
- EvaluationForm.tsx
- EventForm.tsx
- All List components
- All Detail components

Lihat `MIGRATION_GUIDE_ERROR_HANDLING.md` untuk full migration plan.
