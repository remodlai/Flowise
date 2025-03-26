/**
 * PKCE Flow Sign In Test
 *
 * This is a simple test script to verify the PKCE authentication flow
 * with basic email and password sign in.
 */

// Import the RemodlAuth class and config
const { RemodlAuth } = require('../dist');
const config = require('../config.json');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask for input
function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Create test configuration using config.json values
const authConfig = {
  remodlPlatformDataUrl: config.remodlPlatformDataUrl,
  remodlPlatformDataAnonKey: config.remodlPlatformDataAnonKey,
  debug: true // Enable debug logging
};

// Test credentials will be prompted for
let testEmail = '';
let testPassword = '';

/**
 * Main test function
 */
async function runTest() {
  console.log('=== PKCE Flow Sign In Test ===');
  console.log(`Using URL: ${authConfig.remodlPlatformDataUrl}`);
  
  // Ask for test credentials
  testEmail = await askQuestion('Enter test email: ');
  testPassword = await askQuestion('Enter test password: ');
  
  try {
    // Initialize the auth client with PKCE flow
    console.log('Initializing RemodlAuth with PKCE flow...');
    const auth = new RemodlAuth(authConfig);
    
    // Sign in with email and password
    console.log(`Attempting to sign in with email: ${testEmail}...`);
    const signInResult = await auth.signIn(testEmail, testPassword);
    
    if (signInResult.error) {
      console.error('Sign in failed:', signInResult.error.message || JSON.stringify(signInResult.error));
      rl.close();
      return;
    }
    
    console.log('Sign in successful!');
    console.log('User info:', {
      id: signInResult.user.id,
      email: signInResult.user.email,
      emailConfirmed: signInResult.user.emailConfirmed
    });
    
    // Verify JWT claims
    const jwtClaims = auth.getJwtClaims();
    console.log('JWT claims:', jwtClaims ? 'Valid token with claims' : 'No JWT claims found');
    
    // Check if authenticated
    const isAuthenticated = auth.isAuthenticated();
    console.log('Is authenticated:', isAuthenticated);
    
    // Check admin status (if applicable)
    const isPlatformAdmin = auth.isPlatformAdmin();
    console.log('Is platform admin:', isPlatformAdmin);
    
    // Test sign out
    console.log('Signing out...');
    await auth.signOut();
    
    // Verify signed out
    const isStillAuthenticated = auth.isAuthenticated();
    console.log('Is still authenticated after sign out:', isStillAuthenticated);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  } finally {
    rl.close();
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});

/**
 * To run this test:
 * 1. Build the package first: npm run build
 * 2. Run: node tests/pkceSignInTest.js
 * 3. Enter your test email and password when prompted
 */ 