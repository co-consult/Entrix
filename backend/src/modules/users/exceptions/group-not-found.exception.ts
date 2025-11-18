// src/modules/users/exceptions/group-not-found.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';

export class GroupNotFoundException extends HttpException {
  constructor(identifier?: string, identifierType: 'id' | 'code' | 'name' = 'id') {
    const messages = {
      id: identifier ? `Groupe avec l'ID "${identifier}" introuvable` : 'Groupe introuvable',
      code: identifier ? `Groupe avec le code "${identifier}" introuvable` : 'Groupe introuvable par code',
      name: identifier ? `Groupe avec le nom "${identifier}" introuvable` : 'Groupe introuvable par nom',
    };

    const errorResponse = {
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: messages[identifierType],
      code: 'GROUP_NOT_FOUND',
      identifier,
      identifierType,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Vérifiez l\'ID ou le code du groupe',
        'Le groupe a peut-être été supprimé',
        'Vous n\'avez peut-être pas accès à ce groupe',
      ],
    };

    super(errorResponse, HttpStatus.NOT_FOUND);
  }

  static byId(id: string): GroupNotFoundException {
    return new GroupNotFoundException(id, 'id');
  }

  static byCode(code: string): GroupNotFoundException {
    return new GroupNotFoundException(code, 'code');
  }

  static byName(name: string): GroupNotFoundException {
    return new GroupNotFoundException(name, 'name');
  }
}