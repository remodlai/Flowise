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
  // Create a test user with enhanced metadata
  const email = 'test-service-user-' + Date.now() + '@example.com';
  const password = 'Test123456!';
  
  console.log('Creating test service user...');
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      is_service_user: true,
      status: 'active',
      application_id: '123e4567-e89b-12d3-a456-426614174000',
      application_name: 'Test Application',
      organization_id: '123e4567-e89b-12d3-a456-426614174001',
      organization_name: 'Test Organization',
      created_by: '123e4567-e89b-12d3-a456-426614174002',
      creator_first_name: 'Admin',
      creator_last_name: 'User',
      first_name: 'Service',
      last_name: 'User'
    }
  });
  
  if (userError) {
    console.error('Error creating user:', userError);
    return;
  }
  
  console.log('User created:', userData);
  
  // Sign in with the test user to get a JWT token
  console.log('Signing in as test user...');
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (sessionError) {
    console.error('Error signing in:', sessionError);
    return;
  }
  
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
}

testHook().catch(console.error); 