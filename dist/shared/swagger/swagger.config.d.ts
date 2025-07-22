import * as Joi from 'joi';
export declare const swaggerValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    path: string;
    authType: string;
    tags: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    path: string;
    authType: string;
    tags: string[];
}>;
export default _default;
