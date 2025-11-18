#!/usr/bin/env node

/**
 * Simple script to create test users with proper bcrypt hashing
 * No authentication needed - creates users directly like the backend would
 */

const bcrypt = require('bcrypt');

// Use the same database connection as your backend
// Import from your backend's Prisma service
const { PrismaClient } = require('../node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://entrix_preprod_user:bAQTuhY6Rgq6rt9uPuaAwxXQq@196.179.229.147:5432/entrix_preprod_db'
    }
  }
});

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
  console.log('🚀 Creating test users with proper bcrypt hashing...\n');
  
  try {
    for (const userData of TEST_USERS) {
      console.log(`👤 Creating user: ${userData.email}...`);
      
      try {
        // Hash the password properly (same as backend)
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user directly in database
        const user = await prisma.users.create({
          data: {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            password: hashedPassword,
            is_active: true,
            email_verified: true
          }
        });
        
        console.log(`✅ User created successfully with ID: ${user.id}`);
        
        // Get the role ID
        const role = await prisma.roles.findUnique({
          where: { code: userData.role }
        });
        
        if (role) {
          // Assign role to user
          await prisma.user_roles.create({
            data: {
              user_id: user.id,
              role_id: role.id,
              status: 'ACTIVE',
              assigned_at: new Date()
            }
          });
          
          console.log(`✅ Role ${userData.role} assigned successfully\n`);
        } else {
          console.log(`⚠️  Role ${userData.role} not found\n`);
        }
        
      } catch (userError) {
        if (userError.code === 'P2002') {
          console.log(`⚠️  User ${userData.email} already exists, skipping creation`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, userError.message);
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
    console.error('❌ Error in test user creation:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUsers();
