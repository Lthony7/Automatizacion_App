/*
 * Auth Controller - Content Automation Platform FASE 2
 * Registration, login, logout, refresh, RBAC
 * All endpoints respect tenant context from JWT
*/

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; tenantId: string; name?: string },
    @Request() _req: any,
  ) {
    const result = await this.authService.register(
      body.email,
      body.password,
      body.tenantId,
      body.name,
    );
    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string; tenantId: string },
    @Request() _req: any,
  ) {
    const result = await this.authService.login(
      body.email,
      body.password,
      body.tenantId,
    );
    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  async refresh(@Request() req: any) {
    const result = await this.authService.refreshToken(req.cookies?.refreshToken || '');
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Request() req: any) {
    const token = (req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    const result = await this.authService.logout(token, req.userId, req.tenantId);
    return {
      success: true,
      data: result,
    };
  }
}