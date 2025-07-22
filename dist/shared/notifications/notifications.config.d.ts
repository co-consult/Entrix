import * as Joi from 'joi';
export declare const notificationsValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (() => {
    emailEnabled: boolean;
    wsEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    defaultChannel: string;
    priorityLevels: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    emailEnabled: boolean;
    wsEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    defaultChannel: string;
    priorityLevels: string[];
}>;
export default _default;
