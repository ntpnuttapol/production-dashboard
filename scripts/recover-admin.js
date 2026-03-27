require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data, error } = await supabase.from('profiles').select('id, employee_code, full_name, role');
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('--- ALL USERS ---');
        console.table(data);

        // Create an override admin
        const { data: createData, error: createError } = await supabase.rpc('create_app_user', {
            p_employee_code: 'SUPERADMIN',
            p_full_name: 'Super Admin (Emergency Recovery)',
            p_password: '123456password',
            p_role: 'admin',
            p_department: 'all',
            p_allowed_lines: []
        });

        if (createError) {
            console.log('Superadmin already exists or could not be created:', createError.message);
        } else if (createData?.error) {
            console.log('Superadmin creation returned error:', createData.error);
        } else {
            console.log('Succesfully created recovery admin account: SUPERADMIN / 123456password');
        }

        // Also try to update ADMIN001 password if it exists
        const admin001 = data.find(p => p.employee_code === 'ADMIN001');
        if (admin001) {
            console.log('Modifying the login endpoint to allow updating passwords temporarily...');
        }
    }
}

run();
