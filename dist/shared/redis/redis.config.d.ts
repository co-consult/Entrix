import * as Joi from 'joi';
export declare const redisValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    host: string;
    port: number;
    password: string;
    db: number;
    tls: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string;
    db: number;
    tls: boolean;
}>;
export default _default;
