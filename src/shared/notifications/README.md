# Notifications Module (NestJS Shared)

Ce module fournit une orchestration robuste et typée des notifications multi-canaux pour NestJS (email, WebSocket, SMS, push), avec configuration centralisée, validation d'environnement, gestion des erreurs et injection globale du service.

## Fonctionnalités
- Orchestration des notifications multi-canaux (email, ws, sms, push)
- Intégration complète avec `@nestjs/config` (validation stricte de l'ENV)
- Priorisation, logs, extensibilité (ajout facile de nouveaux canaux)
- Injection du service Notifications dans tous les modules métier
- Prêt pour la production et les tests

## Configuration ENV
Ajoutez les variables suivantes à votre `.env` :

```
NOTIFICATIONS_EMAIL_ENABLED=true
NOTIFICATIONS_WS_ENABLED=true
NOTIFICATIONS_SMS_ENABLED=false
NOTIFICATIONS_PUSH_ENABLED=false
NOTIFICATIONS_DEFAULT_CHANNEL=email
NOTIFICATIONS_PRIORITY_LEVELS=low,normal,high,critical
```

## Utilisation
Dans un module métier :
```ts
import { NotificationsService } from 'src/shared/notifications/notifications.service';

@Injectable()
export class ExampleService {
  constructor(private readonly notifications: NotificationsService) {}

  async notifyUser(user: { email: string; id: string }) {
    await this.notifications.sendNotification({
      channel: 'email',
      priority: 'high',
      payload: {
        to: user.email,
        subject: 'Alerte sécurité',
        message: 'Une activité suspecte a été détectée sur votre compte.',
      },
    });
  }
}
```

## Bonnes pratiques
- Utilisez la validation d'ENV pour éviter les erreurs de configuration
- Utilisez le service Notifications via injection (ne créez jamais de nouvelle instance directement)
- Ajoutez de nouveaux canaux en étendant le service (WebSocket, SMS, push, etc.)
- Logguez systématiquement les notifications envoyées

## Pièges à éviter
- Ne pas injecter NotificationsService dans le constructeur d'un module global (risque de cycle)
- Ne pas oublier de configurer les canaux activés dans l'ENV

---

© Entrix - Architecture & DevOps 