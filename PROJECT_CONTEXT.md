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
- None

## Current Phase
- Phase 1: Project Foundation Setup

## Pending Work
- Phase 1: Set up the Next.js frontend.
- Phase 1: Set up the NestJS backend.
- Phase 1: Configure Prisma for PostgreSQL/Supabase.
- Phase 1: Configure `.env` and `.env.example` safely.
- Phase 1: Add a simple `GET /health` endpoint to the backend.
- Phase 1: Verify frontend and backend run successfully.
- Phase 1: Configure Git properly.

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
