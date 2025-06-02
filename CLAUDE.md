# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start both frontend (Next.js on :3005) and backend (Node.js on :3001) concurrently
- `npm run dev:frontend` - Start only Next.js frontend on port 3005
- `npm run dev:backend` - Start only Node.js backend on port 3001
- `npm run build` - Build Next.js application for production
- `npm run lint` - Run ESLint with Next.js configuration
- `npm test` - No tests configured yet

### Database Operations
- `npm run prisma:generate` - Generate Prisma client after schema changes
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:seed` - Seed database with initial data from scripts/seed.js

### Production
- `npm start` - Start both frontend and backend in production mode

## Architecture Overview

This is a **hybrid Next.js + Node.js application** for Torvan Medical CleanStation workflow management with a unique dual-backend architecture:

### Backend Architecture
1. **Plain Node.js Server** (`src/server.js` on port 3001)
   - Handles legacy API routes and core business logic
   - No Express.js - uses native Node.js HTTP server
   - Custom routing system in `src/lib/router.js`
   - Serves: configurator, BOM generation, accessories, parts/assemblies data
   - Note: Many routes are deprecated in favor of Next.js API routes

2. **Next.js API Routes** (`app/api/**` on port 3005)
   - Handles modern features: authentication, orders, QC system, file uploads
   - Uses Next.js 15 App Router
   - Integrated with Prisma for database operations
   - Preferred for new feature development

### Frontend
- **Next.js 15** with App Router (`app/` directory)
- **ShadCN UI** components in `components/ui/`
- **Tailwind CSS** for styling
- **Zustand** for state management (`stores/`)
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Database
- **PostgreSQL** with **Prisma ORM**
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Main models: User, Order, Part, Assembly, QcFormTemplate, OrderQcResult

## API Client Pattern

The application uses two different API clients based on the target backend:

```typescript
// For Node.js backend (port 3001) - legacy routes
import { plainNodeApiClient } from '@/lib/api';

// For Next.js API routes (port 3005) - preferred for new features
import { nextJsApiClient } from '@/lib/api';
```

Note: `plainNodeApiClient` incorrectly points to port 3004 in the code - should be 3001.

## Key Business Logic Locations

### Product Configuration
- **Service**: `src/services/configuratorService.js` - Dynamic sink configuration logic
- **Service**: `src/services/accessoriesService.js` - Accessories catalog management
- **Legacy**: `sink-config.js`, `accessories.js` - Original configurator logic

### Order Management
- **Store**: `stores/orderCreateStore.ts` - Order creation state (Zustand + Immer)
- **Components**: `components/order/` - Order wizard components
- **API**: `app/api/orders/` - Order CRUD operations

### BOM Generation
- **Service**: `src/services/bomService.js` - Bill of Materials generation
- **API**: `app/api/orders/[orderId]/bom/` - BOM export functionality
- **Legacy**: `bom-generator.js` - Original BOM logic

### Quality Control System
- **Models**: QcFormTemplate, OrderQcResult in Prisma schema
- **API**: `app/api/orders/[orderId]/qc/` - QC form management
- **Components**: `components/qc/` - QC form interfaces
- **Admin API**: `app/api/admin/qc-templates/` - Template management

### Authentication & Authorization
- JWT-based authentication stored in httpOnly cookies
- **API**: `app/api/auth/login/` - Login endpoint
- **Utilities**: `lib/nextAuthUtils.ts` - JWT handling
- **Middleware**: `src/lib/authMiddleware.js` - Route protection
- **Store**: `stores/authStore.ts` - Client-side auth state

## Database Setup

1. Ensure PostgreSQL is running
2. Create database: `createdb torvan-db`
3. Copy environment file: `cp .env.local.example .env.local`
4. Configure `DATABASE_URL` in `.env.local`
5. Run migrations: `npm run prisma:migrate`
6. Generate client: `npm run prisma:generate`
7. Seed data: `npm run prisma:seed`

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret

Optional:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend server port (default: 3001)
- `CORS_ORIGINS` - Allowed CORS origins
- `UPLOADS_DIR` - File upload directory
- `NEXT_PUBLIC_API_URL` - Frontend API URL

## Role-Based Access

System roles with hierarchical permissions:
- `ADMIN` - Full system access
- `PRODUCTION_COORDINATOR` - Order and production management
- `PROCUREMENT_SPECIALIST` - Parts and procurement
- `QC_PERSON` - Quality control operations
- `ASSEMBLER` - Production and assembly
- `SERVICE_DEPARTMENT` - Service and maintenance

## Development Patterns

### Adding New Features
1. **Prefer Next.js API routes** over Node.js backend for new endpoints
2. Use TypeScript for all new code
3. Follow existing patterns in similar files
4. Include proper error handling and validation

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration)
3. Run `npm run prisma:generate` (updates client)
4. Update seed script if needed

### Component Development
- Use ShadCN UI components from `components/ui/`
- Follow React Hook Form patterns for forms
- Use Zod schemas for validation (see `lib/qcValidationSchemas.ts`)
- Implement proper TypeScript types

### State Management
- Use Zustand stores with Immer for complex state
- Keep API calls in components or custom hooks
- Use optimistic updates where appropriate

## Legacy Code Notes

Several files contain legacy frontend logic that's being migrated:
- `app.js` - Original vanilla JS configurator
- `sink-config.js` - Sink configuration logic
- `accessories.js` - Accessories management
- `bom-generator.js` - BOM generation
- `index.html`, `styles.css` - Legacy UI

These are preserved for reference during migration to the modern stack.