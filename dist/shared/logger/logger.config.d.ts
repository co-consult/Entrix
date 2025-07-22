import * as Joi from 'joi';
export declare const loggerValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    level: string;
    format: string;
    enableConsole: boolean;
    enableFile: boolean;
    filePath: string;
    maxSize: string;
    maxFiles: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    level: string;
    format: string;
    enableConsole: boolean;
    enableFile: boolean;
    filePath: string;
    maxSize: string;
    maxFiles: string;
}>;
export default _default;
