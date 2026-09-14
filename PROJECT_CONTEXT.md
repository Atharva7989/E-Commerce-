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

- **Phase 4: Cart**
  - Added `Cart` and `CartItem` models with Prisma migration.
  - Implemented `CartModule` with `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart`.
  - Added cart drawer/modal in frontend with persistent context and live badge count.

- **Phase 5: Address + Checkout Preparation**
  - Added `Address` model (id, userId, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, timestamps) related to `User` and created migration `20260914071948_add_address_model`.
  - Implemented `AddressesModule` with authenticated CRUD APIs (`GET /addresses`, `GET /addresses/:id`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id`).
  - Derived `userId` strictly from authenticated JWT (`req.user.sub`) with strict phone and postal code validation and cross-user address isolation (returns 404 for other users' addresses).
  - Implemented `CheckoutModule` with `GET /checkout/summary` and `POST /checkout/validate` re-reading product price, stock, and active status directly from the database.
  - Built frontend Address management UI (`/addresses`) and Checkout page (`/checkout`) with address selection, live backend prices/quantities/totals, stock failure alerts, and payment placeholder preparing for Phase 6.
  - Added global responsive navigation header with authentication status and navigation links.

## Current Phase
- Phase 5 Completed. Ready for Phase 6 (Payment Gateway Integration & Order Fulfillment).

## Architecture Updates
- Added `PrismaService` for database connection in NestJS.
- Added `ProductsModule`, `AuthModule`, `CartModule`, `AddressesModule`, and `CheckoutModule`.
- Re-reads live product prices and stock from PostgreSQL database during checkout to ensure data integrity without trusting frontend inputs.
- Next.js fetches data from the backend dynamically (`cache: 'no-store'`).

## Database schema
- `Product`: `id`, `name`, `description`, `price`, `imageUrl`, `stock`, `active`, `createdAt`, `updatedAt`.
- `User`: `id`, `name`, `email`, `passwordHash`, `createdAt`, `updatedAt`, `cart`, `addresses`.
- `Cart`: `id`, `userId`, `createdAt`, `updatedAt`, `items`.
- `CartItem`: `id`, `cartId`, `productId`, `quantity`, `createdAt`, `updatedAt`.
- `Address`: `id`, `userId`, `fullName`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `createdAt`, `updatedAt`.

## API Endpoints
- **Products**:
  - `GET /products` - Fetch all active products
  - `GET /products/:id` - Fetch specific product details
- **Auth**:
  - `POST /auth/register` - Register new user
  - `POST /auth/login` - User sign-in (returns JWT HttpOnly cookie)
  - `POST /auth/logout` - Clear JWT cookie
  - `GET /auth/me` - Authenticated user info
- **Cart**:
  - `GET /cart` - Retrieve user's cart
  - `POST /cart/items` - Add item to cart
  - `PATCH /cart/items/:productId` - Update item quantity
  - `DELETE /cart/items/:productId` - Remove item from cart
  - `DELETE /cart` - Clear entire cart
- **Addresses**:
  - `GET /addresses` - List user's saved addresses
  - `GET /addresses/:id` - Get specific address owned by user
  - `POST /addresses` - Create new delivery address
  - `PATCH /addresses/:id` - Update existing address
  - `DELETE /addresses/:id` - Delete address
- **Checkout**:
  - `GET /checkout/summary` - Live checkout summary re-reading current prices, stock, and active status from DB
  - `POST /checkout/validate` - Validates address ownership and real-time stock availability without placing order

## Data
- Seed script (`backend/prisma/seed.ts`) populates the database with 4 physical products.

## Important Decisions
- Using Next.js App Router for frontend.
- Skipping Docker for simplicity.
- Real-time DB price and stock validation during checkout preparation.
- Strictly no order creation, stock deduction, or payment capture until Phase 6.

## Commands
- **Frontend**: `cd frontend && npm run dev`
- **Backend**: `cd backend && npm run start:dev`

## Known Issues
- None

## Change Log
- **[Phase 1]**: Initialized project structure, NestJS backend, and Next.js frontend.
- **[Phase 2]**: Product catalog with Prisma model and responsive UI.
- **[Phase 3]**: User authentication with bcrypt, JWT cookies, and auth UI.
- **[Phase 4]**: Cart functionality with backend APIs and modal drawer.
- **[Phase 5]**: Address management CRUD, live checkout verification, and checkout UI.
