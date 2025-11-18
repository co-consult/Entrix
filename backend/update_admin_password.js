const bcrypt = require('bcryptjs');

async function updatePassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated hash:', hash);
  
  // Verify it works
  const match = await bcrypt.compare(password, hash);
  console.log('Verification:', match ? 'SUCCESS' : 'FAILED');
  
  // Output SQL command
  console.log('\nSQL to run:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@entrix.dev';`);
}

updatePassword().catch(console.error);

