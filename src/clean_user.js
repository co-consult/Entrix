// cleanup-user.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUser(email) {
    console.log(`🗑️ Nettoyage complet pour: ${email}`);
    
    try {
        // Trouver l'utilisateur
        const user = await prisma.users.findUnique({
            where: { email }
        });
        
        if (!user) {
            console.log('✅ Utilisateur non trouvé - déjà supprimé');
            return;
        }
        
        console.log(`👤 Utilisateur trouvé: ${user.id}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👨 Nom: ${user.first_name} ${user.last_name}`);
        console.log(`📅 Créé le: ${user.created_at}`);
        
        // Supprimer les tokens MFA
        const deletedTokens = await prisma.mfa_tokens.deleteMany({
            where: { user_id: user.id }
        });
        console.log(`🔑 ${deletedTokens.count} tokens MFA supprimés`);
        
        // Supprimer l'utilisateur
        await prisma.users.delete({
            where: { id: user.id }
        });
        console.log('👤 Utilisateur supprimé');
        
        // Vérification finale
        const check = await prisma.users.findUnique({
            where: { email }
        });
        
        if (check) {
            console.log('❌ ERREUR: Utilisateur encore présent après suppression !');
        } else {
            console.log('✅ Nettoyage réussi ! Vous pouvez maintenant refaire l\'inscription.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        console.log('\n🔍 Détails de l\'erreur:');
        console.log(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Lancez le nettoyage
cleanupUser('souheilsbs@gmail.com');