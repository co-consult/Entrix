// test-hash.js
const bcrypt = require('bcrypt');

async function testHash() {
    const hashStored = '$2b$12$ioZ20E0DT/7sz20GMSS4PeySCEfaVX/hhsoybpB8mposAHx6JxxDa';
    const password = 'Zazou2002';
    
    console.log('🔍 Analyse du hash:');
    console.log('Hash:', hashStored);
    console.log('Password à tester:', password);
    console.log('');
    
    // Analyser le format du hash
    const parts = hashStored.split('$');
    console.log('📊 Structure du hash:');
    console.log('- Algorithme:', parts[1]); // 2b
    console.log('- Rounds:', parts[2]);     // 12
    console.log('- Salt + Hash:', parts[3]); 
    console.log('');
    
    // Test avec bcrypt
    try {
        const isMatch = await bcrypt.compare(password, hashStored);
        console.log('✅ Test bcrypt.compare:');
        console.log(`"${password}" vs hash: ${isMatch ? '🎉 MATCH!' : '❌ NO MATCH'}`);
        
        if (isMatch) {
            console.log('');
            console.log('🎯 RÉSULTAT: Ce hash correspond bien à "Zazou2002" avec 12 rounds bcrypt');
        } else {
            console.log('');
            console.log('❌ RÉSULTAT: Ce hash NE correspond PAS à "Zazou2002"');
            
            // Tests supplémentaires avec d'autres mots de passe possibles
            console.log('');
            console.log('🔍 Tests avec d\'autres mots de passe possibles:');
            
            const otherPasswords = [
                'TestPassword123!',
                'Zazou2002!!;',
                'zazou2002',
                'ZAZOU2002',
                'Souheil123'
            ];
            
            for (const pwd of otherPasswords) {
                const testMatch = await bcrypt.compare(pwd, hashStored);
                console.log(`"${pwd}": ${testMatch ? '✅ MATCH!' : '❌'}`);
            }
        }
        
    } catch (error) {
        console.log('❌ Erreur lors du test:', error.message);
    }
}

testHash();