@echo off
REM Script pour corriger l'erreur PrismaClient

echo ========================================
echo Correction de l'erreur PrismaClient
echo ========================================
echo.

echo 1. Nettoyage du build precedent...
if exist "dist" (
    rmdir /s /q dist
    echo ✅ Dossier dist supprime
)
echo.

echo 2. Nettoyage du cache TypeScript...
if exist ".tsbuildinfo" (
    del .tsbuildinfo
    echo ✅ Cache TypeScript supprime
)
echo.

echo 3. Regeneration du client Prisma...
call npx prisma generate
echo ✅ Client Prisma regenere
echo.

echo 4. Reconstruction du projet...
call npm run build
echo ✅ Projet reconstruit
echo.

echo ========================================
echo Correction terminee !
echo ========================================
echo.
echo Relancez maintenant : npm run start:dev
echo.
pause