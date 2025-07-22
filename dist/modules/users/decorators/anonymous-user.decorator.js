"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymousSessionId = exports.OnboardingKey = exports.AnonymousUserEmail = exports.AnonymousUser = void 0;
const common_1 = require("@nestjs/common");
exports.AnonymousUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const anonymousData = {};
    const headers = request.headers;
    if (headers['x-guest-name']) {
        anonymousData.guestName = headers['x-guest-name'];
    }
    if (headers['x-guest-email']) {
        anonymousData.guestEmail = headers['x-guest-email'];
    }
    if (headers['x-guest-phone']) {
        anonymousData.guestPhone = headers['x-guest-phone'];
    }
    if (headers['x-onboarding-key']) {
        anonymousData.onboardingKey = headers['x-onboarding-key'];
    }
    if (headers['x-session-id']) {
        anonymousData.sessionId = headers['x-session-id'];
    }
    if (headers['x-device-fingerprint']) {
        anonymousData.fingerprint = headers['x-device-fingerprint'];
    }
    const body = request.body || {};
    if (body.guestName) {
        anonymousData.guestName = body.guestName;
    }
    if (body.guestEmail) {
        anonymousData.guestEmail = body.guestEmail;
    }
    if (body.guestPhone) {
        anonymousData.guestPhone = body.guestPhone;
    }
    if (body.onboardingKey) {
        anonymousData.onboardingKey = body.onboardingKey;
    }
    if (body.anonymousMetadata) {
        anonymousData.metadata = body.anonymousMetadata;
    }
    const query = request.query || {};
    if (query.guestName) {
        anonymousData.guestName = query.guestName;
    }
    if (query.guestEmail) {
        anonymousData.guestEmail = query.guestEmail;
    }
    if (query.onboardingKey) {
        anonymousData.onboardingKey = query.onboardingKey;
    }
    anonymousData.ipAddress = request.ip ||
        request.connection?.remoteAddress ||
        request.headers['x-forwarded-for'] ||
        request.headers['x-real-ip'];
    anonymousData.userAgent = request.headers['user-agent'];
    const session = request.session;
    if (session?.anonymousUser) {
        Object.assign(anonymousData, session.anonymousUser);
    }
    const cookies = request.cookies || {};
    if (cookies.anonymousId) {
        anonymousData.id = cookies.anonymousId;
    }
    if (cookies.guestEmail) {
        anonymousData.guestEmail = cookies.guestEmail;
    }
    if (cookies.sessionId) {
        anonymousData.sessionId = cookies.sessionId;
    }
    if (headers['x-anonymous-metadata']) {
        try {
            const headerMetadata = JSON.parse(headers['x-anonymous-metadata']);
            anonymousData.metadata = { ...anonymousData.metadata, ...headerMetadata };
        }
        catch (error) {
        }
    }
    if (data) {
        return anonymousData[data];
    }
    return anonymousData;
});
function extractAnonymousData(ctx) {
    const request = ctx.switchToHttp().getRequest();
    const anonymousData = {};
    const headers = request.headers;
    if (headers['x-guest-name']) {
        anonymousData.guestName = headers['x-guest-name'];
    }
    if (headers['x-guest-email']) {
        anonymousData.guestEmail = headers['x-guest-email'];
    }
    if (headers['x-guest-phone']) {
        anonymousData.guestPhone = headers['x-guest-phone'];
    }
    if (headers['x-onboarding-key']) {
        anonymousData.onboardingKey = headers['x-onboarding-key'];
    }
    if (headers['x-session-id']) {
        anonymousData.sessionId = headers['x-session-id'];
    }
    if (headers['x-device-fingerprint']) {
        anonymousData.fingerprint = headers['x-device-fingerprint'];
    }
    const body = request.body || {};
    if (body.guestName) {
        anonymousData.guestName = body.guestName;
    }
    if (body.guestEmail) {
        anonymousData.guestEmail = body.guestEmail;
    }
    if (body.guestPhone) {
        anonymousData.guestPhone = body.guestPhone;
    }
    if (body.onboardingKey) {
        anonymousData.onboardingKey = body.onboardingKey;
    }
    if (body.anonymousMetadata) {
        anonymousData.metadata = body.anonymousMetadata;
    }
    const query = request.query || {};
    if (query.guestName) {
        anonymousData.guestName = query.guestName;
    }
    if (query.guestEmail) {
        anonymousData.guestEmail = query.guestEmail;
    }
    if (query.onboardingKey) {
        anonymousData.onboardingKey = query.onboardingKey;
    }
    anonymousData.ipAddress = request.ip ||
        request.connection?.remoteAddress ||
        request.headers['x-forwarded-for'] ||
        request.headers['x-real-ip'];
    anonymousData.userAgent = request.headers['user-agent'];
    const session = request.session;
    if (session?.anonymousUser) {
        Object.assign(anonymousData, session.anonymousUser);
    }
    const cookies = request.cookies || {};
    if (cookies.anonymousId) {
        anonymousData.id = cookies.anonymousId;
    }
    if (cookies.guestEmail) {
        anonymousData.guestEmail = cookies.guestEmail;
    }
    if (cookies.sessionId) {
        anonymousData.sessionId = cookies.sessionId;
    }
    if (headers['x-anonymous-metadata']) {
        try {
            const headerMetadata = JSON.parse(headers['x-anonymous-metadata']);
            anonymousData.metadata = { ...anonymousData.metadata, ...headerMetadata };
        }
        catch (error) {
        }
    }
    return anonymousData;
}
exports.AnonymousUserEmail = (0, common_1.createParamDecorator)((data, ctx) => {
    const anonymousData = extractAnonymousData(ctx);
    return anonymousData.guestEmail;
});
exports.OnboardingKey = (0, common_1.createParamDecorator)((data, ctx) => {
    const anonymousData = extractAnonymousData(ctx);
    return anonymousData.onboardingKey;
});
exports.AnonymousSessionId = (0, common_1.createParamDecorator)((data, ctx) => {
    const anonymousData = extractAnonymousData(ctx);
    return anonymousData.sessionId;
});
//# sourceMappingURL=anonymous-user.decorator.js.map