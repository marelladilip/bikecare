# BikeCare – Architecture & Technical Design Specification

## System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend Tier (React + Vite + Tailwind CSS)"]
        UI["Responsive UI (Desktop, Tablet, Mobile)"]
        Router["React Router v6"]
        State["Context (Auth, Active Bike, Theme)"]
        API_Client["Axios HTTP Client (JWT Bearer Token)"]
        Charts["Recharts Visualizations"]
    end

    subgraph Server ["Backend Tier (Python FastAPI REST API)"]
        FastAPI["FastAPI App (ASGI / Uvicorn)"]
        AuthMiddleware["JWT Authentication Middleware"]
        Routers["Routers: Auth, Bikes, Fuel, Maint, Expenses, Analytics, Reports"]
        Services["Domain Services (TCO, Mileage Calc, Analytics Engine)"]
        PydanticSchemas["Pydantic v2 Models (Validation & Serialization)"]
        SQLAlchemyORM["SQLAlchemy 2.0 ORM / Engine"]
    end

    subgraph Data ["Data & Storage Tier (Supabase)"]
        Postgres["Supabase PostgreSQL (Tables, Indexes, Checks, Triggers)"]
        RLS["Row Level Security (Tenant Isolation auth.uid() = user_id)"]
        Storage["Supabase Storage (Receipts, Invoices, Bike Photos)"]
    end

    UI --> Router
    Router --> State
    State --> API_Client
    UI --> Charts
    API_Client -->|HTTPS REST + JWT| FastAPI
    FastAPI --> AuthMiddleware
    AuthMiddleware --> Routers
    Routers --> PydanticSchemas
    Routers --> Services
    Services --> SQLAlchemyORM
    SQLAlchemyORM -->|Async PostgreSQL / RLS Context| Postgres
    Postgres --> RLS
    API_Client -.->|Direct Secure Uploads| Storage
```

## Entity Relationship Model

```mermaid
erDiagram
    PROFILES ||--o{ BIKES : owns
    PROFILES ||--o{ MAINTENANCE_CATEGORIES : creates
    BIKES ||--o{ FUEL_RECORDS : logs
    BIKES ||--o{ MAINTENANCE_RECORDS : logs
    BIKES ||--o{ EXPENSES : incurs
    BIKES ||--o{ REMINDERS : triggers
    BIKES ||--o{ DOCUMENTS : stores
    MAINTENANCE_CATEGORIES ||--o{ MAINTENANCE_RECORDS : categorizes

    PROFILES {
        uuid id PK
        string email UK
        string full_name
        string currency_symbol
        string distance_unit
        string volume_unit
        timestamp created_at
        timestamp updated_at
    }

    BIKES {
        uuid id PK
        uuid user_id FK
        string brand
        string model
        string variant
        string registration_number
        date purchase_date
        decimal purchase_price
        integer purchase_odometer
        integer current_odometer
        string fuel_type
        decimal tank_capacity
        decimal expected_mileage
        date insurance_expiry
        date puc_expiry
        text notes
        string image_url
        timestamp created_at
        timestamp updated_at
    }

    FUEL_RECORDS {
        uuid id PK
        uuid bike_id FK
        uuid user_id FK
        date date
        integer odometer
        decimal litres
        decimal price_per_litre
        decimal total_amount
        string petrol_station
        boolean is_full_tank
        text notes
        string receipt_url
        timestamp created_at
        timestamp updated_at
    }

    MAINTENANCE_CATEGORIES {
        uuid id PK
        uuid user_id FK
        string name
        boolean is_system
        timestamp created_at
    }

    MAINTENANCE_RECORDS {
        uuid id PK
        uuid bike_id FK
        uuid user_id FK
        uuid category_id FK
        date date
        integer odometer
        decimal cost
        string service_center
        string parts_replaced
        text description
        date next_due_date
        integer next_due_odometer
        string receipt_url
        text notes
        timestamp created_at
        timestamp updated_at
    }

    EXPENSES {
        uuid id PK
        uuid bike_id FK
        uuid user_id FK
        date date
        string category
        decimal amount
        text description
        string payment_method
        string receipt_url
        boolean is_synced_from_module
        timestamp created_at
        timestamp updated_at
    }

    REMINDERS {
        uuid id PK
        uuid bike_id FK
        uuid user_id FK
        string title
        string reminder_type
        date due_date
        integer due_odometer
        string status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENTS {
        uuid id PK
        uuid bike_id FK
        uuid user_id FK
        string doc_type
        string file_name
        string file_url
        string mime_type
        integer file_size_bytes
        date expiry_date
        text notes
        timestamp created_at
        timestamp updated_at
    }
```

## REST API Specification Summary

- **Auth**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/profile`
- **Bikes**: `/api/v1/bikes`, `/api/v1/bikes/{id}` (CRUD)
- **Fuel**: `/api/v1/bikes/{bike_id}/fuel` (Log refills, calculate mileage, fetch history)
- **Maintenance**: `/api/v1/bikes/{bike_id}/maintenance`, `/api/v1/maintenance/categories`
- **Expenses**: `/api/v1/bikes/{bike_id}/expenses` (Categorized non-fuel & general expenses)
- **Reminders**: `/api/v1/bikes/{bike_id}/reminders`, `/api/v1/reminders/{id}/complete`
- **Dashboard & Analytics**: `/api/v1/dashboard/{bike_id}`, `/api/v1/analytics/{bike_id}`, `/api/v1/tco/{bike_id}`
- **Reports**: `/api/v1/reports/{bike_id}`, `/api/v1/reports/{bike_id}/export/csv`
