import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(req: any): Promise<{}>;
    revoke(dto: {
        sessionId: string;
    }): Promise<{}>;
    list(req: any): Promise<any[]>;
}
