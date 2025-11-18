@echo off
echo ============================================
echo   ENTRIX V3.0 - GENERATEUR MODULE USERS
echo   (Version Epuree - Separation Auth/Permissions)
echo ============================================
echo.

REM Définir le répertoire de base
set BASE_DIR=src\modules\users

echo Creation du module users epure avec arborescence...
echo.

REM Créer la structure de dossiers
echo [1/9] Creation des dossiers principaux...
mkdir %BASE_DIR% 2>nul
mkdir %BASE_DIR%\controllers 2>nul
mkdir %BASE_DIR%\services 2>nul
mkdir %BASE_DIR%\dto 2>nul
mkdir %BASE_DIR%\guards 2>nul
mkdir %BASE_DIR%\decorators 2>nul
mkdir %BASE_DIR%\interfaces 2>nul
mkdir %BASE_DIR%\types 2>nul
mkdir %BASE_DIR%\utils 2>nul

echo [2/9] Creation des sous-dossiers dto...
mkdir %BASE_DIR%\dto\users 2>nul
mkdir %BASE_DIR%\dto\groups 2>nul
mkdir %BASE_DIR%\dto\profiles 2>nul
mkdir %BASE_DIR%\dto\anonymous 2>nul
mkdir %BASE_DIR%\dto\invitations 2>nul

echo [3/9] Creation des dossiers queues et processors...
mkdir %BASE_DIR%\constants 2>nul
mkdir %BASE_DIR%\queues 2>nul
mkdir %BASE_DIR%\processors 2>nul

echo [4/9] Creation des dossiers templates...
mkdir %BASE_DIR%\templates 2>nul
mkdir %BASE_DIR%\templates\emails 2>nul
mkdir %BASE_DIR%\templates\notifications 2>nul

echo [5/9] Creation des dossiers configs et exceptions...
mkdir %BASE_DIR%\configs 2>nul
mkdir %BASE_DIR%\exceptions 2>nul
mkdir %BASE_DIR%\interceptors 2>nul

REM Créer les fichiers controllers
echo [6/9] Creation des controllers...
type nul > %BASE_DIR%\controllers\users.controller.ts
type nul > %BASE_DIR%\controllers\groups.controller.ts
type nul > %BASE_DIR%\controllers\profiles.controller.ts
type nul > %BASE_DIR%\controllers\anonymous.controller.ts
type nul > %BASE_DIR%\controllers\invitations.controller.ts

REM Créer les fichiers services
echo [7/9] Creation des services...
type nul > %BASE_DIR%\services\users.service.ts
type nul > %BASE_DIR%\services\groups.service.ts
type nul > %BASE_DIR%\services\profiles.service.ts
type nul > %BASE_DIR%\services\anonymous.service.ts
type nul > %BASE_DIR%\services\invitations.service.ts
type nul > %BASE_DIR%\services\onboarding.service.ts
type nul > %BASE_DIR%\services\conversion.service.ts

REM Créer les DTOs users
echo [8/9] Creation des DTOs...
type nul > %BASE_DIR%\dto\users\create-user.dto.ts
type nul > %BASE_DIR%\dto\users\update-user.dto.ts
type nul > %BASE_DIR%\dto\users\user-search.dto.ts
type nul > %BASE_DIR%\dto\users\update-privacy.dto.ts
type nul > %BASE_DIR%\dto\users\user-preferences.dto.ts

REM Créer les DTOs groups
type nul > %BASE_DIR%\dto\groups\create-group.dto.ts
type nul > %BASE_DIR%\dto\groups\update-group.dto.ts
type nul > %BASE_DIR%\dto\groups\invite-member.dto.ts
type nul > %BASE_DIR%\dto\groups\update-member.dto.ts
type nul > %BASE_DIR%\dto\groups\group-settings.dto.ts

REM Créer les DTOs profiles
type nul > %BASE_DIR%\dto\profiles\create-profile.dto.ts
type nul > %BASE_DIR%\dto\profiles\update-profile.dto.ts
type nul > %BASE_DIR%\dto\profiles\upload-avatar.dto.ts
type nul > %BASE_DIR%\dto\profiles\profile-completion.dto.ts

REM Créer les DTOs anonymous
type nul > %BASE_DIR%\dto\anonymous\create-anonymous.dto.ts
type nul > %BASE_DIR%\dto\anonymous\convert-anonymous.dto.ts
type nul > %BASE_DIR%\dto\anonymous\anonymous-session.dto.ts

REM Créer les DTOs invitations
type nul > %BASE_DIR%\dto\invitations\send-invitation.dto.ts
type nul > %BASE_DIR%\dto\invitations\respond-invitation.dto.ts
type nul > %BASE_DIR%\dto\invitations\bulk-invitation.dto.ts

