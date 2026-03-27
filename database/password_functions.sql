-- ฟังก์ชันสำหรับให้ผู้ใช้เปลี่ยนรหัสผ่านตัวเอง (ต้องรู้รหัสผ่านเดิม)
CREATE OR REPLACE FUNCTION change_user_password(
  p_employee_code TEXT,
  p_old_password TEXT,
  p_new_password TEXT
) RETURNS jsonb AS $$
DECLARE
  found_user RECORD;
BEGIN
  -- ตรวจสอบรหัสผ่านเดิม
  SELECT id INTO found_user
  FROM profiles
  WHERE employee_code = p_employee_code
    AND password_hash = crypt(p_old_password, password_hash);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'รหัสผ่านเดิมไม่ถูกต้อง');
  END IF;

  -- อัปเดตรหัสผ่านใหม่
  UPDATE profiles 
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE employee_code = p_employee_code;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ฟังก์ชันสำหรับแอดมินรีเซ็ตรหัสผ่านให้พนักงาน (ไม่ต้องใช้รหัสผ่านเดิม)
CREATE OR REPLACE FUNCTION admin_reset_password(
  p_employee_code TEXT,
  p_new_password TEXT
) RETURNS jsonb AS $$
DECLARE
  found_user RECORD;
BEGIN
  SELECT id INTO found_user
  FROM profiles
  WHERE employee_code = p_employee_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'ไม่พบรหัสพนักงานนี้ในระบบ');
  END IF;

  UPDATE profiles 
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE employee_code = p_employee_code;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
