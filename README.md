# BikeCare – Bike Expense & Maintenance Tracker

A production-quality full-stack web application designed for motorcycle and scooter owners to track expenses, analyze fuel consumption, monitor maintenance schedules, and evaluate Total Cost of Ownership (TCO).

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Python FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Secure JWT & Supabase Auth Integration

## Project Structure
```
bikecare/
├── database/
│   ├── schema.sql        # PostgreSQL DDL with RLS, Constraints, Indexes
│   └── seed.sql          # Sample development seed data
├── backend/              # Python FastAPI REST API
├── frontend/             # React + Vite + Tailwind CSS SPA
└── docs/                 # Architecture, API & DB design specs
```

## Phases
1. System Architecture, ER Diagram & Schema Design (Completed)
2. Supabase Setup, SQL Schema Execution & Seed Data
3. FastAPI Backend Setup
4. Authentication & Profile Management
5. React Frontend Foundation
6. Fuel Tracker Module
7. Maintenance Tracker & Custom Categories
8. General Expense Module
9. Dashboard & Analytics Engine
10. Reports & CSV/PDF Export
11. Automated Testing & Edge Case Validation
12. Cloud Deployment (Vercel + Render + Supabase)
