const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://voksjtjrshonjadwjozt.supabase.co', 
  'SzhoGvFA_pUgn5GaKBbXPW8CWLH1jkjx4VhsIXiMaYY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testHook() {
  // Sign in with the existing user
  console.log('Signing in as existing user...');
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: 'brian+test@remodl.ai',
    password: 'password' // Replace with the actual password
  });
  
  if (sessionError) {
    console.error('Error signing in:', sessionError);
    return;
  }
  
  console.log('Successfully signed in');
  
  // Decode the JWT token to check the claims
  const token = sessionData.session.access_token;
  const tokenParts = token.split('.');
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  
  console.log('JWT Claims:', JSON.stringify(payload, null, 2));
  
  // Check for the enhanced metadata
  console.log('Enhanced Metadata Check:');
  console.log('- is_service_user:', payload.is_service_user);
  console.log('- user_status:', payload.user_status);
  console.log('- application:', payload.application);
  console.log('- organization:', payload.organization);
  console.log('- creator:', payload.creator);
  console.log('- test_claim:', payload.test_claim);
  console.log('- first_name:', payload.first_name);
  console.log('- last_name:', payload.last_name);
}

testHook().catch(console.error); 