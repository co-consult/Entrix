import * as Joi from 'joi';
export declare const emailValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    from: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    defaultReplyTo: string;
    provider: string;
    templatesPath: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    from: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    defaultReplyTo: string;
    provider: string;
    templatesPath: string;
}>;
export default _default;
