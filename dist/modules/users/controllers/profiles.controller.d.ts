import { Request } from 'express';
import { CreateProfileDto } from '../dto/profiles/create-profile.dto';
import { ProfilesService } from '../services/profiles.service';
import { LoggerService } from '../../../shared/logger/logger.service';
interface SimpleResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}
export declare class ProfilesController {
    private readonly profilesService;
    private readonly logger;
    constructor(profilesService: ProfilesService, loggerService: LoggerService);
    create(createProfileDto: CreateProfileDto, req: Request): Promise<SimpleResponse<any>>;
    getByUserId(userId: string, req: Request): Promise<SimpleResponse<any>>;
    getCompletion(userId: string, req: Request): Promise<SimpleResponse<any>>;
    updatePreferences(userId: string, preferences: Record<string, any>, req: Request): Promise<SimpleResponse<any>>;
    remove(userId: string, req: Request): Promise<void>;
    search(query: any, req: Request): Promise<SimpleResponse<any>>;
}
export {};
