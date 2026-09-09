-- =============================================================================
-- BikeCare – Bike Expense & Maintenance Tracker
-- Database Schema (PostgreSQL / Supabase)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE fuel_type_enum AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');

CREATE TYPE expense_category_enum AS ENUM (
    'PETROL',
    'MAINTENANCE',
    'REPAIRS',
    'INSURANCE',
    'PUC',
    'ACCESSORIES',
    'WASHING',
    'PARKING',
    'FINES',
    'TAX',
    'SERVICE',
    'OTHER'
);

CREATE TYPE payment_method_enum AS ENUM ('CASH', 'CARD', 'UPI', 'NET_BANKING', 'OTHER');

CREATE TYPE reminder_type_enum AS ENUM ('DATE', 'ODOMETER', 'BOTH');

CREATE TYPE reminder_status_enum AS ENUM ('DUE_SOON', 'DUE_TODAY', 'OVERDUE', 'COMPLETED');

CREATE TYPE document_type_enum AS ENUM (
    'SERVICE_BILL',
    'PETROL_RECEIPT',
    'INSURANCE',
    'PUC',
    'REPAIR_BILL',
    'RC',
    'OTHER'
);

-- -----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Mirrors & extends Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    currency_symbol TEXT DEFAULT '₹',
    distance_unit TEXT DEFAULT 'KM',
    volume_unit TEXT DEFAULT 'L',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. BIKES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bikes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT,
    registration_number TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    purchase_odometer INTEGER NOT NULL DEFAULT 0,
    current_odometer INTEGER NOT NULL DEFAULT 0,
    fuel_type fuel_type_enum NOT NULL DEFAULT 'PETROL',
    tank_capacity NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    expected_mileage NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    insurance_expiry DATE,
    puc_expiry DATE,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_purchase_price_non_negative CHECK (purchase_price >= 0),
    CONSTRAINT chk_purchase_odometer_non_negative CHECK (purchase_odometer >= 0),
    CONSTRAINT chk_current_odometer_valid CHECK (current_odometer >= purchase_odometer),
    CONSTRAINT chk_tank_capacity_positive CHECK (tank_capacity > 0),
    CONSTRAINT chk_expected_mileage_positive CHECK (expected_mileage > 0)
);

-- -----------------------------------------------------------------------------
-- 4. FUEL RECORDS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fuel_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    odometer INTEGER NOT NULL,
    litres NUMERIC(7, 2) NOT NULL,
    price_per_litre NUMERIC(7, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    petrol_station TEXT,
    is_full_tank BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_fuel_odometer_non_negative CHECK (odometer >= 0),
    CONSTRAINT chk_fuel_litres_positive CHECK (litres > 0),
    CONSTRAINT chk_fuel_price_positive CHECK (price_per_litre > 0),
    CONSTRAINT chk_fuel_total_non_negative CHECK (total_amount >= 0)
);

-- -----------------------------------------------------------------------------
-- 5. MAINTENANCE CATEGORIES (System Presets & User Custom)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system presets
    name TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_user_category_name UNIQUE(user_id, name)
);

-- -----------------------------------------------------------------------------
-- 6. MAINTENANCE RECORDS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.maintenance_categories(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    odometer INTEGER NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    service_center TEXT,
    parts_replaced TEXT,
    description TEXT,
    next_due_date DATE,
    next_due_odometer INTEGER,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_maint_odometer_non_negative CHECK (odometer >= 0),
    CONSTRAINT chk_maint_cost_non_negative CHECK (cost >= 0),
    CONSTRAINT chk_next_due_odometer_valid CHECK (next_due_odometer IS NULL OR next_due_odometer >= odometer),
    CONSTRAINT chk_next_due_date_valid CHECK (next_due_date IS NULL OR next_due_date >= date)
);

-- -----------------------------------------------------------------------------
-- 7. EXPENSES TABLE (General Expenses)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category expense_category_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    payment_method payment_method_enum NOT NULL DEFAULT 'UPI',
    receipt_url TEXT,
    is_synced_from_module BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_expense_amount_non_negative CHECK (amount >= 0)
);

-- -----------------------------------------------------------------------------
-- 8. REMINDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reminder_type reminder_type_enum NOT NULL DEFAULT 'BOTH',
    due_date DATE,
    due_odometer INTEGER,
    status reminder_status_enum NOT NULL DEFAULT 'DUE_SOON',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_due_odometer_non_negative CHECK (due_odometer IS NULL OR due_odometer >= 0)
);

-- -----------------------------------------------------------------------------
-- 9. DOCUMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doc_type document_type_enum NOT NULL DEFAULT 'OTHER',
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes INTEGER,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bikes_user_id ON public.bikes(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_bike_date ON public.fuel_records(bike_id, date DESC, odometer DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_bike_date ON public.maintenance_records(bike_id, date DESC, odometer DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_bike_date ON public.expenses(bike_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_bike_category ON public.expenses(bike_id, category);
CREATE INDEX IF NOT EXISTS idx_reminders_bike_status ON public.reminders(bike_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_bike_type ON public.documents(bike_id, doc_type);

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Bikes
CREATE POLICY "Users can manage own bikes" ON public.bikes
    FOR ALL USING (auth.uid() = user_id);

-- Fuel Records
CREATE POLICY "Users can manage own fuel records" ON public.fuel_records
    FOR ALL USING (auth.uid() = user_id);

-- Maintenance Categories
CREATE POLICY "Users can view system and own categories" ON public.maintenance_categories
    FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.maintenance_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can modify own categories" ON public.maintenance_categories
    FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete own categories" ON public.maintenance_categories
    FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- Maintenance Records
CREATE POLICY "Users can manage own maintenance records" ON public.maintenance_records
    FOR ALL USING (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Users can manage own expenses" ON public.expenses
    FOR ALL USING (auth.uid() = user_id);

-- Reminders
CREATE POLICY "Users can manage own reminders" ON public.reminders
    FOR ALL USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can manage own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 12. AUTOMATIC UPDATED_AT TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bikes_updated_at BEFORE UPDATE ON public.bikes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_fuel_updated_at BEFORE UPDATE ON public.fuel_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_maint_updated_at BEFORE UPDATE ON public.maintenance_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
