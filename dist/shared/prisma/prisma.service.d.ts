/// <reference types="node" />
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
type LogDefinition = {
    level: 'info' | 'query' | 'warn' | 'error';
    emit: 'event';
};
type GetEvents<T extends Record<PropertyKey, any>> = T extends {
    level: infer U;
} ? U : never;
type PrismaClientWithEvents = PrismaClient<{
    log: LogDefinition[];
}, GetEvents<LogDefinition>>;
export interface PrismaMetrics {
    queryCount: number;
    errorCount: number;
    totalQueryTime: number;
    avgQueryTime: number;
    transactionCount: number;
    connectionCount: number;
    retryCount: number;
}
declare const PrismaService_base: new (...args: any[]) => PrismaClientWithEvents;
export declare class PrismaService extends PrismaService_base implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private metrics;
    constructor(configService: ConfigService);
    private setupEventListeners;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        message: string;
        timestamp: Date;
        metrics: PrismaMetrics;
    }>;
    paginate<T, A>(model: any, args: A & {
        where?: any;
        orderBy?: any;
        select?: any;
        include?: any;
    }, page?: number, limit?: number): Promise<{
        data: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    paginateWithCursor<T>(model: any, args: {
        where?: any;
        orderBy: any;
        cursor?: any;
        select?: any;
        include?: any;
    }, limit?: number): Promise<{
        data: T[];
        nextCursor?: any;
        hasNext: boolean;
    }>;
    executeWithRetry<T>(operation: () => Promise<T>, maxRetries?: number, delayMs?: number, backoffMultiplier?: number): Promise<T>;
    transactionWithRetry<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, maxRetries?: number): Promise<T>;
    private isNonRetryableError;
    private delay;
    getMetrics(): {
        uptimeSeconds: number;
        memoryUsage: NodeJS.MemoryUsage;
        timestamp: Date;
        queryCount: number;
        errorCount: number;
        totalQueryTime: number;
        avgQueryTime: number;
        transactionCount: number;
        connectionCount: number;
        retryCount: number;
    };
    resetMetrics(): void;
}
export {};
