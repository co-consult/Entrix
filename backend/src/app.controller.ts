import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello Entrix';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'entrix-backend',
      timestamp: new Date().toISOString(),
    };
  }
}