REM Créer les guards (seulement ceux spécifiques aux groupes)
type nul > %BASE_DIR%\guards\group-member.guard.ts
type nul > %BASE_DIR%\guards\group-owner.guard.ts

REM Créer les decorators
type nul > %BASE_DIR%\decorators\current-user.decorator.ts
type nul > %BASE_DIR%\decorators\group-permissions.decorator.ts
type nul > %BASE_DIR%\decorators\anonymous-user.decorator.ts

REM Créer les interfaces
type nul > %BASE_DIR%\interfaces\user.interface.ts
type nul > %BASE_DIR%\interfaces\group.interface.ts
type nul > %BASE_DIR%\interfaces\profile.interface.ts
type nul > %BASE_DIR%\interfaces\anonymous.interface.ts
type nul > %BASE_DIR%\interfaces\invitation.interface.ts

REM Créer les types
type nul > %BASE_DIR%\types\user.types.ts
type nul > %BASE_DIR%\types\group.types.ts
type nul > %BASE_DIR%\types\profile.types.ts
type nul > %BASE_DIR%\types\enums.ts

REM Créer les utils
type nul > %BASE_DIR%\utils\validation.util.ts
type nul > %BASE_DIR%\utils\conversion.util.ts
type nul > %BASE_DIR%\utils\onboarding.util.ts
type nul > %BASE_DIR%\utils\analytics.util.ts
type nul > %BASE_DIR%\utils\group-permissions.util.ts

REM Créer les constants
type nul > %BASE_DIR%\constants\user.constants.ts
type nul > %BASE_DIR%\constants\group.constants.ts
type nul > %BASE_DIR%\constants\invitation.constants.ts

REM Créer les queues
type nul > %BASE_DIR%\queues\welcome.queue.ts
type nul > %BASE_DIR%\queues\group-invitation.queue.ts
type nul > %BASE_DIR%\queues\anonymous-conversion.queue.ts
type nul > %BASE_DIR%\queues\user-analytics.queue.ts

REM Créer les processors
type nul > %BASE_DIR%\processors\welcome.processor.ts
type nul > %BASE_DIR%\processors\group-invitation.processor.ts
type nul > %BASE_DIR%\processors\anonymous-conversion.processor.ts
type nul > %BASE_DIR%\processors\user-analytics.processor.ts

REM Créer les templates emails
echo [9/9] Creation des templates...
type nul > %BASE_DIR%\templates\emails\welcome.hbs
type nul > %BASE_DIR%\templates\emails\group-invitation.hbs
type nul > %BASE_DIR%\templates\emails\anonymous-conversion.hbs
type nul > %BASE_DIR%\templates\emails\onboarding-complete.hbs

REM Créer les templates notifications
type nul > %BASE_DIR%\templates\notifications\group-joined.hbs
type nul > %BASE_DIR%\templates\notifications\member-left.hbs
type nul > %BASE_DIR%\templates\notifications\role-changed.hbs

REM Créer les configs (seulement anonyme)
type nul > %BASE_DIR%\configs\anonymous.config.ts

REM Créer les exceptions
type nul > %BASE_DIR%\exceptions\user-not-found.exception.ts
type nul > %BASE_DIR%\exceptions\group-not-found.exception.ts
type nul > %BASE_DIR%\exceptions\email-already-exists.exception.ts
type nul > %BASE_DIR%\exceptions\group-full.exception.ts
type nul > %BASE_DIR%\exceptions\insufficient-permissions.exception.ts
type nul > %BASE_DIR%\exceptions\anonymous-user.exception.ts

REM Créer les interceptors
type nul > %BASE_DIR%\interceptors\auth.interceptor.ts
type nul > %BASE_DIR%\interceptors\logging.interceptor.ts
type nul > %BASE_DIR%\interceptors\analytics.interceptor.ts

