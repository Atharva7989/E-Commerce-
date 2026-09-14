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

- **Phase 6: Cash on Delivery (COD) Order Creation**
  - Added `Order` and `OrderItem` models with enums (`OrderStatus`: PENDING, CONFIRMED, CANCELLED, DELIVERED; `PaymentMethod`: COD; `PaymentStatus`: PENDING, PAID, FAILED) and created migration `20260914075149_add_order_and_order_item_models`.
  - Implemented `OrdersModule` with `POST /orders`, `GET /orders`, and `GET /orders/:id`.
  - Protected endpoints with `JwtAuthGuard` and strictly pull `userId` from authenticated JWT.
  - Re-checks address ownership, product active status, live prices, and available stock.
  - Executes stock deduction, order & order item creation, address & pricing snapshots, and cart clearing in a single atomic Prisma transaction (`$transaction`).
  - Updated checkout frontend: Cash on Delivery (COD) is the active selectable payment method, Razorpay is displayed as disabled with a "Coming Soon" badge, and "Place Order (Cash on Delivery)" creates the order, clears the client-side cart badge, and shows an order success confirmation screen with order ID, total, and COD instructions.

- **Phase 7: My Orders & Order Details**
  - Verified and enhanced NestJS `OrdersModule` (`GET /orders` and `GET /orders/:id`) to include product images with snapshotted line item information, strict `userId` ownership enforcement, and 404 handling.
  - Added **My Orders** page (`/orders`) displaying user's order history cards with order ID, date, status, payment status, item count, thumbnails, and navigation to details.
  - Added **Order Details** page (`/orders/[id]`) displaying historical shipping address snapshots, ordered products breakdown with unit price and subtotal, and payment details.
  - Integrated "My Orders" link in global navbar with active route styling.
  - Comprehensive handling for loading skeletons, empty order history, unauthorized access, and non-owned/missing orders (404).

## Current Phase
- Phase 7 Completed. Ready for Phase 8 (Online Payment / Razorpay Integration & Order Management).

## Architecture Updates
- Added `PrismaService` for database connection in NestJS.
- Added `ProductsModule`, `AuthModule`, `CartModule`, `AddressesModule`, `CheckoutModule`, and `OrdersModule`.
- Re-reads live product prices and stock from PostgreSQL database during checkout to ensure data integrity without trusting frontend inputs.
- Executes order creation, product stock deduction, and cart clearing atomically inside a single Prisma database transaction (`$transaction`).
- Secure customer order retrieval enforcing tenant isolation at the database level (`where: { userId }`).
- Next.js fetches data from the backend dynamically (`cache: 'no-store'`).

## Database schema
- `Product`: `id`, `name`, `description`, `price`, `imageUrl`, `stock`, `active`, `createdAt`, `updatedAt`, `cartItems`, `orderItems`.
- `User`: `id`, `name`, `email`, `passwordHash`, `createdAt`, `updatedAt`, `cart`, `addresses`, `orders`.
- `Cart`: `id`, `userId`, `createdAt`, `updatedAt`, `items`.
- `CartItem`: `id`, `cartId`, `productId`, `quantity`, `createdAt`, `updatedAt`.
- `Address`: `id`, `userId`, `fullName`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `createdAt`, `updatedAt`.
- `Order`: `id`, `userId`, `status`, `paymentMethod`, `paymentStatus`, `totalAmount`, `shippingFullName`, `shippingPhone`, `shippingAddressLine1`, `shippingAddressLine2`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`, `items`, `createdAt`, `updatedAt`.
- `OrderItem`: `id`, `orderId`, `productId`, `productName`, `quantity`, `unitPrice`, `subtotal`, `createdAt`, `updatedAt`.

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
- **Orders**:
  - `POST /orders` - Create COD order, deduct stock, and clear cart in atomic transaction
  - `GET /orders` - List user's placed orders
  - `GET /orders/:id` - Retrieve order details by ID

## Frontend Routes
- `/` - Product Catalog Listing
- `/products/[id]` - Product Details
- `/login` - User Sign In
- `/register` - User Registration
- `/addresses` - Shipping Address Management
- `/checkout` - Order Review & COD Placement
- `/orders` - My Orders List
- `/orders/[id]` - Order Details & Snapshot Review

## Data
- Seed script (`backend/prisma/seed.ts`) populates the database with 4 physical products.

## Important Decisions
- Using Next.js App Router for frontend.
- Skipping Docker for simplicity.
- Real-time DB price and stock validation during checkout.
- Cash on Delivery (COD) as the primary payment method for Phase 6.
- Atomic stock deduction and cart clearing within `$transaction`.
- Read-only historical snapshot preservation for orders and order details.

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
- **[Phase 6]**: Cash on Delivery (COD) order creation with atomic stock deduction, cart clearing, and confirmation UI.
- **[Phase 7]**: My Orders (`/orders`) list and Order Details (`/orders/[id]`) pages with snapshot review and navbar navigation.
- **[Phase 8]**: Admin Panel & RBAC Security:
  - `User.role` enum (`USER`, `ADMIN`) with secure registration enforcement (`role = USER` hardcoded, client role rejected).
  - Initial Admin seeded via Prisma (`admin@store.com` / `AdminPassword123!`).
  - Backend authoritative `AdminGuard` protecting all `/admin/*` routes (metrics, product catalog, customer order management).
  - Admin UI with `/admin` dashboard metrics, `/admin/products` catalog CRUD, `/admin/orders` order tracking, and `/admin/orders/[id]` status updater.
  - Safe product deactivation if referenced in orders; historical pricing and shipping snapshots preserved permanently.
