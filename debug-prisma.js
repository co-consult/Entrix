// Script de débogage pour vérifier Prisma
const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  console.log('🔍 Testing Prisma Client...\n');

  try {
    // Test 1: Vérifier que PrismaClient existe
    console.log('1. Checking if PrismaClient is available...');
    console.log('   ✅ PrismaClient imported successfully');
    console.log(`   Type: ${typeof PrismaClient}`);
    console.log(`   Constructor name: ${PrismaClient.name}\n`);

    // Test 2: Créer une instance
    console.log('2. Creating PrismaClient instance...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    console.log('   ✅ PrismaClient instance created\n');

    // Test 3: Se connecter à la base
    console.log('3. Connecting to database...');
    await prisma.$connect();
    console.log('   ✅ Connected to database\n');

    // Test 4: Exécuter une requête simple
    console.log('4. Running test query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query executed successfully');
    console.log(`   Result: ${JSON.stringify(result)}\n`);

    // Test 5: Lister les tables
    console.log('5. Listing database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('   ✅ Tables found:');
    tables.forEach(t => console.log(`      - ${t.table_name}`));
    console.log('');

    // Test 6: Déconnexion
    console.log('6. Disconnecting...');
    await prisma.$disconnect();
    console.log('   ✅ Disconnected successfully\n');

    console.log('✨ All tests passed! Prisma is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('\nPossible causes:');
    console.error('1. Prisma client not generated - Run: npx prisma generate');
    console.error('2. Database connection issue - Check your DATABASE_URL');
    console.error('3. Missing dependencies - Run: npm install');
    process.exit(1);
  }
}

// Afficher les informations d'environnement
console.log('Environment Information:');
console.log('------------------------');
console.log(`Node Version: ${process.version}`);
console.log(`Current Directory: ${process.cwd()}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : '[NOT SET]'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('------------------------\n');

// Lancer le test
testPrisma();