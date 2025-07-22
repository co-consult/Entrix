// src/modules/auth/strategies/local.strategy.ts
/**
 * Stratégie Local (email/password) pour Passport
 * 
 * Responsabilités :
 * - Validation des credentials email/password
 * - Vérifications de sécurité (compte actif, blacklist)
 * - Préparation pour création de session
 * - Intégration avec rate limiting
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    // À compléter : valider l'utilisateur
    throw new UnauthorizedException();
  }
}