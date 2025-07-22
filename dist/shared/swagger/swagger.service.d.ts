import { INestApplication } from '@nestjs/common';
import { SwaggerModuleConfig } from './swagger.interfaces';
export declare class SwaggerService {
    static setup(app: INestApplication, config: SwaggerModuleConfig): void;
}
