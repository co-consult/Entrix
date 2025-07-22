import * as Joi from 'joi';
export declare const prismaValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    databaseUrl: string;
    logLevel: string;
    poolMin: number;
    poolMax: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    databaseUrl: string;
    logLevel: string;
    poolMin: number;
    poolMax: number;
}>;
export default _default;