REM Créer le module principal
echo import { Module } from '@nestjs/common'; > %BASE_DIR%\users.module.ts
echo import { SharedModule } from '../../shared/shared.module'; >> %BASE_DIR%\users.module.ts
echo. >> %BASE_DIR%\users.module.ts
echo // Controllers >> %BASE_DIR%\users.module.ts
echo import { UsersController } from './controllers/users.controller'; >> %BASE_DIR%\users.module.ts
echo import { GroupsController } from './controllers/groups.controller'; >> %BASE_DIR%\users.module.ts
echo import { ProfilesController } from './controllers/profiles.controller'; >> %BASE_DIR%\users.module.ts
echo import { AnonymousController } from './controllers/anonymous.controller'; >> %BASE_DIR%\users.module.ts
echo import { InvitationsController } from './controllers/invitations.controller'; >> %BASE_DIR%\users.module.ts
echo. >> %BASE_DIR%\users.module.ts
echo // Services >> %BASE_DIR%\users.module.ts
echo import { UsersService } from './services/users.service'; >> %BASE_DIR%\users.module.ts
echo import { GroupsService } from './services/groups.service'; >> %BASE_DIR%\users.module.ts
echo import { ProfilesService } from './services/profiles.service'; >> %BASE_DIR%\users.module.ts
echo import { AnonymousService } from './services/anonymous.service'; >> %BASE_DIR%\users.module.ts
echo import { InvitationsService } from './services/invitations.service'; >> %BASE_DIR%\users.module.ts
echo import { OnboardingService } from './services/onboarding.service'; >> %BASE_DIR%\users.module.ts
echo import { ConversionService } from './services/conversion.service'; >> %BASE_DIR%\users.module.ts
echo. >> %BASE_DIR%\users.module.ts
echo @Module({ >> %BASE_DIR%\users.module.ts
echo   imports: [SharedModule], >> %BASE_DIR%\users.module.ts
echo   controllers: [ >> %BASE_DIR%\users.module.ts
echo     UsersController, >> %BASE_DIR%\users.module.ts
echo     GroupsController, >> %BASE_DIR%\users.module.ts
echo     ProfilesController, >> %BASE_DIR%\users.module.ts
echo     AnonymousController, >> %BASE_DIR%\users.module.ts
echo     InvitationsController, >> %BASE_DIR%\users.module.ts
echo   ], >> %BASE_DIR%\users.module.ts
echo   providers: [ >> %BASE_DIR%\users.module.ts
echo     UsersService, >> %BASE_DIR%\users.module.ts
echo     GroupsService, >> %BASE_DIR%\users.module.ts
echo     ProfilesService, >> %BASE_DIR%\users.module.ts
echo     AnonymousService, >> %BASE_DIR%\users.module.ts
echo     InvitationsService, >> %BASE_DIR%\users.module.ts
echo     OnboardingService, >> %BASE_DIR%\users.module.ts
echo     ConversionService, >> %BASE_DIR%\users.module.ts
echo   ], >> %BASE_DIR%\users.module.ts
echo   exports: [ >> %BASE_DIR%\users.module.ts
echo     UsersService, >> %BASE_DIR%\users.module.ts
echo     GroupsService, >> %BASE_DIR%\users.module.ts
echo     AnonymousService, >> %BASE_DIR%\users.module.ts
echo     ConversionService, >> %BASE_DIR%\users.module.ts
echo   ], >> %BASE_DIR%\users.module.ts
echo }) >> %BASE_DIR%\users.module.ts
echo export class UsersModule {} >> %BASE_DIR%\users.module.ts

REM Créer le fichier README
echo # Module Users - Entrix V3.0 > %BASE_DIR%\README.md
echo. >> %BASE_DIR%\README.md
echo Module epure pour la gestion des utilisateurs et groupes. >> %BASE_DIR%\README.md
echo L'authentification est geree par le module Auth separe. >> %BASE_DIR%\README.md
echo. >> %BASE_DIR%\README.md
echo ## Fonctionnalites >> %BASE_DIR%\README.md
echo - Gestion utilisateurs (CRUD, profils, recherche) >> %BASE_DIR%\README.md
echo - Systeme de groupes avec permissions >> %BASE_DIR%\README.md
echo - Gestion utilisateurs anonymes >> %BASE_DIR%\README.md
echo - Onboarding intelligent >> %BASE_DIR%\README.md
echo - Conversion anonyme vers enregistre >> %BASE_DIR%\README.md
echo - Invitations et gestion membres >> %BASE_DIR%\README.md
echo. >> %BASE_DIR%\README.md
echo ## Modules lies >> %BASE_DIR%\README.md
echo - **Module Auth** : Authentification JWT, login/logout >> %BASE_DIR%\README.md
echo - **Module Permissions** : RBAC systeme, roles >> %BASE_DIR%\README.md
echo - **Module Admin** : Audit, monitoring securite >> %BASE_DIR%\README.md

echo.
echo ============================================
echo   GENERATION TERMINEE AVEC SUCCES !
echo ============================================
echo.
echo Module users epure cree dans: %BASE_DIR%
echo Total fichiers: 62 (vs 84 avant separation)
echo.
echo MODULES SEPARES :
echo - Auth: JWT, Passport, login/logout
echo - Permissions: RBAC, roles systeme  
echo - Admin: Audit, monitoring
echo.
echo Prochaines etapes:
echo 1. Configurer le SharedModule  
echo 2. Implementer les services et controllers
echo 3. Integrer avec modules Auth/Permissions
echo.
echo Architecture modulaire optimisee ! 🎯
echo.
pause