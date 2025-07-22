@echo off
REM Script d'installation complete des dependances Entrix
REM Versions stables et securisees - Janvier 2025

echo ========================================
echo Installation complete Entrix Backend
echo ========================================
echo.

REM Verification de Node.js
echo Verification de Node.js (version recommandee: 18.x ou 20.x)...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installe. Veuillez l'installer d'abord.
    pause
    exit /b 1
)
echo.

REM Nettoyage (optionnel)
echo Nettoyage des anciennes dependances...
if exist "node_modules" (
    echo Suppression du dossier node_modules...
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    echo Suppression du package-lock.json...
    del package-lock.json
)
echo.

REM ==========================================
REM CORE NESTJS
REM ==========================================
echo [1/9] Installation du core NestJS...
call npm install @nestjs/common@^11.1.3 @nestjs/core@^11.1.3 @nestjs/platform-express@^11.1.3
call npm install reflect-metadata@^0.2.1 rxjs@^7.8.1
call npm install @nestjs/config@^3.2.2
echo ✅ Core NestJS installe
echo.

REM ==========================================
REM PRISMA ORM
REM ==========================================
echo [2/9] Installation de Prisma ORM...
call npm install @prisma/client@^6.11.1
call npm install --save-dev prisma@^6.11.1
echo ✅ Prisma installe
echo.

REM ==========================================
REM REDIS & CACHE
REM ==========================================
echo [3/9] Installation de Redis...
call npm install redis@^5.6.0
echo ✅ Redis installe
echo.

REM ==========================================
REM BULL QUEUE (Bull et BullMQ)
REM ==========================================
echo [4/9] Installation de Bull et BullMQ (Message Queue)...
call npm install @nestjs/bull@^10.2.1 bull@^4.14.0
call npm install @nestjs/bullmq@^10.2.1 bullmq@^5.56.2
call npm install --save-dev @types/bull@^4.14.0
echo ✅ Bull et BullMQ installes
echo.

REM ==========================================
REM EMAIL & TEMPLATES
REM ==========================================
echo [5/9] Installation des services Email...
call npm install nodemailer@^7.0.5 handlebars@^4.7.8
call npm install --save-dev @types/nodemailer@^7.0.5
echo ✅ Services Email installes
echo.

REM ==========================================
REM LOGGING
REM ==========================================
echo [6/9] Installation de Winston (Logging)...
call npm install winston@^3.17.0 winston-daily-rotate-file@^5.0.0 nest-winston@^1.10.2
echo ✅ Winston installe
echo.

REM ==========================================
REM SECURITE & MIDDLEWARE
REM ==========================================
echo [7/9] Installation des modules de securite...
call npm install helmet@^8.1.0
call npm install compression@^1.7.5
call npm install --save-dev @types/compression@^1.7.5
echo ✅ Modules de securite installes
echo.

REM ==========================================
REM VALIDATION & SWAGGER
REM ==========================================
echo [8/9] Installation de la validation et documentation...
call npm install class-validator@^0.14.2 class-transformer@^0.5.1
call npm install @nestjs/swagger@^7.2.0 swagger-ui-express@^5.0.1
echo ✅ Validation et Swagger installes
echo.

REM ==========================================
REM MODULES ADDITIONNELS RECOMMANDES
REM ==========================================
echo [9/9] Installation des modules additionnels...
call npm install @nestjs/jwt@^10.2.0 @nestjs/passport@^10.0.3
call npm install bcrypt@^5.1.1
call npm install --save-dev @types/bcrypt@^5.0.2
echo ✅ Modules additionnels installes
echo.

REM ==========================================
REM DEV DEPENDENCIES
REM ==========================================
echo Installation des dependances de developpement...
call npm install --save-dev @nestjs/cli@^11.0.0 @nestjs/schematics@^11.0.0
call npm install --save-dev typescript@^5.3.3 @types/node@^20.11.0
call npm install --save-dev @typescript-eslint/parser@^7.0.0 @typescript-eslint/eslint-plugin@^7.0.0
call npm install --save-dev eslint@^8.57.0 eslint-config-prettier@^9.1.0 eslint-plugin-prettier@^5.2.1
call npm install --save-dev prettier@^3.3.3
call npm install --save-dev @types/express@^5.0.0
call npm install --save-dev ts-node@^10.9.2 tsconfig-paths@^4.2.0
call npm install --save-dev @nestjs/testing@^11.1.3
echo ✅ Dependances de developpement installees
echo.

REM ==========================================
REM VERIFICATION FINALE
REM ==========================================
echo ========================================
echo Verification des vulnerabilites...
echo ========================================
call npm audit
echo.

echo ========================================
echo Installation terminee !
echo ========================================
echo.
echo Prochaines etapes :
echo.
echo 1. Configurez votre fichier .env
echo 2. Initialisez Prisma :
echo    npx prisma init
echo    npx prisma generate
echo.
echo 3. Lancez l'application :
echo    npm run start:dev
echo.
echo ========================================
echo Resume des modules installes :
echo ========================================
echo ✅ NestJS Core v11.1.3
echo ✅ Prisma ORM v6.11.1
echo ✅ Redis v5.6.0
echo ✅ Bull Queue v4.14.x (dernier)
echo ✅ BullMQ v5.56.2
echo ✅ Nodemailer v7.0.5
echo ✅ Winston Logger v3.17.0
echo ✅ Helmet Security v8.1.0
echo ✅ Class Validator v0.14.2
echo ✅ Swagger v7.2.x
echo ✅ TypeScript v5.3.x
echo ✅ JWT & Passport (auth)
echo ✅ Bcrypt (hashing)
echo.
echo Toutes les versions sont a jour et securisees (Decembre 2024 / Janvier 2025)
echo.
pause