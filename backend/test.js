const { createUser, getUserByUID, deleteUser } = require('./firebase');

const testAuth = async () => {
  console.log('🧪 Testing Firebase Authentication Setup...\n');

  try {
    // Test 1: Create a user
    console.log('1️⃣ Creating test user...');
    const testEmail = `test${Date.now()}@example.com`;
    const createResult = await createUser(testEmail, 'TestPassword123!', 'Test User');
    console.log('Result:', JSON.stringify(createResult, null, 2));
    
    if (!createResult.success) {
      console.log('❌ User creation failed:', createResult.error);
      return;
    }
    
    const uid = createResult.uid;
    console.log('✅ User created successfully!\n');

    // Test 2: Get user by UID
    console.log('2️⃣ Fetching user by UID...');
    const getUserResult = await getUserByUID(uid);
    console.log('Result:', JSON.stringify(getUserResult, null, 2));
    
    if (!getUserResult.success) {
      console.log('❌ User fetch failed:', getUserResult.error);
      return;
    }
    console.log('✅ User fetched successfully!\n');

    // Test 3: Clean up - delete test user
    console.log('3️⃣ Cleaning up (deleting test user)...');
    const deleteResult = await deleteUser(uid);
    console.log('Result:', JSON.stringify(deleteResult, null, 2));
    console.log('✅ Test user deleted\n');

    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED! Firebase is working correctly.');
    console.log('═══════════════════════════════════════');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
};

testAuth();
