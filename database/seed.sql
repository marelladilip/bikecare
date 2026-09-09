-- =============================================================================
-- BikeCare – Database Seed Data
-- =============================================================================

-- 1. Insert System Maintenance Categories (Accessible to all users)
INSERT INTO public.maintenance_categories (id, user_id, name, is_system)
VALUES
    ('c0000000-0000-0000-0000-000000000001', NULL, 'Engine Oil', TRUE),
    ('c0000000-0000-0000-0000-000000000002', NULL, 'Oil Filter', TRUE),
    ('c0000000-0000-0000-0000-000000000003', NULL, 'Air Filter', TRUE),
    ('c0000000-0000-0000-0000-000000000004', NULL, 'Brake Pads', TRUE),
    ('c0000000-0000-0000-0000-000000000005', NULL, 'Brake Fluid', TRUE),
    ('c0000000-0000-0000-0000-000000000006', NULL, 'Chain Lubrication', TRUE),
    ('c0000000-0000-0000-0000-000000000007', NULL, 'Chain Replacement', TRUE),
    ('c0000000-0000-0000-0000-000000000008', NULL, 'Tyres', TRUE),
    ('c0000000-0000-0000-0000-000000000009', NULL, 'Battery', TRUE),
    ('c0000000-0000-0000-0000-000000000010', NULL, 'Spark Plug', TRUE),
    ('c0000000-0000-0000-0000-000000000011', NULL, 'Coolant', TRUE),
    ('c0000000-0000-0000-0000-000000000012', NULL, 'General Service', TRUE),
    ('c0000000-0000-0000-0000-000000000013', NULL, 'Repairs', TRUE),
    ('c0000000-0000-0000-0000-000000000014', NULL, 'Other', TRUE)
