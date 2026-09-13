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
- Phase 1: Project Foundation Setup

## Current Phase
- Phase 1 Completed. Waiting for Phase 2.

## Pending Work
- Phase 2: TBA

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
