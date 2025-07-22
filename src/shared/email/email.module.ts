import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import emailConfig, { emailValidationSchema } from './email.config';
import { EmailService } from './email.service';

/**
 * Module Email global pour la gestion des envois transactionnels
 * - Fournit EmailService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [emailConfig],
      validationSchema: emailValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
