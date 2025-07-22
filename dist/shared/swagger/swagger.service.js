"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerService = void 0;
const swagger_1 = require("@nestjs/swagger");
class SwaggerService {
    static setup(app, config) {
        if (!config.enabled) {
            return;
        }
        const builder = new swagger_1.DocumentBuilder()
            .setTitle(config.title)
            .setVersion(config.version);
        if (config.description) {
            builder.setDescription(config.description);
        }
        if (config.authType === 'bearer') {
            builder.addBearerAuth();
        }
        else if (config.authType === 'cookie') {
            builder.addCookieAuth('access_token');
        }
        if (config.tags && config.tags.length) {
            config.tags.forEach(tag => builder.addTag(tag));
        }
        const document = swagger_1.SwaggerModule.createDocument(app, builder.build());
        swagger_1.SwaggerModule.setup(config.path, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
            customSiteTitle: config.title,
        });
    }
}
exports.SwaggerService = SwaggerService;
//# sourceMappingURL=swagger.service.js.map