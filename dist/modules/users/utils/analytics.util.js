"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsUtil = void 0;
class AnalyticsUtil {
    static calculateProfileCompletion(user) {
        const requiredFields = ['firstName', 'lastName', 'email'];
        const optionalFields = ['phone', 'avatar'];
        const profileFields = ['dateOfBirth', 'city', 'country', 'bio', 'favoriteTeamId'];
        let completedFields = 0;
        let totalFields = requiredFields.length + optionalFields.length;
        completedFields += requiredFields.length;
        optionalFields.forEach(field => {
            if (user[field]) {
                completedFields += 1;
            }
        });
        if (user.profile) {
            totalFields += profileFields.length;
            profileFields.forEach(field => {
                if (user.profile?.[field]) {
                    completedFields += 1;
                }
            });
        }
        return Math.round((completedFields / totalFields) * 100);
    }
    static calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    static calculateConversionRate(totalAnonymous, totalConverted) {
        if (totalAnonymous === 0)
            return 0;
        return Math.round((totalConverted / totalAnonymous) * 100 * 100) / 100;
    }
    static calculateAverageConversionTime(conversions) {
        if (conversions.length === 0)
            return 0;
        const totalHours = conversions.reduce((sum, conversion) => {
            const diffMs = conversion.convertedAt.getTime() - conversion.createdAt.getTime();
            return sum + (diffMs / (1000 * 60 * 60));
        }, 0);
        return Math.round((totalHours / conversions.length) * 100) / 100;
    }
    static analyzeIncentiveEffectiveness(incentives) {
        const results = {};
        const grouped = incentives.reduce((acc, incentive) => {
            if (!acc[incentive.type]) {
                acc[incentive.type] = [];
            }
            acc[incentive.type].push(incentive);
            return acc;
        }, {});
        Object.entries(grouped).forEach(([type, items]) => {
            const converted = items.filter(item => item.converted);
            const conversionsWithTime = converted.filter(item => item.convertedAt);
            results[type] = {
                total: items.length,
                converted: converted.length,
                conversionRate: this.calculateConversionRate(items.length, converted.length),
                averageConversionTime: this.calculateAverageConversionTime(conversionsWithTime.map(item => ({
                    createdAt: item.createdAt,
                    convertedAt: item.convertedAt,
                }))),
                averageValue: Math.round((items.reduce((sum, item) => sum + item.value, 0) / items.length) * 100) / 100,
            };
        });
        return results;
    }
    static segmentUsersByActivity(users) {
        const now = new Date();
        const segments = {
            new: 0,
            active: 0,
            inactive: 0,
            dormant: 0,
            churned: 0,
        };
        users.forEach(user => {
            const daysSinceRegistration = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceRegistration <= 7) {
                segments.new++;
                return;
            }
            if (!user.lastLogin) {
                segments.churned++;
                return;
            }
            const daysSinceLastLogin = Math.floor((now.getTime() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastLogin <= 30) {
                segments.active++;
            }
            else if (daysSinceLastLogin <= 90) {
                segments.inactive++;
            }
            else if (daysSinceLastLogin <= 365) {
                segments.dormant++;
            }
            else {
                segments.churned++;
            }
        });
        return segments;
    }
    static calculateCohortRetention(users, periods = [1, 7, 30, 90]) {
        const cohorts = users.reduce((acc, user) => {
            const cohortKey = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[cohortKey]) {
                acc[cohortKey] = [];
            }
            acc[cohortKey].push(user);
            return acc;
        }, {});
        return Object.entries(cohorts).map(([cohort, cohortUsers]) => {
            const retention = {};
            periods.forEach(period => {
                const retainedUsers = cohortUsers.filter(user => {
                    if (!user.lastLogin)
                        return false;
                    const daysSinceRegistration = Math.floor((user.lastLogin.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
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
    static calculateGroupEngagement(group) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentActivities = group.activities?.filter(activity => activity.createdAt >= thirtyDaysAgo) || [];
        const activityScore = Math.min(100, recentActivities.length * 5);
        const activeMembers = group.members?.filter(member => member.lastActivity && member.lastActivity >= thirtyDaysAgo) || [];
        const memberEngagement = group.memberCount > 0
            ? Math.round((activeMembers.length / group.memberCount) * 100)
            : 0;
        const recentPurchases = group.purchases?.filter(purchase => purchase.createdAt >= thirtyDaysAgo) || [];
        const purchaseActivity = Math.min(100, recentPurchases.length * 10);
        const newMembers = group.members?.filter(member => member.joinedAt >= thirtyDaysAgo) || [];
        const growthRate = group.memberCount > 0
            ? Math.round((newMembers.length / group.memberCount) * 100)
            : 0;
        const overallScore = Math.round((activityScore * 0.3 + memberEngagement * 0.4 + purchaseActivity * 0.2 + growthRate * 0.1));
        return {
            activityScore,
            memberEngagement,
            purchaseActivity,
            growthRate,
            overallScore,
        };
    }
    static generateTimeTrends(data, period = 'day', last = 30) {
        const now = new Date();
        const trends = [];
        for (let i = last - 1; i >= 0; i--) {
            let periodStart;
            let periodEnd;
            let label;
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
            const count = data.filter(item => item.createdAt >= periodStart && item.createdAt < periodEnd).length;
            trends.push({
                date: periodStart.toISOString().split('T')[0],
                count,
                label,
            });
        }
        return trends;
    }
    static calculatePercentiles(values, percentiles = [25, 50, 75, 90, 95]) {
        if (values.length === 0)
            return {};
        const sorted = [...values].sort((a, b) => a - b);
        const result = {};
        percentiles.forEach(percentile => {
            const index = Math.ceil((percentile / 100) * sorted.length) - 1;
            result[percentile] = sorted[Math.max(0, index)];
        });
        return result;
    }
    static detectAnomalies(data, threshold = 2) {
        if (data.length < 3)
            return data.map(d => ({ ...d, isAnomaly: false, zScore: 0 }));
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
exports.AnalyticsUtil = AnalyticsUtil;
//# sourceMappingURL=analytics.util.js.map