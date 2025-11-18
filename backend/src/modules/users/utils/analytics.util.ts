// src/modules/users/utils/analytics.util.ts

import { UserWithRelations, AnonymousUserData, UserStats } from '../types/user.types';
import { GroupWithMembers, GroupStats } from '../types/group.types';
import { IncentiveType } from '../types/enums';

/**
 * Utilitaires pour les analytics et métriques utilisateurs
 */
export class AnalyticsUtil {
  
  /**
   * Calcule le pourcentage de complétion d'un profil utilisateur
   */
  static calculateProfileCompletion(user: UserWithRelations): number {
    const requiredFields = ['firstName', 'lastName', 'email'];
    const optionalFields = ['phone', 'avatar'];
    const profileFields = ['dateOfBirth', 'city', 'country', 'bio', 'favoriteTeamId'];
    
    let completedFields = 0;
    let totalFields = requiredFields.length + optionalFields.length;
    
    // Champs utilisateur obligatoires (toujours présents)
    completedFields += requiredFields.length;
    
    // Champs utilisateur optionnels
    optionalFields.forEach(field => {
      if (user[field as keyof typeof user]) {
        completedFields += 1;
      }
    });
    
    // Champs de profil
    if (user.profile) {
      totalFields += profileFields.length;
      profileFields.forEach(field => {
        if (user.profile?.[field as keyof typeof user.profile]) {
          completedFields += 1;
        }
      });
    }
    
    return Math.round((completedFields / totalFields) * 100);
  }
  
  /**
   * Calcule l'âge d'un utilisateur depuis sa date de naissance
   */
  static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Calcule le taux de conversion anonyme vers enregistré
   */
  static calculateConversionRate(
    totalAnonymous: number,
    totalConverted: number
  ): number {
    if (totalAnonymous === 0) return 0;
    return Math.round((totalConverted / totalAnonymous) * 100 * 100) / 100; // 2 décimales
  }
  
  /**
   * Calcule le temps moyen de conversion en heures
   */
  static calculateAverageConversionTime(conversions: Array<{
    createdAt: Date;
    convertedAt: Date;
  }>): number {
    if (conversions.length === 0) return 0;
    
    const totalHours = conversions.reduce((sum, conversion) => {
      const diffMs = conversion.convertedAt.getTime() - conversion.createdAt.getTime();
      return sum + (diffMs / (1000 * 60 * 60)); // Convert to hours
    }, 0);
    
    return Math.round((totalHours / conversions.length) * 100) / 100; // 2 décimales
  }
  
  /**
   * Analyse l'efficacité des incentives
   */
  static analyzeIncentiveEffectiveness(incentives: Array<{
    type: IncentiveType;
    value: number;
    converted: boolean;
    createdAt: Date;
    convertedAt?: Date;
  }>): Record<IncentiveType, {
    total: number;
    converted: number;
    conversionRate: number;
    averageConversionTime: number;
    averageValue: number;
  }> {
    const results = {} as any;
    
    // Grouper par type d'incentive
    const grouped = incentives.reduce((acc, incentive) => {
      if (!acc[incentive.type]) {
        acc[incentive.type] = [];
      }
      acc[incentive.type].push(incentive);
      return acc;
    }, {} as Record<IncentiveType, typeof incentives>);
    
    // Calculer les métriques pour chaque type
    Object.entries(grouped).forEach(([type, items]) => {
      const converted = items.filter(item => item.converted);
      const conversionsWithTime = converted.filter(item => item.convertedAt);
      
      results[type as IncentiveType] = {
        total: items.length,
        converted: converted.length,
        conversionRate: this.calculateConversionRate(items.length, converted.length),
        averageConversionTime: this.calculateAverageConversionTime(
          conversionsWithTime.map(item => ({
            createdAt: item.createdAt,
            convertedAt: item.convertedAt!,
          }))
        ),
        averageValue: Math.round((items.reduce((sum, item) => sum + item.value, 0) / items.length) * 100) / 100,
      };
    });
    
    return results;
  }
  
