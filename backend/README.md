# BikeCare Backend – FastAPI REST API

## Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your `DATABASE_URL` with your Supabase PostgreSQL connection URI:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```
*(Note: If you want to develop offline without Supabase configured, the backend automatically falls back to local SQLite).*

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

- Interactive Swagger Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/api/v1/health`
