// src/modules/users/dto/profiles/profile-completion.dto.ts

import {
    IsOptional,
    IsBoolean,
    IsArray,
    IsString,
  } from 'class-validator';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  
  export class GetProfileCompletionDto {
    @ApiPropertyOptional({
      description: 'Inclure les suggestions d\'amélioration',
      example: true,
      default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'includeSuggestions doit être un booléen' })
    includeSuggestions?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Inclure les incentives disponibles',
      example: true,
      default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'includeIncentives doit être un booléen' })
    includeIncentives?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Inclure les prochaines étapes recommandées',
      example: true,
      default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'includeNextSteps doit être un booléen' })
    includeNextSteps?: boolean = true;
  }
  
  // DTO de réponse pour la complétion du profil
  export class ProfileCompletionResponseDto {
    @ApiPropertyOptional({
      description: 'Pourcentage de complétion du profil',
      example: 75,
    })
    percentage: number;
  
    @ApiPropertyOptional({
      description: 'Champs complétés',
      example: ['firstName', 'lastName', 'email', 'city', 'country'],
    })
    completedFields: string[];
  
    @ApiPropertyOptional({
      description: 'Champs manquants',
      example: ['dateOfBirth', 'bio', 'favoriteTeam'],
    })
    missingFields: string[];
  
    @ApiPropertyOptional({
      description: 'Suggestions d\'amélioration',
      example: [
        {
          field: 'dateOfBirth',
          title: 'Ajoutez votre date de naissance',
          description: 'Nous pourrons vous proposer des événements adaptés à votre âge',
          priority: 'MEDIUM',
          incentive: {
            type: 'BONUS_POINTS',
            value: 50,
            description: '50 points bonus'
          }
        }
      ],
    })
    suggestions: Array<{
      field: string;
      title: string;
      description: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      incentive?: {
        type: string;
        value: number;
        description: string;
      };
    }>;
  
    @ApiPropertyOptional({
      description: 'Prochaines étapes recommandées',
      example: [
        'Ajoutez votre photo de profil',
        'Complétez votre biographie',
        'Choisissez votre équipe favorite'
      ],
    })
    nextSteps: string[];
  
    @ApiPropertyOptional({
      description: 'Paliers de complétion atteints',
      example: [
        {
          level: 'BASIC',
          percentage: 25,
          achieved: true,
          reward: 'Accès aux groupes publics'
        },
        {
          level: 'INTERMEDIATE',
          percentage: 50,
          achieved: true,
          reward: 'Recommandations personnalisées'
        },
        {
          level: 'ADVANCED',
          percentage: 75,
          achieved: true,
          reward: '100 points bonus'
        },
        {
          level: 'COMPLETE',
          percentage: 100,
          achieved: false,
          reward: 'Badge profil complet + 200 points'
        }
      ],
    })
    milestones: Array<{
      level: string;
      percentage: number;
      achieved: boolean;
      reward: string;
    }>;
  
    @ApiPropertyOptional({
      description: 'Score de qualité du profil',
      example: {
        overall: 85,
        completeness: 75,
        authenticity: 90,
        engagement: 80
      },
    })
    qualityScore: {
      overall: number;
      completeness: number;
      authenticity: number;
      engagement: number;
    };
  }