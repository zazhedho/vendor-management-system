# Vendor Management System - Frontend

Modern, modular frontend for Vendor Management System with React + TypeScript + Vite + Tailwind CSS.

## Project Structure

```
src/
├── api/              # API integration (client, auth, events, vendors, payments, evaluations)
├── components/       # Shared components (Layout, ProtectedRoute)
├── context/          # React Context (AuthContext)
├── pages/            # Modular page structure
│   ├── auth/        # Login, Register
│   ├── events/      # EventList, EventForm, EventDetail
│   ├── vendors/     # VendorList, VendorForm, VendorDetail
│   ├── payments/    # PaymentList, PaymentDetail
│   ├── evaluations/ # EvaluationList
│   └── users/       # UserList
├── types/           # TypeScript types
└── App.tsx          # Main routing
```

## Module Pattern

Each module (events, vendors, payments, etc.) has:
- **List**: Table/grid with search, filter, pagination
- **Form**: Create/Edit with validation
- **Detail**: Read-only view with related info

### Routing Pattern
- `/module` - List view
- `/module/new` - Create form
- `/module/:id` - Detail view
- `/module/:id/edit` - Edit form

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Visit: http://localhost:5173

## Environment

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Features

✓ JWT Authentication with auto-refresh
✓ Modular architecture per feature
✓ TypeScript for type safety
✓ Responsive design (mobile-first)
✓ Centralized API clients
✓ Loading states & error handling
✓ Protected routes
✓ Blue color scheme (not purple!)

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
```

## API Usage

```typescript
import { eventsApi } from '../api/events';

const events = await eventsApi.getAll({ page: 1, limit: 10 });
const event = await eventsApi.getById(id);
await eventsApi.create(data);
await eventsApi.update(id, data);
await eventsApi.delete(id);
```

## Tech Stack

- React 18 + TypeScript
- Vite 6
- React Router v7
- Tailwind CSS
- Axios
- Lucide Icons

## License

MIT
