import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterUserDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/guards/roles.decorator';
import type { AuthUser } from '../common/types';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -------------------------------------------------------------------------
  // POST /auth/register — kept for the existing public sign-up flow.
  // Module 1 spec only ships login/refresh/logout/me; admin-driven user
  // creation lives at POST /users in the Identity module.
  // -------------------------------------------------------------------------
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (PENDING by default)' })
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email + password' })
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(dto, {
      ipAddress: ip ?? req.ip,
      userAgent,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token (single-use)' })
  refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refreshTokens(dto.refreshToken, {
      ipAddress: ip ?? req.ip,
      userAgent,
    });
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout — revoke the current refresh token' })
  logout(
    @CurrentUser() user: AuthUser,
    @Body() body: LogoutDto,
    @Headers('x-refresh-token') refreshToken?: string,
  ) {
    return this.authService.logout(user.id, refreshToken ?? body?.refreshToken);
  }

  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout — revoke every refresh token' })
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }
}
