-- Import customers from Barcode System / ManageCustomer
-- Source: http://192.168.100.175/barcode_system/backoffice/ManageCustomer
-- Generated: 2026-04-01
-- Notes:
-- 1. Numeric customer codes are normalized by removing leading zeroes (01 -> 1)
--    to avoid duplicates with existing rows already stored in Project-Finishing.
-- 2. This script is safe to re-run because it uses UPSERT.
-- 3. Fujitsu and Toshiba customer masters are intentionally excluded per business request.

WITH customer_seed (customer_code, customer_name, is_active) AS (
  VALUES
    ('1', 'DAIKIN INDUSTRIES (THAILAND) LTD.', true),
    ('2', 'FISHER & PAYKEL APPL', true),
    ('5', 'MIC INDUSTRIES (THAILAND) CO.,LTD.', true),
    ('6', 'TENMA (THAILAND) CO., LTD.', true),
    ('7', 'HAMAKA (Thailand) CO., LTD.', true),
    ('8', 'NISSHINBO MECHATRONICS (THAILAND) LTD.', true),
    ('9', 'FELTOL MANUFACTURING CO.,LTD.', true),
    ('10', 'AIRCON-MFG CO.,LTD.', true),
    ('11', 'DAIMA CORPORATION LIMITED', true),
    ('12', 'MITSUBISHI HEAVY INDUSTRIES-MAHAJAK AIR CONDITIONERS CO., LTD.', true),
    ('13', 'KANG YONG ELECTRIC PUBLIC COMPANY LIMITED.', true),
    ('14', 'SNC CREATIVITY ANTHOLOGY CO.,LTD.', true),
    ('15', 'ARMSTRONG RUBBER & CHEMICAL PRODUCTS CO., LTD.', true),
    ('16', 'บริษัท ว่านลี่แพ็คกิ้งเอ็นเตอร์ไพรส์ จำกัด(สำนักงานใหญ่)', true),
    ('17', 'CLASSIC BREAK', true),
    ('18', 'ASIA KENDY ENGINEERING CO., LTD.', true),
    ('19', 'DAIKIN TRADING (THAILAND) LIMITED', true),
    ('20', 'Calsonic Kansei(Thailand)Co.,Ltd.', true),
    ('21', 'TACS', true),
    ('22', 'ICP', true),
    ('23', 'บริษัท เทคโนโฟม จำกัด', true),
    ('24', 'Other', true),
    ('25', 'MINIGREAT PACKING (THAILAND) CO.,LTD', true),
    ('26', 'บริษัท พาราไดซ์ พลาสติก จำกัด (สำนักงานใหญ่)', true),
    ('27', 'B.GRIMM AIRCONDITIONING LTD.', true),
    ('28', 'NEWLAND XDD (Thailand) Co., Ltd', true),
    ('29', 'HISENSE', true),
    ('30', 'GEELONG (THAILAND)CO.LTD.', true),
    ('31', 'Midea', true),
    ('32', 'SAMRUAY ENGINEERING CO.,LTD.', true),
    ('33', 'Canadian Solar Manufacturing (Thailand) Co., Ltd.', true),
    ('34', 'TTS PLASTIC CO., LTD.', true),
    ('35', 'JET INDUSTRIES (THAILAND) CO., LTD.', true),
    ('37', 'CARRIER AIR CONDITIONING (THAILAND) CO.,LTD.', true),
    ('38', 'UKKARIT RUNGRUENG (2000) CO.,LTD.', true),
    ('39', 'TONGRUN', true),
    ('40', 'THAIMAKE', true),
    ('41', 'GENERAL Air Conditioning Manufacturing (Thailand) Co.,LTD.', true)
)
INSERT INTO customers (customer_code, customer_name, is_active)
SELECT
  customer_code,
  customer_name,
  is_active
FROM customer_seed
ON CONFLICT (customer_code) DO UPDATE
SET
  customer_name = EXCLUDED.customer_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
