// src/modules/users/exceptions/user-not-found.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(identifier?: string, identifierType: 'id' | 'email' | 'phone' = 'id') {
    const messages = {
      id: identifier ? `Utilisateur avec l'ID "${identifier}" introuvable` : 'Utilisateur introuvable',
      email: identifier ? `Utilisateur avec l'email "${identifier}" introuvable` : 'Utilisateur introuvable par email',
      phone: identifier ? `Utilisateur avec le téléphone "${identifier}" introuvable` : 'Utilisateur introuvable par téléphone',
    };

    const errorResponse = {
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: messages[identifierType],
      code: 'USER_NOT_FOUND',
      identifier,
      identifierType,
      timestamp: new Date().toISOString(),
    };

    super(errorResponse, HttpStatus.NOT_FOUND);
  }

  static byId(id: string): UserNotFoundException {
    return new UserNotFoundException(id, 'id');
  }

  static byEmail(email: string): UserNotFoundException {
    return new UserNotFoundException(email, 'email');
  }

  static byPhone(phone: string): UserNotFoundException {
    return new UserNotFoundException(phone, 'phone');
  }
}