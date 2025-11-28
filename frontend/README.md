# Vendor Management System - Frontend

Modern frontend application for the Vendor Management System built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- User authentication (Login/Register)
- Dashboard with statistics
- Events management
- Vendors management
- Payments tracking
- Evaluations system
- User management
- Responsive design

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

### Preview

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── api/              # API client and endpoints
│   ├── client.ts
│   ├── auth.ts
│   ├── events.ts
│   ├── vendors.ts
│   ├── payments.ts
│   └── evaluations.ts
├── components/       # Reusable components
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── context/          # React Context
│   └── AuthContext.tsx
├── pages/            # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Events.tsx
│   ├── Vendors.tsx
│   ├── Payments.tsx
│   ├── Evaluations.tsx
│   └── Users.tsx
├── types/            # TypeScript types
│   └── index.ts
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## API Integration

The frontend integrates with the backend API at `http://localhost:8080/api` by default.

### Available API Endpoints

- **Auth**: `/user/login`, `/user/register`, `/user/logout`
- **Events**: `/events`, `/event/:id`
- **Vendors**: `/vendors`, `/vendor/:id`
- **Payments**: `/payments`, `/payment/:id`
- **Evaluations**: `/evaluations`, `/evaluation/:id`

## Authentication

The app uses JWT token-based authentication:
- Token is stored in localStorage
- Automatically included in API requests
- Redirect to login on 401 responses

## License

MIT
