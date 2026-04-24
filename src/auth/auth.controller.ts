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
  // RegisterStudentDto,
  // RegisterFacultyDto,
  LoginDto,
  RegisterUserDto,
} from './dto/auth.dto';
import {
  JwtAuthGuard,
  JwtRefreshGuard,
} from '../common/guards/Jwt auth.guard'; // ✅ FIXED
import { Request } from 'express';
import { AuthUser } from '../common/types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

type AuthenticatedRequest = Request & { user: AuthUser };
type RefreshRequest = Request & {
  user: AuthUser & { refreshToken: string };
};

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
@HttpCode(HttpStatus.CREATED)
register(@Body() dto: RegisterUserDto) {
  return this.authService.register(dto);
}

  // @Post('register/student')
  // @HttpCode(HttpStatus.CREATED)
  // registerStudent(@Body() dto: RegisterStudentDto) {
  //   return this.authService.registerStudent(dto);
  // }

  // @Post('register/faculty')
  // @HttpCode(HttpStatus.CREATED)
  // registerFaculty(@Body() dto: RegisterFacultyDto) {
  //   return this.authService.registerFaculty(dto);
  // }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth()
  refresh(@Req() req: RefreshRequest) {
    return this.authService.refreshTokens(
      req.user.id,
      req.user.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  logout(
    @Req() req: AuthenticatedRequest,
    @Headers('x-refresh-token') refreshToken?: string,
  ) {
    return this.authService.logout(req.user.id, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @ApiBearerAuth()
  logoutAll(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }
}