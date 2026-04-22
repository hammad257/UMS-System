import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterStudentDto,
  RegisterFacultyDto,
  LoginDto,
} from './dto/auth.dto';
import { JwtAuthGuard, JwtRefreshGuard } from '../common/guards/Jwt auth.guard';
import { Request } from 'express';
import { AuthUser } from '../common/types';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
// import { CurrentUser } from '../common/decorators/CurrentUser.de';

type AuthenticatedRequest = Request & { user: AuthUser };
type RefreshRequest = Request & { user: AuthUser & { refreshToken: string } };

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register/student
  @Post('register/student')
  @ApiOperation({ summary: 'Register student user' })
  @ApiBody({ type: RegisterStudentDto })
  @HttpCode(HttpStatus.CREATED)
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
  }

  // POST /auth/register/faculty
  @Post('register/faculty')
  @ApiOperation({ summary: 'Register faculty/admin/security/staff user' })
  @ApiBody({ type: RegisterFacultyDto })
  @HttpCode(HttpStatus.CREATED)
  registerFaculty(@Body() dto: RegisterFacultyDto) {
    return this.authService.registerFaculty(dto);
  }

  // POST /auth/login
  @Post('login')
  @ApiOperation({ summary: 'Login user and issue access/refresh tokens' })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/refresh — send: Authorization: Bearer <refreshToken>
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Refresh token pair using refresh token bearer auth',
  })
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: RefreshRequest) {
    return this.authService.refreshTokens(req.user.id, req.user.refreshToken);
  }

  // POST /auth/logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current session or specific refresh token' })
  @HttpCode(HttpStatus.OK)
  logout(
    @Req() req: AuthenticatedRequest,
    @Headers('x-refresh-token') refreshToken?: string,
  ) {
    return this.authService.logout(req.user.id, refreshToken);
  }

  // POST /auth/logout-all (revoke all sessions for this user)
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout user from all sessions' })
  @HttpCode(HttpStatus.OK)
  logoutAll(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }
}
