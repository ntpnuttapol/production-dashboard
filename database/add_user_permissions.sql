-- =====================================================
-- CUSTOM AUTH SYSTEM (No Email Required!)
-- Login = employee_code + password
-- Password hashed with pgcrypto (bcrypt)
-- Run this ONCE in Supabase SQL Editor
-- Then go to http://localhost:3000/setup
-- =====================================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop FK to auth.users so we can create users independently
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- 3. Set id default so we can auto-generate UUIDs
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowed_lines TEXT[] DEFAULT '{}';

-- 5. Fix existing data before adding constraints
UPDATE profiles SET role = 'user' WHERE role IS NULL OR role NOT IN ('admin', 'user');
UPDATE profiles SET department = 'production' WHERE department IS NULL OR department NOT IN ('production', 'finishing', 'all');

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_department_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user'));
ALTER TABLE profiles ADD CONSTRAINT profiles_department_check CHECK (department IN ('production', 'finishing', 'all'));

-- 6. RLS: allow full public access (internal app, protected by app-level login)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can lookup employee_code" ON profiles;
DROP POLICY IF EXISTS "Allow all access" ON profiles;

CREATE POLICY "Allow all access" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 7. Function: Create user with hashed password
CREATE OR REPLACE FUNCTION create_app_user(
  p_employee_code TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'user',
  p_department TEXT DEFAULT 'production',
  p_allowed_lines TEXT[] DEFAULT '{}'
) RETURNS jsonb AS $$
DECLARE
  new_id UUID;
  existing_id UUID;
BEGIN
  -- Check if employee_code already exists
  SELECT id INTO existing_id FROM profiles WHERE employee_code = p_employee_code;
  IF existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'รหัสพนักงานนี้มีอยู่แล้ว');
  END IF;

  new_id := gen_random_uuid();
  INSERT INTO profiles (id, employee_code, full_name, password_hash, role, department, allowed_lines, created_at, updated_at)
  VALUES (new_id, p_employee_code, p_full_name, crypt(p_password, gen_salt('bf')), p_role, p_department, p_allowed_lines, NOW(), NOW());

  RETURN jsonb_build_object('id', new_id, 'employee_code', p_employee_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function: Login (verify password)
CREATE OR REPLACE FUNCTION login_app_user(
  p_employee_code TEXT,
  p_password TEXT
) RETURNS jsonb AS $$
DECLARE
  found_user RECORD;
BEGIN
  SELECT id, employee_code, full_name, role, department, allowed_lines
  INTO found_user
  FROM profiles
  WHERE employee_code = p_employee_code
    AND password_hash = crypt(p_password, password_hash);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง');
  END IF;

  RETURN jsonb_build_object(
    'id', found_user.id,
    'employee_code', found_user.employee_code,
    'full_name', found_user.full_name,
    'role', found_user.role,
    'department', found_user.department,
    'allowed_lines', found_user.allowed_lines
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONE! Go to http://localhost:3000/setup
-- =====================================================
