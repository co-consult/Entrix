import * as Joi from 'joi';
export declare const bullmqValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    prefix: string;
    concurrency: number;
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
        tls: boolean;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    prefix: string;
    concurrency: number;
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
        tls: boolean;
    };
}>;
export default _default;
