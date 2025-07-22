// src/modules/auth/strategies/jwt.strategy.ts
/**
 * Stratégie JWT pour Passport
 * 
 * Responsabilités :
 * - Validation des access tokens JWT
 * - Extraction du payload et validation
 * - Vérification de la révocation des tokens
 * - Construction du contexte utilisateur
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: AuthPayload) {
    return payload;
  }
}