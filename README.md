# E-Commerce Project

A small e-commerce website with 4 physical products.

## Project Structure

- `frontend/`: Next.js frontend application.
- `backend/`: NestJS backend application.
- `docs/`: Project documentation.
- `PROJECT_CONTEXT.md`: Single source of truth for project status and architecture.

## Setup Instructions

1. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend:**
   ```bash
   cd backend
   npm install
   # Set up .env variables (refer to .env.example)
   npx prisma generate
   npm run start:dev
   ```

Please refer to `PROJECT_CONTEXT.md` for more details.