import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Singleton guard - NestJS reuses the same instance via DI
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
