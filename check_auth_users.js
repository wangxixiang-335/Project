import { supabaseAdmin } from './src/config/supabase.js';

async function checkAuthUsers() {
  try {
    console.log('Checking Supabase Auth users...');
    
    // List all auth users
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return;
    }
    
    console.log('Auth users found:', users.users.length);
    
    users.users.forEach(user => {
      console.log('User:', {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        username: user.user_metadata?.username,
        created_at: user.created_at
      });
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkAuthUsers();