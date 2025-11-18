#!/usr/bin/env node

/**
 * Script to generate bcrypt hash for test user passwords
 * Run this to get a real working hash for authentication
 */

const bcrypt = require('bcrypt');

async function generateHashes() {
  console.log('🔐 Generating bcrypt hashes for test users...\n');
  
  try {
    // Generate hash for Controller123!
    const controllerPassword = 'Controller123!';
    const controllerHash = await bcrypt.hash(controllerPassword, 12);
    
    // Generate hash for Badger123!
    const badgerPassword = 'Badger123!';
    const badgerHash = await bcrypt.hash(badgerPassword, 12);
    
    // Generate hash for password123 (simple alternative)
    const simplePassword = 'password123';
    const simpleHash = await bcrypt.hash(simplePassword, 12);
    
    console.log('✅ Generated hashes successfully!\n');
    
    console.log('📱 For Controller User (controller@css.org.tn):');
    console.log(`Password: ${controllerPassword}`);
    console.log(`Hash: ${controllerHash}\n`);
    
    console.log('🦡 For Badger User (badger@css.org.tn):');
    console.log(`Password: ${badgerPassword}`);
    console.log(`Hash: ${badgerHash}\n`);
    
    console.log('🔑 Simple Alternative (password123):');
    console.log(`Password: ${simplePassword}`);
    console.log(`Hash: ${simpleHash}\n`);
    
    console.log('📋 SQL Update Commands:');
    console.log('-- Update Controller user:');
    console.log(`UPDATE users SET password = '${controllerHash}' WHERE email = 'controller@css.org.tn';\n`);
    
    console.log('-- Update Badger user:');
    console.log(`UPDATE users SET password = '${badgerHash}' WHERE email = 'badger@css.org.tn';\n`);
    
    console.log('-- Update both users with simple password:');
    console.log(`UPDATE users SET password = '${simpleHash}' WHERE email IN ('controller@css.org.tn', 'badger@css.org.tn');\n`);
    
    console.log('💡 Copy the hash you want to use and run the SQL command in your database!');
    
  } catch (error) {
    console.error('❌ Error generating hashes:', error.message);
    process.exit(1);
  }
}

// Run the script
generateHashes();
