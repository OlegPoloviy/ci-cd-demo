import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';

@Controller('health')
@Version(VERSION_NEUTRAL)
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
