import { supabaseAdmin } from './src/config/supabase.js';

async function resetTeacherPassword() {
  try {
    console.log('Resetting teacher1 password...');
    
    // Update the user password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      '58517efa-e7c3-4cca-8d83-4648d0bcf6aa',
      {
        password: 'password123'
      }
    );
    
    if (error) {
      console.error('Error updating password:', error);
    } else {
      console.log('✅ Password updated successfully for teacher1');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

resetTeacherPassword();