  /**
   * Segmente les utilisateurs par activité
   */
  static segmentUsersByActivity(users: Array<{
    id: string;
    createdAt: Date;
    lastLogin?: Date;
    emailVerified: boolean;
    groupsCount?: number;
    ordersCount?: number;
  }>): {
    new: number;
    active: number;
    inactive: number;
    dormant: number;
    churned: number;
  } {
    const now = new Date();
    const segments = {
      new: 0,      // Inscrits dans les 7 derniers jours
      active: 0,   // Connectés dans les 30 derniers jours
      inactive: 0, // Connectés entre 30 et 90 jours
      dormant: 0,  // Connectés entre 90 et 365 jours
      churned: 0,  // Plus connectés depuis plus d'un an
    };
    
    users.forEach(user => {
      const daysSinceRegistration = Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Nouveaux utilisateurs (7 derniers jours)
      if (daysSinceRegistration <= 7) {
        segments.new++;
        return;
      }
      
      if (!user.lastLogin) {
        segments.churned++;
        return;
      }
      
      const daysSinceLastLogin = Math.floor(
        (now.getTime() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastLogin <= 30) {
        segments.active++;
      } else if (daysSinceLastLogin <= 90) {
        segments.inactive++;
      } else if (daysSinceLastLogin <= 365) {
        segments.dormant++;
      } else {
        segments.churned++;
      }
    });
    
    return segments;
  }
  
  /**
   * Calcule la rétention par cohorte
   */
  static calculateCohortRetention(users: Array<{
    createdAt: Date;
    lastLogin?: Date;
  }>, periods: number[] = [1, 7, 30, 90]): Array<{
    cohort: string;
    totalUsers: number;
    retention: Record<number, number>;
  }> {
    // Grouper les utilisateurs par mois de création
    const cohorts = users.reduce((acc, user) => {
      const cohortKey = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[cohortKey]) {
        acc[cohortKey] = [];
      }
      acc[cohortKey].push(user);
      return acc;
    }, {} as Record<string, typeof users>);
    
    // Calculer la rétention pour chaque cohorte
    return Object.entries(cohorts).map(([cohort, cohortUsers]) => {
      const retention: Record<number, number> = {};
      
      periods.forEach(period => {
        const retainedUsers = cohortUsers.filter(user => {
          if (!user.lastLogin) return false;
          
          const daysSinceRegistration = Math.floor(
            (user.lastLogin.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return daysSinceRegistration >= period;
        });
        
        retention[period] = Math.round((retainedUsers.length / cohortUsers.length) * 100);
      });
      
      return {
        cohort,
        totalUsers: cohortUsers.length,
        retention,
      };
    });
  }
  
  /**
   * Calcule les métriques d'engagement d'un groupe
   */
  static calculateGroupEngagement(group: GroupWithMembers & {
    activities?: Array<{ createdAt: Date; type: string }>;
    purchases?: Array<{ createdAt: Date; amount: number }>;
  }): {
    activityScore: number;
    memberEngagement: number;
    purchaseActivity: number;
    growthRate: number;
    overallScore: number;
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Score d'activité (basé sur les activités des 30 derniers jours)
    const recentActivities = group.activities?.filter(
      activity => activity.createdAt >= thirtyDaysAgo
    ) || [];
    const activityScore = Math.min(100, recentActivities.length * 5);
    
    // Engagement des membres (% de membres actifs)
    const activeMembers = group.members?.filter(member => 
      member.lastActivity && member.lastActivity >= thirtyDaysAgo
    ) || [];
    const memberEngagement = group.memberCount > 0 
      ? Math.round((activeMembers.length / group.memberCount) * 100)
      : 0;
    
    // Activité d'achat
    const recentPurchases = group.purchases?.filter(
      purchase => purchase.createdAt >= thirtyDaysAgo
    ) || [];
    const purchaseActivity = Math.min(100, recentPurchases.length * 10);
    
    // Taux de croissance (nouveau membres last 30 days)
    const newMembers = group.members?.filter(member => 
      member.joinedAt >= thirtyDaysAgo
    ) || [];
    const growthRate = group.memberCount > 0
      ? Math.round((newMembers.length / group.memberCount) * 100)
      : 0;
    
    // Score global (moyenne pondérée)
    const overallScore = Math.round(
      (activityScore * 0.3 + memberEngagement * 0.4 + purchaseActivity * 0.2 + growthRate * 0.1)
    );
    
    return {
      activityScore,
      memberEngagement,
      purchaseActivity,
      growthRate,
      overallScore,
    };
  }
  
  /**
   * Génère des tendances temporelles
   */
  static generateTimeTrends<T extends { createdAt: Date }>(
    data: T[],
    period: 'day' | 'week' | 'month' = 'day',
    last: number = 30
  ): Array<{
    date: string;
    count: number;
    label: string;
  }> {
    const now = new Date();
    const trends: Array<{ date: string; count: number; label: string }> = [];
    
    for (let i = last - 1; i >= 0; i--) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;
      
      switch (period) {
        case 'day':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
          label = periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          break;
          
        case 'week':
          const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          periodStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - weekStart.getDay());
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          label = `S${Math.ceil(periodStart.getDate() / 7)}`;
          break;
          
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          label = periodStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          break;
      }
      
      const count = data.filter(item => 
        item.createdAt >= periodStart && item.createdAt < periodEnd
      ).length;
      
      trends.push({
        date: periodStart.toISOString().split('T')[0],
        count,
        label,
      });
    }
    
    return trends;
  }
  
  /**
   * Calcule des percentiles pour des valeurs numériques
   */
  static calculatePercentiles(values: number[], percentiles: number[] = [25, 50, 75, 90, 95]): Record<number, number> {
    if (values.length === 0) return {};
    
    const sorted = [...values].sort((a, b) => a - b);
    const result: Record<number, number> = {};
    
    percentiles.forEach(percentile => {
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      result[percentile] = sorted[Math.max(0, index)];
    });
    
    return result;
  }
  
  /**
   * Détecte les anomalies dans une série temporelle
   */
  static detectAnomalies(
    data: Array<{ date: Date; value: number }>,
    threshold: number = 2
  ): Array<{ date: Date; value: number; isAnomaly: boolean; zScore: number }> {
    if (data.length < 3) return data.map(d => ({ ...d, isAnomaly: false, zScore: 0 }));
    
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return data.map(item => {
      const zScore = stdDev === 0 ? 0 : Math.abs(item.value - mean) / stdDev;
      return {
        ...item,
        isAnomaly: zScore > threshold,
        zScore: Math.round(zScore * 100) / 100,
      };
    });
  }
}