# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start both frontend (Next.js on :3005) and backend (Node.js on :3001) concurrently
- `npm run dev:frontend` - Start only Next.js frontend on port 3005
- `npm run dev:backend` - Start only Node.js backend on port 3001
- `npm run build` - Build Next.js application for production
- `npm run lint` - Run Next.js linting

### Database Operations
- `npm run prisma:generate` - Generate Prisma client after schema changes
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:seed` - Seed database with initial data from scripts/seed.js

### Production
- `npm start` - Start both frontend and backend in production mode

## Architecture Overview

This is a **hybrid Next.js + Node.js application** with a unique dual-backend architecture:

### Backend Architecture
1. **Plain Node.js Server** (`src/server.js` on port 3001)
   - Handles legacy API routes and core business logic
   - No Express.js - uses native Node.js HTTP server
   - Custom routing system in `src/lib/router.js`
   - Serves: configurator, BOM generation, accessories, etc.

2. **Next.js API Routes** (`app/api/**` on port 3005)
   - Handles modern features: authentication, orders, QC system
   - Uses Next.js 15 App Router
   - Integrated with Prisma for database operations

### Frontend
- **Next.js 15** with App Router (`app/` directory)
- **ShadCN UI** components in `components/ui/`
- **Tailwind CSS** for styling
- **Zustand** for state management (`stores/`)

### Database
- **PostgreSQL** with **Prisma ORM**
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Main models: User, Order, Part, Assembly, QC system models

## API Client Pattern

The application uses two different API clients based on the target:

```typescript
// For Node.js backend (port 3001)
import { plainNodeApiClient } from '@/lib/api';

// For Next.js API routes (port 3005)
import { nextJsApiClient } from '@/lib/api';
```

## Key Business Logic Locations

### Product Configuration
- **Service**: `src/services/configuratorService.js` - Dynamic sink configuration logic
- **Service**: `src/services/accessoriesService.js` - Accessories catalog management
- **API**: `src/api/configuratorHandlers.js` - Configuration API endpoints

### Order Management
- **Store**: `stores/orderCreateStore.ts` - Order creation state management
- **Components**: `components/order/` - Order wizard components
- **API**: `app/api/orders/` - Next.js order management routes

### BOM Generation
- **Service**: `src/services/bomService.js` - Bill of Materials generation
- **API**: `app/api/orders/[orderId]/bom/` - BOM export functionality

### Quality Control System
- **Models**: QcFormTemplate, OrderQcResult in Prisma schema
- **API**: `app/api/orders/[orderId]/qc/` - QC form management
- **Components**: `components/qc/` - QC form interfaces

## Development Patterns

### Database Access
- Use Prisma client: `import { prisma } from '@/lib/prisma'`
- Always use transactions for multi-table operations
- Include proper error handling for database operations

### Authentication
- JWT-based authentication stored in httpOnly cookies
- Auth utilities: `lib/nextAuthUtils.ts`
- Protected routes use `components/ProtectedRoute.tsx`

### State Management
- Order creation: `stores/orderCreateStore.ts` (Zustand + Immer)
- Global auth state: `stores/authStore.ts`

### Component Structure
- UI components: `components/ui/` (ShadCN-based)
- Feature components: `components/order/`, `components/qc/`, etc.
- Dashboard components: `components/dashboard/` (role-based)

## Important Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_API_URL` - API base URL for frontend

## Role-Based Access

The system supports multiple user roles:
- `ADMIN` - Full system access
- `PRODUCTION_COORDINATOR` - Order and production management
- `PROCUREMENT_SPECIALIST` - Parts and procurement
- `QC_PERSON` - Quality control operations
- `ASSEMBLER` - Production and assembly
- `SERVICE_DEPARTMENT` - Service and maintenance

## Common Development Tasks

### Adding New API Endpoints
1. **Node.js backend**: Add handler in `src/api/` and register in `src/lib/router.js`
2. **Next.js API**: Create route file in `app/api/`

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Run `npm run prisma:generate`

### Adding New Components
- Follow ShadCN pattern for UI components
- Use TypeScript for all components
- Include proper prop types and error handling

## Testing and Quality

- Run linting with `npm run lint` before committing
- Test database changes with fresh migrations
- Test both API backends when making changes
- Verify role-based access control for new features