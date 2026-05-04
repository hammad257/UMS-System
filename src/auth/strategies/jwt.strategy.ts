import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/types';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  scope: { campusIds: string[]; departmentIds: string[] };
  /** Session stamp — must match `User.tokenVersion` or the access token is rejected. */
  tv?: number;
  iat?: number;
  exp?: number;
}

const extractAccessToken = (req: { headers?: { authorization?: string } }) => {
  const authHeader = req.headers?.authorization?.trim();
  if (!authHeader) return null;

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader;
  }

  const token = authHeader.slice(7).trim();
  if (token.toLowerCase().startsWith('bearer ')) {
    return token.slice(7).trim();
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? '',
    };
    super(options);
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Trust the JWT payload for permission/scope claims (Module 2 spec — no DB
    // hit per request) but still verify the user is active and not deleted.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        deletedAt: true,
        tokenVersion: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Unauthorized');
    }

    const claimedTv = payload.tv ?? 0;
    if (claimedTv !== user.tokenVersion) {
      throw new UnauthorizedException('Session ended — please sign in again');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      scope: payload.scope ?? { campusIds: [], departmentIds: [] },
    };
  }
}
