const { createUser, createUserProfile } = require('./firebase');

const createTestUser = async () => {
  console.log('📝 Creating a new user...\n');

  try {
    // Create a user with custom details
    const email = 'john.doe@example.com';
    const password = 'SecurePassword123!';
    const displayName = 'John Doe';

    console.log('Creating user with:');
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${displayName}`);
    console.log(`  Password: ${password}\n`);

    // Create Auth user
    const createResult = await createUser(email, password, displayName);
    
    if (!createResult.success) {
      console.log('❌ User creation failed:', createResult.error);
      return;
    }

    const uid = createResult.uid;
    console.log('✅ User created in Firebase Authentication!\n');
    console.log('User Details:');
    console.log(`  UID: ${uid}`);
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${displayName}\n`);

    // Also create user profile in Firestore
    console.log('Creating user profile in Firestore...');
    const profileResult = await createUserProfile(uid, {
      email,
      displayName,
      role: 'user',
      createdDate: new Date().toISOString()
    });

    if (profileResult.success) {
      console.log('✅ User profile created in Firestore!\n');
    }

    console.log('═══════════════════════════════════════════════');
    console.log('📌 SAVE THIS UID - You\'ll need it to verify:');
    console.log(`   ${uid}`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUser();
