// src/shared/hashing/hashing.module.ts
/**
 * Module de hashing centralisé
 * À ajouter dans SharedModule pour utilisation globale
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { HashingService } from './hashing.service';

@Module({
  providers: [HashingService],
  exports: [HashingService],
})
export class HashingModule {}

