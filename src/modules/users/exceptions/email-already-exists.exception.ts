// src/modules/users/exceptions/email-already-exists.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailAlreadyExistsException extends HttpException {
  constructor(email: string, context?: 'registration' | 'update' | 'invitation') {
    const contextMessages = {
      registration: 'Un compte existe déjà avec cette adresse email',
      update: 'Cette adresse email est déjà utilisée par un autre utilisateur',
      invitation: 'Cette adresse email a déjà été invitée',
    };

    const suggestions = {
      registration: [
        'Essayez de vous connecter si vous avez déjà un compte',
        'Utilisez une autre adresse email',
        'Contactez le support si vous avez oublié votre mot de passe',
      ],
      update: [
        'Choisissez une autre adresse email',
        'Vérifiez que vous n\'avez pas déjà un autre compte',
      ],
      invitation: [
        'L\'utilisateur a peut-être déjà été invité',
        'Vérifiez les invitations en cours',
        'Attendez que l\'invitation précédente expire',
      ],
    };

    const errorResponse = {
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: context ? contextMessages[context] : 'Cette adresse email est déjà utilisée',
      code: 'EMAIL_ALREADY_EXISTS',
      email: email.toLowerCase(),
      context,
      timestamp: new Date().toISOString(),
      suggestions: context ? suggestions[context] : suggestions.registration,
    };

    super(errorResponse, HttpStatus.CONFLICT);
  }

  static forRegistration(email: string): EmailAlreadyExistsException {
    return new EmailAlreadyExistsException(email, 'registration');
  }

  static forUpdate(email: string): EmailAlreadyExistsException {
    return new EmailAlreadyExistsException(email, 'update');
  }

  static forInvitation(email: string): EmailAlreadyExistsException {
    return new EmailAlreadyExistsException(email, 'invitation');
  }
}