ON CONFLICT (user_id, name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Sample Realistic Development Seed Data
-- Note: Replace '00000000-0000-0000-0000-000000000000' with your actual Supabase auth.users UUID
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_user_id UUID;
    v_bike_id UUID := 'b1111111-1111-1111-1111-111111111111';
BEGIN
    -- Attempt to pick the first existing user from profiles, if any
    SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

    -- If a user profile exists, seed a sample motorcycle and logs for testing
    IF v_user_id IS NOT NULL THEN
        -- 2. Insert Sample Bike: Honda CB350 H'ness
        INSERT INTO public.bikes (
            id, user_id, brand, model, variant, registration_number,
            purchase_date, purchase_price, purchase_odometer, current_odometer,
            fuel_type, tank_capacity, expected_mileage, insurance_expiry, puc_expiry, notes
        )
        VALUES (
            v_bike_id,
            v_user_id,
            'Honda',
            'H''ness CB350',
            'DLX Pro Dual Tone',
            'MH 12 AB 4589',
            '2024-01-15',
            215000.00,
            0,
            6450,
            'PETROL',
            15.00,
            38.00,
            '2027-01-14',
            '2027-01-14',
            'Daily commuter + weekend highway touring machine.'
        ) ON CONFLICT (id) DO NOTHING;

        -- 3. Insert Fuel Records (Demonstrating mileage calculation & price trends)
        INSERT INTO public.fuel_records (bike_id, user_id, date, odometer, litres, price_per_litre, total_amount, petrol_station, is_full_tank, notes)
        VALUES
            (v_bike_id, v_user_id, '2024-01-16', 15, 14.50, 104.20, 1510.90, 'Shell V-Power Hinjewadi', TRUE, 'First full tank after delivery'),
            (v_bike_id, v_user_id, '2024-02-02', 480, 13.20, 104.50, 1379.40, 'Indian Oil Wakad', TRUE, 'City commuting'),
            (v_bike_id, v_user_id, '2024-02-25', 960, 12.80, 104.80, 1341.44, 'HP Auto Care Baner', TRUE, 'Highway run to Lonavala'),
            (v_bike_id, v_user_id, '2024-03-20', 1450, 13.50, 105.10, 1418.85, 'Bharat Petroleum Aundh', TRUE, 'Regular commute'),
            (v_bike_id, v_user_id, '2024-04-18', 2100, 15.00, 105.40, 1581.00, 'Shell Petrol Station', TRUE, 'Pre-ride top up'),
            (v_bike_id, v_user_id, '2024-05-30', 3200, 14.20, 105.20, 1493.84, 'Indian Oil Highway Care', TRUE, 'Long ride through ghats'),
            (v_bike_id, v_user_id, '2024-07-15', 4650, 13.90, 105.60, 1467.84, 'HP Pump', TRUE, 'Monsoon riding'),
            (v_bike_id, v_user_id, '2024-08-28', 5800, 14.10, 105.50, 1487.55, 'Shell Wakad', TRUE, 'Post service refill'),
            (v_bike_id, v_user_id, '2024-09-02', 6450, 14.40, 105.80, 1523.52, 'Bharat Petroleum Highway', TRUE, 'Latest fill-up')
        ON CONFLICT DO NOTHING;

        -- 4. Insert Maintenance Records
        INSERT INTO public.maintenance_records (
            bike_id, user_id, category_id, date, odometer, cost, service_center,
            parts_replaced, description, next_due_date, next_due_odometer, notes
        )
        VALUES
            (
                v_bike_id, v_user_id,
                'c0000000-0000-0000-0000-000000000012', -- General Service (1st Free Service)
                '2024-02-10', 1000, 480.00, 'Honda BigWing Pune Central',
                'Engine Oil, Oil Filter O-ring',
                'First mandatory 1000 km checkup. Chain lubed and valve clearances checked.',
                '2024-08-10', 6000, 'Labor free, only consumable fluids charged.'
            ),
            (
                v_bike_id, v_user_id,
                'c0000000-0000-0000-0000-000000000006', -- Chain Lubrication
                '2024-04-10', 2500, 250.00, 'DIY Garage',
                'Motul Chain Clean & Lube',
                'Cleaned with kerosene brush and applied Motul C2 spray.',
                '2024-05-15', 3200, 'Clean every 700 km.'
            ),
            (
                v_bike_id, v_user_id,
                'c0000000-0000-0000-0000-000000000012', -- General Service (2nd Service)
                '2024-08-14', 5950, 1850.00, 'Honda BigWing Pune Central',
                'Synthetic Engine Oil 10W-30, Oil Filter element, Air filter cleaned',
                'Second scheduled periodic maintenance. Brake pads cleaned and front caliper greased.',
                '2025-02-14', 12000, 'Smooth clutch adjustment done.'
            )
        ON CONFLICT DO NOTHING;

        -- 5. Insert General Expenses
        INSERT INTO public.expenses (bike_id, user_id, date, category, amount, description, payment_method)
        VALUES
            (v_bike_id, v_user_id, '2024-01-18', 'ACCESSORIES', 3200.00, 'Crash Guard / Leg Protector & Bash Plate', 'UPI'),
            (v_bike_id, v_user_id, '2024-01-20', 'ACCESSORIES', 1400.00, 'Bobo Mobile Holder with Vibration Dampener', 'CARD'),
            (v_bike_id, v_user_id, '2024-03-12', 'WASHING', 350.00, 'Foam Wash & Ceramic Polish Spray', 'CASH'),
            (v_bike_id, v_user_id, '2024-06-05', 'WASHING', 300.00, 'Detailing foam wash after monsoon ride', 'UPI'),
            (v_bike_id, v_user_id, '2024-07-22', 'PARKING', 120.00, 'Weekend multi-level secure parking', 'UPI')
        ON CONFLICT DO NOTHING;

        -- 6. Insert Reminders
        INSERT INTO public.reminders (bike_id, user_id, title, reminder_type, due_date, due_odometer, status, notes)
        VALUES
            (v_bike_id, v_user_id, 'Chain Cleaning & Lube', 'ODOMETER', NULL, 6700, 'DUE_SOON', 'Chain should be cleaned every 500-700 KM.'),
            (v_bike_id, v_user_id, '3rd Scheduled Periodic Service', 'BOTH', '2025-02-14', 12000, 'DUE_SOON', 'Mandatory 1-year / 12,000 KM service at BigWing.'),
            (v_bike_id, v_user_id, 'Pollution Under Control (PUC) Renewal', 'DATE', '2027-01-14', NULL, 'DUE_SOON', 'PUC valid for 3 years for BS6 new vehicles.')
        ON CONFLICT DO NOTHING;

    END IF;
END $$;
