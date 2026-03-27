require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data: createData, error: createError } = await supabase.rpc('create_app_user', {
        p_employee_code: 'TEST2026',
        p_full_name: 'Test Create',
        p_password: 'password123',
        p_role: 'user',
        p_department: 'production',
        p_allowed_lines: []
    });

    if (createError) {
        console.error('ERROR CREATING USER:', createError);
    } else {
        console.log('SUCCESS CREATING USER:', createData);
    }
}

run();
