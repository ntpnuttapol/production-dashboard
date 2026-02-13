-- =====================================================
-- Production Finishing Dashboard - Supabase SQL Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments table
CREATE TABLE departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Status types table
CREATE TABLE status_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_th TEXT,
    color TEXT NOT NULL,
    animation_type TEXT DEFAULT 'none',
    priority INT DEFAULT 0
);

-- 3. Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    employee_code TEXT UNIQUE,
    full_name TEXT,
    department_id UUID REFERENCES departments(id),
    role TEXT DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Production orders table
CREATE TABLE production_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) NOT NULL,
    quantity_target INT NOT NULL DEFAULT 0,
    quantity_completed INT DEFAULT 0,
    status_id INT REFERENCES status_types(id) DEFAULT 4,
    assigned_to UUID REFERENCES profiles(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order status history table
CREATE TABLE order_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE NOT NULL,
    old_status_id INT REFERENCES status_types(id),
    new_status_id INT REFERENCES status_types(id) NOT NULL,
    updated_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Insert default data
-- =====================================================

INSERT INTO departments (name, description, display_order) VALUES
('Production', 'งานผลิต', 1),
('Finishing', 'งาน Finishing', 2),
('Assembly', 'งานประกอบ', 3);

INSERT INTO status_types (name, name_th, color, animation_type, priority) VALUES
('Working', 'กำลังทำงาน', '#FFD700', 'bounce', 1),
('Completed', 'เสร็จสิ้น', '#4CAF50', 'fireworks', 2),
('Not Working', 'ไม่ได้ทำ', '#F44336', 'none', 3),
('Inactive', 'ไม่มีงาน', '#424242', 'none', 4);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Policies: Only authenticated users can access
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view departments" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view status_types" ON status_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view orders" ON production_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" ON production_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON production_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view history" ON order_status_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert history" ON order_status_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- Auto-create profile on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- Useful Views
-- =====================================================

CREATE OR REPLACE VIEW production_orders_view AS
SELECT 
    po.id,
    po.order_number,
    po.product_name,
    d.name as department,
    po.quantity_target,
    po.quantity_completed,
    st.name as status,
    st.name_th as status_th,
    st.color as status_color,
    st.animation_type,
    p.full_name as assigned_to_name,
    po.order_date,
    po.due_date,
    po.remarks,
    po.created_at,
    po.updated_at
FROM production_orders po
LEFT JOIN departments d ON po.department_id = d.id
LEFT JOIN status_types st ON po.status_id = st.id
LEFT JOIN profiles p ON po.assigned_to = p.id;
