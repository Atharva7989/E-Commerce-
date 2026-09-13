# Project Context

## Project Overview
A small e-commerce website with only 4 physical products. 

## Tech Stack
* **Frontend**: Next.js + TypeScript + Tailwind CSS
* **Backend**: NestJS + TypeScript
* **Database**: PostgreSQL using Supabase
* **ORM**: Prisma
* **Payment**: Razorpay (Planned for later)
* **Docker**: Not required

## Architecture
- Client-Server architecture.
- Frontend communicating with Backend via REST API.
- Backend communicating with Supabase PostgreSQL via Prisma ORM.

## Project Structure
```
frontend/ - Next.js application
backend/ - NestJS application
docs/ - Documentation
PROJECT_CONTEXT.md - Single source of truth for the project
README.md - General setup instructions
```

## Completed Phases
- **Phase 1: Project Foundation Setup**
  - Initialized Next.js frontend (App Router, Tailwind CSS, TypeScript).
  - Initialized NestJS backend.
  - Configured Prisma ORM for PostgreSQL and setup environment variables.
  - Added a `/health` endpoint to verify the backend is running.
  - Setup `.gitignore` and initialized Git repository.
- **Phase 2: Product Catalog**
  - Created the `Product` model in Prisma and ran database migrations.
  - Seeded the local database with 4 physical products.
  - Implemented NestJS `ProductsModule` with REST APIs (`GET /products`, `GET /products/:id`).
  - Built Next.js frontend Product Listing (`/`) and Product Details (`/products/[id]`) pages with premium Tailwind CSS aesthetics.

- **Phase 3: Authentication**
  - Added `User` model (id, name, email, passwordHash, timestamps) and migration.
  - Implemented `AuthModule` with `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
  - Integrated bcrypt for password hashing, email normalization, and validation.
  - Configured JWT authentication with HttpOnly cookies; environment‑aware cookie security.
  - Updated `main.ts` with `cookie-parser` and CORS (origin `http://localhost:3001`, credentials true).
  - Created Next.js `/register` and `/login` pages with premium UI and error handling.
  - Ensured `passwordHash` is never returned in API responses.

## Current Phase
- Phase 3 Completed. Waiting for Phase 4.

## Pending Work
- Phase 4: TBA

## Architecture Updates
- Added `PrismaService` for database connection in NestJS.
- Added `ProductsModule`, `ProductsController`, and `ProductsService` for REST endpoints.
- Next.js fetches data from the backend dynamically (`cache: 'no-store'`).

## Database schema
- `Product` model added with fields: `id`, `name`, `description`, `price`, `imageUrl`, `stock`, `active`, `createdAt`, `updatedAt`.

## API Endpoints
- `GET /products` - Fetch all active products
- `GET /products/:id` - Fetch specific product details

## Data
- Seed script (`backend/prisma/seed.ts`) populates the database with 4 physical products.

## Important Decisions
- Using Next.js App Router for frontend.
- Skipping Docker for simplicity.

## Commands
- **Frontend**: `cd frontend && npm run dev`
- **Backend**: `cd backend && npm run start:dev`

## Known Issues
- None

## Change Log
- **[Current Date]**: Initialized `PROJECT_CONTEXT.md`.
