#!/usr/bin/env node

/**
 * Script to create test users using backend API endpoints
 * This ensures proper password hashing and user creation flow
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@css.org.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Test user data
const TEST_USERS = [
  {
    email: 'badger@css.org.tn',
    first_name: 'Badger',
    last_name: 'Test',
    password: 'Badger123!',
    role: 'BADGER'
  },
  {
    email: 'controller@css.org.tn',
    first_name: 'Controller',
    last_name: 'Test',
    password: 'Controller123!',
    role: 'CONTROLLER'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users using backend API endpoints...\n');
  
  try {
    // Step 1: Login as admin to get authentication token
    console.log('🔐 Step 1: Authenticating as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const { access_token } = loginResponse.data;
    console.log('✅ Admin authentication successful\n');
    
    // Step 2: Create each test user
    for (const userData of TEST_USERS) {
      console.log(`👤 Creating user: ${userData.email}...`);
      
      try {
        // Create user through the proper user creation endpoint
        const createUserResponse = await axios.post(`${API_BASE_URL}/users`, {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          password: userData.password,
          is_active: true,
          email_verified: true
        }, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const userId = createUserResponse.data.id;
        console.log(`✅ User created successfully with ID: ${userId}`);
        
        // Step 3: Assign role to the user
        console.log(`🎭 Assigning ${userData.role} role...`);
        
        const assignRoleResponse = await axios.post(`${API_BASE_URL}/users/${userId}/roles`, {
          role_code: userData.role,
          status: 'ACTIVE'
        }, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Role ${userData.role} assigned successfully\n`);
        
      } catch (userError) {
        if (userError.response?.status === 409) {
          console.log(`⚠️  User ${userData.email} already exists, skipping creation`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, userError.response?.data || userError.message);
        }
      }
    }
    
    console.log('🎉 Test users creation completed!');
    console.log('\n📱 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    TEST_USERS.forEach(user => {
      console.log(`\n👤 ${user.role} User:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
    });
    
    console.log('\n💡 These users can now authenticate in the mobile app!');
    
  } catch (error) {
    console.error('❌ Error in test user creation:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure you have valid admin credentials:');
      console.log(`   ADMIN_EMAIL: ${ADMIN_EMAIL}`);
      console.log(`   ADMIN_PASSWORD: ${ADMIN_PASSWORD}`);
    }
    
    process.exit(1);
  }
}

// Run the script
createTestUsers();
