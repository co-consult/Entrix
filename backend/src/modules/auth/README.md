# AuthModule (Entrix)

Module d’authentification centralisé pour Entrix (NestJS).

## Fonctionnalités
- Login/logout
- Inscription
- Reset password
- Vérification email
- MFA (2FA)
- JWT/refresh
- Guards/strategies Passport
- Gestion des sessions (à brancher)

## Endpoints principaux
- POST /auth/login
- POST /auth/register
- POST /auth/reset-password
- POST /auth/confirm-reset-password
- POST /auth/verify-email
- POST /auth/mfa

## Structure
```
src/modules/auth/
  ├── constants.ts
  ├── interfaces.ts
  ├── dtos/
  ├── auth.service.ts
  ├── auth.controller.ts
  ├── auth.module.ts
  ├── strategies/
  ├── guards/
  └── README.md
```

## Bonnes pratiques
- Ne jamais exposer d’informations sensibles dans les erreurs
- Toujours hasher les mots de passe (bcrypt, argon2, ...)
- Utiliser JWT pour l’auth stateless, refresh pour la persistance
- MFA recommandé pour les comptes sensibles
- Séparer la logique auth du CRUD user 