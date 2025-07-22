import { AuthUser } from '../types/auth.types';
export declare const CurrentUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof AuthUser)[]) => ParameterDecorator;
export declare const CurrentAuthContext: (...dataOrPipes: (string | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
export declare const CurrentSessionId: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const CurrentPermissions: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const CurrentRoles: (...dataOrPipes: unknown[]) => ParameterDecorator;
